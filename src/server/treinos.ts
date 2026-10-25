import "server-only";

import { and, asc, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import {
  exercicio,
  modeloExercicio,
  modeloTreino,
  serie,
  treino,
  treinoExercicio,
} from "@/db/schema";
import type { DataCivil } from "@/domain/datas";
import {
  limparNome,
  normalizarNome,
  type ModeloValido,
  type TreinoValido,
} from "@/domain/treinos";

import type { Transacao } from "./metas";

/** Leituras e escritas de Treinos. Todas recebem o dono vindo da sessão. */

type Executor = ReturnType<typeof db> | Transacao;

const ehUuid = (valor: string) => z.uuid().safeParse(valor).success;

// ---------------------------------------------------------------------------
// Exercícios

export type Exercicio = { id: string; nome: string; arquivado: boolean };

const colunasExercicio = {
  id: exercicio.id,
  nome: exercicio.nome,
  arquivadoEm: exercicio.arquivadoEm,
};

const paraExercicio = (e: {
  id: string;
  nome: string;
  arquivadoEm: Date | null;
}): Exercicio => ({
  id: e.id,
  nome: e.nome,
  arquivado: e.arquivadoEm !== null,
});

/** O catálogo em ordem alfabética: só os ativos, ou só os arquivados. */
export async function exerciciosDoUsuario(
  usuarioId: string,
  { arquivados = false } = {},
): Promise<Exercicio[]> {
  const linhas = await db()
    .select(colunasExercicio)
    .from(exercicio)
    .where(
      and(
        eq(exercicio.usuarioId, usuarioId),
        arquivados
          ? sql`${exercicio.arquivadoEm} is not null`
          : isNull(exercicio.arquivadoEm),
      ),
    )
    .orderBy(asc(exercicio.nomeNormalizado));
  return linhas.map(paraExercicio);
}

export async function exercicioDoUsuario(
  usuarioId: string,
  exercicioId: string,
  executor: Executor = db(),
): Promise<Exercicio | null> {
  if (!ehUuid(exercicioId)) return null;
  const [e] = await executor
    .select(colunasExercicio)
    .from(exercicio)
    .where(
      and(eq(exercicio.id, exercicioId), eq(exercicio.usuarioId, usuarioId)),
    );
  return e ? paraExercicio(e) : null;
}

/** Usado em algum modelo ou treino? Então só pode ser arquivado (9.4). */
export async function exercicioUsado(
  exercicioId: string,
  executor: Executor = db(),
): Promise<boolean> {
  const [emTreino] = await executor
    .select({ id: treinoExercicio.id })
    .from(treinoExercicio)
    .where(eq(treinoExercicio.exercicioId, exercicioId))
    .limit(1);
  if (emTreino) return true;
  const [emModelo] = await executor
    .select({ id: modeloExercicio.id })
    .from(modeloExercicio)
    .where(eq(modeloExercicio.exercicioId, exercicioId))
    .limit(1);
  return Boolean(emModelo);
}

export type ResultadoExercicio =
  | { ok: true; exercicio: Exercicio; jaExistia: boolean }
  | { ok: false; erro: string };

/**
 * Cria um exercício. Se já existe um com o mesmo nome normalizado, devolve o
 * existente (`jaExistia`), desarquivando-o se for o caso: quem digitou o nome
 * quer usar aquele exercício.
 */
export async function criarExercicio(
  executor: Executor,
  usuarioId: string,
  nome: string,
): Promise<ResultadoExercicio> {
  const limpo = limparNome(nome);
  const nomeNormalizado = normalizarNome(limpo);
  const [criado] = await executor
    .insert(exercicio)
    .values({ usuarioId, nome: limpo, nomeNormalizado })
    .onConflictDoNothing()
    .returning(colunasExercicio);
  if (criado) {
    return { ok: true, exercicio: paraExercicio(criado), jaExistia: false };
  }
  const [existente] = await executor
    .update(exercicio)
    .set({ arquivadoEm: null })
    .where(
      and(
        eq(exercicio.usuarioId, usuarioId),
        eq(exercicio.nomeNormalizado, nomeNormalizado),
      ),
    )
    .returning(colunasExercicio);
  if (!existente) return { ok: false, erro: "Não foi possível criar." };
  return { ok: true, exercicio: paraExercicio(existente), jaExistia: true };
}

/** Renomeia; o novo nome vale em todos os treinos (decisão 4). */
export async function renomearExercicio(
  usuarioId: string,
  exercicioId: string,
  nome: string,
): Promise<string | null> {
  const limpo = limparNome(nome);
  const nomeNormalizado = normalizarNome(limpo);
  const [outro] = await db()
    .select({ id: exercicio.id })
    .from(exercicio)
    .where(
      and(
        eq(exercicio.usuarioId, usuarioId),
        eq(exercicio.nomeNormalizado, nomeNormalizado),
      ),
    );
  if (outro && outro.id !== exercicioId) {
    return "Já existe um exercício com esse nome.";
  }
  await db()
    .update(exercicio)
    .set({ nome: limpo, nomeNormalizado })
    .where(
      and(eq(exercicio.id, exercicioId), eq(exercicio.usuarioId, usuarioId)),
    );
  return null;
}

/** Todos os ids são exercícios deste usuário? */
async function exerciciosSaoDoUsuario(
  tx: Executor,
  usuarioId: string,
  ids: string[],
): Promise<boolean> {
  const unicos = [...new Set(ids)];
  if (unicos.length === 0) return true;
  const [linha] = await tx
    .select({ n: count() })
    .from(exercicio)
    .where(
      and(eq(exercicio.usuarioId, usuarioId), inArray(exercicio.id, unicos)),
    );
  return linha?.n === unicos.length;
}

// ---------------------------------------------------------------------------
// Treinos

export type ResumoTreino = {
  id: string;
  nome: string | null;
  data: DataCivil;
  exercicios: string[];
};

/** A lista de sessões, da mais recente para a mais antiga (RF-TRE-15). */
export async function treinosDoUsuario(
  usuarioId: string,
): Promise<ResumoTreino[]> {
  const treinos = await db()
    .select({ id: treino.id, nome: treino.nome, data: treino.data })
    .from(treino)
    .where(eq(treino.usuarioId, usuarioId))
    .orderBy(desc(treino.data), desc(treino.criadoEm));
  if (treinos.length === 0) return [];

  const nomes = await db()
    .select({ treinoId: treinoExercicio.treinoId, nome: exercicio.nome })
    .from(treinoExercicio)
    .innerJoin(exercicio, eq(exercicio.id, treinoExercicio.exercicioId))
    .where(
      inArray(
        treinoExercicio.treinoId,
        treinos.map((t) => t.id),
      ),
    )
    .orderBy(asc(treinoExercicio.ordem));
  const porTreino = Map.groupBy(nomes, (n) => n.treinoId);

  return treinos.map((t) => ({
    id: t.id,
    nome: t.nome,
    data: t.data as DataCivil,
    exercicios: (porTreino.get(t.id) ?? []).map((n) => n.nome),
  }));
}

export type SerieRegistrada = {
  repeticoes: number;
  cargaKg: number | null;
  observacao: string | null;
};

export type Treino = {
  id: string;
  nome: string | null;
  data: DataCivil;
  observacao: string | null;
  modelo: { id: string; nome: string } | null;
  exercicios: {
    exercicioId: string;
    nome: string;
    arquivado: boolean;
    series: SerieRegistrada[];
  }[];
};

/** Uma sessão completa, com exercícios e séries na ordem (RF-TRE-15). */
export async function treinoDoUsuario(
  usuarioId: string,
  treinoId: string,
): Promise<Treino | null> {
  if (!ehUuid(treinoId)) return null;
  const [t] = await db()
    .select({
      id: treino.id,
      nome: treino.nome,
      data: treino.data,
      observacao: treino.observacao,
      modeloId: modeloTreino.id,
      modeloNome: modeloTreino.nome,
    })
    .from(treino)
    .leftJoin(modeloTreino, eq(modeloTreino.id, treino.modeloId))
    .where(and(eq(treino.id, treinoId), eq(treino.usuarioId, usuarioId)));
  if (!t) return null;

  const linhas = await db()
    .select({
      treinoExercicioId: treinoExercicio.id,
      exercicioId: exercicio.id,
      nome: exercicio.nome,
      arquivadoEm: exercicio.arquivadoEm,
      repeticoes: serie.repeticoes,
      cargaKg: serie.cargaKg,
      observacao: serie.observacao,
    })
    .from(treinoExercicio)
    .innerJoin(exercicio, eq(exercicio.id, treinoExercicio.exercicioId))
    .innerJoin(serie, eq(serie.treinoExercicioId, treinoExercicio.id))
    .where(eq(treinoExercicio.treinoId, t.id))
    .orderBy(asc(treinoExercicio.ordem), asc(serie.ordem));

  const exercicios: Treino["exercicios"] = [];
  let anterior: string | null = null;
  for (const l of linhas) {
    if (l.treinoExercicioId !== anterior) {
      anterior = l.treinoExercicioId;
      exercicios.push({
        exercicioId: l.exercicioId,
        nome: l.nome,
        arquivado: l.arquivadoEm !== null,
        series: [],
      });
    }
    exercicios.at(-1)!.series.push({
      repeticoes: l.repeticoes,
      cargaKg: l.cargaKg,
      observacao: l.observacao,
    });
  }

  return {
    id: t.id,
    nome: t.nome,
    data: t.data as DataCivil,
    observacao: t.observacao,
    modelo:
      t.modeloId && t.modeloNome
        ? { id: t.modeloId, nome: t.modeloNome }
        : null,
    exercicios,
  };
}

/**
 * Grava o treino inteiro numa transação: cria, ou substitui os exercícios e
 * as séries de um existente pelo conteúdo do formulário (treinos.md,
 * "Operações"). Devolve o id, ou null se algo não for do usuário.
 */
export async function gravarTreino(
  tx: Transacao,
  usuarioId: string,
  dados: TreinoValido,
  treinoId: string | null,
): Promise<string | null> {
  const ids = dados.exercicios.map((e) => e.exercicioId);
  if (!(await exerciciosSaoDoUsuario(tx, usuarioId, ids))) return null;

  let modeloId = dados.modeloId;
  if (modeloId && !(await modeloDoUsuarioExiste(tx, usuarioId, modeloId))) {
    modeloId = null;
  }

  const campos = {
    nome: dados.nome,
    data: dados.data,
    observacao: dados.observacao,
  };
  let id: string;
  if (treinoId) {
    const [atualizado] = await tx
      .update(treino)
      .set({ ...campos, atualizadoEm: new Date() })
      .where(and(eq(treino.id, treinoId), eq(treino.usuarioId, usuarioId)))
      .returning({ id: treino.id });
    if (!atualizado) return null;
    id = atualizado.id;
    // As séries vão junto, em cascata.
    await tx.delete(treinoExercicio).where(eq(treinoExercicio.treinoId, id));
  } else {
    const [criado] = await tx
      .insert(treino)
      .values({ usuarioId, modeloId, ...campos })
      .returning({ id: treino.id });
    id = criado!.id;
  }

  const blocos = await tx
    .insert(treinoExercicio)
    .values(
      dados.exercicios.map((e, ordem) => ({
        treinoId: id,
        exercicioId: e.exercicioId,
        ordem,
      })),
    )
    .returning({ id: treinoExercicio.id, ordem: treinoExercicio.ordem });
  const idDoBloco = new Map(blocos.map((b) => [b.ordem, b.id]));
  await tx.insert(serie).values(
    dados.exercicios.flatMap((e, i) =>
      e.series.map((s, ordem) => ({
        treinoExercicioId: idDoBloco.get(i)!,
        ordem,
        ...s,
      })),
    ),
  );
  return id;
}

/** Apaga a sessão e, em cascata, as séries. O catálogo não muda (9.11). */
export async function excluirTreino(
  usuarioId: string,
  treinoId: string,
): Promise<void> {
  if (!ehUuid(treinoId)) return;
  await db()
    .delete(treino)
    .where(and(eq(treino.id, treinoId), eq(treino.usuarioId, usuarioId)));
}

export type AparicaoDoExercicio = {
  treinoId: string;
  data: DataCivil;
  nome: string | null;
  series: { repeticoes: number; cargaKg: number | null }[];
};

/**
 * Histórico por exercício (RF-TRE-16): uma linha por sessão, da mais recente
 * para a mais antiga, com as séries na ordem.
 */
export async function historicoDoExercicio(
  usuarioId: string,
  exercicioId: string,
): Promise<AparicaoDoExercicio[]> {
  if (!ehUuid(exercicioId)) return [];
  const linhas = await db()
    .select({
      treinoId: treino.id,
      data: treino.data,
      nome: treino.nome,
      repeticoes: serie.repeticoes,
      cargaKg: serie.cargaKg,
    })
    .from(serie)
    .innerJoin(treinoExercicio, eq(treinoExercicio.id, serie.treinoExercicioId))
    .innerJoin(treino, eq(treino.id, treinoExercicio.treinoId))
    .where(
      and(
        eq(treino.usuarioId, usuarioId),
        eq(treinoExercicio.exercicioId, exercicioId),
      ),
    )
    .orderBy(
      desc(treino.data),
      desc(treino.criadoEm),
      asc(treinoExercicio.ordem),
      asc(serie.ordem),
    );

  const aparicoes: AparicaoDoExercicio[] = [];
  for (const l of linhas) {
    if (aparicoes.at(-1)?.treinoId !== l.treinoId) {
      aparicoes.push({
        treinoId: l.treinoId,
        data: l.data as DataCivil,
        nome: l.nome,
        series: [],
      });
    }
    aparicoes.at(-1)!.series.push({
      repeticoes: l.repeticoes,
      cargaKg: l.cargaKg,
    });
  }
  return aparicoes;
}

// ---------------------------------------------------------------------------
// Modelos

export type ResumoModelo = { id: string; nome: string; exercicios: number };

export async function modelosDoUsuario(
  usuarioId: string,
): Promise<ResumoModelo[]> {
  return db()
    .select({
      id: modeloTreino.id,
      nome: modeloTreino.nome,
      exercicios: count(modeloExercicio.id),
    })
    .from(modeloTreino)
    .leftJoin(modeloExercicio, eq(modeloExercicio.modeloId, modeloTreino.id))
    .where(eq(modeloTreino.usuarioId, usuarioId))
    .groupBy(modeloTreino.id)
    .orderBy(asc(sql`lower(${modeloTreino.nome})`));
}

export type Modelo = {
  id: string;
  nome: string;
  observacao: string | null;
  exercicios: {
    exercicioId: string;
    nome: string;
    seriesSugeridas: number;
    repsMin: number;
    repsMax: number | null;
  }[];
};

export async function modeloDoUsuario(
  usuarioId: string,
  modeloId: string,
): Promise<Modelo | null> {
  if (!ehUuid(modeloId)) return null;
  const [m] = await db()
    .select({
      id: modeloTreino.id,
      nome: modeloTreino.nome,
      observacao: modeloTreino.observacao,
    })
    .from(modeloTreino)
    .where(
      and(eq(modeloTreino.id, modeloId), eq(modeloTreino.usuarioId, usuarioId)),
    );
  if (!m) return null;
  const exercicios = await db()
    .select({
      exercicioId: exercicio.id,
      nome: exercicio.nome,
      seriesSugeridas: modeloExercicio.seriesSugeridas,
      repsMin: modeloExercicio.repsMin,
      repsMax: modeloExercicio.repsMax,
    })
    .from(modeloExercicio)
    .innerJoin(exercicio, eq(exercicio.id, modeloExercicio.exercicioId))
    .where(eq(modeloExercicio.modeloId, m.id))
    .orderBy(asc(modeloExercicio.ordem));
  return { ...m, exercicios };
}

async function modeloDoUsuarioExiste(
  tx: Executor,
  usuarioId: string,
  modeloId: string,
): Promise<boolean> {
  const [m] = await tx
    .select({ id: modeloTreino.id })
    .from(modeloTreino)
    .where(
      and(eq(modeloTreino.id, modeloId), eq(modeloTreino.usuarioId, usuarioId)),
    );
  return Boolean(m);
}

/**
 * Cria ou substitui um modelo numa transação. Treinos já feitos com ele não
 * mudam: são cópias (D-045).
 */
export async function gravarModelo(
  tx: Transacao,
  usuarioId: string,
  dados: ModeloValido,
  modeloId: string | null,
): Promise<string | null> {
  const ids = dados.exercicios.map((e) => e.exercicioId);
  if (!(await exerciciosSaoDoUsuario(tx, usuarioId, ids))) return null;

  const campos = { nome: dados.nome, observacao: dados.observacao };
  let id: string;
  if (modeloId) {
    const [atualizado] = await tx
      .update(modeloTreino)
      .set({ ...campos, atualizadoEm: new Date() })
      .where(
        and(
          eq(modeloTreino.id, modeloId),
          eq(modeloTreino.usuarioId, usuarioId),
        ),
      )
      .returning({ id: modeloTreino.id });
    if (!atualizado) return null;
    id = atualizado.id;
    await tx.delete(modeloExercicio).where(eq(modeloExercicio.modeloId, id));
  } else {
    const [criado] = await tx
      .insert(modeloTreino)
      .values({ usuarioId, ...campos })
      .returning({ id: modeloTreino.id });
    id = criado!.id;
  }

  await tx
    .insert(modeloExercicio)
    .values(
      dados.exercicios.map((e, ordem) => ({ modeloId: id, ordem, ...e })),
    );
  return id;
}

/** Apaga o modelo. Os treinos feitos com ele só perdem a referência. */
export async function excluirModelo(
  usuarioId: string,
  modeloId: string,
): Promise<void> {
  if (!ehUuid(modeloId)) return;
  await db()
    .delete(modeloTreino)
    .where(
      and(eq(modeloTreino.id, modeloId), eq(modeloTreino.usuarioId, usuarioId)),
    );
}
