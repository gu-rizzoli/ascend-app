import "server-only";

import { and, asc, between, eq, inArray, lte } from "drizzle-orm";

import { db } from "@/db";
import {
  metaVersao,
  ocorrencia,
  projeto,
  projetoAtualTroca,
} from "@/db/schema";
import type { DataCivil } from "@/domain/datas";
import {
  focoPorDia,
  type MetaDoHistorico,
  type TreinoDoHistorico,
} from "@/domain/historico";
import { itemDaGravada, ordenarItens } from "@/domain/metas";

import { paraGravada, selecionarGravadas } from "./metas";
import { treinosDoUsuario } from "./treinos";

/**
 * Leituras do Histórico. Não há tabela própria: tudo vem das ocorrências, dos
 * treinos e das trocas de projeto atual (10.1, 13.9). Todas recebem o dono
 * vindo da sessão.
 */

async function nomesDosProjetos(
  usuarioId: string,
  ids: (string | null)[],
): Promise<Map<string, string>> {
  const unicos = [...new Set(ids.filter((id) => id !== null))];
  if (unicos.length === 0) return new Map();
  const linhas = await db()
    .select({ id: projeto.id, nome: projeto.nome })
    .from(projeto)
    .where(and(eq(projeto.usuarioId, usuarioId), inArray(projeto.id, unicos)));
  return new Map(linhas.map((p) => [p.id, p.nome]));
}

/**
 * As ocorrências com data no período, inclusive as de metas pausadas ou
 * excluídas depois (RF-HIS-15). Com `projetoId`, só as da versão associada
 * a ele (RF-HIS-08, 12).
 */
export async function metasDoPeriodo(
  usuarioId: string,
  de: DataCivil,
  ate: DataCivil,
  projetoId: string | null,
): Promise<MetaDoHistorico[]> {
  if (de > ate) return [];
  const linhas = await selecionarGravadas(
    and(
      eq(ocorrencia.usuarioId, usuarioId),
      between(ocorrencia.data, de, ate),
      projetoId ? eq(metaVersao.projetoId, projetoId) : undefined,
    ),
  );
  const nomes = await nomesDosProjetos(
    usuarioId,
    linhas.map((l) => l.versao.projetoId),
  );
  const porItem = new Map(linhas.map((l) => [l.ocorrencia.id, l] as const));
  const metas = ordenarItens(
    linhas.map((l) => itemDaGravada(paraGravada(l))),
  ).map((item) => {
    const { ocorrencia: o, versao: v } = porItem.get(item.ocorrenciaId!)!;
    const nome = v.projetoId ? nomes.get(v.projetoId) : undefined;
    return {
      ...item,
      data: o.data as DataCivil,
      projeto: nome ? { id: v.projetoId!, nome } : null,
      corrigidaEm: o.corrigidaAposEncerramento ? o.atualizadoEm : null,
    };
  });
  // Por data, e dentro do dia na ordem da lista do dia (sort é estável).
  return metas.sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
}

/** Os treinos do período, já com o título da lista de Treinos. */
export async function treinosDoPeriodo(
  usuarioId: string,
  de: DataCivil,
  ate: DataCivil,
  titulo: (t: { nome: string | null; exercicios: string[] }) => string,
): Promise<TreinoDoHistorico[]> {
  if (de > ate) return [];
  const treinos = await treinosDoUsuario(usuarioId, { de, ate });
  return treinos.map((t) => ({ id: t.id, data: t.data, titulo: titulo(t) }));
}

/**
 * O projeto em foco em cada dia pedido (RF-HIS-09): a última troca até ele.
 * Um projeto excluído deixa a troca sem projeto, então o dia fica sem foco.
 */
export async function focosDosDias(
  usuarioId: string,
  dias: DataCivil[],
): Promise<Map<DataCivil, { id: string; nome: string } | null>> {
  if (dias.length === 0) return new Map();
  const ultimo = dias.reduce((a, b) => (a > b ? a : b));
  const trocas = await db()
    .select({
      data: projetoAtualTroca.data,
      projetoId: projetoAtualTroca.projetoId,
    })
    .from(projetoAtualTroca)
    .where(
      and(
        eq(projetoAtualTroca.usuarioId, usuarioId),
        lte(projetoAtualTroca.data, ultimo),
      ),
    )
    .orderBy(asc(projetoAtualTroca.data), asc(projetoAtualTroca.criadoEm));
  const foco = focoPorDia(
    trocas.map((t) => ({ data: t.data as DataCivil, projetoId: t.projetoId })),
    dias,
  );
  const nomes = await nomesDosProjetos(usuarioId, [...foco.values()]);
  return new Map(
    [...foco].map(([dia, id]) => {
      const nome = id ? nomes.get(id) : undefined;
      return [dia, nome ? { id: id!, nome } : null];
    }),
  );
}
