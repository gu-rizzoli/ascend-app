import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db } from "@/db";
import { ocorrencia } from "@/db/schema";
import type { EdicaoMeta } from "@/domain/metas";
import { fecharDiasVencidos } from "@/server/fechamento";
import { garantirOcorrencia, listaDoDia } from "@/server/metas";
import {
  adiar,
  editar,
  excluir,
  pausar,
  reagendar,
  reativar,
  type PedidoDeEdicao,
} from "@/server/recorrencia";

import {
  comBanco,
  d,
  estadoDa,
  novaMeta,
  novoUsuario,
  ocorrenciasDa,
  versoesDa,
} from "./banco";

// 2026-10-20 é uma terça-feira.
const HOJE = d("2026-10-20");

async function mexer(
  u: string,
  metaId: string,
  dia: string,
  mudanca: Partial<typeof ocorrencia.$inferInsert>,
) {
  return db().transaction(async (tx) => {
    const o = await garantirOcorrencia(tx, u, metaId, d(dia));
    if (Object.keys(mudanca).length > 0) {
      await tx.update(ocorrencia).set(mudanca).where(eq(ocorrencia.id, o!.id));
    }
    return o!.id;
  });
}

const concluir = { estado: "concluida" as const, concluidaEm: new Date() };

function edicao(parcial: Partial<EdicaoMeta> = {}): EdicaoMeta {
  return {
    titulo: "Meta",
    descricao: null,
    valorAlvo: null,
    horario: null,
    frequencia: { frequencia: "diaria", diasSemana: null, intervaloDias: null },
    ...parcial,
  };
}

function pedido(
  metaId: string,
  parcial: Partial<PedidoDeEdicao> = {},
): PedidoDeEdicao {
  return {
    metaId,
    vaga: null,
    ocorrenciaId: null,
    escopo: "proximas",
    edicao: edicao(),
    ...parcial,
  };
}

comBanco("recorrência no banco", () => {
  describe("pausar e reativar", () => {
    it("hoje intocada sai; concluída antes da data fica; pendente ajustada sai", async () => {
      const u = await novoUsuario("2026-10-19");
      const { metaId } = await novaMeta(u, { vigenteDe: "2026-10-15" });
      await mexer(u, metaId, "2026-10-20", {}); // gravada, mas intocada
      await mexer(u, metaId, "2026-10-22", concluir);
      await mexer(u, metaId, "2026-10-23", { titulo: "Ajustada" });

      expect(await db().transaction((tx) => pausar(tx, u, metaId, HOJE))).toBe(
        true,
      );
      expect(await estadoDa(metaId)).toBe("pausada");
      expect((await ocorrenciasDa(metaId)).map((o) => o.data)).toEqual([
        "2026-10-22",
      ]);
      expect((await versoesDa(metaId)).map((v) => v.vigenteAte)).toEqual([
        "2026-10-19",
      ]);
      expect(await listaDoDia(u, d("2026-10-21"))).toEqual([]);
    });

    it("com progresso hoje, a regra vale até hoje e reativar amanhã só reabre", async () => {
      const u = await novoUsuario("2026-10-19");
      const { metaId } = await novaMeta(u, { vigenteDe: "2026-10-15" });
      await mexer(u, metaId, "2026-10-20", concluir);
      await db().transaction((tx) => pausar(tx, u, metaId, HOJE));
      expect((await versoesDa(metaId)).map((v) => v.vigenteAte)).toEqual([
        "2026-10-20",
      ]);

      await fecharDiasVencidos(u, d("2026-10-21"));
      await db().transaction((tx) => reativar(tx, u, metaId, d("2026-10-21")));
      const versoes = await versoesDa(metaId);
      expect(versoes).toHaveLength(1);
      expect(versoes[0]!.vigenteAte).toBeNull();
    });

    it("depois de dias pausados nasce uma versão nova e o intervalo recomeça", async () => {
      const u = await novoUsuario("2026-10-09");
      const { metaId } = await novaMeta(u, {
        vigenteDe: "2026-10-10",
        frequencia: "intervalo",
        intervaloDias: 3,
      });
      await db().transaction((tx) => pausar(tx, u, metaId, d("2026-10-10")));
      await fecharDiasVencidos(u, d("2026-10-14"));
      await db().transaction((tx) => reativar(tx, u, metaId, d("2026-10-14")));
      const versoes = await versoesDa(metaId);
      expect(versoes.map((v) => [v.vigenteDe, v.vigenteAte])).toEqual([
        ["2026-10-10", "2026-10-09"], // vazia: pausou antes do primeiro dia
        ["2026-10-14", null],
      ]);
      const dia = async (x: string) =>
        (await listaDoDia(u, d(x))).map((i) => i.metaId);
      expect(await dia("2026-10-14")).toEqual([metaId]);
      expect(await dia("2026-10-16")).toEqual([]);
      expect(await dia("2026-10-17")).toEqual([metaId]);
    });

    it("pausar e reativar no mesmo dia mantém os dias até uma mudança agendada", async () => {
      const u = await novoUsuario("2026-10-19");
      const { metaId } = await novaMeta(u, { vigenteDe: "2026-10-15" });
      await db().transaction((tx) =>
        editar(
          tx,
          u,
          pedido(metaId, {
            vaga: d("2026-10-25"),
            edicao: edicao({ titulo: "Nova" }),
          }),
          HOJE,
        ),
      );
      await db().transaction((tx) => pausar(tx, u, metaId, HOJE));
      await db().transaction((tx) => reativar(tx, u, metaId, HOJE));

      expect(
        (await versoesDa(metaId)).map((v) => [v.vigenteDe, v.vigenteAte]),
      ).toEqual([
        ["2026-10-15", "2026-10-24"],
        ["2026-10-25", null],
      ]);
      const titulos = async (x: string) =>
        (await listaDoDia(u, d(x))).map((i) => i.titulo);
      expect(await titulos("2026-10-20")).toEqual(["Meta"]);
      expect(await titulos("2026-10-24")).toEqual(["Meta"]);
      expect(await titulos("2026-10-25")).toEqual(["Nova"]);
    });

    it("meta de ocorrência única não pausa", async () => {
      const u = await novoUsuario("2026-10-19");
      const { metaId } = await novaMeta(u, {
        vigenteDe: "2026-10-22",
        frequencia: "unica",
      });
      expect(await db().transaction((tx) => pausar(tx, u, metaId, HOJE))).toBe(
        false,
      );
    });
  });

  describe("excluir", () => {
    it("com história: o passado fica, o futuro todo sai e nada mais é gerado", async () => {
      const u = await novoUsuario("2026-10-17");
      const { metaId } = await novaMeta(u, { vigenteDe: "2026-10-18" });
      await fecharDiasVencidos(u, HOJE); // 18 e 19 viram não concluídas
      await mexer(u, metaId, "2026-10-22", concluir);

      await db().transaction((tx) => excluir(tx, u, metaId, HOJE));
      expect(await estadoDa(metaId)).toBe("excluida");
      expect((await ocorrenciasDa(metaId)).map((o) => o.data)).toEqual([
        "2026-10-18",
        "2026-10-19",
      ]);
      expect(await listaDoDia(u, d("2026-10-21"))).toEqual([]);
      expect((await listaDoDia(u, d("2026-10-19"))).length).toBe(1);

      await fecharDiasVencidos(u, d("2026-10-25"));
      expect(await ocorrenciasDa(metaId)).toHaveLength(2);
    });

    it("sem história: a meta é apagada de verdade", async () => {
      const u = await novoUsuario("2026-10-19");
      const { metaId } = await novaMeta(u, { vigenteDe: "2026-10-20" });
      await mexer(u, metaId, "2026-10-21", concluir);
      await db().transaction((tx) => excluir(tx, u, metaId, HOJE));
      expect(await estadoDa(metaId)).toBeNull();
    });

    it("com progresso hoje, a ocorrência de hoje fica", async () => {
      const u = await novoUsuario("2026-10-19");
      const { metaId } = await novaMeta(u, { vigenteDe: "2026-10-20" });
      await mexer(u, metaId, "2026-10-20", concluir);
      await db().transaction((tx) => excluir(tx, u, metaId, HOJE));
      expect(await estadoDa(metaId)).toBe("excluida");
      expect(await ocorrenciasDa(metaId)).toHaveLength(1);
      await fecharDiasVencidos(u, d("2026-10-23"));
      expect(await ocorrenciasDa(metaId)).toHaveLength(1);
    });
  });

  describe("editar esta e as próximas", () => {
    it("a partir de uma data futura: o passado segue a versão antiga e os ajustes ficam", async () => {
      const u = await novoUsuario("2026-10-17");
      const { metaId, versaoId } = await novaMeta(u, {
        vigenteDe: "2026-10-18",
        titulo: "Ler",
      });
      const ajustada = await mexer(u, metaId, "2026-10-25", {
        titulo: "Ler no parque",
      });

      const erro = await db().transaction((tx) =>
        editar(
          tx,
          u,
          pedido(metaId, {
            vaga: d("2026-10-22"),
            edicao: edicao({ titulo: "Ler 20 páginas" }),
          }),
          HOJE,
        ),
      );
      expect(erro).toBeNull();
      const versoes = await versoesDa(metaId);
      expect(versoes.map((v) => [v.vigenteDe, v.vigenteAte, v.titulo])).toEqual(
        [
          ["2026-10-18", "2026-10-21", "Ler"],
          ["2026-10-22", null, "Ler 20 páginas"],
        ],
      );

      const titulos = async (x: string) =>
        (await listaDoDia(u, d(x))).map((i) => i.titulo);
      expect(await titulos("2026-10-21")).toEqual(["Ler"]);
      expect(await titulos("2026-10-22")).toEqual(["Ler 20 páginas"]);
      expect(await titulos("2026-10-25")).toEqual(["Ler no parque"]);

      // O fechamento grava cada dia com a versão que valia nele.
      await fecharDiasVencidos(u, d("2026-10-24"));
      const porDia = new Map(
        (await ocorrenciasDa(metaId)).map((o) => [o.data, o.versaoId]),
      );
      expect(porDia.get("2026-10-21")).toBe(versaoId);
      expect(porDia.get("2026-10-22")).toBe(versoes[1]!.id);
      expect(
        (await ocorrenciasDa(metaId)).find((o) => o.id === ajustada)!.titulo,
      ).toBe("Ler no parque");
    });

    it("editar de novo numa data anterior substitui a versão futura", async () => {
      const u = await novoUsuario("2026-10-19");
      const { metaId } = await novaMeta(u, { vigenteDe: "2026-10-15" });
      await mexer(u, metaId, "2026-10-26", concluir);
      await db().transaction((tx) =>
        editar(
          tx,
          u,
          pedido(metaId, {
            vaga: d("2026-10-25"),
            edicao: edicao({ titulo: "B" }),
          }),
          HOJE,
        ),
      );
      await db().transaction((tx) =>
        editar(
          tx,
          u,
          pedido(metaId, {
            vaga: d("2026-10-22"),
            edicao: edicao({ titulo: "C" }),
          }),
          HOJE,
        ),
      );
      const versoes = await versoesDa(metaId);
      expect(versoes.map((v) => [v.vigenteDe, v.vigenteAte, v.titulo])).toEqual(
        [
          ["2026-10-15", "2026-10-21", "Meta"],
          ["2026-10-22", null, "C"],
        ],
      );
      const [concluida] = await ocorrenciasDa(metaId);
      expect(concluida!.versaoId).toBe(versoes[1]!.id);
    });

    it("trocar para dias da semana: futura intocada some, com progresso fica", async () => {
      const u = await novoUsuario("2026-10-19");
      const { metaId } = await novaMeta(u, { vigenteDe: "2026-10-15" });
      await mexer(u, metaId, "2026-10-22", {}); // quinta, gravada e intocada
      await mexer(u, metaId, "2026-10-23", concluir); // sexta
      await db().transaction((tx) =>
        editar(
          tx,
          u,
          pedido(metaId, {
            edicao: edicao({
              frequencia: {
                frequencia: "semanal",
                diasSemana: [1, 3],
                intervaloDias: null,
              },
            }),
          }),
          HOJE,
        ),
      );
      expect(
        (await ocorrenciasDa(metaId)).map((o) => [o.data, o.estado]),
      ).toEqual([["2026-10-23", "concluida"]]);
      const dia = async (x: string) => (await listaDoDia(u, d(x))).length;
      expect(await dia("2026-10-20")).toBe(0); // terça
      expect(await dia("2026-10-21")).toBe(1); // quarta
      expect(await dia("2026-10-23")).toBe(1); // a concluída fica
    });

    it("subir o alvo devolve a concluída de hoje para pendente", async () => {
      const u = await novoUsuario("2026-10-19");
      const { metaId } = await novaMeta(u, {
        vigenteDe: "2026-10-15",
        valorAlvo: 2,
      });
      await mexer(u, metaId, "2026-10-20", { ...concluir, valorAtual: 2 });
      await db().transaction((tx) =>
        editar(
          tx,
          u,
          pedido(metaId, { vaga: HOJE, edicao: edicao({ valorAlvo: 3 }) }),
          HOJE,
        ),
      );
      const [hoje] = await ocorrenciasDa(metaId);
      expect([hoje!.estado, hoje!.concluidaEm]).toEqual(["pendente", null]);
    });
  });

  describe("adiar e reagendar", () => {
    it("adiar a de hoje para amanhã: hoje não vira falha", async () => {
      const u = await novoUsuario("2026-10-19");
      const { metaId } = await novaMeta(u, { vigenteDe: "2026-10-15" });
      const ok = await db().transaction((tx) =>
        adiar(tx, u, { metaId, dataPrevista: HOJE }, d("2026-10-21"), HOJE),
      );
      expect(ok).toBe(true);
      expect(await listaDoDia(u, HOJE)).toEqual([]);
      expect(await listaDoDia(u, d("2026-10-21"))).toHaveLength(2);

      await fecharDiasVencidos(u, d("2026-10-21"));
      expect(
        (await ocorrenciasDa(metaId)).map((o) => [
          o.dataPrevista,
          o.data,
          o.estado,
        ]),
      ).toEqual([["2026-10-20", "2026-10-21", "pendente"]]);
    });

    it("reagendar duas vezes ao mesmo tempo cria uma só", async () => {
      const u = await novoUsuario("2026-10-17");
      const { metaId } = await novaMeta(u, {
        vigenteDe: "2026-10-18",
        frequencia: "unica",
        valorAlvo: 3,
      });
      await mexer(u, metaId, "2026-10-18", { valorAtual: 1 });
      await fecharDiasVencidos(u, HOJE);
      const [original] = await ocorrenciasDa(metaId);

      const feitos = await Promise.all(
        ["2026-10-20", "2026-10-21"].map((x) =>
          db().transaction((tx) => reagendar(tx, u, original!.id, d(x), HOJE)),
        ),
      );
      expect(feitos.filter(Boolean)).toHaveLength(1);
      const linhas = await ocorrenciasDa(metaId);
      expect(linhas).toHaveLength(2);
      const nova = linhas.find((o) => o.origem === "reagendada")!;
      expect([nova.estado, nova.valorAtual]).toEqual(["pendente", 1]);
      expect(linhas[0]!.estado).toBe("nao_concluida");

      // Se a nova também falhar, ela vira não concluída e pode ser reagendada.
      await fecharDiasVencidos(u, d("2026-10-23"));
      const falhou = (await ocorrenciasDa(metaId)).find(
        (o) => o.id === nova.id,
      )!;
      expect(falhou.estado).toBe("nao_concluida");
      expect(
        await db().transaction((tx) =>
          reagendar(tx, u, nova.id, d("2026-10-24"), d("2026-10-23")),
        ),
      ).toBe(true);
    });
  });

  describe("dono", () => {
    it("ninguém mexe na meta de outra pessoa", async () => {
      const dona = await novoUsuario("2026-10-17");
      const outra = await novoUsuario("2026-10-17");
      const { metaId } = await novaMeta(dona, { vigenteDe: "2026-10-18" });
      await fecharDiasVencidos(dona, HOJE);
      const [passada] = await ocorrenciasDa(metaId);

      const tentativas = await db().transaction(async (tx) => [
        await pausar(tx, outra, metaId, HOJE),
        await excluir(tx, outra, metaId, HOJE),
        await adiar(
          tx,
          outra,
          { metaId, dataPrevista: HOJE },
          d("2026-10-21"),
          HOJE,
        ),
        await reagendar(tx, outra, passada!.id, HOJE, HOJE),
        await garantirOcorrencia(tx, outra, metaId, HOJE),
      ]);
      expect(tentativas).toEqual([false, false, false, false, null]);
      expect(
        await db().transaction((tx) => editar(tx, outra, pedido(metaId), HOJE)),
      ).toBe("Esta meta não pode ser editada agora.");
      expect(await estadoDa(metaId)).toBe("ativa");
      expect(await ocorrenciasDa(metaId)).toHaveLength(2);
      expect(await listaDoDia(outra, HOJE)).toEqual([]);
    });
  });
});
