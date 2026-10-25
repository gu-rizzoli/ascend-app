import "server-only";

import { and, eq, gte, inArray, or, sql } from "drizzle-orm";

import { meta, metaVersao, ocorrencia } from "@/db/schema";
import type { DataCivil } from "@/domain/datas";
import { estadoPeloValor, type EdicaoMeta } from "@/domain/metas";
import { type Regra } from "@/domain/recorrencia";
import {
  ajusteSoEsta,
  novaDataValida,
  planoDeEdicao,
  planoDeEncerramento,
  planoDeReativacao,
  podeAdiar,
  podeReagendar,
  versaoDeReferencia,
  type OcorrenciaDaMeta,
} from "@/domain/vigencia";

import { garantirOcorrencia, ocorrenciaDaRef, type Transacao } from "./metas";

/**
 * Escritas da recorrência completa (entrega 4). Cada função roda dentro da
 * transação de quem chama, com a meta travada (`FOR UPDATE`): duas ações ao
 * mesmo tempo na mesma meta acontecem uma depois da outra. Os planos vêm de
 * src/domain/vigencia.ts.
 */

const horaCurta = (horario: string | null) => horario?.slice(0, 5) ?? null;

/** A meta do usuário, travada, com as versões em ordem de vigência. */
async function travarMeta(tx: Transacao, usuarioId: string, metaId: string) {
  const [m] = await tx
    .select()
    .from(meta)
    .where(and(eq(meta.id, metaId), eq(meta.usuarioId, usuarioId)))
    .for("update");
  if (!m) return null;
  const versoes = (
    await tx
      .select()
      .from(metaVersao)
      .where(eq(metaVersao.metaId, metaId))
      .orderBy(metaVersao.vigenteDe)
  ).map((v) => ({
    ...v,
    horario: horaCurta(v.horario),
    vigenteDe: v.vigenteDe as DataCivil,
    vigenteAte: v.vigenteAte as DataCivil | null,
  }));
  return { meta: m, versoes };
}

type Versao = NonNullable<Awaited<ReturnType<typeof travarMeta>>>["versoes"][0];

/** As ocorrências da meta de hoje em diante: o passado nunca muda aqui. */
async function ocorrenciasDeHojeEmDiante(
  tx: Transacao,
  metaId: string,
  dataHoje: DataCivil,
) {
  const linhas = await tx
    .select()
    .from(ocorrencia)
    .where(
      and(
        eq(ocorrencia.metaId, metaId),
        or(
          gte(ocorrencia.data, dataHoje),
          gte(ocorrencia.dataPrevista, dataHoje),
        ),
      ),
    )
    .for("update");
  return linhas.map((o) => ({
    linha: o,
    plano: {
      id: o.id,
      versaoId: o.versaoId,
      origem: o.origem,
      dataPrevista: o.dataPrevista as DataCivil | null,
      data: o.data as DataCivil,
      estado: o.estado,
      valorAtual: o.valorAtual,
      ajustada:
        o.titulo !== null ||
        o.horario !== null ||
        o.valorAlvo !== null ||
        (o.dataPrevista !== null && o.data !== o.dataPrevista),
    } satisfies OcorrenciaDaMeta,
  }));
}

async function apagarOcorrencias(tx: Transacao, ids: string[]) {
  if (ids.length > 0) {
    await tx.delete(ocorrencia).where(inArray(ocorrencia.id, ids));
  }
}

async function fecharVersoes(
  tx: Transacao,
  fechar: { id: string; vigenteAte: DataCivil }[],
) {
  for (const f of fechar) {
    await tx
      .update(metaVersao)
      .set({ vigenteAte: f.vigenteAte })
      .where(eq(metaVersao.id, f.id));
  }
}

// ---------------------------------------------------------------------------
// Pausar, reativar e excluir (RF-MET-10, 10.9, RF-HIS-15)

/** Pausa uma meta recorrente ativa a partir de hoje. */
export async function pausar(
  tx: Transacao,
  usuarioId: string,
  metaId: string,
  dataHoje: DataCivil,
): Promise<boolean> {
  const travada = await travarMeta(tx, usuarioId, metaId);
  if (!travada || travada.meta.estado !== "ativa") return false;
  const referencia = versaoDeReferencia(travada.versoes, dataHoje);
  if (!referencia || referencia.frequencia === "unica") return false;

  const ocorrencias = await ocorrenciasDeHojeEmDiante(tx, metaId, dataHoje);
  const plano = planoDeEncerramento(
    "pausar",
    dataHoje,
    travada.versoes,
    ocorrencias.map((o) => o.plano),
  );
  await apagarOcorrencias(tx, plano.apagar);
  await fecharVersoes(tx, plano.fechar);
  await tx
    .update(meta)
    .set({ estado: "pausada", atualizadoEm: new Date() })
    .where(eq(meta.id, metaId));
  return true;
}

/** Reativa uma meta pausada a partir de hoje, com a mesma regra. */
export async function reativar(
  tx: Transacao,
  usuarioId: string,
  metaId: string,
  dataHoje: DataCivil,
): Promise<boolean> {
  const travada = await travarMeta(tx, usuarioId, metaId);
  if (!travada || travada.meta.estado !== "pausada") return false;
  const plano = planoDeReativacao(dataHoje, travada.versoes);
  if (!plano) return false;

  if (plano.tipo === "reabrir") {
    await tx
      .update(metaVersao)
      .set({ vigenteAte: null })
      .where(eq(metaVersao.id, plano.versaoId));
  } else {
    const ultima = travada.versoes.find((v) => v.id === plano.versaoId)!;
    await tx.insert(metaVersao).values({
      metaId,
      vigenteDe: plano.vigenteDe,
      titulo: ultima.titulo,
      descricao: ultima.descricao,
      horario: ultima.horario,
      valorAlvo: ultima.valorAlvo,
      frequencia: ultima.frequencia,
      diasSemana: ultima.diasSemana,
      intervaloDias: ultima.intervaloDias,
    });
  }
  await tx
    .update(meta)
    .set({ estado: "ativa", atualizadoEm: new Date() })
    .where(eq(meta.id, metaId));
  return true;
}

/**
 * Exclui a meta: encerra a regra como na pausa e esconde a meta das listas.
 * O passado fica no Histórico (D-054). Se não sobrar nenhuma ocorrência, a
 * meta não tem história e é apagada de verdade, como uma meta de ocorrência
 * única que ainda não aconteceu (fluxos-metas.md).
 */
export async function excluir(
  tx: Transacao,
  usuarioId: string,
  metaId: string,
  dataHoje: DataCivil,
): Promise<boolean> {
  const travada = await travarMeta(tx, usuarioId, metaId);
  if (!travada || travada.meta.estado === "excluida") return false;

  const ocorrencias = await ocorrenciasDeHojeEmDiante(tx, metaId, dataHoje);
  const plano = planoDeEncerramento(
    "excluir",
    dataHoje,
    travada.versoes,
    ocorrencias.map((o) => o.plano),
  );
  await apagarOcorrencias(tx, plano.apagar);

  const [resta] = await tx
    .select({ id: ocorrencia.id })
    .from(ocorrencia)
    .where(eq(ocorrencia.metaId, metaId))
    .limit(1);
  if (!resta) {
    await tx.delete(metaVersao).where(eq(metaVersao.metaId, metaId));
    await tx.delete(meta).where(eq(meta.id, metaId));
    return true;
  }

  await fecharVersoes(tx, plano.fechar);
  const agora = new Date();
  await tx
    .update(meta)
    .set({ estado: "excluida", excluidaEm: agora, atualizadoEm: agora })
    .where(eq(meta.id, metaId));
  return true;
}

// ---------------------------------------------------------------------------
// Editar (RF-MET-09)

export type Escopo = "so_esta" | "proximas";

export type PedidoDeEdicao = {
  metaId: string;
  // A ocorrência aberta no detalhe, se a edição partiu de uma.
  vaga: DataCivil | null;
  ocorrenciaId: string | null;
  escopo: Escopo;
  edicao: EdicaoMeta;
};

const regraDaEdicao = (e: EdicaoMeta, vigenteDe: DataCivil): Regra => ({
  ...e.frequencia,
  vigenteDe,
  vigenteAte: e.frequencia.frequencia === "unica" ? vigenteDe : null,
});

function mesmaRegra(v: Versao, e: EdicaoMeta): boolean {
  return (
    v.titulo === e.titulo &&
    v.descricao === e.descricao &&
    v.horario === e.horario &&
    v.valorAlvo === e.valorAlvo &&
    v.frequencia === e.frequencia.frequencia &&
    (v.diasSemana ?? []).join() === (e.frequencia.diasSemana ?? []).join() &&
    v.intervaloDias === e.frequencia.intervaloDias
  );
}

/**
 * Uma numérica de hoje ou do futuro volta a ser decidida pelo valor quando o
 * alvo muda: concluída se já chegou, pendente se não.
 */
function estadoComAlvo(
  tipo: "binaria" | "numerica",
  o: { estado: string; valorAtual: number | null; concluidaEm: Date | null },
  alvo: number | null,
) {
  if (tipo !== "numerica" || alvo === null || o.estado === "nao_concluida") {
    return {};
  }
  const estado = estadoPeloValor(o.valorAtual ?? 0, alvo);
  if (estado === o.estado) return {};
  return {
    estado,
    concluidaEm: estado === "concluida" ? (o.concluidaEm ?? new Date()) : null,
  };
}

/**
 * Salva a edição. Devolve uma mensagem de erro para a tela, ou null.
 *
 * - Meta de ocorrência única: não há o que perguntar, a única versão muda.
 * - "Só esta": a ocorrência guarda o título, o horário e o alvo que diferem
 *   da regra; descrição e frequência são da regra e não mudam.
 * - "Esta e as próximas": a regra antiga termina na véspera da ocorrência
 *   editada (ou de hoje, vindo de Todas as metas) e uma nova começa ali.
 */
export async function editar(
  tx: Transacao,
  usuarioId: string,
  pedido: PedidoDeEdicao,
  dataHoje: DataCivil,
): Promise<string | null> {
  const travada = await travarMeta(tx, usuarioId, pedido.metaId);
  if (!travada || travada.meta.estado !== "ativa") {
    return "Esta meta não pode ser editada agora.";
  }
  const { meta: m, versoes } = travada;
  const { edicao } = pedido;

  const referencia = versaoDeReferencia(versoes, dataHoje);
  if (!referencia) return "Esta meta não pode ser editada agora.";

  if (referencia.frequencia === "unica") {
    return editarUnica(tx, m.tipo, referencia, edicao, dataHoje);
  }

  if (pedido.escopo === "so_esta") {
    const ref = pedido.ocorrenciaId
      ? { ocorrenciaId: pedido.ocorrenciaId }
      : pedido.vaga
        ? { metaId: m.id, dataPrevista: pedido.vaga }
        : null;
    if (!ref) return "Escolha uma ocorrência para editar só ela.";
    const o = await ocorrenciaDaRef(tx, usuarioId, ref);
    if (!o || o.data < dataHoje) {
      return "Dias encerrados se mudam pela correção.";
    }
    const [atual] = await tx
      .select({ ocorrencia, versao: metaVersao })
      .from(ocorrencia)
      .innerJoin(metaVersao, eq(ocorrencia.versaoId, metaVersao.id))
      .where(eq(ocorrencia.id, o.id));
    const versao = {
      titulo: atual!.versao.titulo,
      horario: horaCurta(atual!.versao.horario),
      valorAlvo: atual!.versao.valorAlvo,
    };
    if (edicao.horario === null && versao.horario !== null) {
      return "Para tirar o horário, salve para esta e as próximas.";
    }
    const ajuste = ajusteSoEsta(versao, {
      titulo: edicao.titulo,
      horario: edicao.horario,
      valorAlvo: m.tipo === "numerica" ? edicao.valorAlvo : null,
    });
    await tx
      .update(ocorrencia)
      .set({
        ...ajuste,
        ...estadoComAlvo(
          m.tipo,
          atual!.ocorrencia,
          ajuste.valorAlvo ?? versao.valorAlvo,
        ),
        atualizadoEm: new Date(),
      })
      .where(eq(ocorrencia.id, o.id));
    return null;
  }

  // "Esta e as próximas": começa na data da ocorrência aberta, ou hoje.
  if (pedido.ocorrenciaId) {
    return "Uma ocorrência reagendada só muda sozinha.";
  }
  const inicioDaRegra =
    referencia.vigenteDe > dataHoje ? referencia.vigenteDe : dataHoje;
  const d =
    pedido.vaga !== null && pedido.vaga > dataHoje
      ? pedido.vaga
      : inicioDaRegra;
  const cobreD = versoes.find(
    (v) => v.vigenteDe <= d && (v.vigenteAte === null || v.vigenteAte >= d),
  );

  const ocorrencias = await ocorrenciasDeHojeEmDiante(tx, m.id, dataHoje);
  const editada =
    pedido.vaga === null
      ? null
      : ocorrencias.find(
          (o) =>
            o.linha.origem === "regra" && o.linha.dataPrevista === pedido.vaga,
        );
  if (cobreD && mesmaRegra(cobreD, edicao) && !editada?.plano.ajustada) {
    return null;
  }

  const novaRegra = regraDaEdicao(edicao, d);
  const plano = planoDeEdicao(
    d,
    novaRegra,
    versoes,
    ocorrencias.map((o) => o.plano),
    editada?.linha.id ?? null,
  );

  const [nova] = await tx
    .insert(metaVersao)
    .values({
      metaId: m.id,
      vigenteDe: d,
      vigenteAte: null,
      titulo: edicao.titulo,
      descricao: edicao.descricao,
      horario: edicao.horario,
      valorAlvo: m.tipo === "numerica" ? edicao.valorAlvo : null,
      frequencia: novaRegra.frequencia,
      diasSemana: novaRegra.diasSemana,
      intervaloDias: novaRegra.intervaloDias,
    })
    .returning({ id: metaVersao.id });

  await apagarOcorrencias(tx, plano.apagar);
  for (const r of plano.repontar) {
    const o = ocorrencias.find((x) => x.linha.id === r.id)!.linha;
    const alvo = r.limparAjuste
      ? edicao.valorAlvo
      : (o.valorAlvo ?? edicao.valorAlvo);
    await tx
      .update(ocorrencia)
      .set({
        versaoId: nova!.id,
        ...(r.limparAjuste && { titulo: null, horario: null, valorAlvo: null }),
        ...(o.data >= dataHoje && estadoComAlvo(m.tipo, o, alvo)),
        atualizadoEm: new Date(),
      })
      .where(eq(ocorrencia.id, r.id));
  }
  await fecharVersoes(tx, plano.fechar);
  if (plano.remover.length > 0) {
    await tx.delete(metaVersao).where(inArray(metaVersao.id, plano.remover));
  }
  return null;
}

/**
 * Meta de ocorrência única: só existe um dia, que ainda não passou, então a
 * versão muda no lugar. Virar recorrente abre a vigência a partir do mesmo
 * dia. A ocorrência perde os ajustes, porque a tela mostrou os valores dela.
 */
async function editarUnica(
  tx: Transacao,
  tipo: "binaria" | "numerica",
  versao: Versao,
  edicao: EdicaoMeta,
  dataHoje: DataCivil,
): Promise<string | null> {
  const [gravada] = await tx
    .select()
    .from(ocorrencia)
    .where(
      and(eq(ocorrencia.versaoId, versao.id), eq(ocorrencia.origem, "regra")),
    )
    .for("update")
    .limit(1);
  const dia = gravada ? (gravada.data as DataCivil) : versao.vigenteDe;
  if (dia < dataHoje) return "Dias encerrados se mudam pela correção.";

  const regra = regraDaEdicao(edicao, versao.vigenteDe);
  await tx
    .update(metaVersao)
    .set({
      titulo: edicao.titulo,
      descricao: edicao.descricao,
      horario: edicao.horario,
      valorAlvo: tipo === "numerica" ? edicao.valorAlvo : null,
      frequencia: regra.frequencia,
      diasSemana: regra.diasSemana,
      intervaloDias: regra.intervaloDias,
      vigenteAte: regra.vigenteAte,
    })
    .where(eq(metaVersao.id, versao.id));
  if (gravada) {
    await tx
      .update(ocorrencia)
      .set({
        titulo: null,
        horario: null,
        valorAlvo: null,
        ...estadoComAlvo(tipo, gravada, edicao.valorAlvo),
        atualizadoEm: new Date(),
      })
      .where(eq(ocorrencia.id, gravada.id));
  }
  return null;
}

// ---------------------------------------------------------------------------
// Adiar e reagendar (RF-MET-13, fluxos-metas.md, decisão 6)

/**
 * Muda a data de uma pendente de hoje ou do futuro. A vaga continua a mesma
 * (`data_prevista`), então a regra não a gera de novo no dia original.
 */
export async function adiar(
  tx: Transacao,
  usuarioId: string,
  ref: { metaId: string; dataPrevista: DataCivil } | { ocorrenciaId: string },
  novaData: DataCivil,
  dataHoje: DataCivil,
): Promise<boolean> {
  const o =
    "ocorrenciaId" in ref
      ? await ocorrenciaDaRef(tx, usuarioId, ref)
      : await garantirOcorrencia(tx, usuarioId, ref.metaId, ref.dataPrevista);
  if (!o || !podeAdiar(o, dataHoje)) return false;
  if (!novaDataValida(novaData, o.data, dataHoje)) return false;
  await tx
    .update(ocorrencia)
    .set({ data: novaData, atualizadoEm: new Date() })
    .where(eq(ocorrencia.id, o.id));
  return true;
}

/**
 * Reagenda uma não concluída: cria uma ocorrência avulsa na data escolhida,
 * ligada à original, com o mesmo título, horário, alvo e valor (decisão 5).
 * A original continua não concluída.
 */
export async function reagendar(
  tx: Transacao,
  usuarioId: string,
  ocorrenciaId: string,
  novaData: DataCivil,
  dataHoje: DataCivil,
): Promise<boolean> {
  const [linha] = await tx
    .select({ meta, versao: metaVersao, ocorrencia })
    .from(ocorrencia)
    .innerJoin(meta, eq(ocorrencia.metaId, meta.id))
    .innerJoin(metaVersao, eq(ocorrencia.versaoId, metaVersao.id))
    .where(
      and(eq(ocorrencia.id, ocorrenciaId), eq(ocorrencia.usuarioId, usuarioId)),
    )
    .for("update", { of: [ocorrencia, meta] })
    .limit(1);
  if (!linha || linha.meta.estado === "excluida") return false;
  const { meta: m, versao: v, ocorrencia: o } = linha;

  const [filho] = await tx
    .select({ data: ocorrencia.data })
    .from(ocorrencia)
    .where(eq(ocorrencia.reagendadaDeId, o.id))
    .limit(1);
  const original = {
    data: o.data as DataCivil,
    estado: o.estado,
    reagendadaPara: (filho?.data as DataCivil | undefined) ?? null,
  };
  if (!podeReagendar(original, dataHoje)) return false;
  if (!novaDataValida(novaData, original.data, dataHoje)) return false;

  const alvo = o.valorAlvo ?? v.valorAlvo;
  const estado =
    m.tipo === "numerica" && alvo !== null
      ? estadoPeloValor(o.valorAtual ?? 0, alvo)
      : "pendente";
  const criadas = await tx
    .insert(ocorrencia)
    .values({
      usuarioId,
      metaId: m.id,
      versaoId: o.versaoId,
      origem: "reagendada",
      dataPrevista: null,
      data: novaData,
      reagendadaDeId: o.id,
      estado,
      valorAtual: o.valorAtual,
      titulo: o.titulo,
      horario: o.horario,
      valorAlvo: o.valorAlvo,
      concluidaEm: estado === "concluida" ? new Date() : null,
    })
    .onConflictDoNothing({
      target: ocorrencia.reagendadaDeId,
      where: sql`${ocorrencia.reagendadaDeId} is not null`,
    })
    .returning({ id: ocorrencia.id });
  return criadas.length > 0;
}
