import { eq } from "drizzle-orm";
import { expect, it } from "vitest";

import { db } from "@/db";
import { metaVersao, projeto } from "@/db/schema";
import { gravarTroca, projetoAtualId } from "@/server/projetos";
import { editar, pausar, reativar } from "@/server/recorrencia";

import { comBanco, d, novaMeta, novoUsuario, versoesDa } from "./banco";

const HOJE = d("2026-10-20");

async function novoProjeto(usuarioId: string, nome = "TCC"): Promise<string> {
  const [p] = await db()
    .insert(projeto)
    .values({ usuarioId, nome, dataInicio: "2026-10-01" })
    .returning({ id: projeto.id });
  return p!.id;
}

async function trocar(usuarioId: string, projetoId: string | null) {
  await db().transaction((tx) => gravarTroca(tx, usuarioId, projetoId, HOJE));
}

comBanco("projetos no banco", () => {
  it("o atual é a última troca, inclusive várias no mesmo dia", async () => {
    const u = await novoUsuario("2026-10-19");
    const a = await novoProjeto(u, "A");
    const b = await novoProjeto(u, "B");
    expect(await projetoAtualId(u)).toBeNull();
    await trocar(u, a);
    await trocar(u, b);
    expect(await projetoAtualId(u)).toBe(b);
    await trocar(u, null);
    expect(await projetoAtualId(u)).toBeNull();
  });

  it("excluir o projeto tira a associação das metas e o destaque", async () => {
    const u = await novoUsuario("2026-10-19");
    const p = await novoProjeto(u);
    const { metaId, versaoId } = await novaMeta(u, { vigenteDe: "2026-10-01" });
    await db()
      .update(metaVersao)
      .set({ projetoId: p })
      .where(eq(metaVersao.id, versaoId));
    await trocar(u, p);

    await db().delete(projeto).where(eq(projeto.id, p));

    expect(await projetoAtualId(u)).toBeNull();
    const [v] = await versoesDa(metaId);
    expect(v!.projetoId).toBeNull();
  });

  it("reativar e editar mantêm ou trocam o projeto da regra", async () => {
    const u = await novoUsuario("2026-10-19");
    const p = await novoProjeto(u, "P");
    const q = await novoProjeto(u, "Q");
    const { metaId, versaoId } = await novaMeta(u, { vigenteDe: "2026-10-01" });
    await db()
      .update(metaVersao)
      .set({ projetoId: p })
      .where(eq(metaVersao.id, versaoId));

    await db().transaction((tx) => pausar(tx, u, metaId, HOJE));
    // Reativada dias depois: nasce uma versão nova, com o mesmo projeto.
    const depois = d("2026-10-25");
    await db().transaction((tx) => reativar(tx, u, metaId, depois));
    expect((await versoesDa(metaId)).map((v) => v.projetoId)).toEqual([p, p]);

    // "Esta e as próximas" troca o projeto só dali em diante.
    const erro = await db().transaction((tx) =>
      editar(
        tx,
        u,
        {
          metaId,
          vaga: null,
          ocorrenciaId: null,
          escopo: "proximas",
          edicao: {
            titulo: "Meta",
            descricao: null,
            valorAlvo: null,
            horario: null,
            projetoId: q,
            frequencia: {
              frequencia: "diaria",
              diasSemana: null,
              intervaloDias: null,
            },
          },
        },
        d("2026-10-27"),
      ),
    );
    expect(erro).toBeNull();
    expect((await versoesDa(metaId)).map((v) => v.projetoId)).toEqual([
      p,
      p,
      q,
    ]);
  });
});
