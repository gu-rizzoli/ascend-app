import { z } from "zod";

import { ehDataCivil, type DataCivil } from "./datas";
import { caiNaData, FREQUENCIAS, type Regra } from "./recorrencia";

/** Regras de Metas (7.2 a 7.9) que não dependem de banco nem de tela. */

export const TIPOS = ["binaria", "numerica"] as const;
export type TipoMeta = (typeof TIPOS)[number];
export type EstadoOcorrencia = "pendente" | "concluida" | "nao_concluida";

export const TITULO_MAXIMO = 120;
export const DESCRICAO_MAXIMA = 500;
export const UNIDADE_MAXIMA = 20;
export const VALOR_MAXIMO = 1_000_000;
export const INTERVALO_MAXIMO = 365;

// ---------------------------------------------------------------------------
// Números no formato brasileiro ("1,5")

const NUMERO = /^\d+([.,]\d+)?$/;

/** Lê "1,5" ou "1.5". Devolve null se não for um número não negativo. */
export function lerNumero(texto: string): number | null {
  const limpo = texto.trim();
  if (!NUMERO.test(limpo)) return null;
  // Guarda até 3 casas, como a coluna do banco.
  return Math.round(Number(limpo.replace(",", ".")) * 1000) / 1000;
}

const formatoNumero = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 3,
});

/** Ex.: 1.5 → "1,5". */
export function formatarNumero(valor: number): string {
  return formatoNumero.format(valor);
}

// ---------------------------------------------------------------------------
// Criar meta (RF-MET-01 a 05)

const HORARIO = /^([01]\d|2[0-3]):[0-5]\d$/;

const textoOpcional = (maximo: number, mensagem: string) =>
  z
    .string()
    .trim()
    .max(maximo, mensagem)
    .transform((v) => (v === "" ? null : v));

/** Campos crus do formulário de nova meta, todos como texto. */
export type CamposNovaMeta = {
  titulo: string;
  descricao: string;
  tipo: string;
  valorAlvo: string;
  unidade: string;
  frequencia: string;
  diasSemana: string[];
  intervaloDias: string;
  horario: string;
  dataInicio: string;
};

export type NovaMeta = {
  titulo: string;
  descricao: string | null;
  tipo: TipoMeta;
  unidade: string | null;
  valorAlvo: number | null;
  horario: string | null;
  regra: Regra;
};

/**
 * Valida o formulário de nova meta. `hoje` vem de fora porque a data de
 * início não pode ficar no passado: dias passados são só leitura.
 */
export function esquemaNovaMeta(hoje: DataCivil) {
  return z
    .object({
      titulo: z
        .string()
        .trim()
        .min(1, "Digite um título.")
        .max(TITULO_MAXIMO, `Use no máximo ${TITULO_MAXIMO} caracteres.`),
      descricao: textoOpcional(
        DESCRICAO_MAXIMA,
        `Use no máximo ${DESCRICAO_MAXIMA} caracteres.`,
      ),
      tipo: z.enum(TIPOS, "Escolha o tipo."),
      valorAlvo: z.string(),
      unidade: z.string().trim(),
      frequencia: z.enum(FREQUENCIAS, "Escolha a frequência."),
      diasSemana: z.array(z.string()),
      intervaloDias: z.string().trim(),
      horario: z
        .string()
        .trim()
        .refine((v) => v === "" || HORARIO.test(v), "Horário inválido."),
      dataInicio: z
        .string()
        .refine(ehDataCivil, "Escolha uma data válida.")
        .refine((v) => v >= hoje, "A data não pode estar no passado."),
    })
    .transform((c, ctx): NovaMeta => {
      const problema = (campo: keyof CamposNovaMeta, message: string) => {
        ctx.addIssue({ code: "custom", path: [campo], message });
        return z.NEVER;
      };

      let valorAlvo: number | null = null;
      let unidade: string | null = null;
      if (c.tipo === "numerica") {
        valorAlvo = lerNumero(c.valorAlvo);
        if (valorAlvo === null || valorAlvo <= 0) {
          problema("valorAlvo", "Digite um alvo maior que zero.");
        } else if (valorAlvo > VALOR_MAXIMO) {
          problema("valorAlvo", "Alvo grande demais.");
        }
        unidade = c.unidade;
        if (unidade === "") problema("unidade", "Digite a unidade, ex.: L.");
        else if (unidade.length > UNIDADE_MAXIMA) {
          problema("unidade", `Use no máximo ${UNIDADE_MAXIMA} caracteres.`);
        }
      }

      let diasSemana: number[] | null = null;
      if (c.frequencia === "semanal") {
        diasSemana = [...new Set(c.diasSemana.map(Number))]
          .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
          .sort();
        if (diasSemana.length === 0) {
          problema("diasSemana", "Escolha pelo menos um dia.");
        }
      }

      let intervaloDias: number | null = null;
      if (c.frequencia === "intervalo") {
        intervaloDias = Number(c.intervaloDias);
        if (
          !/^\d+$/.test(c.intervaloDias) ||
          intervaloDias < 2 ||
          intervaloDias > INTERVALO_MAXIMO
        ) {
          problema(
            "intervaloDias",
            `Digite um número de 2 a ${INTERVALO_MAXIMO}.`,
          );
        }
      }

      const vigenteDe = c.dataInicio as DataCivil;
      return {
        titulo: c.titulo,
        descricao: c.descricao,
        tipo: c.tipo,
        unidade,
        valorAlvo,
        horario: c.horario === "" ? null : c.horario,
        regra: {
          frequencia: c.frequencia,
          vigenteDe,
          // A ocorrência única já nasce com a vigência fechada no mesmo dia.
          vigenteAte: c.frequencia === "unica" ? vigenteDe : null,
          diasSemana,
          intervaloDias,
        },
      };
    });
}

// ---------------------------------------------------------------------------
// Valor e estado de uma ocorrência (7.3, 7.9)

/**
 * Numérica conta como concluída quando chega ao alvo, e volta a pendente se o
 * valor for corrigido para menos. O valor pode passar do alvo (RF-MET-08).
 */
export function estadoPeloValor(valor: number, alvo: number): EstadoOcorrencia {
  return valor >= alvo ? "concluida" : "pendente";
}

/** Fração da barra, de 0 a 1. A barra para em 100%; o valor real, não. */
export function progresso(valor: number, alvo: number): number {
  if (alvo <= 0) return 0;
  return Math.min(1, Math.max(0, valor / alvo));
}

/**
 * Dias passados não se editam direto: mudar um dia encerrado é correção
 * retroativa, que tem fluxo próprio (7.11, src/domain/fechamento.ts). Hoje e datas futuras podem ser alterados,
 * inclusive concluindo antes da data (fluxos-metas.md, decisão 2).
 */
export function diaEditavel(data: DataCivil, hoje: DataCivil): boolean {
  return data >= hoje;
}

// ---------------------------------------------------------------------------
// Lista de uma data (modelo-dados-metas.md, "Ler a lista de uma data D")

/** Uma versão vigente de uma meta ativa, com o que a lista precisa. */
export type VersaoDoDia = {
  metaId: string;
  versaoId: string;
  tipo: TipoMeta;
  unidade: string | null;
  titulo: string;
  horario: string | null;
  valorAlvo: number | null;
  regra: Regra;
};

/** Uma ocorrência já gravada, com a versão que a rege. */
export type OcorrenciaGravada = {
  id: string;
  metaId: string;
  tipo: TipoMeta;
  unidade: string | null;
  dataPrevista: DataCivil | null;
  data: DataCivil;
  estado: EstadoOcorrencia;
  valorAtual: number | null;
  corrigida: boolean;
  versao: { titulo: string; horario: string | null; valorAlvo: number | null };
  // Ajustes de "só esta": quando preenchidos, prevalecem sobre a versão.
  ajuste: {
    titulo: string | null;
    horario: string | null;
    valorAlvo: number | null;
  };
};

export type ItemDoDia = {
  // Identifica a linha na tela: (meta, data prevista), ou a ocorrência
  // quando ela não vem de uma vaga da regra.
  chave: string;
  metaId: string;
  dataPrevista: DataCivil | null;
  ocorrenciaId: string | null;
  tipo: TipoMeta;
  unidade: string | null;
  titulo: string;
  horario: string | null;
  valorAlvo: number | null;
  valorAtual: number | null;
  estado: EstadoOcorrencia;
  // Alterada depois do encerramento do dia (RF-MET-12): aparece como selo.
  corrigida: boolean;
};

const chaveDaVaga = (metaId: string, dataPrevista: DataCivil) =>
  `${metaId}:${dataPrevista}`;

/**
 * Junta as ocorrências gravadas na data com as vagas calculadas pela regra.
 * `gravadas` deve trazer as que têm `data = D` e as que têm
 * `dataPrevista = D`: uma vaga já gravada não é calculada de novo, mesmo que
 * a ocorrência tenha sido adiada para outra data.
 */
export function montarListaDoDia(
  data: DataCivil,
  versoes: VersaoDoDia[],
  gravadas: OcorrenciaGravada[],
): ItemDoDia[] {
  const ocupadas = new Set(
    gravadas
      .filter((g) => g.dataPrevista === data)
      .map((g) => chaveDaVaga(g.metaId, data)),
  );

  const itens: ItemDoDia[] = gravadas
    .filter((g) => g.data === data)
    .map((g) => ({
      // A mesma chave da vaga virtual: gravar a vaga não remonta a linha.
      chave: g.dataPrevista ? chaveDaVaga(g.metaId, g.dataPrevista) : g.id,
      metaId: g.metaId,
      dataPrevista: g.dataPrevista,
      ocorrenciaId: g.id,
      tipo: g.tipo,
      unidade: g.unidade,
      titulo: g.ajuste.titulo ?? g.versao.titulo,
      horario: g.ajuste.horario ?? g.versao.horario,
      valorAlvo: g.ajuste.valorAlvo ?? g.versao.valorAlvo,
      valorAtual: g.valorAtual,
      estado: g.estado,
      corrigida: g.corrigida,
    }));

  for (const v of versoes) {
    if (!caiNaData(v.regra, data)) continue;
    const chave = chaveDaVaga(v.metaId, data);
    if (ocupadas.has(chave)) continue;
    ocupadas.add(chave);
    itens.push({
      chave,
      metaId: v.metaId,
      dataPrevista: data,
      ocorrenciaId: null,
      tipo: v.tipo,
      unidade: v.unidade,
      titulo: v.titulo,
      horario: v.horario,
      valorAlvo: v.valorAlvo,
      valorAtual: v.tipo === "numerica" ? 0 : null,
      estado: "pendente",
      corrigida: false,
    });
  }

  return ordenarItens(itens);
}

/** Com horário primeiro, em ordem cronológica; depois as sem horário (7.5). */
export function ordenarItens(itens: ItemDoDia[]): ItemDoDia[] {
  return [...itens].sort((a, b) => {
    if (a.horario !== b.horario) {
      if (a.horario === null) return 1;
      if (b.horario === null) return -1;
      return a.horario < b.horario ? -1 : 1;
    }
    return a.titulo.localeCompare(b.titulo, "pt-BR");
  });
}

/** "3 de 5 concluídas". */
export function resumoDoDia(itens: ItemDoDia[]): {
  concluidas: number;
  total: number;
} {
  return {
    concluidas: itens.filter((i) => i.estado === "concluida").length,
    total: itens.length,
  };
}
