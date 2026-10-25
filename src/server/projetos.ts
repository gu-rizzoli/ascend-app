import "server-only";

import { and, asc, desc, eq, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { metaVersao, projeto, projetoAtualTroca, usuario } from "@/db/schema";
import type { DataCivil } from "@/domain/datas";
import { STATUS_ABERTOS, type StatusProjeto } from "@/domain/projetos";

import type { Transacao } from "./metas";

/** Leituras e escritas de Projetos. Todas recebem o dono vindo da sessão. */

export type Projeto = {
  id: string;
  nome: string;
  descricao: string | null;
  status: StatusProjeto;
  proximoPasso: string | null;
  dataInicio: DataCivil;
  prazo: DataCivil | null;
};

const colunas = {
  id: projeto.id,
  nome: projeto.nome,
  descricao: projeto.descricao,
  status: projeto.status,
  proximoPasso: projeto.proximoPasso,
  dataInicio: projeto.dataInicio,
  prazo: projeto.prazo,
};

const paraProjeto = (p: {
  dataInicio: string;
  prazo: string | null;
}): Pick<Projeto, "dataInicio" | "prazo"> => ({
  dataInicio: p.dataInicio as DataCivil,
  prazo: p.prazo as DataCivil | null,
});

type Executor = ReturnType<typeof db> | Transacao;

/**
 * O id do projeto atual: a última troca do usuário. Nulo se ele nunca
 * escolheu, se removeu o destaque ou se o projeto atual foi excluído.
 */
export async function projetoAtualId(
  usuarioId: string,
  executor: Executor = db(),
): Promise<string | null> {
  const [ultima] = await executor
    .select({ projetoId: projetoAtualTroca.projetoId })
    .from(projetoAtualTroca)
    .where(eq(projetoAtualTroca.usuarioId, usuarioId))
    .orderBy(desc(projetoAtualTroca.data), desc(projetoAtualTroca.criadoEm))
    .limit(1);
  return ultima?.projetoId ?? null;
}

/** O projeto atual com os dados para a linha de Hoje, ou null. */
export async function projetoAtual(usuarioId: string): Promise<Projeto | null> {
  const id = await projetoAtualId(usuarioId);
  return id ? projetoDoUsuario(usuarioId, id) : null;
}

/**
 * O projeto em foco numa data passada: a última troca feita até aquele dia
 * (RF-HIS-09). Trocas posteriores não mudam o passado.
 */
export async function projetoEmFoco(
  usuarioId: string,
  data: DataCivil,
): Promise<Projeto | null> {
  const [ultima] = await db()
    .select({ projetoId: projetoAtualTroca.projetoId })
    .from(projetoAtualTroca)
    .where(
      and(
        eq(projetoAtualTroca.usuarioId, usuarioId),
        lte(projetoAtualTroca.data, data),
      ),
    )
    .orderBy(desc(projetoAtualTroca.data), desc(projetoAtualTroca.criadoEm))
    .limit(1);
  return ultima?.projetoId
    ? projetoDoUsuario(usuarioId, ultima.projetoId)
    : null;
}

/** Todos os projetos, em ordem alfabética. */
export async function projetosDoUsuario(usuarioId: string): Promise<Projeto[]> {
  const linhas = await db()
    .select(colunas)
    .from(projeto)
    .where(eq(projeto.usuarioId, usuarioId))
    .orderBy(asc(sql`lower(${projeto.nome})`));
  return linhas.map((p) => ({ ...p, ...paraProjeto(p) }));
}

export async function projetoDoUsuario(
  usuarioId: string,
  projetoId: string,
  executor: Executor = db(),
): Promise<Projeto | null> {
  if (!z.uuid().safeParse(projetoId).success) return null;
  const [p] = await executor
    .select(colunas)
    .from(projeto)
    .where(and(eq(projeto.id, projetoId), eq(projeto.usuarioId, usuarioId)));
  return p ? { ...p, ...paraProjeto(p) } : null;
}

/** Os projetos que podem receber metas: os não concluídos nem arquivados. */
export async function projetosParaAssociar(
  usuarioId: string,
): Promise<{ id: string; nome: string }[]> {
  return db()
    .select({ id: projeto.id, nome: projeto.nome })
    .from(projeto)
    .where(
      and(
        eq(projeto.usuarioId, usuarioId),
        inArray(projeto.status, [...STATUS_ABERTOS]),
      ),
    )
    .orderBy(asc(sql`lower(${projeto.nome})`));
}

/**
 * O projeto pode ficar numa meta? Precisa ser do usuário e estar aberto, a
 * não ser que a meta já estivesse nele (`atual`): salvar sem mexer no campo
 * não tira a meta de um projeto que foi concluído.
 */
export async function projetoValidoParaMeta(
  usuarioId: string,
  projetoId: string | null,
  atual: string | null = null,
): Promise<boolean> {
  if (projetoId === null || projetoId === atual) return true;
  const p = await projetoDoUsuario(usuarioId, projetoId);
  return p !== null && (STATUS_ABERTOS as readonly string[]).includes(p.status);
}

/** Alguma versão de meta, até do passado, aponta para o projeto? */
export async function temMetasAssociadas(
  projetoId: string,
  executor: Executor = db(),
): Promise<boolean> {
  const [linha] = await executor
    .select({ id: metaVersao.id })
    .from(metaVersao)
    .where(eq(metaVersao.projetoId, projetoId))
    .limit(1);
  return Boolean(linha);
}

/**
 * Trava a linha do usuário até o fim da transação. Toda troca de projeto
 * atual passa por aqui, então duas trocas ao mesmo tempo acontecem uma depois
 * da outra e a última lida é sempre a última gravada.
 */
export async function travarUsuario(tx: Transacao, usuarioId: string) {
  await tx
    .select({ id: usuario.id })
    .from(usuario)
    .where(eq(usuario.id, usuarioId))
    .for("update");
}

/** Grava uma troca de projeto atual com a data de hoje (nulo = nenhum). */
export async function gravarTroca(
  tx: Transacao,
  usuarioId: string,
  projetoId: string | null,
  dataHoje: DataCivil,
) {
  // O instante vem daqui, depois da trava, e não do now() do Postgres, que é
  // o início da transação: assim a ordem das trocas do dia é a real.
  await tx
    .insert(projetoAtualTroca)
    .values({ usuarioId, projetoId, data: dataHoje, criadoEm: new Date() });
}
