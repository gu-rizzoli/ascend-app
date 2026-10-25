import { describe, expect, it } from "vitest";

import { paraDataCivil, somarDias, type DataCivil } from "@/domain/datas";
import {
  caiNaData,
  descreverFrequencia,
  frequenciaPadrao,
  vigenteEm,
  type Regra,
} from "@/domain/recorrencia";

const d = paraDataCivil;

function regra(parcial: Partial<Regra> & Pick<Regra, "frequencia">): Regra {
  return {
    vigenteDe: d("2026-10-24"),
    vigenteAte: null,
    diasSemana: null,
    intervaloDias: null,
    ...parcial,
  };
}

function datasEntre(de: string, ate: string, r: Regra): DataCivil[] {
  const datas: DataCivil[] = [];
  for (let data = d(de); data <= ate; data = somarDias(data, 1)) {
    if (caiNaData(r, data)) datas.push(data);
  }
  return datas;
}

describe("vigenteEm", () => {
  it("inclui as duas pontas da vigência", () => {
    const r = regra({
      frequencia: "diaria",
      vigenteAte: d("2026-10-30"),
    });
    expect(vigenteEm(r, d("2026-10-23"))).toBe(false);
    expect(vigenteEm(r, d("2026-10-24"))).toBe(true);
    expect(vigenteEm(r, d("2026-10-30"))).toBe(true);
    expect(vigenteEm(r, d("2026-10-31"))).toBe(false);
  });

  it("sem fim, vale para sempre a partir do início", () => {
    expect(vigenteEm(regra({ frequencia: "diaria" }), d("2030-01-01"))).toBe(
      true,
    );
  });
});

describe("caiNaData", () => {
  it("única: só na data de início", () => {
    const r = regra({ frequencia: "unica", vigenteAte: d("2026-10-24") });
    expect(datasEntre("2026-10-20", "2026-11-05", r)).toEqual(["2026-10-24"]);
  });

  it("diária: todo dia a partir do início, nunca antes", () => {
    const r = regra({ frequencia: "diaria" });
    expect(datasEntre("2026-10-22", "2026-10-27", r)).toEqual([
      "2026-10-24",
      "2026-10-25",
      "2026-10-26",
      "2026-10-27",
    ]);
  });

  it("semanal: só nos dias escolhidos (24/10/2026 é sábado)", () => {
    // Segunda (1), quarta (3) e sexta (5).
    const r = regra({ frequencia: "semanal", diasSemana: [1, 3, 5] });
    expect(datasEntre("2026-10-24", "2026-11-01", r)).toEqual([
      "2026-10-26",
      "2026-10-28",
      "2026-10-30",
    ]);
  });

  it("semanal: o início pode não cair num dia escolhido", () => {
    const r = regra({ frequencia: "semanal", diasSemana: [6] });
    expect(datasEntre("2026-10-24", "2026-11-08", r)).toEqual([
      "2026-10-24",
      "2026-10-31",
      "2026-11-07",
    ]);
  });

  it("a cada X dias: conta a partir do início", () => {
    const r = regra({ frequencia: "intervalo", intervaloDias: 3 });
    expect(datasEntre("2026-10-20", "2026-11-03", r)).toEqual([
      "2026-10-24",
      "2026-10-27",
      "2026-10-30",
      "2026-11-02",
    ]);
  });

  it("a cada X dias: atravessa a virada do ano", () => {
    const r = regra({
      frequencia: "intervalo",
      vigenteDe: d("2026-12-30"),
      intervaloDias: 2,
    });
    expect(datasEntre("2026-12-29", "2027-01-04", r)).toEqual([
      "2026-12-30",
      "2027-01-01",
      "2027-01-03",
    ]);
  });

  it("respeita o fim da vigência", () => {
    const r = regra({ frequencia: "diaria", vigenteAte: d("2026-10-25") });
    expect(datasEntre("2026-10-24", "2026-10-28", r)).toEqual([
      "2026-10-24",
      "2026-10-25",
    ]);
  });
});

describe("frequenciaPadrao", () => {
  it("todo dia quando a data aberta é hoje; só nesta data quando é futura", () => {
    expect(frequenciaPadrao(d("2026-10-24"), d("2026-10-24"))).toBe("diaria");
    expect(frequenciaPadrao(d("2026-10-25"), d("2026-10-24"))).toBe("unica");
  });
});

describe("descreverFrequencia", () => {
  it("escreve a frequência como na tela", () => {
    expect(descreverFrequencia(regra({ frequencia: "diaria" }))).toBe(
      "Todo dia",
    );
    expect(
      descreverFrequencia(
        regra({ frequencia: "unica", vigenteDe: d("2026-10-28") }),
      ),
    ).toBe("Só em 28/10");
    expect(
      descreverFrequencia(regra({ frequencia: "intervalo", intervaloDias: 3 })),
    ).toBe("A cada 3 dias");
  });

  it("lista os dias da semana", () => {
    const semanal = (diasSemana: number[]) =>
      descreverFrequencia(regra({ frequencia: "semanal", diasSemana }));
    expect(semanal([5, 1, 3])).toBe("Seg, Qua e Sex");
    expect(semanal([0])).toBe("Dom");
    expect(semanal([1, 2, 3, 4, 5])).toBe("Segunda a sexta");
    expect(semanal([0, 1, 2, 3, 4, 5, 6])).toBe("Todo dia");
  });
});
