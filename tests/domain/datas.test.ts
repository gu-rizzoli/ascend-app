import { describe, expect, it } from "vitest";

import {
  diaDaSemana,
  diferencaEmDias,
  ehDataCivil,
  formatarDataCurta,
  formatarDataLonga,
  hoje,
  paraDataCivil,
  somarDias,
} from "@/domain/datas";

const d = paraDataCivil;

describe("hoje", () => {
  it("usa o fuso de São Paulo, não o UTC", () => {
    // 23:30 em São Paulo (UTC-3) ainda é dia 24, embora em UTC já seja 25.
    expect(hoje(new Date("2026-10-25T02:30:00Z"))).toBe("2026-10-24");
    expect(hoje(new Date("2026-10-25T03:00:00Z"))).toBe("2026-10-25");
  });

  it("vira o ano à meia-noite local", () => {
    expect(hoje(new Date("2027-01-01T02:59:59Z"))).toBe("2026-12-31");
    expect(hoje(new Date("2027-01-01T03:00:00Z"))).toBe("2027-01-01");
  });
});

describe("ehDataCivil / paraDataCivil", () => {
  it("aceita datas reais no formato AAAA-MM-DD", () => {
    expect(ehDataCivil("2026-10-24")).toBe(true);
    expect(ehDataCivil("2028-02-29")).toBe(true);
  });

  it("recusa formatos e dias inexistentes", () => {
    expect(ehDataCivil("2026-02-29")).toBe(false);
    expect(ehDataCivil("2026-13-01")).toBe(false);
    expect(ehDataCivil("24/10/2026")).toBe(false);
    expect(ehDataCivil("2026-10-24T00:00")).toBe(false);
    expect(() => paraDataCivil("ontem")).toThrow(/Data inválida/);
  });
});

describe("somarDias / diferencaEmDias", () => {
  it("atravessa mês, ano e fevereiro bissexto", () => {
    expect(somarDias(d("2026-10-31"), 1)).toBe("2026-11-01");
    expect(somarDias(d("2026-12-31"), 1)).toBe("2027-01-01");
    expect(somarDias(d("2028-02-28"), 1)).toBe("2028-02-29");
    expect(somarDias(d("2026-03-01"), -1)).toBe("2026-02-28");
  });

  it("mede a distância em dias civis", () => {
    expect(diferencaEmDias(d("2026-10-24"), d("2026-10-31"))).toBe(7);
    expect(diferencaEmDias(d("2026-10-24"), d("2026-10-20"))).toBe(-4);
    expect(diferencaEmDias(d("2026-01-01"), d("2027-01-01"))).toBe(365);
  });
});

describe("diaDaSemana", () => {
  it("devolve 0 para domingo e 6 para sábado", () => {
    expect(diaDaSemana(d("2026-10-24"))).toBe(6);
    expect(diaDaSemana(d("2026-10-25"))).toBe(0);
  });
});

describe("formatarDataLonga", () => {
  it("escreve em português com inicial maiúscula", () => {
    expect(formatarDataLonga(d("2026-10-24"))).toBe("Sábado, 24 de outubro");
    expect(formatarDataLonga(d("2027-01-01"))).toBe(
      "Sexta-feira, 1 de janeiro",
    );
  });
});

describe("formatarDataCurta", () => {
  it("dia e mês com dois dígitos", () => {
    expect(formatarDataCurta(d("2026-07-05"))).toBe("05/07");
    expect(formatarDataCurta(d("2026-12-25"))).toBe("25/12");
  });
});
