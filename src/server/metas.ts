import "server-only";

import {
  and,
  asc,
  eq,
  gte,
  isNull,
  lte,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";

import { db } from "@/db";
import { meta, metaVersao, ocorrencia } from "@/db/schema";
import { ehDataCivil, type DataCivil } from "@/domain/datas";
import {
  itemDaGravada,
  itemDaVaga,
  montarListaDoDia,
  type ItemDoDia,
  type RefOcorrencia,
  type OcorrenciaGravada,
  type VersaoDoDia,
} from "@/domain/metas";
import { caiNaData, type Regra } from "@/domain/recorrencia";

/** Leituras e escritas de Metas. Todas recebem o dono vindo da sessão. */

export type Transacao = Parameters<
  Parameters<ReturnType<typeof db>["transaction"]>[0]
>[0];

// O Postgres devolve `time` como "07:30:00"; a tela usa "07:30".
const horaCurta = (horario: string | null) => horario?.slice(0, 5) ?? null;

const versaoVigenteEm = (data: DataCivil) =>
  and(
    lte(metaVersao.vigenteDe, data),
    or(isNull(metaVersao.vigenteAte), gte(metaVersao.vigenteAte, data)),
  );

export function regraDa(
  v: Pick<
    typeof metaVersao.$inferSelect,
    "frequencia" | "vigenteDe" | "vigenteAte" | "diasSemana" | "intervaloDias"
  >,
): Regra {
  return {
    frequencia: v.frequencia,
    vigenteDe: v.vigenteDe as DataCivil,
    vigenteAte: v.vigenteAte as DataCivil | null,
    diasSemana: v.diasSemana,
    intervaloDias: v.intervaloDias,
  };
}

// Os dois lados do vínculo de reagendamento (RF-MET-13), para os selos.
const original = alias(ocorrencia, "original");
const reagendada = alias(ocorrencia, "reagendada");

/** Ocorrências gravadas com a meta, a versão e as datas do reagendamento. */
function selecionarGravadas(onde: SQL | undefined) {
  return db()
    .select({
      meta,
      versao: metaVersao,
      ocorrencia,
      reagendadaDe: original.data,
      reagendadaPara: reagendada.data,
    })
    .from(ocorrencia)
    .innerJoin(meta, eq(ocorrencia.metaId, meta.id))
    .innerJoin(metaVersao, eq(ocorrencia.versaoId, metaVersao.id))
    .leftJoin(original, eq(ocorrencia.reagendadaDeId, original.id))
    .leftJoin(reagendada, eq(reagendada.reagendadaDeId, ocorrencia.id))
    .where(onde);
}

type LinhaGravada = Awaited<ReturnType<typeof selecionarGravadas>>[number];

function paraGravada({
  meta: m,
  versao: v,
  ocorrencia: o,
  reagendadaDe,
  reagendadaPara,
}: LinhaGravada): OcorrenciaGravada {
  return {
    id: o.id,
    metaId: m.id,
    tipo: m.tipo,
    unidade: m.unidade,
    dataPrevista: o.dataPrevista as DataCivil | null,
    data: o.data as DataCivil,
    estado: o.estado,
    valorAtual: o.valorAtual,
    corrigida: o.corrigidaAposEncerramento,
    reagendadaDe: reagendadaDe as DataCivil | null,
    reagendadaPara: reagendadaPara as DataCivil | null,
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
  };
}

function paraVersaoDoDia(
  m: typeof meta.$inferSelect,
  v: typeof metaVersao.$inferSelect,
): VersaoDoDia {
  return {
    metaId: m.id,
    versaoId: v.id,
    tipo: m.tipo,
    unidade: m.unidade,
    titulo: v.titulo,
    horario: horaCurta(v.horario),
    valorAlvo: v.valorAlvo,
    regra: regraDa(v),
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
    selecionarGravadas(
      and(
        eq(ocorrencia.usuarioId, usuarioId),
        or(eq(ocorrencia.data, data), eq(ocorrencia.dataPrevista, data)),
      ),
    ),
  ]);

  return montarListaDoDia(
    data,
    versoes.map(({ meta: m, versao: v }) => paraVersaoDoDia(m, v)),
    gravadas.map(paraGravada),
  );
}

// ---------------------------------------------------------------------------
// Detalhe da meta e Todas as metas (navegacao.md, /metas e /metas/:id)

export type VersaoDaMeta = typeof metaVersao.$inferSelect & {
  vigenteDe: DataCivil;
  vigenteAte: DataCivil | null;
};

export type MetaComVersoes = {
  id: string;
  tipo: "binaria" | "numerica";
  unidade: string | null;
  estado: "ativa" | "pausada" | "excluida";
  versoes: VersaoDaMeta[];
};

/** A meta do usuário com todas as versões, em ordem de vigência. */
export async function metaDoUsuario(
  usuarioId: string,
  metaId: string,
): Promise<MetaComVersoes | null> {
  if (!z.uuid().safeParse(metaId).success) return null;
  const [m] = await db()
    .select()
    .from(meta)
    .where(and(eq(meta.id, metaId), eq(meta.usuarioId, usuarioId)));
  if (!m) return null;
  const versoes = await db()
    .select()
    .from(metaVersao)
    .where(eq(metaVersao.metaId, m.id))
    .orderBy(asc(metaVersao.vigenteDe));
  return {
    id: m.id,
    tipo: m.tipo,
    unidade: m.unidade,
    estado: m.estado,
    versoes: versoes.map((v) => ({
      ...v,
      horario: horaCurta(v.horario),
      vigenteDe: v.vigenteDe as DataCivil,
      vigenteAte: v.vigenteAte as DataCivil | null,
    })),
  };
}

/** A ocorrência aberta no detalhe, gravada ou ainda virtual. */
export type OcorrenciaDoDetalhe = ItemDoDia & {
  data: DataCivil;
  versaoId: string;
};

/**
 * A ocorrência de uma linha da lista, pela vaga ou pelo id. Uma vaga ainda
 * não gravada é calculada pela regra, como na lista do dia.
 */
export async function ocorrenciaDoDetalhe(
  usuarioId: string,
  m: MetaComVersoes,
  ref: RefOcorrencia,
): Promise<OcorrenciaDoDetalhe | null> {
  const porId = "ocorrenciaId" in ref;
  if (porId && !z.uuid().safeParse(ref.ocorrenciaId).success) return null;
  if (!porId && !ehDataCivil(ref.dataPrevista)) return null;

  const [linha] = await selecionarGravadas(
    and(
      eq(ocorrencia.usuarioId, usuarioId),
      eq(ocorrencia.metaId, m.id),
      porId
        ? eq(ocorrencia.id, ref.ocorrenciaId)
        : and(
            eq(ocorrencia.origem, "regra"),
            eq(ocorrencia.dataPrevista, ref.dataPrevista),
          ),
    ),
  ).limit(1);
  if (linha) {
    return {
      ...itemDaGravada(paraGravada(linha)),
      data: linha.ocorrencia.data as DataCivil,
      versaoId: linha.ocorrencia.versaoId,
    };
  }
  if (porId || m.estado !== "ativa") return null;

  const data = ref.dataPrevista as DataCivil;
  const v = m.versoes.find((v) => caiNaData(regraDa(v), data));
  if (!v) return null;
  return {
    ...itemDaVaga(
      {
        metaId: m.id,
        versaoId: v.id,
        tipo: m.tipo,
        unidade: m.unidade,
        titulo: v.titulo,
        horario: v.horario,
        valorAlvo: v.valorAlvo,
        regra: regraDa(v),
      },
      data,
    ),
    data,
    versaoId: v.id,
  };
}

/** Todas as metas que não foram excluídas, com as versões. */
export async function metasDoUsuario(
  usuarioId: string,
): Promise<MetaComVersoes[]> {
  const linhas = await db()
    .select({ meta, versao: metaVersao })
    .from(metaVersao)
    .innerJoin(meta, eq(metaVersao.metaId, meta.id))
    .where(and(eq(meta.usuarioId, usuarioId), ne(meta.estado, "excluida")))
    .orderBy(asc(meta.criadoEm), asc(metaVersao.vigenteDe));

  const metas = new Map<string, MetaComVersoes>();
  for (const { meta: m, versao: v } of linhas) {
    let atual = metas.get(m.id);
    if (!atual) {
      atual = {
        id: m.id,
        tipo: m.tipo,
        unidade: m.unidade,
        estado: m.estado,
        versoes: [],
      };
      metas.set(m.id, atual);
    }
    atual.versoes.push({
      ...v,
      horario: horaCurta(v.horario),
      vigenteDe: v.vigenteDe as DataCivil,
      vigenteAte: v.vigenteAte as DataCivil | null,
    });
  }
  return [...metas.values()];
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

/**
 * A ocorrência de uma linha, travada até o fim da transação: pela vaga
 * (gravando-a se ainda for virtual) ou pelo id, no caso de uma reagendada.
 */
export async function ocorrenciaDaRef(
  tx: Transacao,
  usuarioId: string,
  ref: RefOcorrencia,
): Promise<OcorrenciaParaAlterar | null> {
  if (!("ocorrenciaId" in ref)) {
    if (!z.uuid().safeParse(ref.metaId).success) return null;
    if (!ehDataCivil(ref.dataPrevista)) return null;
    return garantirOcorrencia(tx, usuarioId, ref.metaId, ref.dataPrevista);
  }
  if (!z.uuid().safeParse(ref.ocorrenciaId).success) return null;
  const [linha] = await tx
    .select({ meta, versao: metaVersao, ocorrencia })
    .from(ocorrencia)
    .innerJoin(meta, eq(ocorrencia.metaId, meta.id))
    .innerJoin(metaVersao, eq(ocorrencia.versaoId, metaVersao.id))
    .where(
      and(
        eq(ocorrencia.id, ref.ocorrenciaId),
        eq(ocorrencia.usuarioId, usuarioId),
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
}
