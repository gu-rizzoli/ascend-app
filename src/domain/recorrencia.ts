import { diaDaSemana, diferencaEmDias, type DataCivil } from "./datas";

/**
 * Frequências do MVP (7.4). `unica` acontece só em `vigenteDe`; as outras se
 * repetem enquanto a versão estiver vigente.
 */
export const FREQUENCIAS = ["unica", "diaria", "semanal", "intervalo"] as const;
export type Frequencia = (typeof FREQUENCIAS)[number];

/** A parte de uma `meta_versao` que decide em quais datas a meta cai. */
export type Regra = {
  frequencia: Frequencia;
  vigenteDe: DataCivil;
  // Nulo enquanto a versão estiver aberta.
  vigenteAte: DataCivil | null;
  // 0 = domingo … 6 = sábado. Só em `semanal`.
  diasSemana: number[] | null;
  // Maior ou igual a 2. Só em `intervalo`.
  intervaloDias: number | null;
};

export function vigenteEm(regra: Regra, data: DataCivil): boolean {
  return (
    regra.vigenteDe <= data &&
    (regra.vigenteAte === null || data <= regra.vigenteAte)
  );
}

/**
 * A regra gera uma vaga nesta data? A contagem de `intervalo` parte de
 * `vigenteDe`, então recomeça a cada versão nova (modelo-dados-metas.md).
 */
export function caiNaData(regra: Regra, data: DataCivil): boolean {
  if (!vigenteEm(regra, data)) return false;
  switch (regra.frequencia) {
    case "unica":
      return data === regra.vigenteDe;
    case "diaria":
      return true;
    case "semanal":
      return (regra.diasSemana ?? []).includes(diaDaSemana(data));
    case "intervalo": {
      const passo = regra.intervaloDias ?? 0;
      if (passo < 1) return false;
      return diferencaEmDias(regra.vigenteDe, data) % passo === 0;
    }
  }
}

/**
 * Padrão ao criar (fluxos-metas.md, decisão 1): "Todo dia" quando a data
 * aberta é hoje, "Só nesta data" quando é futura.
 */
export function frequenciaPadrao(
  dataAberta: DataCivil,
  hoje: DataCivil,
): Frequencia {
  return dataAberta > hoje ? "unica" : "diaria";
}
