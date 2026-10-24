import "server-only";

import { and, eq, gte, isNull, lte, ne, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { meta, metaVersao, ocorrencia } from "@/db/schema";
import type { DataCivil } from "@/domain/datas";
import {
  montarListaDoDia,
  type ItemDoDia,
  type OcorrenciaGravada,
  type VersaoDoDia,
} from "@/domain/metas";
import { caiNaData, type Regra } from "@/domain/recorrencia";

/** Leituras e escritas de Metas. Todas recebem o dono vindo da sessão. */

type Transacao = Parameters<
  Parameters<ReturnType<typeof db>["transaction"]>[0]
>[0];

// O Postgres devolve `time` como "07:30:00"; a tela usa "07:30".
const horaCurta = (horario: string | null) => horario?.slice(0, 5) ?? null;

const versaoVigenteEm = (data: DataCivil) =>
  and(
    lte(metaVersao.vigenteDe, data),
    or(isNull(metaVersao.vigenteAte), gte(metaVersao.vigenteAte, data)),
  );

function regraDa(v: typeof metaVersao.$inferSelect): Regra {
  return {
    frequencia: v.frequencia,
    vigenteDe: v.vigenteDe as DataCivil,
    vigenteAte: v.vigenteAte as DataCivil | null,
    diasSemana: v.diasSemana,
    intervaloDias: v.intervaloDias,
  };
}

/** A lista de uma data: gravadas + vagas calculadas pela regra. */
export async function listaDoDia(
  usuarioId: string,
  data: DataCivil,
): Promise<ItemDoDia[]> {
  const [versoes, gravadas] = await Promise.all([
    db()
      .select({ meta, versao: metaVersao })
      .from(metaVersao)
      .innerJoin(meta, eq(metaVersao.metaId, meta.id))
      .where(
        and(
          eq(meta.usuarioId, usuarioId),
          eq(meta.estado, "ativa"),
          versaoVigenteEm(data),
        ),
      ),
    db()
      .select({ meta, versao: metaVersao, ocorrencia })
      .from(ocorrencia)
      .innerJoin(meta, eq(ocorrencia.metaId, meta.id))
      .innerJoin(metaVersao, eq(ocorrencia.versaoId, metaVersao.id))
      .where(
        and(
          eq(ocorrencia.usuarioId, usuarioId),
          or(eq(ocorrencia.data, data), eq(ocorrencia.dataPrevista, data)),
        ),
      ),
  ]);

  return montarListaDoDia(
    data,
    versoes.map(({ meta: m, versao: v }): VersaoDoDia => ({
      metaId: m.id,
      versaoId: v.id,
      tipo: m.tipo,
      unidade: m.unidade,
      titulo: v.titulo,
      horario: horaCurta(v.horario),
      valorAlvo: v.valorAlvo,
      regra: regraDa(v),
    })),
    gravadas.map(
      ({ meta: m, versao: v, ocorrencia: o }): OcorrenciaGravada => ({
        id: o.id,
        metaId: m.id,
        tipo: m.tipo,
        unidade: m.unidade,
        dataPrevista: o.dataPrevista as DataCivil | null,
        data: o.data as DataCivil,
        estado: o.estado,
        valorAtual: o.valorAtual,
        versao: {
          titulo: v.titulo,
          horario: horaCurta(v.horario),
          valorAlvo: v.valorAlvo,
        },
        ajuste: {
          titulo: o.titulo,
          horario: horaCurta(o.horario),
          valorAlvo: o.valorAlvo,
        },
      }),
    ),
  );
}

/** O usuário já criou alguma meta? Decide o estado vazio do primeiro acesso. */
export async function temAlgumaMeta(usuarioId: string): Promise<boolean> {
  const [linha] = await db()
    .select({ id: meta.id })
    .from(meta)
    .where(and(eq(meta.usuarioId, usuarioId), ne(meta.estado, "excluida")))
    .limit(1);
  return Boolean(linha);
}

export type OcorrenciaParaAlterar = {
  id: string;
  data: DataCivil;
  tipo: "binaria" | "numerica";
  estado: "pendente" | "concluida" | "nao_concluida";
  valorAtual: number | null;
  valorAlvo: number | null;
};

/**
 * Devolve a ocorrência da vaga (meta, data prevista), gravando-a se ainda for
 * virtual, e trava a linha até o fim da transação. Null se a meta não for do
 * usuário ou se a regra não cair nessa data. Gravar duas vezes a mesma vaga
 * não duplica nada, por causa da chave única (13.8).
 */
export async function garantirOcorrencia(
  tx: Transacao,
  usuarioId: string,
  metaId: string,
  dataPrevista: DataCivil,
): Promise<OcorrenciaParaAlterar | null> {
  const buscar = async () => {
    const [linha] = await tx
      .select({ meta, versao: metaVersao, ocorrencia })
      .from(ocorrencia)
      .innerJoin(meta, eq(ocorrencia.metaId, meta.id))
      .innerJoin(metaVersao, eq(ocorrencia.versaoId, metaVersao.id))
      .where(
        and(
          eq(ocorrencia.usuarioId, usuarioId),
          eq(ocorrencia.metaId, metaId),
          eq(ocorrencia.origem, "regra"),
          eq(ocorrencia.dataPrevista, dataPrevista),
        ),
      )
      .for("update", { of: ocorrencia })
      .limit(1);
    if (!linha) return null;
    const { meta: m, versao: v, ocorrencia: o } = linha;
    return {
      id: o.id,
      data: o.data as DataCivil,
      tipo: m.tipo,
      estado: o.estado,
      valorAtual: o.valorAtual,
      valorAlvo: o.valorAlvo ?? v.valorAlvo,
    };
  };

  const existente = await buscar();
  if (existente) return existente;

  const [vigente] = await tx
    .select({ meta, versao: metaVersao })
    .from(metaVersao)
    .innerJoin(meta, eq(metaVersao.metaId, meta.id))
    .where(
      and(
        eq(meta.id, metaId),
        eq(meta.usuarioId, usuarioId),
        eq(meta.estado, "ativa"),
        versaoVigenteEm(dataPrevista),
      ),
    )
    .limit(1);
  if (!vigente || !caiNaData(regraDa(vigente.versao), dataPrevista)) {
    return null;
  }

  await tx
    .insert(ocorrencia)
    .values({
      usuarioId,
      metaId,
      versaoId: vigente.versao.id,
      origem: "regra",
      dataPrevista,
      data: dataPrevista,
      valorAtual: vigente.meta.tipo === "numerica" ? 0 : null,
    })
    .onConflictDoNothing({
      target: [ocorrencia.metaId, ocorrencia.dataPrevista],
      where: sql`${ocorrencia.origem} = 'regra'`,
    });

  return buscar();
}
