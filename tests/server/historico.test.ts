import { eq } from "drizzle-orm";
import { expect, it } from "vitest";

import { db } from "@/db";
import { metaVersao, ocorrencia, projeto } from "@/db/schema";
import { corrigir } from "@/server/correcao";
import { fecharDiasVencidos } from "@/server/fechamento";
import { focosDosDias, metasDoPeriodo } from "@/server/historico";
import { gravarTroca } from "@/server/projetos";
import { pausar, reagendar } from "@/server/recorrencia";

import { comBanco, d, novaMeta, novoUsuario, ocorrenciasDa } from "./banco";

const HOJE = d("2026-10-20");

async function novoProjeto(usuarioId: string, nome: string): Promise<string> {
  const [p] = await db()
    .insert(projeto)
    .values({ usuarioId, nome, dataInicio: "2026-10-01" })
    .returning({ id: projeto.id });
  return p!.id;
}

comBanco("histórico no banco", () => {
  it("lê as ocorrências do período, inclusive de meta pausada depois", async () => {
    const u = await novoUsuario("2026-10-14");
    const { metaId } = await novaMeta(u, { vigenteDe: "2026-10-15" });
    await fecharDiasVencidos(u, HOJE);
    await db().transaction((tx) => pausar(tx, u, metaId, HOJE));

    const metas = await metasDoPeriodo(
      u,
      d("2026-10-16"),
      d("2026-10-18"),
      null,
    );
    expect(metas.map((m) => [m.data, m.estado])).toEqual([
      ["2026-10-16", "nao_concluida"],
      ["2026-10-17", "nao_concluida"],
      ["2026-10-18", "nao_concluida"],
    ]);
  });

  it("filtra pelo projeto da versão e não mostra dados de outro usuário", async () => {
    const u = await novoUsuario("2026-10-17");
    const outro = await novoUsuario("2026-10-17");
    const tcc = await novoProjeto(u, "TCC");
    const a = await novaMeta(u, { vigenteDe: "2026-10-18", titulo: "Ler" });
    await novaMeta(u, { vigenteDe: "2026-10-18", titulo: "Água" });
    await novaMeta(outro, { vigenteDe: "2026-10-18" });
    await db()
      .update(metaVersao)
      .set({ projetoId: tcc })
      .where(eq(metaVersao.id, a.versaoId));
    await fecharDiasVencidos(u, HOJE);
    await fecharDiasVencidos(outro, HOJE);

    const todas = await metasDoPeriodo(
      u,
      d("2026-10-18"),
      d("2026-10-19"),
      null,
    );
    expect(todas).toHaveLength(4);
    const doTcc = await metasDoPeriodo(
      u,
      d("2026-10-18"),
      d("2026-10-19"),
      tcc,
    );
    expect(doTcc.map((m) => [m.titulo, m.projeto?.nome])).toEqual([
      ["Ler", "TCC"],
      ["Ler", "TCC"],
    ]);
  });

  it("reconstrói o projeto em foco de cada dia", async () => {
    const u = await novoUsuario("2026-10-01");
    const a = await novoProjeto(u, "A");
    const b = await novoProjeto(u, "B");
    await db().transaction((tx) => gravarTroca(tx, u, a, d("2026-10-05")));
    await db().transaction((tx) => gravarTroca(tx, u, b, d("2026-10-12")));
    const focos = await focosDosDias(u, [
      d("2026-10-04"),
      d("2026-10-06"),
      d("2026-10-12"),
    ]);
    expect(focos.get(d("2026-10-04"))).toBeNull();
    expect(focos.get(d("2026-10-06"))?.nome).toBe("A");
    expect(focos.get(d("2026-10-12"))?.nome).toBe("B");
  });
});

comBanco("correção de uma original reagendada (decisão 21)", () => {
  async function reagendada(novaData: string) {
    const u = await novoUsuario("2026-10-17");
    const { metaId } = await novaMeta(u, {
      vigenteDe: "2026-10-18",
      frequencia: "unica",
    });
    await fecharDiasVencidos(u, HOJE);
    const [original] = await ocorrenciasDa(metaId);
    await db().transaction((tx) =>
      reagendar(tx, u, original!.id, d(novaData), HOJE),
    );
    return { u, metaId, originalId: original!.id };
  }

  it("corrigir para concluída tira a cópia pendente", async () => {
    const { u, metaId, originalId } = await reagendada("2026-10-21");
    const r = await corrigir(u, originalId, { concluida: true }, HOJE);
    expect(r).toEqual({ alterou: true, copiaRemovida: true });
    const linhas = await ocorrenciasDa(metaId);
    expect(
      linhas.map((o) => [o.data, o.estado, o.corrigidaAposEncerramento]),
    ).toEqual([["2026-10-18", "concluida", true]]);
  });

  it("a cópia já concluída fica", async () => {
    const { u, metaId, originalId } = await reagendada("2026-10-20");
    await db()
      .update(ocorrencia)
      .set({ estado: "concluida", concluidaEm: new Date() })
      .where(eq(ocorrencia.reagendadaDeId, originalId));
    const r = await corrigir(u, originalId, { concluida: true }, HOJE);
    expect(r.copiaRemovida).toBe(false);
    expect(await ocorrenciasDa(metaId)).toHaveLength(2);
  });

  it("a cópia de um dia já encerrado fica", async () => {
    const { u, metaId, originalId } = await reagendada("2026-10-20");
    // Dois dias depois, a cópia do dia 20 já foi encerrada.
    const depois = d("2026-10-22");
    await fecharDiasVencidos(u, depois);
    const r = await corrigir(u, originalId, { concluida: true }, depois);
    expect(r.copiaRemovida).toBe(false);
    const linhas = await ocorrenciasDa(metaId);
    expect(linhas.map((o) => o.estado)).toEqual(["concluida", "nao_concluida"]);
  });

  it("outro usuário não corrige", async () => {
    const { originalId } = await reagendada("2026-10-21");
    const intruso = await novoUsuario("2026-10-19");
    const r = await corrigir(intruso, originalId, { concluida: true }, HOJE);
    expect(r.alterou).toBe(false);
  });
});
