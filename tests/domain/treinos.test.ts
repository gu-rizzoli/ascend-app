import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { grupoMuscular } from "@/db/schema";
import { paraDataCivil } from "@/domain/datas";
import {
  avisoDeDescartadas,
  agruparPorGrupo,
  buscarExercicios,
  EXERCICIOS_INICIAIS,
  faixaDeRepeticoes,
  formatarSeries,
  GRUPOS_MUSCULARES,
  lerGrupo,
  lerCarga,
  mover,
  nomeJaExiste,
  normalizarNome,
  novaSerie,
  rotuloDaData,
  treinoDoModelo,
  validarModelo,
  validarTreino,
  type TreinoDoFormulario,
} from "@/domain/treinos";

const HOJE = paraDataCivil("2026-10-25");
const SUPINO = "00000000-0000-4000-8000-000000000001";
const FLEXAO = "00000000-0000-4000-8000-000000000002";

const serie = (repeticoes: string, carga = "", observacao = "") => ({
  repeticoes,
  carga,
  observacao,
});

function treino(
  mudancas: Partial<TreinoDoFormulario> = {},
): TreinoDoFormulario {
  return {
    nome: "",
    data: HOJE,
    observacao: "",
    modeloId: null,
    exercicios: [
      {
        exercicioId: SUPINO,
        nome: "Supino reto",
        series: [serie("10", "40"), serie("9", "40"), serie("8", "37,5")],
      },
    ],
    ...mudancas,
  };
}

describe("catálogo de exercícios", () => {
  it("normaliza maiúsculas, acentos e espaços extras", () => {
    expect(normalizarNome("  Supino   Reto ")).toBe("supino reto");
    expect(normalizarNome("Elevação Pélvica")).toBe("elevacao pelvica");
    expect(nomeJaExiste("supino  reto", [{ nome: "Supino Reto" }])).toBe(true);
  });

  it("nomes parecidos não contam como iguais", () => {
    expect(nomeJaExiste("Supino", [{ nome: "Supino reto" }])).toBe(false);
  });

  it("a busca acha por palavras, sem acento, com o igual primeiro", () => {
    const catalogo = [
      { nome: "Supino inclinado" },
      { nome: "Crucifixo" },
      { nome: "Supino" },
      { nome: "Elevação lateral" },
    ];
    expect(buscarExercicios("supino", catalogo).map((e) => e.nome)).toEqual([
      "Supino",
      "Supino inclinado",
    ]);
    expect(buscarExercicios("elevacao", catalogo)).toHaveLength(1);
    expect(buscarExercicios("inc sup", catalogo).map((e) => e.nome)).toEqual([
      "Supino inclinado",
    ]);
    expect(buscarExercicios("  ", catalogo)).toHaveLength(4);
  });
});

describe("séries", () => {
  it("lê carga com vírgula e aceita vazio como peso corporal", () => {
    expect(lerCarga("37,5")).toBe(37.5);
    expect(lerCarga("40")).toBe(40);
    expect(lerCarga("")).toBeNull();
    expect(lerCarga("1.234")).toBeUndefined();
    expect(lerCarga("-5")).toBeUndefined();
  });

  it("formata como no histórico, com ou sem carga", () => {
    expect(
      formatarSeries([
        { repeticoes: 10, cargaKg: 40 },
        { repeticoes: 8, cargaKg: 37.5 },
      ]),
    ).toBe("40×10, 37,5×8");
    expect(
      formatarSeries([
        { repeticoes: 10, cargaKg: null },
        { repeticoes: 8, cargaKg: null },
      ]),
    ).toBe("×10, ×8");
  });

  it("+ Série copia carga e repetições da anterior", () => {
    expect(novaSerie(serie("10", "40", "boa"))).toEqual({
      repeticoes: "10",
      carga: "40",
      observacao: "",
      dica: undefined,
    });
    expect(novaSerie()).toEqual(serie(""));
  });

  it("move itens só dentro dos limites", () => {
    expect(mover(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]);
    expect(mover(["a", "b", "c"], 2, -1)).toEqual(["a", "c", "b"]);
    expect(mover(["a", "b"], 0, -1)).toEqual(["a", "b"]);
  });

  it("mostra a faixa e a data como dica", () => {
    expect(faixaDeRepeticoes(8, 12)).toBe("8–12");
    expect(faixaDeRepeticoes(10, null)).toBe("10");
    expect(rotuloDaData(paraDataCivil("2026-07-10"), HOJE)).toBe("10/07");
    expect(rotuloDaData(paraDataCivil("2025-07-10"), HOJE)).toBe("10/07/2025");
  });
});

describe("validarTreino", () => {
  it("aceita um treino livre completo", () => {
    const r = validarTreino(treino({ nome: " Peito " }), HOJE);
    expect(r).toEqual({
      ok: true,
      descartadas: 0,
      treino: {
        nome: "Peito",
        data: HOJE,
        observacao: null,
        modeloId: null,
        exercicios: [
          {
            exercicioId: SUPINO,
            series: [
              { repeticoes: 10, cargaKg: 40, observacao: null },
              { repeticoes: 9, cargaKg: 40, observacao: null },
              { repeticoes: 8, cargaKg: 37.5, observacao: null },
            ],
          },
        ],
      },
    });
  });

  it("descarta séries sem repetições e exercícios que ficam vazios", () => {
    const r = validarTreino(
      treino({
        exercicios: [
          {
            exercicioId: SUPINO,
            nome: "Supino reto",
            series: [serie("10", "40"), serie("", "40"), serie("8")],
          },
          {
            exercicioId: FLEXAO,
            nome: "Flexão",
            series: [serie(""), serie("")],
          },
        ],
      }),
      HOJE,
    );
    expect(r.ok && r.descartadas).toBe(3);
    expect(r.ok && r.treino.exercicios).toHaveLength(1);
    expect(r.ok && r.treino.exercicios[0]!.series[1]!.cargaKg).toBeNull();
    expect(avisoDeDescartadas(3)).toBe(
      "3 séries sem repetições foram descartadas.",
    );
    expect(avisoDeDescartadas(0)).toBeNull();
    // Aberto da lista, sem ?descartadas no endereço: Number(undefined) é NaN.
    expect(avisoDeDescartadas(Number(undefined))).toBeNull();
  });

  it("recusa treino sem nenhuma série com repetições", () => {
    const r = validarTreino(treino({ exercicios: [] }), HOJE);
    expect(r).toEqual({
      ok: false,
      erro: "Registre pelo menos uma série com repetições.",
    });
  });

  it("diz qual série está errada", () => {
    const r = validarTreino(
      treino({
        exercicios: [
          {
            exercicioId: SUPINO,
            nome: "Supino reto",
            series: [serie("10"), serie("10", "quarenta")],
          },
        ],
      }),
      HOJE,
    );
    expect(r.ok).toBe(false);
    expect(!r.ok && r.erro).toMatch(/^Supino reto, série 2: a carga/);
    expect(
      validarTreino(
        treino({
          exercicios: [
            { exercicioId: SUPINO, nome: "Supino", series: [serie("0")] },
          ],
        }),
        HOJE,
      ).ok,
    ).toBe(false);
  });

  it("recusa data futura ou inválida", () => {
    expect(validarTreino(treino({ data: "2026-10-26" }), HOJE).ok).toBe(false);
    expect(validarTreino(treino({ data: "2026-02-30" }), HOJE).ok).toBe(false);
    expect(validarTreino(treino({ data: "2026-10-24" }), HOJE).ok).toBe(true);
  });

  it("ignora um modelo com id inválido", () => {
    const r = validarTreino(treino({ modeloId: "x" }), HOJE);
    expect(r.ok && r.treino.modeloId).toBeNull();
  });
});

describe("modelos", () => {
  const modelo = {
    id: "00000000-0000-4000-8000-0000000000aa",
    nome: "Peito e tríceps",
    exercicios: [
      {
        exercicioId: SUPINO,
        nome: "Supino reto",
        seriesSugeridas: 3,
        repsMin: 8,
        repsMax: 12,
      },
    ],
  };

  it("o treino do modelo vem com séries em branco e a faixa como dica", () => {
    const f = treinoDoModelo(modelo, HOJE);
    expect(f.nome).toBe("Peito e tríceps");
    expect(f.modeloId).toBe(modelo.id);
    expect(f.exercicios[0]!.series).toEqual([
      { repeticoes: "", carga: "", observacao: "", dica: "8–12" },
      { repeticoes: "", carga: "", observacao: "", dica: "8–12" },
      { repeticoes: "", carga: "", observacao: "", dica: "8–12" },
    ]);
  });

  it("fazer menos séries que o modelo sugere não dá erro", () => {
    const f = treinoDoModelo(modelo, HOJE);
    f.exercicios[0]!.series[0]!.repeticoes = "10";
    f.exercicios[0]!.series[1]!.repeticoes = "15";
    const r = validarTreino(f, HOJE);
    expect(r.ok && r.descartadas).toBe(1);
  });

  const campos = (repsMin: string, repsMax: string, series = "3") => ({
    nome: "A",
    observacao: "",
    exercicios: [
      {
        exercicioId: SUPINO,
        nome: "Supino",
        seriesSugeridas: series,
        repsMin,
        repsMax,
      },
    ],
  });

  it("valida séries e faixa, com o máximo opcional", () => {
    expect(validarModelo(campos("8", "12"))).toMatchObject({
      ok: true,
      modelo: { exercicios: [{ seriesSugeridas: 3, repsMin: 8, repsMax: 12 }] },
    });
    expect(validarModelo(campos("10", ""))).toMatchObject({
      ok: true,
      modelo: { exercicios: [{ repsMax: null }] },
    });
    expect(validarModelo(campos("12", "8")).ok).toBe(false);
    expect(validarModelo(campos("8", "12", "0")).ok).toBe(false);
    expect(validarModelo(campos("", "12")).ok).toBe(false);
  });

  it("exige nome e pelo menos um exercício", () => {
    expect(validarModelo({ ...campos("8", ""), nome: "  " }).ok).toBe(false);
    expect(
      validarModelo({ nome: "A", observacao: "", exercicios: [] }).ok,
    ).toBe(false);
  });
});

describe("catálogo inicial", () => {
  const ler = (arquivo: string) =>
    readFileSync(
      new URL(`../../src/db/migrations/${arquivo}`, import.meta.url),
      "utf8",
    );

  it("não tem nomes repetidos e usa os grupos do banco", () => {
    const normalizados = EXERCICIOS_INICIAIS.map((e) => normalizarNome(e.nome));
    expect(new Set(normalizados).size).toBe(EXERCICIOS_INICIAIS.length);
    expect([...grupoMuscular.enumValues]).toEqual([...GRUPOS_MUSCULARES]);
  });

  it("a migração 0006 grava a lista toda, e a 0005 era parte dela", () => {
    const linhas = [
      ...ler("0006_grupos_musculares.sql").matchAll(
        /\('([^']+)', '([^']+)', '([^']+)'\)/g,
      ),
    ].map((m) => [m[1], m[2], m[3]]);
    expect(linhas).toEqual(
      EXERCICIOS_INICIAIS.map((e) => [e.nome, normalizarNome(e.nome), e.grupo]),
    );
    const antigos = [
      ...ler("0005_exercicios_iniciais.sql").matchAll(/\('([^']+)', '/g),
    ].map((m) => m[1]);
    const nomes = EXERCICIOS_INICIAIS.map((e) => e.nome);
    expect(antigos.filter((n) => !nomes.includes(n!))).toEqual([]);
  });

  it("agrupa na ordem dos grupos, com os sem grupo no fim", () => {
    const g = agruparPorGrupo([
      { nome: "Meu", grupo: null },
      { nome: "Stiff", grupo: "posteriores" as const },
      { nome: "Supino", grupo: "peito" as const },
    ]);
    expect(g.map((x) => x.nome)).toEqual(["Peito", "Posteriores", "Sem grupo"]);
    expect(lerGrupo("peito")).toBe("peito");
    expect(lerGrupo("x")).toBeNull();
  });
});
