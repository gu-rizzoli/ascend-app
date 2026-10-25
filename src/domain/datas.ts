import { tz } from "@date-fns/tz";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Fuso fixo do produto (spec v0.4). Toda data civil do Ascend ("o dia da
 * meta", "o dia do treino") é contada neste fuso, independente de onde o
 * servidor roda.
 */
export const FUSO = "America/Sao_Paulo";

/**
 * Data civil no formato AAAA-MM-DD. Não é um instante: não tem hora nem fuso
 * e nunca é convertida para UTC. No banco vira uma coluna `date`.
 */
export type DataCivil = string & { readonly __dataCivil: unique symbol };

const PADRAO = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_POR_DIA = 86_400_000;

function partes(data: DataCivil): [number, number, number] {
  const [, a, m, d] = PADRAO.exec(data)!;
  return [Number(a), Number(m), Number(d)];
}

/** Dias desde 1970-01-01, usando aritmética de calendário pura (sem fuso). */
function paraDiaAbsoluto(data: DataCivil): number {
  const [a, m, d] = partes(data);
  return Date.UTC(a, m - 1, d) / MS_POR_DIA;
}

function deDiaAbsoluto(dia: number): DataCivil {
  return new Date(dia * MS_POR_DIA).toISOString().slice(0, 10) as DataCivil;
}

export function ehDataCivil(valor: string): valor is DataCivil {
  const m = PADRAO.exec(valor);
  if (!m) return false;
  const [a, mes, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const data = new Date(Date.UTC(a, mes - 1, d));
  return (
    data.getUTCFullYear() === a &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === d
  );
}

/** Valida texto vindo de fora (URL, formulário) e devolve a data civil. */
export function paraDataCivil(valor: string): DataCivil {
  if (!ehDataCivil(valor)) {
    throw new Error(`Data inválida: "${valor}" (esperado AAAA-MM-DD)`);
  }
  return valor;
}

/**
 * A data civil de hoje no fuso do produto. É o único lugar do código que
 * decide "que dia é hoje"; o resto recebe a data pronta.
 */
export function hoje(agora: Date = new Date()): DataCivil {
  return format(agora, "yyyy-MM-dd", { in: tz(FUSO) }) as DataCivil;
}

export function somarDias(data: DataCivil, dias: number): DataCivil {
  return deDiaAbsoluto(paraDiaAbsoluto(data) + dias);
}

/** Quantos dias vão de `de` até `ate` (negativo se `ate` vem antes). */
export function diferencaEmDias(de: DataCivil, ate: DataCivil): number {
  return paraDiaAbsoluto(ate) - paraDiaAbsoluto(de);
}

/** 0 = domingo … 6 = sábado. */
export function diaDaSemana(data: DataCivil): number {
  return new Date(paraDiaAbsoluto(data) * MS_POR_DIA).getUTCDay();
}

/** Ex.: "Sábado, 24 de outubro". */
export function formatarDataLonga(data: DataCivil): string {
  const [a, m, d] = partes(data);
  // Meio-dia UTC cai no mesmo dia civil em qualquer fuso das Américas.
  const texto = format(
    new Date(Date.UTC(a, m - 1, d, 12)),
    "EEEE, d 'de' MMMM",
    {
      locale: ptBR,
      in: tz(FUSO),
    },
  );
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Ex.: "12/07", para selos como "reagendada de 12/07". */
export function formatarDataCurta(data: DataCivil): string {
  const [, m, d] = partes(data);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}
