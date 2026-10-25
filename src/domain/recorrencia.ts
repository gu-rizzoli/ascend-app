import {
  diaDaSemana,
  diferencaEmDias,
  formatarDataCurta,
  type DataCivil,
} from "./datas";

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

const DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Ex.: "Todo dia", "Seg, Qua e Sex", "A cada 3 dias", "Só em 28/10". */
export function descreverFrequencia(regra: Regra): string {
  switch (regra.frequencia) {
    case "unica":
      return `Só em ${formatarDataCurta(regra.vigenteDe)}`;
    case "diaria":
      return "Todo dia";
    case "semanal": {
      const dias = [...(regra.diasSemana ?? [])].sort();
      if (dias.length === 7) return "Todo dia";
      if (dias.join() === "1,2,3,4,5") return "Segunda a sexta";
      const nomes = dias.map((d) => DIAS_CURTOS[d]);
      return nomes.length === 1
        ? nomes[0]!
        : `${nomes.slice(0, -1).join(", ")} e ${nomes.at(-1)}`;
    }
    case "intervalo":
      return `A cada ${regra.intervaloDias} dias`;
  }
}
