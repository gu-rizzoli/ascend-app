import { describe, expect, it } from "vitest";

import { paraDataCivil, type DataCivil } from "@/domain/datas";
import {
  agruparPorData,
  contagemPorDia,
  enderecoDaData,
  estatisticas,
  filtrosDaLista,
  filtrosDoCalendario,
  fimDasMetas,
  fimDosTreinos,
  focoPorDia,
  formatarMes,
  nivelDaTaxa,
  parametrosDosFiltros,
  percentual,
  semanasDoMes,
  somarMeses,
  ultimoDia,
  type Mes,
  type MetaDoHistorico,
} from "@/domain/historico";
import type { EstadoOcorrencia } from "@/domain/metas";

const d = paraDataCivil;
const HOJE = d("2026-10-25"); // domingo
const mes = (m: string) => m as Mes;
const PROJETO = "7d3a1c9e-2b4f-4e8a-9c6d-1f2e3a4b5c6d";

function registro(data: string, estado: EstadoOcorrencia) {
  return { data: d(data), estado };
}

function metaDoHistorico(
  data: string,
  estado: EstadoOcorrencia,
  titulo = "Meta",
): MetaDoHistorico {
  return {
    chave: `${titulo}:${data}`,
    metaId: titulo,
    dataPrevista: d(data),
    ocorrenciaId: `${titulo}-${data}`,
    tipo: "binaria",
    unidade: null,
    titulo,
    horario: null,
    valorAlvo: null,
    valorAtual: null,
    estado,
    corrigida: false,
    reagendadaDe: null,
    reagendadaPara: null,
    data: d(data),
    projeto: null,
    corrigidaEm: null,
  };
}

describe("taxa do dia (10.3)", () => {
  it("3 de 4 concluídas é 75%", () => {
    const dias = contagemPorDia([
      registro("2026-07-15", "concluida"),
      registro("2026-07-15", "concluida"),
      registro("2026-07-15", "concluida"),
      registro("2026-07-15", "nao_concluida"),
    ]);
    const c = dias.get(d("2026-07-15"))!;
    expect(c).toEqual({ concluidas: 3, total: 4 });
    expect(percentual(c)).toBe(75);
  });

  it("dia sem metas é neutro, não 0%", () => {
    expect(contagemPorDia([]).get(d("2026-07-15"))).toBeUndefined();
    expect(percentual({ concluidas: 0, total: 0 })).toBeNull();
  });

  it("dia com metas e nenhuma concluída é 0%", () => {
    const c = contagemPorDia([registro("2026-07-15", "nao_concluida")]);
    expect(percentual(c.get(d("2026-07-15"))!)).toBe(0);
  });

  it("arredonda para o inteiro mais próximo", () => {
    expect(percentual({ concluidas: 1, total: 3 })).toBe(33);
    expect(percentual({ concluidas: 2, total: 3 })).toBe(67);
  });

  it("pendentes não entram na conta", () => {
    const c = contagemPorDia([
      registro("2026-07-15", "concluida"),
      registro("2026-07-15", "pendente"),
    ]);
    expect(c.get(d("2026-07-15"))).toEqual({ concluidas: 1, total: 1 });
  });

  it("separa por dia", () => {
    const c = contagemPorDia([
      registro("2026-07-15", "concluida"),
      registro("2026-07-16", "nao_concluida"),
    ]);
    expect(c.size).toBe(2);
  });

  it("a intensidade cresce com a taxa, sem marcar dia ruim", () => {
    expect(nivelDaTaxa(0)).toBe(1);
    expect(nivelDaTaxa(24)).toBe(1);
    expect(nivelDaTaxa(25)).toBe(2);
    expect(nivelDaTaxa(50)).toBe(3);
    expect(nivelDaTaxa(75)).toBe(4);
    expect(nivelDaTaxa(99)).toBe(4);
    expect(nivelDaTaxa(100)).toBe(5);
  });
});

describe("estatísticas do período (10.10)", () => {
  it("conta concluídas, não concluídas, taxa e treinos", () => {
    expect(
      estatisticas(
        [
          registro("2026-10-01", "concluida"),
          registro("2026-10-01", "nao_concluida"),
          registro("2026-10-02", "concluida"),
          registro("2026-10-03", "concluida"),
        ],
        2,
      ),
    ).toEqual({ concluidas: 3, naoConcluidas: 1, taxa: 75, treinos: 2 });
  });

  it("sem metas, a taxa fica vazia em vez de 0%", () => {
    expect(estatisticas([], 3)).toEqual({
      concluidas: 0,
      naoConcluidas: 0,
      taxa: null,
      treinos: 3,
    });
  });
});

describe("mês do calendário", () => {
  it("último dia, inclusive fevereiro bissexto", () => {
    expect(ultimoDia(mes("2026-10"))).toBe("2026-10-31");
    expect(ultimoDia(mes("2026-02"))).toBe("2026-02-28");
    expect(ultimoDia(mes("2028-02"))).toBe("2028-02-29");
  });

  it("anda entre meses e anos", () => {
    expect(somarMeses(mes("2026-01"), -1)).toBe("2025-12");
    expect(somarMeses(mes("2026-12"), 1)).toBe("2027-01");
    expect(somarMeses(mes("2026-10"), 0)).toBe("2026-10");
  });

  it("formata o nome", () => {
    expect(formatarMes(mes("2026-03"))).toBe("Março de 2026");
  });

  it("a grade começa no domingo e completa as semanas", () => {
    // Outubro de 2026 começa numa quinta-feira.
    const semanas = semanasDoMes(mes("2026-10"));
    expect(semanas).toHaveLength(5);
    expect(semanas.every((s) => s.length === 7)).toBe(true);
    expect(semanas[0]!.slice(0, 5)).toEqual([
      null,
      null,
      null,
      null,
      "2026-10-01",
    ]);
    expect(semanas[4]!.slice(-1)).toEqual(["2026-10-31"]);
    expect(semanas.flat().filter(Boolean)).toHaveLength(31);
  });
});

describe("filtros (10.7)", () => {
  it("o calendário abre no mês de hoje", () => {
    expect(filtrosDoCalendario({}, HOJE)).toEqual({
      mes: "2026-10",
      filtros: {
        de: "2026-10-01",
        ate: "2026-10-31",
        tipo: "tudo",
        projetoId: null,
      },
    });
  });

  it("o calendário lê mês, tipo e projeto", () => {
    const { mes: m, filtros } = filtrosDoCalendario(
      { mes: "2026-07", tipo: "metas", projeto: PROJETO },
      HOJE,
    );
    expect(m).toBe("2026-07");
    expect(filtros).toMatchObject({
      de: "2026-07-01",
      ate: "2026-07-31",
      tipo: "metas",
      projetoId: PROJETO,
    });
  });

  it("valores inválidos voltam ao padrão", () => {
    const { mes: m, filtros } = filtrosDoCalendario(
      { mes: "2026-13", tipo: "tarefas", projeto: "1; drop" },
      HOJE,
    );
    expect(m).toBe("2026-10");
    expect(filtros.tipo).toBe("tudo");
    expect(filtros.projetoId).toBeNull();
  });

  it("a lista vai do primeiro dia do mês até hoje", () => {
    expect(filtrosDaLista({}, HOJE)).toMatchObject({
      de: "2026-10-01",
      ate: "2026-10-25",
    });
  });

  it("a lista aceita um intervalo e desvira se vier invertido", () => {
    expect(
      filtrosDaLista({ de: "2026-09-30", ate: "2026-09-01" }, HOJE),
    ).toMatchObject({ de: "2026-09-01", ate: "2026-09-30" });
  });

  it("só o fim no passado começa no primeiro dia daquele mês", () => {
    expect(filtrosDaLista({ ate: "2026-08-20" }, HOJE)).toMatchObject({
      de: "2026-08-01",
      ate: "2026-08-20",
    });
  });

  it("metas vão até ontem e treinos até hoje", () => {
    expect(fimDasMetas(d("2026-10-31"), HOJE)).toBe("2026-10-24");
    expect(fimDasMetas(d("2026-09-30"), HOJE)).toBe("2026-09-30");
    expect(fimDosTreinos(d("2026-10-31"), HOJE)).toBe("2026-10-25");
    expect(fimDosTreinos(d("2026-09-30"), HOJE)).toBe("2026-09-30");
  });

  it("volta para o endereço sem os filtros no padrão", () => {
    expect(parametrosDosFiltros({ tipo: "tudo", projetoId: null })).toBe("");
    expect(
      parametrosDosFiltros(
        { tipo: "treinos", projetoId: PROJETO },
        { mes: "2026-09" },
      ),
    ).toBe(`?mes=2026-09&tipo=treinos&projeto=${PROJETO}`);
  });
});

describe("projeto em foco (RF-HIS-09)", () => {
  const trocas = [
    { data: d("2026-10-05"), projetoId: "A" },
    { data: d("2026-10-10"), projetoId: "B" },
    // Duas trocas no mesmo dia: vale a última.
    { data: d("2026-10-10"), projetoId: "C" },
    { data: d("2026-10-20"), projetoId: null },
  ];

  it("é a última troca até cada dia", () => {
    const dias = ["2026-10-01", "2026-10-05", "2026-10-09", "2026-10-10"];
    const foco = focoPorDia(trocas, dias.map(d));
    expect([...foco]).toEqual([
      ["2026-10-01", null],
      ["2026-10-05", "A"],
      ["2026-10-09", "A"],
      ["2026-10-10", "C"],
    ]);
  });

  it("trocas depois não mudam o passado, e tirar o destaque deixa sem foco", () => {
    const dias: DataCivil[] = [d("2026-10-25"), d("2026-10-15")];
    const foco = focoPorDia(trocas, dias);
    expect(foco.get(d("2026-10-15"))).toBe("C");
    expect(foco.get(d("2026-10-25"))).toBeNull();
  });
});

describe("lista cronológica (10.4)", () => {
  it("agrupa por data, do mais recente para o mais antigo, com a contagem", () => {
    const dias = agruparPorData(
      [
        metaDoHistorico("2026-10-20", "concluida", "Ler"),
        metaDoHistorico("2026-10-22", "nao_concluida", "Ler"),
        metaDoHistorico("2026-10-20", "nao_concluida", "Água"),
      ],
      [
        { id: "t1", data: d("2026-10-21"), titulo: "Treino A" },
        { id: "t2", data: d("2026-10-20"), titulo: "Treino B" },
      ],
    );
    expect(dias.map((x) => x.data)).toEqual([
      "2026-10-22",
      "2026-10-21",
      "2026-10-20",
    ]);
    expect(dias[1]).toMatchObject({
      metas: [],
      contagem: { concluidas: 0, total: 0 },
    });
    expect(dias[2]!.metas).toHaveLength(2);
    expect(dias[2]!.treinos.map((t) => t.id)).toEqual(["t2"]);
    expect(dias[2]!.contagem).toEqual({ concluidas: 1, total: 2 });
  });
});

describe("endereço de uma data", () => {
  it("hoje vai para Hoje, o futuro para o dia e o passado para o Histórico", () => {
    expect(enderecoDaData(HOJE, HOJE)).toBe("/hoje");
    expect(enderecoDaData(d("2026-10-26"), HOJE)).toBe("/dia/2026-10-26");
    expect(enderecoDaData(d("2026-10-12"), HOJE)).toBe("/historico/2026-10-12");
  });
});
