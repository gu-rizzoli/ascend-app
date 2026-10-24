import { describe, expect, it } from "vitest";

import { paraDataCivil } from "@/domain/datas";
import {
  diaEditavel,
  esquemaNovaMeta,
  estadoPeloValor,
  formatarNumero,
  lerNumero,
  montarListaDoDia,
  progresso,
  resumoDoDia,
  type CamposNovaMeta,
  type OcorrenciaGravada,
  type VersaoDoDia,
} from "@/domain/metas";

const d = paraDataCivil;
const HOJE = d("2026-10-24");

describe("lerNumero / formatarNumero", () => {
  it("aceita vírgula ou ponto como separador decimal", () => {
    expect(lerNumero("1,5")).toBe(1.5);
    expect(lerNumero(" 2.25 ")).toBe(2.25);
    expect(lerNumero("3")).toBe(3);
    expect(lerNumero("0")).toBe(0);
  });

  it("recusa textos, negativos e milhar", () => {
    expect(lerNumero("")).toBeNull();
    expect(lerNumero("abc")).toBeNull();
    expect(lerNumero("-1")).toBeNull();
    expect(lerNumero("1.000,5")).toBeNull();
  });

  it("guarda até 3 casas decimais", () => {
    expect(lerNumero("0,12345")).toBe(0.123);
  });

  it("escreve no formato brasileiro", () => {
    expect(formatarNumero(1.5)).toBe("1,5");
    expect(formatarNumero(3)).toBe("3");
  });
});

describe("estadoPeloValor / progresso", () => {
  it("conclui ao atingir o alvo e volta a pendente se o valor cair", () => {
    expect(estadoPeloValor(2.9, 3)).toBe("pendente");
    expect(estadoPeloValor(3, 3)).toBe("concluida");
    expect(estadoPeloValor(3.5, 3)).toBe("concluida");
  });

  it("a barra para em 100% mesmo passando do alvo", () => {
    expect(progresso(1.5, 3)).toBe(0.5);
    expect(progresso(3.5, 3)).toBe(1);
    expect(progresso(0, 3)).toBe(0);
  });
});

describe("diaEditavel", () => {
  it("hoje e futuro sim, passado não", () => {
    expect(diaEditavel(HOJE, HOJE)).toBe(true);
    expect(diaEditavel(d("2026-10-30"), HOJE)).toBe(true);
    expect(diaEditavel(d("2026-10-23"), HOJE)).toBe(false);
  });
});

describe("esquemaNovaMeta", () => {
  const base: CamposNovaMeta = {
    titulo: "Ir à academia",
    descricao: "",
    tipo: "binaria",
    valorAlvo: "",
    unidade: "",
    frequencia: "diaria",
    diasSemana: [],
    intervaloDias: "",
    horario: "",
    dataInicio: "2026-10-24",
  };
  const validar = (campos: Partial<CamposNovaMeta>) =>
    esquemaNovaMeta(HOJE).safeParse({ ...base, ...campos });
  const erros = (campos: Partial<CamposNovaMeta>) => {
    const r = validar(campos);
    return r.success ? [] : r.error.issues.map((i) => String(i.path[0]));
  };

  it("caso mais comum: só o título", () => {
    const r = validar({});
    expect(r.success && r.data).toEqual({
      titulo: "Ir à academia",
      descricao: null,
      tipo: "binaria",
      unidade: null,
      valorAlvo: null,
      horario: null,
      regra: {
        frequencia: "diaria",
        vigenteDe: "2026-10-24",
        vigenteAte: null,
        diasSemana: null,
        intervaloDias: null,
      },
    });
  });

  it("exige título", () => {
    expect(erros({ titulo: "   " })).toEqual(["titulo"]);
  });

  it("numérica exige alvo maior que zero e unidade", () => {
    expect(erros({ tipo: "numerica" })).toEqual(["valorAlvo", "unidade"]);
    expect(erros({ tipo: "numerica", valorAlvo: "0", unidade: "L" })).toEqual([
      "valorAlvo",
    ]);
    const r = validar({ tipo: "numerica", valorAlvo: "1,5", unidade: " L " });
    expect(r.success && [r.data.valorAlvo, r.data.unidade]).toEqual([1.5, "L"]);
  });

  it("binária ignora alvo e unidade digitados", () => {
    const r = validar({ valorAlvo: "3", unidade: "L" });
    expect(r.success && [r.data.valorAlvo, r.data.unidade]).toEqual([
      null,
      null,
    ]);
  });

  it("única fecha a vigência no próprio dia", () => {
    const r = validar({ frequencia: "unica", dataInicio: "2026-10-30" });
    expect(r.success && r.data.regra).toMatchObject({
      vigenteDe: "2026-10-30",
      vigenteAte: "2026-10-30",
    });
  });

  it("semanal exige pelo menos um dia e normaliza a lista", () => {
    expect(erros({ frequencia: "semanal" })).toEqual(["diasSemana"]);
    const r = validar({ frequencia: "semanal", diasSemana: ["5", "1", "1"] });
    expect(r.success && r.data.regra.diasSemana).toEqual([1, 5]);
  });

  it("a cada X dias aceita de 2 a 365", () => {
    expect(erros({ frequencia: "intervalo", intervaloDias: "1" })).toEqual([
      "intervaloDias",
    ]);
    expect(erros({ frequencia: "intervalo", intervaloDias: "2,5" })).toEqual([
      "intervaloDias",
    ]);
    const r = validar({ frequencia: "intervalo", intervaloDias: "3" });
    expect(r.success && r.data.regra.intervaloDias).toBe(3);
  });

  it("horário opcional no formato HH:MM", () => {
    expect(erros({ horario: "25:00" })).toEqual(["horario"]);
    const r = validar({ horario: "07:30" });
    expect(r.success && r.data.horario).toBe("07:30");
  });

  it("data de início não pode estar no passado", () => {
    expect(erros({ dataInicio: "2026-10-23" })).toEqual(["dataInicio"]);
    expect(erros({ dataInicio: "2026-02-30" })).toContain("dataInicio");
  });
});

describe("montarListaDoDia", () => {
  const D = d("2026-10-26"); // segunda-feira

  function versao(
    metaId: string,
    parcial: Partial<VersaoDoDia> = {},
  ): VersaoDoDia {
    return {
      metaId,
      versaoId: `v-${metaId}`,
      tipo: "binaria",
      unidade: null,
      titulo: metaId,
      horario: null,
      valorAlvo: null,
      regra: {
        frequencia: "diaria",
        vigenteDe: HOJE,
        vigenteAte: null,
        diasSemana: null,
        intervaloDias: null,
      },
      ...parcial,
    };
  }

  function gravada(
    metaId: string,
    parcial: Partial<OcorrenciaGravada> = {},
  ): OcorrenciaGravada {
    return {
      id: `o-${metaId}`,
      metaId,
      tipo: "binaria",
      unidade: null,
      dataPrevista: D,
      data: D,
      estado: "concluida",
      valorAtual: null,
      versao: { titulo: metaId, horario: null, valorAlvo: null },
      ajuste: { titulo: null, horario: null, valorAlvo: null },
      ...parcial,
    };
  }

  it("calcula as vagas da regra que caem na data", () => {
    const lista = montarListaDoDia(
      D,
      [
        versao("diaria"),
        versao("sabado", {
          regra: {
            ...versao("x").regra,
            frequencia: "semanal",
            diasSemana: [6],
          },
        }),
      ],
      [],
    );
    expect(lista.map((i) => [i.chave, i.estado, i.ocorrenciaId])).toEqual([
      ["diaria:2026-10-26", "pendente", null],
    ]);
  });

  it("numérica virtual começa em zero", () => {
    const [item] = montarListaDoDia(
      D,
      [versao("agua", { tipo: "numerica", unidade: "L", valorAlvo: 3 })],
      [],
    );
    expect(item).toMatchObject({ valorAtual: 0, valorAlvo: 3, unidade: "L" });
  });

  it("a ocorrência gravada substitui a vaga, sem duplicar", () => {
    const lista = montarListaDoDia(D, [versao("a")], [gravada("a")]);
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({
      ocorrenciaId: "o-a",
      estado: "concluida",
    });
  });

  it("a linha mantém a mesma chave antes e depois de gravada", () => {
    const [virtual] = montarListaDoDia(D, [versao("a")], []);
    const [gravadaNaTela] = montarListaDoDia(D, [versao("a")], [gravada("a")]);
    expect(gravadaNaTela!.chave).toBe(virtual!.chave);
  });

  it("vaga adiada para outra data não aparece na data prevista", () => {
    const adiada = gravada("a", { data: d("2026-10-27"), estado: "pendente" });
    expect(montarListaDoDia(D, [versao("a")], [adiada])).toEqual([]);
  });

  it("ajustes de 'só esta' prevalecem sobre a versão", () => {
    const [item] = montarListaDoDia(
      D,
      [],
      [
        gravada("a", {
          ajuste: { titulo: "Outro título", horario: "09:00", valorAlvo: null },
        }),
      ],
    );
    expect(item).toMatchObject({ titulo: "Outro título", horario: "09:00" });
  });

  it("ordena com horário primeiro, cronológico, e depois por título", () => {
    const lista = montarListaDoDia(
      D,
      [
        versao("Ler"),
        versao("Correr", { horario: "18:00" }),
        versao("Água"),
        versao("Remédio", { horario: "07:30" }),
      ],
      [],
    );
    expect(lista.map((i) => i.titulo)).toEqual([
      "Remédio",
      "Correr",
      "Água",
      "Ler",
    ]);
  });

  it("resumo conta concluídas sobre o total", () => {
    const lista = montarListaDoDia(
      D,
      [versao("a"), versao("b"), versao("c")],
      [gravada("a")],
    );
    expect(resumoDoDia(lista)).toEqual({ concluidas: 1, total: 3 });
  });
});
