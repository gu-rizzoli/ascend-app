import { z } from "zod";

import { diaDaSemana, ehDataCivil, somarDias, type DataCivil } from "./datas";
import type { EstadoOcorrencia, ItemDoDia } from "./metas";

/**
 * Regras do Histórico (10, RF-HIS-01 a 15). O Histórico não tem tabela
 * própria: tudo aqui recebe ocorrências, treinos e trocas de projeto já lidos
 * e só agrupa e conta (13.9).
 *
 * As metas entram só até ontem: uma meta só é "não concluída" depois que o
 * dia termina, e hoje vive na tela Hoje. Treinos entram até hoje, porque um
 * treino registrado já aconteceu (docs/produto/historico.md, decisão 1).
 */

// ---------------------------------------------------------------------------
// Taxa e estatísticas (10.3, 10.10)

type ComEstado = { data: DataCivil; estado: EstadoOcorrencia };

export type Contagem = { concluidas: number; total: number };

/** "75%" de 3 em 4. Null num dia sem metas: neutro, não 0% (RF-HIS-02). */
export function percentual({ concluidas, total }: Contagem): number | null {
  return total === 0 ? null : Math.round((concluidas / total) * 100);
}

/**
 * Concluídas e total de cada dia. Uma numérica conta só se atingiu o alvo, o
 * que o estado já diz. Pendentes não contam: num dia encerrado não existem.
 */
export function contagemPorDia(
  registros: readonly ComEstado[],
): Map<DataCivil, Contagem> {
  const dias = new Map<DataCivil, Contagem>();
  for (const r of registros) {
    if (r.estado === "pendente") continue;
    const c = dias.get(r.data) ?? { concluidas: 0, total: 0 };
    c.total += 1;
    if (r.estado === "concluida") c.concluidas += 1;
    dias.set(r.data, c);
  }
  return dias;
}

export type Estatisticas = {
  concluidas: number;
  naoConcluidas: number;
  // Null quando não há metas no período.
  taxa: number | null;
  treinos: number;
};

/** As quatro estatísticas do período, e só elas (10.10). */
export function estatisticas(
  registros: readonly ComEstado[],
  treinos: number,
): Estatisticas {
  let concluidas = 0;
  let naoConcluidas = 0;
  for (const r of registros) {
    if (r.estado === "concluida") concluidas += 1;
    else if (r.estado === "nao_concluida") naoConcluidas += 1;
  }
  return {
    concluidas,
    naoConcluidas,
    taxa: percentual({ concluidas, total: concluidas + naoConcluidas }),
    treinos,
  };
}

/**
 * A intensidade da cor no calendário, de 1 a 5. Só ajuda a ler: a cor é uma
 * só e não diz que um dia foi bom ou ruim (10.3).
 */
export function nivelDaTaxa(taxa: number): 1 | 2 | 3 | 4 | 5 {
  if (taxa >= 100) return 5;
  if (taxa >= 75) return 4;
  if (taxa >= 50) return 3;
  if (taxa >= 25) return 2;
  return 1;
}

// ---------------------------------------------------------------------------
// Mês do calendário

/** Um mês no formato AAAA-MM. */
export type Mes = string & { readonly __mes: unique symbol };

const MES = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function ehMes(valor: string): valor is Mes {
  return MES.test(valor);
}

export function mesDe(data: DataCivil): Mes {
  return data.slice(0, 7) as Mes;
}

export function primeiroDia(mes: Mes): DataCivil {
  return `${mes}-01` as DataCivil;
}

export function ultimoDia(mes: Mes): DataCivil {
  return somarDias(primeiroDia(somarMeses(mes, 1)), -1);
}

export function somarMeses(mes: Mes, meses: number): Mes {
  const [a, m] = mes.split("-").map(Number) as [number, number];
  const total = a * 12 + (m - 1) + meses;
  const ano = Math.floor(total / 12);
  return `${ano}-${String((total % 12) + 1).padStart(2, "0")}` as Mes;
}

const NOMES_DOS_MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/** Ex.: "Outubro de 2026". */
export function formatarMes(mes: Mes): string {
  const [a, m] = mes.split("-").map(Number) as [number, number];
  return `${NOMES_DOS_MESES[m - 1]} de ${a}`;
}

/**
 * As semanas do mês, de domingo a sábado, com null nos dias de fora para
 * alinhar a grade.
 */
export function semanasDoMes(mes: Mes): (DataCivil | null)[][] {
  const dias: (DataCivil | null)[] = [];
  const inicio = primeiroDia(mes);
  for (let i = 0; i < diaDaSemana(inicio); i++) dias.push(null);
  const fim = ultimoDia(mes);
  for (let d = inicio; d <= fim; d = somarDias(d, 1)) dias.push(d);
  while (dias.length % 7 !== 0) dias.push(null);
  const semanas: (DataCivil | null)[][] = [];
  for (let i = 0; i < dias.length; i += 7) semanas.push(dias.slice(i, i + 7));
  return semanas;
}

// ---------------------------------------------------------------------------
// Filtros (10.7, RF-HIS-12)

export const TIPOS_DE_REGISTRO = ["tudo", "metas", "treinos"] as const;
export type TipoDeRegistro = (typeof TIPOS_DE_REGISTRO)[number];

export type Filtros = {
  de: DataCivil;
  ate: DataCivil;
  tipo: TipoDeRegistro;
  // Só vale para metas: treinos não têm projeto (9.12).
  projetoId: string | null;
};

/** Os parâmetros do endereço, como o Next.js os entrega. */
export type Parametros = Record<string, string | string[] | undefined>;

const um = (v: string | string[] | undefined) =>
  typeof v === "string" ? v : "";

function tipoEProjeto(p: Parametros): Pick<Filtros, "tipo" | "projetoId"> {
  const tipo = (TIPOS_DE_REGISTRO as readonly string[]).includes(um(p.tipo))
    ? (um(p.tipo) as TipoDeRegistro)
    : "tudo";
  const projeto = um(p.projeto);
  return {
    tipo,
    projetoId: z.uuid().safeParse(projeto).success ? projeto : null,
  };
}

/**
 * O calendário mostra um mês (`?mes=2026-10`, padrão o mês de hoje). As
 * estatísticas valem para o mês inteiro.
 */
export function filtrosDoCalendario(
  p: Parametros,
  hoje: DataCivil,
): { mes: Mes; filtros: Filtros } {
  const mes = ehMes(um(p.mes)) ? (um(p.mes) as Mes) : mesDe(hoje);
  return {
    mes,
    filtros: { de: primeiroDia(mes), ate: ultimoDia(mes), ...tipoEProjeto(p) },
  };
}

/**
 * A lista mostra um intervalo (`?de=…&ate=…`), por padrão do primeiro dia do
 * mês até hoje. Datas inválidas voltam ao padrão; um intervalo invertido é
 * desvirado.
 */
export function filtrosDaLista(p: Parametros, hoje: DataCivil): Filtros {
  let de = ehDataCivil(um(p.de)) ? (um(p.de) as DataCivil) : null;
  let ate = ehDataCivil(um(p.ate)) ? (um(p.ate) as DataCivil) : hoje;
  de ??= ate < hoje ? primeiroDia(mesDe(ate)) : primeiroDia(mesDe(hoje));
  if (de > ate) [de, ate] = [ate, de];
  return { de, ate, ...tipoEProjeto(p) };
}

/** O último dia que entra nas metas: ontem, ou antes se o período acaba antes. */
export function fimDasMetas(ate: DataCivil, hoje: DataCivil): DataCivil {
  const ontem = somarDias(hoje, -1);
  return ate < ontem ? ate : ontem;
}

/** O último dia que entra nos treinos: hoje, ou antes. */
export function fimDosTreinos(ate: DataCivil, hoje: DataCivil): DataCivil {
  return ate < hoje ? ate : hoje;
}

/** Os filtros de volta no endereço, sem os que estão no padrão. */
export function parametrosDosFiltros(
  f: Pick<Filtros, "tipo" | "projetoId">,
  extra: Record<string, string> = {},
): string {
  const p = new URLSearchParams(extra);
  if (f.tipo !== "tudo") p.set("tipo", f.tipo);
  if (f.projetoId) p.set("projeto", f.projetoId);
  const texto = p.toString();
  return texto ? `?${texto}` : "";
}

// ---------------------------------------------------------------------------
// Projeto em foco (10.5, RF-HIS-09)

export type Troca = { data: DataCivil; projetoId: string | null };

/**
 * O projeto em foco em cada dia: a última troca com data até ele. `trocas`
 * vem na ordem em que foram feitas (data, depois instante).
 */
export function focoPorDia(
  trocas: readonly Troca[],
  dias: readonly DataCivil[],
): Map<DataCivil, string | null> {
  const foco = new Map<DataCivil, string | null>();
  const ordenados = [...dias].sort();
  let i = 0;
  let atual: string | null = null;
  for (const dia of ordenados) {
    while (i < trocas.length && trocas[i]!.data <= dia) {
      atual = trocas[i]!.projetoId;
      i += 1;
    }
    foco.set(dia, atual);
  }
  return foco;
}

// ---------------------------------------------------------------------------
// Lista cronológica e detalhe do dia (10.4, 10.5)

/** Uma ocorrência como o Histórico mostra: a linha do dia com o projeto. */
export type MetaDoHistorico = ItemDoDia & {
  data: DataCivil;
  // O projeto da versão que regia a ocorrência (RF-HIS-08). Some se o
  // projeto foi excluído (10.9).
  projeto: { id: string; nome: string } | null;
  // Última alteração, mostrada no selo "Corrigida" (10.6).
  corrigidaEm: Date | null;
};

export type TreinoDoHistorico = { id: string; data: DataCivil; titulo: string };

export type DiaDoHistorico = {
  data: DataCivil;
  metas: MetaDoHistorico[];
  treinos: TreinoDoHistorico[];
  contagem: Contagem;
};

/** Agrupa por data, do dia mais recente para o mais antigo (RF-HIS-03). */
export function agruparPorData(
  metas: readonly MetaDoHistorico[],
  treinos: readonly TreinoDoHistorico[],
): DiaDoHistorico[] {
  const dias = new Map<DataCivil, DiaDoHistorico>();
  const dia = (data: DataCivil) => {
    let d = dias.get(data);
    if (!d) {
      d = {
        data,
        metas: [],
        treinos: [],
        contagem: { concluidas: 0, total: 0 },
      };
      dias.set(data, d);
    }
    return d;
  };
  for (const m of metas) dia(m.data).metas.push(m);
  for (const t of treinos) dia(t.data).treinos.push(t);
  for (const d of dias.values()) {
    d.contagem = contagemPorDia(d.metas).get(d.data) ?? d.contagem;
  }
  return [...dias.values()].sort((a, b) => (a.data < b.data ? 1 : -1));
}

/** Para onde leva uma data: Hoje, a lista de um dia futuro ou o Histórico. */
export function enderecoDaData(data: DataCivil, hoje: DataCivil): string {
  if (data === hoje) return "/hoje";
  return data > hoje ? `/dia/${data}` : `/historico/${data}`;
}
