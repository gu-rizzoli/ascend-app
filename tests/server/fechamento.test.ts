import { eq } from "drizzle-orm";
import { expect, it } from "vitest";

import { db } from "@/db";
import { ocorrencia } from "@/db/schema";
import { fecharDiasVencidos } from "@/server/fechamento";
import { garantirOcorrencia } from "@/server/metas";
import { pausar, reativar } from "@/server/recorrencia";

import {
  comBanco,
  d,
  fechadoAteDe,
  novaMeta,
  novoUsuario,
  ocorrenciasDa,
} from "./banco";

// 2026-10-20 é uma terça-feira.

comBanco("fecharDiasVencidos no banco", () => {
  it("grava os dias nunca abertos e encerra a pendente com o valor parcial", async () => {
    const u = await novoUsuario("2026-10-16");
    const { metaId } = await novaMeta(u, {
      vigenteDe: "2026-10-15",
      valorAlvo: 3,
    });
    // No dia 18 a pessoa somou 2 de 3 e não voltou mais.
    await db().transaction(async (tx) => {
      const o = await garantirOcorrencia(tx, u, metaId, d("2026-10-18"));
      await tx
        .update(ocorrencia)
        .set({ valorAtual: 2 })
        .where(eq(ocorrencia.id, o!.id));
    });

    await fecharDiasVencidos(u, d("2026-10-20"));

    const linhas = await ocorrenciasDa(metaId);
    expect(linhas.map((o) => [o.data, o.estado, o.valorAtual])).toEqual([
      ["2026-10-17", "nao_concluida", 0],
      ["2026-10-18", "nao_concluida", 2],
      ["2026-10-19", "nao_concluida", 0],
    ]);
    expect(linhas.every((o) => o.encerradaEm !== null)).toBe(true);
    expect(await fechadoAteDe(u)).toBe("2026-10-19");
  });

  it("rodar de novo no mesmo dia não muda nada", async () => {
    const u = await novoUsuario("2026-10-16");
    const { metaId } = await novaMeta(u, { vigenteDe: "2026-10-15" });
    await fecharDiasVencidos(u, d("2026-10-20"));
    const antes = await ocorrenciasDa(metaId);
    await fecharDiasVencidos(u, d("2026-10-20"));
    expect(await ocorrenciasDa(metaId)).toEqual(antes);
  });

  it("dois pedidos ao mesmo tempo fecham uma vez só", async () => {
    const u = await novoUsuario("2026-10-10");
    const { metaId } = await novaMeta(u, { vigenteDe: "2026-10-01" });
    await Promise.all([
      fecharDiasVencidos(u, d("2026-10-20")),
      fecharDiasVencidos(u, d("2026-10-20")),
      fecharDiasVencidos(u, d("2026-10-20")),
    ]);
    const linhas = await ocorrenciasDa(metaId);
    expect(linhas).toHaveLength(9); // 11 a 19
    expect(new Set(linhas.map((o) => o.data)).size).toBe(9);
  });

  it("não toca hoje nem o futuro concluído antes da data", async () => {
    const u = await novoUsuario("2026-10-18");
    const { metaId } = await novaMeta(u, { vigenteDe: "2026-10-18" });
    for (const dia of ["2026-10-20", "2026-10-22"]) {
      await db().transaction(async (tx) => {
        const o = await garantirOcorrencia(tx, u, metaId, d(dia));
        await tx
          .update(ocorrencia)
          .set({ estado: "concluida", concluidaEm: new Date() })
          .where(eq(ocorrencia.id, o!.id));
      });
    }
    await fecharDiasVencidos(u, d("2026-10-20"));
    const linhas = await ocorrenciasDa(metaId);
    expect(
      linhas.map((o) => [o.data, o.estado, o.encerradaEm !== null]),
    ).toEqual([
      ["2026-10-19", "nao_concluida", true],
      ["2026-10-20", "concluida", false],
      ["2026-10-22", "concluida", false],
    ]);
  });

  it("semanal e a cada X dias só geram os dias da regra", async () => {
    const u = await novoUsuario("2026-10-11");
    const semanal = await novaMeta(u, {
      vigenteDe: "2026-10-12",
      frequencia: "semanal",
      diasSemana: [1, 3], // segunda e quarta
    });
    const intervalo = await novaMeta(u, {
      vigenteDe: "2026-10-12",
      frequencia: "intervalo",
      intervaloDias: 3,
    });
    await fecharDiasVencidos(u, d("2026-10-20"));
    expect((await ocorrenciasDa(semanal.metaId)).map((o) => o.data)).toEqual([
      "2026-10-12",
      "2026-10-14",
      "2026-10-19",
    ]);
    expect((await ocorrenciasDa(intervalo.metaId)).map((o) => o.data)).toEqual([
      "2026-10-12",
      "2026-10-15",
      "2026-10-18",
    ]);
  });

  it("dias pausados não viram falha", async () => {
    const u = await novoUsuario("2026-10-09");
    const { metaId } = await novaMeta(u, { vigenteDe: "2026-10-10" });

    // Cada ação fecha os dias vencidos antes, como as Server Actions.
    await fecharDiasVencidos(u, d("2026-10-12"));
    await db().transaction((tx) => pausar(tx, u, metaId, d("2026-10-12")));
    await fecharDiasVencidos(u, d("2026-10-15"));
    await db().transaction((tx) => reativar(tx, u, metaId, d("2026-10-15")));
    await fecharDiasVencidos(u, d("2026-10-17"));

    expect((await ocorrenciasDa(metaId)).map((o) => o.data)).toEqual([
      "2026-10-10",
      "2026-10-11",
      "2026-10-15",
      "2026-10-16",
    ]);
  });

  it("vaga adiada não volta como falha no dia original", async () => {
    const u = await novoUsuario("2026-10-19");
    const { metaId } = await novaMeta(u, {
      vigenteDe: "2026-10-20",
      frequencia: "unica",
    });
    await db().transaction(async (tx) => {
      const o = await garantirOcorrencia(tx, u, metaId, d("2026-10-20"));
      await tx
        .update(ocorrencia)
        .set({ data: "2026-10-21" })
        .where(eq(ocorrencia.id, o!.id));
    });
    await fecharDiasVencidos(u, d("2026-10-21"));
    expect(
      (await ocorrenciasDa(metaId)).map((o) => [o.data, o.estado]),
    ).toEqual([["2026-10-21", "pendente"]]);
  });
});
