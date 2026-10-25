import { randomUUID } from "node:crypto";

import { asc, eq } from "drizzle-orm";
import { describe } from "vitest";

import { db } from "@/db";
import { meta, metaVersao, ocorrencia, usuario } from "@/db/schema";
import { paraDataCivil, type DataCivil } from "@/domain/datas";
import type { Frequencia } from "@/domain/recorrencia";

/**
 * Testes que gravam num PostgreSQL de verdade. Só rodam com
 * DATABASE_URL_TESTE apontando para um banco local já migrado
 * (`DATABASE_URL=... pnpm db:migrate`); sem ela, são pulados. Cada teste cria
 * o próprio usuário, então os arquivos podem rodar em paralelo sem limpar
 * nada.
 */
const URL_TESTE = process.env.DATABASE_URL_TESTE;

if (URL_TESTE) {
  // Nunca gravar dados de teste no banco de produção.
  if (/neon\.tech/.test(URL_TESTE)) {
    throw new Error("DATABASE_URL_TESTE não pode apontar para o Neon.");
  }
  process.env.DATABASE_URL = URL_TESTE;
}

export const comBanco = describe.skipIf(!URL_TESTE);

export const d = paraDataCivil;

export async function novoUsuario(fechadoAte: string): Promise<string> {
  const [u] = await db()
    .insert(usuario)
    .values({
      nome: "Teste",
      email: `${randomUUID()}@teste.local`,
      senhaHash: "x",
      fechadoAte,
    })
    .returning({ id: usuario.id });
  return u!.id;
}

export async function novaMeta(
  usuarioId: string,
  regra: {
    vigenteDe: string;
    frequencia?: Frequencia;
    diasSemana?: number[];
    intervaloDias?: number;
    valorAlvo?: number;
    titulo?: string;
  },
): Promise<{ metaId: string; versaoId: string }> {
  const frequencia = regra.frequencia ?? "diaria";
  const numerica = regra.valorAlvo !== undefined;
  return db().transaction(async (tx) => {
    const [m] = await tx
      .insert(meta)
      .values({
        usuarioId,
        tipo: numerica ? "numerica" : "binaria",
        unidade: numerica ? "L" : null,
      })
      .returning({ id: meta.id });
    const [v] = await tx
      .insert(metaVersao)
      .values({
        metaId: m!.id,
        vigenteDe: regra.vigenteDe,
        vigenteAte: frequencia === "unica" ? regra.vigenteDe : null,
        titulo: regra.titulo ?? "Meta",
        valorAlvo: regra.valorAlvo ?? null,
        frequencia,
        diasSemana: regra.diasSemana ?? null,
        intervaloDias: regra.intervaloDias ?? null,
      })
      .returning({ id: metaVersao.id });
    return { metaId: m!.id, versaoId: v!.id };
  });
}

export async function ocorrenciasDa(metaId: string) {
  return db()
    .select()
    .from(ocorrencia)
    .where(eq(ocorrencia.metaId, metaId))
    .orderBy(asc(ocorrencia.data), asc(ocorrencia.criadoEm));
}

export async function versoesDa(metaId: string) {
  return db()
    .select()
    .from(metaVersao)
    .where(eq(metaVersao.metaId, metaId))
    .orderBy(asc(metaVersao.vigenteDe));
}

export async function estadoDa(metaId: string) {
  const [m] = await db().select().from(meta).where(eq(meta.id, metaId));
  return m?.estado ?? null;
}

export async function fechadoAteDe(usuarioId: string): Promise<DataCivil> {
  const [u] = await db()
    .select({ fechadoAte: usuario.fechadoAte })
    .from(usuario)
    .where(eq(usuario.id, usuarioId));
  return u!.fechadoAte as DataCivil;
}
