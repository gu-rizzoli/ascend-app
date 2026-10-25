import { somarDias, type DataCivil } from "./datas";
import type { EstadoOcorrencia } from "./metas";
import { caiNaData, type Regra } from "./recorrencia";

/**
 * Recorrência completa (7.7, 7.8, 7.12, RF-MET-09, 10, 13). Toda mudança numa
 * regra vale a partir de uma data e nunca toca o passado: editar "esta e as
 * próximas", pausar, reativar e excluir fecham a versão atual e, quando for o
 * caso, abrem outra (fluxos-metas.md, "Recorrência"). Aqui ficam só os
 * planos; quem grava é src/server/recorrencia.ts, numa transação.
 */

/** A vigência de uma `meta_versao`. */
export type Vigencia = {
  id: string;
  vigenteDe: DataCivil;
  vigenteAte: DataCivil | null;
};

/** Uma ocorrência já gravada da meta, com o que os planos precisam. */
export type OcorrenciaDaMeta = {
  id: string;
  versaoId: string;
  origem: "regra" | "reagendada";
  dataPrevista: DataCivil | null;
  data: DataCivil;
  estado: EstadoOcorrencia;
  valorAtual: number | null;
  // Tem ajuste de "só esta" (título, horário ou alvo) ou foi adiada.
  ajustada: boolean;
};

/** Já foi mexida: concluída ou com algum valor somado. */
export function temProgresso(
  o: Pick<OcorrenciaDaMeta, "estado" | "valorAtual">,
): boolean {
  return o.estado === "concluida" || (o.valorAtual ?? 0) > 0;
}

/** Versão que não vale em nenhum dia (fechada antes de começar). */
export function versaoVazia(v: Vigencia): boolean {
  return v.vigenteAte !== null && v.vigenteAte < v.vigenteDe;
}

/**
 * A versão que a tela mostra como "a regra" da meta: a vigente hoje, senão a
 * próxima a começar, senão a última que valeu.
 */
export function versaoDeReferencia<V extends Vigencia>(
  versoes: V[],
  hoje: DataCivil,
): V | null {
  const validas = versoes
    .filter((v) => !versaoVazia(v))
    .sort((a, b) => (a.vigenteDe < b.vigenteDe ? -1 : 1));
  const lista = validas.length > 0 ? validas : versoes;
  return (
    lista.find(
      (v) =>
        v.vigenteDe <= hoje && (v.vigenteAte === null || v.vigenteAte >= hoje),
    ) ??
    lista.find((v) => v.vigenteDe > hoje) ??
    lista.at(-1) ??
    null
  );
}

// ---------------------------------------------------------------------------
// Pausar e excluir (7.8, 10.9, RF-MET-10, RF-HIS-15)

export type PlanoDeEncerramento = {
  /** Ocorrências apagadas: ainda não aconteceram e não têm história. */
  apagar: string[];
  /** Novo `vigente_ate` de cada versão que passava do fim. */
  fechar: { id: string; vigenteAte: DataCivil }[];
};

/**
 * Pausar e excluir encerram a regra a partir de hoje (fluxos-metas.md,
 * decisões 3 e 8):
 *
 * - a ocorrência de hoje sai se estiver intocada e fica se já tiver valor ou
 *   conclusão; nesse caso a regra vale até hoje, senão até ontem;
 * - pendentes futuras gravadas (ajustadas ou adiantadas) são apagadas;
 * - ao pausar, as futuras concluídas antecipadamente ficam. Ao excluir, o
 *   futuro todo sai, porque uma meta excluída não tem futuro.
 *
 * O passado nunca é tocado. Uma versão que só começaria depois do fim fica
 * vazia em vez de apagada, porque ocorrências podem apontar para ela.
 */
export function planoDeEncerramento(
  modo: "pausar" | "excluir",
  hoje: DataCivil,
  versoes: Vigencia[],
  ocorrencias: OcorrenciaDaMeta[],
): PlanoDeEncerramento {
  const apagar = ocorrencias.filter((o) => {
    if (o.data < hoje) return false;
    if (o.data > hoje) return modo === "excluir" || o.estado === "pendente";
    return !temProgresso(o);
  });
  const apagadas = new Set(apagar.map((o) => o.id));

  const ficaHoje = ocorrencias.some(
    (o) =>
      !apagadas.has(o.id) && o.origem === "regra" && o.dataPrevista === hoje,
  );
  const fim = ficaHoje ? hoje : somarDias(hoje, -1);

  const fechar = versoes
    .filter((v) => v.vigenteAte === null || v.vigenteAte > fim)
    .map((v) => {
      const antesDeComecar = somarDias(v.vigenteDe, -1);
      return {
        id: v.id,
        vigenteAte: fim > antesDeComecar ? fim : antesDeComecar,
      };
    })
    .filter((f) => {
      const atual = versoes.find((v) => v.id === f.id)!;
      return atual.vigenteAte !== f.vigenteAte;
    });

  return { apagar: apagar.map((o) => o.id), fechar };
}

// ---------------------------------------------------------------------------
// Reativar (RF-MET-10)

export type PlanoDeReativacao =
  | { tipo: "reabrir"; versaoId: string }
  | { tipo: "copiar"; versaoId: string; vigenteDe: DataCivil };

/**
 * Reativar abre a regra de novo a partir de hoje, igual à última versão. Se a
 * pausa não chegou a cobrir um dia inteiro (pausou e reativou no mesmo dia,
 * ou a regra ainda nem tinha começado), a última versão só é reaberta e nada
 * muda. Senão nasce uma versão nova, e a contagem de "a cada X dias"
 * recomeça nela (modelo-dados-metas.md).
 */
export function planoDeReativacao(
  hoje: DataCivil,
  versoes: Vigencia[],
): PlanoDeReativacao | null {
  const ultima = [...versoes].sort((a, b) =>
    a.vigenteDe < b.vigenteDe ? -1 : 1,
  )[versoes.length - 1];
  if (!ultima) return null;
  if (ultima.vigenteAte === null || ultima.vigenteAte >= somarDias(hoje, -1)) {
    return { tipo: "reabrir", versaoId: ultima.id };
  }
  return { tipo: "copiar", versaoId: ultima.id, vigenteDe: hoje };
}

// ---------------------------------------------------------------------------
// Editar "esta e as próximas" (7.7, RF-MET-09)

export type PlanoDeEdicao = {
  /** Versões que começaram antes de D e passam a terminar em D − 1. */
  fechar: { id: string; vigenteAte: DataCivil }[];
  /** Versões que começariam em D ou depois: a nova regra as substitui. */
  remover: string[];
  /** Ocorrências que passam para a nova versão. */
  repontar: { id: string; limparAjuste: boolean }[];
  /** Ocorrências intocadas em datas que a nova regra não tem mais. */
  apagar: string[];
};

/**
 * Editar a partir da data D: a regra antiga termina em D − 1 e a nova começa
 * em D, com a mesma meta (fluxos-metas.md). Das ocorrências gravadas de D em
 * diante:
 *
 * - as que têm ajuste individual ficam como estão (decisão 7);
 * - as outras passam para a nova regra, se ela ainda cai naquela data;
 * - se não cai mais, ficam as que já têm valor ou conclusão, e as intocadas
 *   são apagadas.
 *
 * A ocorrência que foi editada (`editadaId`) segue a nova regra mesmo se
 * tiver ajuste: a tela mostrou os valores dela e o usuário os salvou como a
 * regra nova. Quem aponta para uma versão removida sempre passa para a nova.
 */
export function planoDeEdicao(
  d: DataCivil,
  novaRegra: Regra,
  versoes: Vigencia[],
  ocorrencias: OcorrenciaDaMeta[],
  editadaId: string | null,
): PlanoDeEdicao {
  const ontem = somarDias(d, -1);
  const fechar = versoes
    .filter(
      (v) => v.vigenteDe < d && (v.vigenteAte === null || v.vigenteAte >= d),
    )
    .map((v) => ({ id: v.id, vigenteAte: ontem }));
  const remover = versoes.filter((v) => v.vigenteDe >= d).map((v) => v.id);
  const removidas = new Set(remover);

  const repontar: PlanoDeEdicao["repontar"] = [];
  const apagar: string[] = [];
  for (const o of ocorrencias) {
    const editada = o.id === editadaId;
    const daNovaFaixa =
      o.origem === "regra" && o.dataPrevista !== null && o.dataPrevista >= d;
    const presa = removidas.has(o.versaoId);
    if (!editada && !daNovaFaixa && !presa) continue;

    if (o.ajustada && !editada) {
      if (presa) repontar.push({ id: o.id, limparAjuste: false });
      continue;
    }
    // Uma vaga de antes de D (a editada, adiada de um dia anterior) ou uma
    // reagendada não dependem da regra para existir.
    const cai =
      o.origem === "reagendada" ||
      o.dataPrevista === null ||
      o.dataPrevista < d ||
      caiNaData(novaRegra, o.dataPrevista);
    if (cai || temProgresso(o)) {
      if (cai || presa || editada) {
        repontar.push({ id: o.id, limparAjuste: editada });
      }
    } else {
      apagar.push(o.id);
    }
  }

  return { fechar, remover, repontar, apagar };
}

/**
 * Ajuste de "só esta": guarda só o que difere da versão, para que uma
 * mudança futura da regra continue valendo nos campos não ajustados.
 */
export function ajusteSoEsta(
  versao: { titulo: string; horario: string | null; valorAlvo: number | null },
  pedido: { titulo: string; horario: string | null; valorAlvo: number | null },
): { titulo: string | null; horario: string | null; valorAlvo: number | null } {
  return {
    titulo: pedido.titulo === versao.titulo ? null : pedido.titulo,
    horario: pedido.horario === versao.horario ? null : pedido.horario,
    valorAlvo: pedido.valorAlvo === versao.valorAlvo ? null : pedido.valorAlvo,
  };
}

// ---------------------------------------------------------------------------
// Adiar e reagendar (7.12, RF-MET-13, fluxos-metas.md, decisão 6)

/**
 * Adiar é mudar a data de uma pendente de hoje ou do futuro ("só esta"). Ela
 * ainda não falhou, então nada fica registrado como não concluído.
 */
export function podeAdiar(
  o: { data: DataCivil; estado: EstadoOcorrencia },
  hoje: DataCivil,
): boolean {
  return o.estado === "pendente" && o.data >= hoje;
}

/**
 * Reagendar é só para não concluídas, e cada uma é reagendada uma vez: a
 * original continua não concluída e ganha uma ocorrência nova ligada a ela.
 */
export function podeReagendar(
  o: {
    data: DataCivil;
    estado: EstadoOcorrencia;
    reagendadaPara: DataCivil | null;
  },
  hoje: DataCivil,
): boolean {
  return (
    o.estado === "nao_concluida" && o.data < hoje && o.reagendadaPara === null
  );
}

/** A data nova de um adiamento ou reagendamento: hoje ou depois. */
export function novaDataValida(
  nova: DataCivil,
  atual: DataCivil,
  hoje: DataCivil,
): boolean {
  return nova >= hoje && nova !== atual;
}

// ---------------------------------------------------------------------------
// Todas as metas (navegacao.md, /metas)

export type GruposDeMetas<M> = {
  recorrentes: M[];
  unicas: M[];
  pausadas: M[];
};

/**
 * Separa as metas da tela Todas as metas: ativas recorrentes, de ocorrência
 * única ainda por vir e pausadas. Uma única que já passou está no Histórico,
 * não aqui. Excluídas não aparecem.
 */
export function agruparMetas<
  M extends {
    estado: "ativa" | "pausada" | "excluida";
    versoes: (Vigencia & { frequencia: string })[];
  },
>(metas: M[], hoje: DataCivil): GruposDeMetas<M> {
  const grupos: GruposDeMetas<M> = {
    recorrentes: [],
    unicas: [],
    pausadas: [],
  };
  for (const m of metas) {
    const referencia = versaoDeReferencia(m.versoes, hoje);
    if (!referencia || m.estado === "excluida") continue;
    if (m.estado === "pausada") grupos.pausadas.push(m);
    else if (referencia.frequencia !== "unica") grupos.recorrentes.push(m);
    else if (referencia.vigenteDe >= hoje) grupos.unicas.push(m);
  }
  return grupos;
}
