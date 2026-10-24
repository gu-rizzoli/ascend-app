import "server-only";

import { and, eq, gte, isNull, lt, lte, or, sql } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import { meta, metaVersao, ocorrencia, usuario } from "@/db/schema";
import { hoje, type DataCivil } from "@/domain/datas";
import { periodoAFechar, vagasDoPeriodo } from "@/domain/fechamento";

import { regraDa } from "./metas";
import { exigirUsuario, type UsuarioDaSessao } from "./sessao";

// Um usuário que ficou meses sem abrir o app pode ter milhares de vagas.
const LOTE = 500;

/**
 * Fecha os dias vencidos do usuário (modelo-dados-metas.md, "Fechamento do
 * dia"): grava como não concluídas as vagas que a regra gerou e ninguém
 * abriu, encerra as pendentes com data anterior a hoje e avança
 * `fechado_ate` para ontem. Idempotente: rodar de novo não muda nada (13.8).
 */
export async function fecharDiasVencidos(
  usuarioId: string,
  dataHoje: DataCivil,
): Promise<void> {
  await db().transaction(async (tx) => {
    // Trava o usuário: dois pedidos ao mesmo tempo fecham uma vez só, e o
    // segundo já encontra fechado_ate em dia.
    const [dono] = await tx
      .select({ fechadoAte: usuario.fechadoAte })
      .from(usuario)
      .where(eq(usuario.id, usuarioId))
      .for("update");
    if (!dono) return;
    const periodo = periodoAFechar(dono.fechadoAte as DataCivil, dataHoje);
    if (!periodo) return;

    const versoes = await tx
      .select({ meta, versao: metaVersao })
      .from(metaVersao)
      .innerJoin(meta, eq(metaVersao.metaId, meta.id))
      .where(
        and(
          eq(meta.usuarioId, usuarioId),
          lte(metaVersao.vigenteDe, periodo.ate),
          or(
            isNull(metaVersao.vigenteAte),
            gte(metaVersao.vigenteAte, periodo.de),
          ),
        ),
      );

    const agora = new Date();
    const vagas = vagasDoPeriodo(
      versoes.map(({ meta: m, versao: v }) => ({
        metaId: m.id,
        versaoId: v.id,
        tipo: m.tipo,
        regra: regraDa(v),
      })),
      periodo.de,
      periodo.ate,
    );
    for (let i = 0; i < vagas.length; i += LOTE) {
      await tx
        .insert(ocorrencia)
        .values(
          vagas.slice(i, i + LOTE).map((v) => ({
            usuarioId,
            metaId: v.metaId,
            versaoId: v.versaoId,
            origem: "regra" as const,
            dataPrevista: v.dataPrevista,
            data: v.dataPrevista,
            estado: "nao_concluida" as const,
            valorAtual: v.tipo === "numerica" ? 0 : null,
            encerradaEm: agora,
          })),
        )
        .onConflictDoNothing({
          target: [ocorrencia.metaId, ocorrencia.dataPrevista],
          where: sql`${ocorrencia.origem} = 'regra'`,
        });
    }

    // Pendentes viram não concluídas, com o valor parcial preservado. As já
    // concluídas recebem só encerrada_em. Não se limita ao período, então
    // pega também o que tiver escapado de um fechamento anterior.
    await tx
      .update(ocorrencia)
      .set({
        estado: sql`case when ${ocorrencia.estado} = 'pendente'
          then 'nao_concluida'::estado_ocorrencia else ${ocorrencia.estado} end`,
        encerradaEm: agora,
      })
      .where(
        and(
          eq(ocorrencia.usuarioId, usuarioId),
          lt(ocorrencia.data, dataHoje),
          or(isNull(ocorrencia.encerradaEm), eq(ocorrencia.estado, "pendente")),
        ),
      );

    await tx
      .update(usuario)
      .set({ fechadoAte: periodo.ate })
      .where(eq(usuario.id, usuarioId));
  });
}

/**
 * O usuário da sessão, com os dias vencidos já fechados. Memorizado por
 * pedido: o layout e a página chamam, mas o fechamento roda uma vez, e a
 * página nunca lê um dia passado antes de ele estar encerrado (o Next.js
 * renderiza layout e página em paralelo).
 */
export const usuarioComDiasFechados = cache(
  async (): Promise<UsuarioDaSessao> => {
    const atual = await exigirUsuario();
    await fecharSePreciso(atual, hoje());
    return atual;
  },
);

/**
 * Atalho para o caso comum: o `fechado_ate` lido com a sessão já está em dia,
 * e nada precisa ser travado nem gravado.
 */
export async function fecharSePreciso(
  atual: UsuarioDaSessao,
  dataHoje: DataCivil,
): Promise<void> {
  if (periodoAFechar(atual.fechadoAte as DataCivil, dataHoje)) {
    await fecharDiasVencidos(atual.id, dataHoje);
  }
}
