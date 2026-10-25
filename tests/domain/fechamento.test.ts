import { describe, expect, it } from "vitest";

import { paraDataCivil } from "@/domain/datas";
import {
  copiaSaiNaCorrecao,
  diaCorrigivel,
  estadoCorrigido,
  periodoAFechar,
  vagasDoPeriodo,
  type VersaoAFechar,
} from "@/domain/fechamento";
import type { Regra } from "@/domain/recorrencia";

const d = paraDataCivil;
const HOJE = d("2026-10-24"); // sábado

describe("periodoAFechar", () => {
  it("não faz nada se o fechamento já passou por ontem", () => {
    // Conta criada hoje: fechado_ate nasce como a véspera.
    expect(periodoAFechar(d("2026-10-23"), HOJE)).toBeNull();
    expect(periodoAFechar(HOJE, HOJE)).toBeNull();
  });

  it("fecha de fechado_ate + 1 até ontem", () => {
    expect(periodoAFechar(d("2026-10-20"), HOJE)).toEqual({
      de: d("2026-10-21"),
      ate: d("2026-10-23"),
    });
  });

  it("um dia só, logo depois da meia-noite", () => {
    expect(periodoAFechar(d("2026-10-22"), HOJE)).toEqual({
      de: d("2026-10-23"),
      ate: d("2026-10-23"),
    });
  });

  it("atravessa a virada do mês e do ano", () => {
    expect(periodoAFechar(d("2026-12-30"), d("2027-01-02"))).toEqual({
      de: d("2026-12-31"),
      ate: d("2027-01-01"),
    });
  });
});

describe("vagasDoPeriodo", () => {
  function versao(
    metaId: string,
    regra: Partial<Regra> = {},
    tipo: VersaoAFechar["tipo"] = "binaria",
  ): VersaoAFechar {
    return {
      metaId,
      versaoId: `v-${metaId}`,
      tipo,
      regra: {
        frequencia: "diaria",
        vigenteDe: d("2026-10-01"),
        vigenteAte: null,
        diasSemana: null,
        intervaloDias: null,
        ...regra,
      },
    };
  }

  const datas = (vagas: ReturnType<typeof vagasDoPeriodo>) =>
    vagas.map((v) => `${v.metaId}:${v.dataPrevista}`);

  it("gera todos os dias de uma diária, inclusive os nunca abertos", () => {
    const vagas = vagasDoPeriodo(
      [versao("a")],
      d("2026-10-20"),
      d("2026-10-23"),
    );
    expect(datas(vagas)).toEqual([
      "a:2026-10-20",
      "a:2026-10-21",
      "a:2026-10-22",
      "a:2026-10-23",
    ]);
  });

  it("respeita o início e o fim da vigência", () => {
    const vagas = vagasDoPeriodo(
      [
        versao("nova", { vigenteDe: d("2026-10-22") }),
        versao("fechada", { vigenteAte: d("2026-10-20") }),
      ],
      d("2026-10-19"),
      d("2026-10-23"),
    );
    expect(datas(vagas)).toEqual([
      "nova:2026-10-22",
      "nova:2026-10-23",
      "fechada:2026-10-19",
      "fechada:2026-10-20",
    ]);
  });

  it("versão fora do período não gera nada", () => {
    expect(
      vagasDoPeriodo(
        [versao("futura", { vigenteDe: d("2026-10-25") })],
        d("2026-10-20"),
        d("2026-10-23"),
      ),
    ).toEqual([]);
  });

  it("única só na sua data", () => {
    const vagas = vagasDoPeriodo(
      [
        versao("u", {
          frequencia: "unica",
          vigenteDe: d("2026-10-21"),
          vigenteAte: d("2026-10-21"),
        }),
      ],
      d("2026-10-20"),
      d("2026-10-23"),
    );
    expect(datas(vagas)).toEqual(["u:2026-10-21"]);
  });

  it("semanal só nos dias escolhidos", () => {
    // 2026-10-19 é segunda; quarta = 21.
    const vagas = vagasDoPeriodo(
      [versao("s", { frequencia: "semanal", diasSemana: [1, 3] })],
      d("2026-10-19"),
      d("2026-10-25"),
    );
    expect(datas(vagas)).toEqual(["s:2026-10-19", "s:2026-10-21"]);
  });

  it("intervalo conta a partir do início da versão, não do período", () => {
    const vagas = vagasDoPeriodo(
      [versao("i", { frequencia: "intervalo", intervaloDias: 3 })],
      d("2026-10-05"),
      d("2026-10-12"),
    );
    // Início em 01/10: 01, 04, 07, 10, 13…
    expect(datas(vagas)).toEqual(["i:2026-10-07", "i:2026-10-10"]);
  });

  it("leva o tipo e a versão para gravar a vaga", () => {
    const [vaga] = vagasDoPeriodo(
      [versao("agua", {}, "numerica")],
      d("2026-10-23"),
      d("2026-10-23"),
    );
    expect(vaga).toEqual({
      metaId: "agua",
      versaoId: "v-agua",
      tipo: "numerica",
      dataPrevista: "2026-10-23",
    });
  });

  it("um período longo gera uma vaga por dia, sem pular nenhum", () => {
    const vagas = vagasDoPeriodo(
      [versao("a", { vigenteDe: d("2026-01-01") })],
      d("2026-01-01"),
      d("2026-12-31"),
    );
    expect(vagas).toHaveLength(365);
    expect(new Set(datas(vagas)).size).toBe(365);
  });
});

describe("estadoCorrigido", () => {
  it("binária: concluída ou não concluída, nunca pendente", () => {
    expect(estadoCorrigido("binaria", { concluida: true }, null)).toBe(
      "concluida",
    );
    expect(estadoCorrigido("binaria", { concluida: false }, null)).toBe(
      "nao_concluida",
    );
  });

  it("numérica: o valor decide pelo alvo", () => {
    expect(estadoCorrigido("numerica", { valor: 3 }, 3)).toBe("concluida");
    expect(estadoCorrigido("numerica", { valor: 3.5 }, 3)).toBe("concluida");
    expect(estadoCorrigido("numerica", { valor: 2.9 }, 3)).toBe(
      "nao_concluida",
    );
    expect(estadoCorrigido("numerica", { valor: 0 }, 3)).toBe("nao_concluida");
  });

  it("pedido que não combina com o tipo não muda nada", () => {
    expect(estadoCorrigido("binaria", { valor: 3 }, null)).toBeNull();
    expect(estadoCorrigido("numerica", { concluida: true }, 3)).toBeNull();
    expect(estadoCorrigido("numerica", { valor: 3 }, null)).toBeNull();
  });
});

describe("diaCorrigivel", () => {
  it("só dias anteriores a hoje", () => {
    expect(diaCorrigivel(d("2026-10-23"), HOJE)).toBe(true);
    expect(diaCorrigivel(HOJE, HOJE)).toBe(false);
    expect(diaCorrigivel(d("2026-10-25"), HOJE)).toBe(false);
  });
});

describe("copiaSaiNaCorrecao (decisão 21)", () => {
  const pendenteFutura = { estado: "pendente" as const, data: d("2026-10-26") };

  it("corrigir para concluída tira a cópia ainda pendente", () => {
    expect(copiaSaiNaCorrecao("concluida", pendenteFutura, HOJE)).toBe(true);
    expect(
      copiaSaiNaCorrecao("concluida", { estado: "pendente", data: HOJE }, HOJE),
    ).toBe(true);
  });

  it("a cópia fica se já foi feita ou se o dia dela já encerrou", () => {
    expect(
      copiaSaiNaCorrecao(
        "concluida",
        { estado: "concluida", data: d("2026-10-26") },
        HOJE,
      ),
    ).toBe(false);
    expect(
      copiaSaiNaCorrecao(
        "concluida",
        { estado: "nao_concluida", data: d("2026-10-22") },
        HOJE,
      ),
    ).toBe(false);
  });

  it("corrigir para não concluída ou sem cópia não tira nada", () => {
    expect(copiaSaiNaCorrecao("nao_concluida", pendenteFutura, HOJE)).toBe(
      false,
    );
    expect(copiaSaiNaCorrecao("concluida", null, HOJE)).toBe(false);
  });
});
