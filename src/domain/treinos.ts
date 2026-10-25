import { z } from "zod";

import { ehDataCivil, formatarDataCurta, type DataCivil } from "./datas";

/** Regras de Treinos (9.x, docs/produto/treinos.md) sem banco nem tela. */

export const NOME_EXERCICIO_MAXIMO = 80;
export const NOME_TREINO_MAXIMO = 80;
export const OBSERVACAO_MAXIMA = 1000;
export const OBSERVACAO_SERIE_MAXIMA = 200;
export const REPETICOES_MAXIMAS = 999;
// numeric(6,2) no banco.
export const CARGA_MAXIMA = 9999.99;
export const SERIES_SUGERIDAS_MAXIMAS = 20;
export const EXERCICIOS_MAXIMOS = 40;
export const SERIES_MAXIMAS = 30;

// ---------------------------------------------------------------------------
// Catálogo de exercícios (RF-TRE-01 a 05)

/**
 * A chave que bloqueia duplicatas: minúsculas, sem acentos e com espaços
 * simples. "Supino  Reto" e "supino reto" dão o mesmo nome (decisão 5).
 */
export function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Grupos musculares para organizar o catálogo (treinos.md, decisão 17). Um
 * exercício tem no máximo um grupo, o principal; sem grupo também vale.
 */
export const GRUPOS_MUSCULARES = [
  "peito",
  "costas",
  "ombros",
  "biceps",
  "triceps",
  "antebracos",
  "quadriceps",
  "posteriores",
  "gluteos",
  "panturrilhas",
  "abdomen",
] as const;
export type GrupoMuscular = (typeof GRUPOS_MUSCULARES)[number];

export const NOME_DO_GRUPO: Record<GrupoMuscular, string> = {
  peito: "Peito",
  costas: "Costas",
  ombros: "Ombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  antebracos: "Antebraços",
  quadriceps: "Quadríceps",
  posteriores: "Posteriores",
  gluteos: "Glúteos",
  panturrilhas: "Panturrilhas",
  abdomen: "Abdômen",
};

/** Os exercícios que a pessoa criou sem escolher grupo. */
export const SEM_GRUPO = "Sem grupo";

/**
 * O catálogo com que toda conta começa: os exercícios mais comuns, cada um
 * com o grupo principal, para o primeiro registro não exigir cadastro. São
 * exercícios como os outros: dá para renomear, arquivar ou excluir (decisão
 * 16). As migrações 0005 e 0006 gravam a lista nas contas que já existiam.
 */
export const EXERCICIOS_INICIAIS: readonly {
  nome: string;
  grupo: GrupoMuscular;
}[] = [
  { nome: "Supino reto", grupo: "peito" },
  { nome: "Supino inclinado", grupo: "peito" },
  { nome: "Supino declinado", grupo: "peito" },
  { nome: "Supino reto com halteres", grupo: "peito" },
  { nome: "Supino inclinado com halteres", grupo: "peito" },
  { nome: "Crucifixo", grupo: "peito" },
  { nome: "Crucifixo inclinado", grupo: "peito" },
  { nome: "Crossover", grupo: "peito" },
  { nome: "Peck deck", grupo: "peito" },
  { nome: "Flexão", grupo: "peito" },
  { nome: "Pullover", grupo: "peito" },
  { nome: "Puxada frontal", grupo: "costas" },
  { nome: "Puxada triângulo", grupo: "costas" },
  { nome: "Barra fixa", grupo: "costas" },
  { nome: "Remada curvada", grupo: "costas" },
  { nome: "Remada baixa", grupo: "costas" },
  { nome: "Remada unilateral", grupo: "costas" },
  { nome: "Remada cavalinho", grupo: "costas" },
  { nome: "Remada máquina", grupo: "costas" },
  { nome: "Pulldown", grupo: "costas" },
  { nome: "Levantamento terra", grupo: "costas" },
  { nome: "Hiperextensão lombar", grupo: "costas" },
  { nome: "Desenvolvimento", grupo: "ombros" },
  { nome: "Desenvolvimento com halteres", grupo: "ombros" },
  { nome: "Desenvolvimento Arnold", grupo: "ombros" },
  { nome: "Elevação lateral", grupo: "ombros" },
  { nome: "Elevação lateral no cabo", grupo: "ombros" },
  { nome: "Elevação frontal", grupo: "ombros" },
  { nome: "Crucifixo inverso", grupo: "ombros" },
  { nome: "Face pull", grupo: "ombros" },
  { nome: "Remada alta", grupo: "ombros" },
  { nome: "Encolhimento", grupo: "ombros" },
  { nome: "Rosca direta", grupo: "biceps" },
  { nome: "Rosca alternada", grupo: "biceps" },
  { nome: "Rosca martelo", grupo: "biceps" },
  { nome: "Rosca Scott", grupo: "biceps" },
  { nome: "Rosca concentrada", grupo: "biceps" },
  { nome: "Rosca no cabo", grupo: "biceps" },
  { nome: "Rosca inversa", grupo: "biceps" },
  { nome: "Tríceps pulley", grupo: "triceps" },
  { nome: "Tríceps corda", grupo: "triceps" },
  { nome: "Tríceps testa", grupo: "triceps" },
  { nome: "Tríceps francês", grupo: "triceps" },
  { nome: "Tríceps coice", grupo: "triceps" },
  { nome: "Paralelas", grupo: "triceps" },
  { nome: "Mergulho no banco", grupo: "triceps" },
  { nome: "Supino fechado", grupo: "triceps" },
  { nome: "Rosca de punho", grupo: "antebracos" },
  { nome: "Rosca de punho inversa", grupo: "antebracos" },
  { nome: "Agachamento livre", grupo: "quadriceps" },
  { nome: "Agachamento frontal", grupo: "quadriceps" },
  { nome: "Agachamento búlgaro", grupo: "quadriceps" },
  { nome: "Agachamento hack", grupo: "quadriceps" },
  { nome: "Agachamento sumô", grupo: "quadriceps" },
  { nome: "Leg press", grupo: "quadriceps" },
  { nome: "Cadeira extensora", grupo: "quadriceps" },
  { nome: "Afundo", grupo: "quadriceps" },
  { nome: "Passada", grupo: "quadriceps" },
  { nome: "Sissy squat", grupo: "quadriceps" },
  { nome: "Mesa flexora", grupo: "posteriores" },
  { nome: "Cadeira flexora", grupo: "posteriores" },
  { nome: "Flexora em pé", grupo: "posteriores" },
  { nome: "Stiff", grupo: "posteriores" },
  { nome: "Levantamento terra romeno", grupo: "posteriores" },
  { nome: "Bom dia", grupo: "posteriores" },
  { nome: "Elevação pélvica", grupo: "gluteos" },
  { nome: "Glúteo na polia", grupo: "gluteos" },
  { nome: "Glúteo na máquina", grupo: "gluteos" },
  { nome: "Cadeira abdutora", grupo: "gluteos" },
  { nome: "Cadeira adutora", grupo: "gluteos" },
  { nome: "Abdução no cabo", grupo: "gluteos" },
  { nome: "Panturrilha em pé", grupo: "panturrilhas" },
  { nome: "Panturrilha sentado", grupo: "panturrilhas" },
  { nome: "Panturrilha no leg press", grupo: "panturrilhas" },
  { nome: "Abdominal", grupo: "abdomen" },
  { nome: "Abdominal infra", grupo: "abdomen" },
  { nome: "Abdominal oblíquo", grupo: "abdomen" },
  { nome: "Abdominal na polia", grupo: "abdomen" },
  { nome: "Elevação de pernas", grupo: "abdomen" },
  { nome: "Abdominal na roda", grupo: "abdomen" },
  { nome: "Russian twist", grupo: "abdomen" },
];

/** O nome como fica gravado: só sem espaços sobrando. */
export function limparNome(nome: string): string {
  return nome.replace(/\s+/g, " ").trim();
}

export const esquemaNomeExercicio = z
  .string()
  .transform(limparNome)
  .pipe(
    z
      .string()
      .min(1, "Dê um nome ao exercício.")
      .max(
        NOME_EXERCICIO_MAXIMO,
        `Use no máximo ${NOME_EXERCICIO_MAXIMO} caracteres.`,
      ),
  );

type ComNome = { nome: string };

/**
 * Os exercícios parecidos com a busca, para achar o existente antes de criar
 * outro (9.3, RF-TRE-02). Cada palavra da busca precisa aparecer no nome, sem
 * ligar para acentos. O nome igual vem primeiro, depois os que começam com a
 * busca, e então os outros em ordem alfabética.
 */
export function buscarExercicios<T extends ComNome>(
  busca: string,
  exercicios: readonly T[],
): T[] {
  const alvo = normalizarNome(busca);
  if (alvo === "") return [...exercicios];
  const palavras = alvo.split(" ");
  const peso = (nome: string) =>
    nome === alvo ? 0 : nome.startsWith(alvo) ? 1 : 2;
  return exercicios
    .map((e) => ({ e, nome: normalizarNome(e.nome) }))
    .filter(({ nome }) => palavras.every((p) => nome.includes(p)))
    .sort(
      (a, b) =>
        peso(a.nome) - peso(b.nome) || a.nome.localeCompare(b.nome, "pt-BR"),
    )
    .map(({ e }) => e);
}

/**
 * O catálogo separado por grupo, na ordem dos grupos, com os sem grupo no
 * fim. Grupos vazios não aparecem.
 */
export function agruparPorGrupo<T extends { grupo: GrupoMuscular | null }>(
  exercicios: readonly T[],
): { grupo: GrupoMuscular | null; nome: string; exercicios: T[] }[] {
  return [...GRUPOS_MUSCULARES, null]
    .map((grupo) => ({
      grupo,
      nome: grupo ? NOME_DO_GRUPO[grupo] : SEM_GRUPO,
      exercicios: exercicios.filter((e) => e.grupo === grupo),
    }))
    .filter((g) => g.exercicios.length > 0);
}

/** Lê o grupo vindo do formulário; vazio ou desconhecido é sem grupo. */
export function lerGrupo(valor: string): GrupoMuscular | null {
  return GRUPOS_MUSCULARES.find((g) => g === valor) ?? null;
}

/** Já existe um exercício com esse nome? Só o nome igual bloqueia. */
export function nomeJaExiste(nome: string, exercicios: readonly ComNome[]) {
  const alvo = normalizarNome(nome);
  return exercicios.some((e) => normalizarNome(e.nome) === alvo);
}

// ---------------------------------------------------------------------------
// Números das séries

/** Lê um inteiro positivo digitado ("10"). Vazio ou inválido dá null. */
function lerInteiro(texto: string): number | null {
  const limpo = texto.trim();
  if (!/^\d+$/.test(limpo)) return null;
  return Number(limpo);
}

/**
 * Lê uma carga em kg com vírgula ou ponto e até 2 casas ("37,5"). Vazio é
 * peso corporal (null); texto inválido dá undefined.
 */
export function lerCarga(texto: string): number | null | undefined {
  const limpo = texto.trim().replace(",", ".");
  if (limpo === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(limpo)) return undefined;
  return Number(limpo);
}

/** 37.5 vira "37,5"; 40 vira "40". */
export function formatarCarga(carga: number): string {
  return String(Math.round(carga * 100) / 100).replace(".", ",");
}

/** Uma série curta, como no histórico: "40×10", ou "×10" sem carga. */
export function formatarSerie(s: {
  repeticoes: number;
  cargaKg: number | null;
}): string {
  return `${s.cargaKg === null ? "" : formatarCarga(s.cargaKg)}×${s.repeticoes}`;
}

/** As séries de um exercício numa sessão: "40×10, 40×9, 38×8". */
export function formatarSeries(
  series: readonly { repeticoes: number; cargaKg: number | null }[],
): string {
  return series.map(formatarSerie).join(", ");
}

/** A faixa do modelo como dica no campo: "8–12", ou "10" sem máximo. */
export function faixaDeRepeticoes(min: number, max: number | null): string {
  return max === null || max === min ? String(min) : `${min}–${max}`;
}

/** "10/07", com o ano quando não é o ano de hoje: "10/07/2025". */
export function rotuloDaData(data: DataCivil, hoje: DataCivil): string {
  const curta = formatarDataCurta(data);
  return data.slice(0, 4) === hoje.slice(0, 4)
    ? curta
    : `${curta}/${data.slice(0, 4)}`;
}

// ---------------------------------------------------------------------------
// Registrar e editar treino (RF-TRE-08 a 14, 17)

/** Uma série como está no formulário, tudo texto. */
export type SerieDoFormulario = {
  repeticoes: string;
  carga: string;
  observacao: string;
  // Dica do modelo ("8–12"); não é gravada.
  dica?: string;
};

export type ExercicioDoFormulario = {
  exercicioId: string;
  nome: string;
  series: SerieDoFormulario[];
};

export type TreinoDoFormulario = {
  nome: string;
  data: string;
  observacao: string;
  modeloId: string | null;
  exercicios: ExercicioDoFormulario[];
};

export type SerieValida = {
  repeticoes: number;
  cargaKg: number | null;
  observacao: string | null;
};

export type TreinoValido = {
  nome: string | null;
  data: DataCivil;
  observacao: string | null;
  modeloId: string | null;
  exercicios: { exercicioId: string; series: SerieValida[] }[];
};

export type ResultadoTreino =
  | { ok: true; treino: TreinoValido; descartadas: number }
  | { ok: false; erro: string };

const textoOuNull = (texto: string, maximo: number) => {
  const limpo = texto.trim();
  return limpo === "" ? null : limpo.slice(0, maximo);
};

const uuid = z.uuid();

/**
 * Valida o treino do formulário. Séries sem repetições são descartadas, e os
 * exercícios que ficam sem série também; `descartadas` conta as séries
 * descartadas para o aviso (decisão 3). A data não pode ser futura: o
 * treino é registrado depois de acontecer (9.9).
 */
export function validarTreino(
  f: TreinoDoFormulario,
  hoje: DataCivil,
): ResultadoTreino {
  const data = f.data.trim();
  if (!ehDataCivil(data)) return { ok: false, erro: "Informe a data." };
  if (data > hoje) {
    return { ok: false, erro: "A data do treino não pode ser no futuro." };
  }
  if (f.exercicios.length > EXERCICIOS_MAXIMOS) {
    return {
      ok: false,
      erro: `Use no máximo ${EXERCICIOS_MAXIMOS} exercícios.`,
    };
  }

  let descartadas = 0;
  const exercicios: TreinoValido["exercicios"] = [];
  for (const e of f.exercicios) {
    if (!uuid.safeParse(e.exercicioId).success) {
      return { ok: false, erro: "Exercício não encontrado." };
    }
    if (e.series.length > SERIES_MAXIMAS) {
      return {
        ok: false,
        erro: `${e.nome}: use no máximo ${SERIES_MAXIMAS} séries.`,
      };
    }
    const series: SerieValida[] = [];
    for (const [i, s] of e.series.entries()) {
      const onde = `${e.nome}, série ${i + 1}`;
      if (s.repeticoes.trim() === "") {
        descartadas++;
        continue;
      }
      const repeticoes = lerInteiro(s.repeticoes);
      if (
        repeticoes === null ||
        repeticoes < 1 ||
        repeticoes > REPETICOES_MAXIMAS
      ) {
        return {
          ok: false,
          erro: `${onde}: as repetições vão de 1 a ${REPETICOES_MAXIMAS}.`,
        };
      }
      const cargaKg = lerCarga(s.carga);
      if (cargaKg === undefined || (cargaKg ?? 0) > CARGA_MAXIMA) {
        return {
          ok: false,
          erro: `${onde}: a carga é um número em kg, como 40 ou 37,5.`,
        };
      }
      series.push({
        repeticoes,
        cargaKg,
        observacao: textoOuNull(s.observacao, OBSERVACAO_SERIE_MAXIMA),
      });
    }
    if (series.length > 0)
      exercicios.push({ exercicioId: e.exercicioId, series });
  }
  if (exercicios.length === 0) {
    return {
      ok: false,
      erro: "Registre pelo menos uma série com repetições.",
    };
  }

  return {
    ok: true,
    descartadas,
    treino: {
      nome: textoOuNull(f.nome, NOME_TREINO_MAXIMO),
      data,
      observacao: textoOuNull(f.observacao, OBSERVACAO_MAXIMA),
      modeloId:
        f.modeloId && uuid.safeParse(f.modeloId).success ? f.modeloId : null,
      exercicios,
    },
  };
}

/** Uma série nova copia carga e repetições da anterior (decisão 1). */
export function novaSerie(anterior?: SerieDoFormulario): SerieDoFormulario {
  return {
    repeticoes: anterior?.repeticoes ?? "",
    carga: anterior?.carga ?? "",
    observacao: "",
    dica: anterior?.dica,
  };
}

/**
 * O formulário a partir de um modelo: os exercícios na ordem, cada um com as
 * séries sugeridas em branco e a faixa só como dica (decisão 2, D-033).
 */
export function treinoDoModelo(
  modelo: {
    id: string;
    nome: string;
    exercicios: {
      exercicioId: string;
      nome: string;
      seriesSugeridas: number;
      repsMin: number;
      repsMax: number | null;
    }[];
  },
  hoje: DataCivil,
): TreinoDoFormulario {
  return {
    nome: modelo.nome,
    data: hoje,
    observacao: "",
    modeloId: modelo.id,
    exercicios: modelo.exercicios.map((e) => {
      const dica = faixaDeRepeticoes(e.repsMin, e.repsMax);
      return {
        exercicioId: e.exercicioId,
        nome: e.nome,
        series: Array.from({ length: e.seriesSugeridas }, () => ({
          repeticoes: "",
          carga: "",
          observacao: "",
          dica,
        })),
      };
    }),
  };
}

/** Troca um item de lugar com o vizinho; fora dos limites, nada muda. */
export function mover<T>(lista: readonly T[], i: number, passo: -1 | 1): T[] {
  const j = i + passo;
  if (i < 0 || i >= lista.length || j < 0 || j >= lista.length) {
    return [...lista];
  }
  const nova = [...lista];
  [nova[i], nova[j]] = [nova[j]!, nova[i]!];
  return nova;
}

/** O aviso depois de salvar (decisão 3). */
export function avisoDeDescartadas(n: number): string | null {
  if (!(n > 0)) return null;
  return n === 1
    ? "1 série sem repetições foi descartada."
    : `${n} séries sem repetições foram descartadas.`;
}

// ---------------------------------------------------------------------------
// Modelos (RF-TRE-06, 07)

export type ExercicioDoModeloFormulario = {
  exercicioId: string;
  nome: string;
  seriesSugeridas: string;
  repsMin: string;
  repsMax: string;
};

export type ModeloDoFormulario = {
  nome: string;
  observacao: string;
  exercicios: ExercicioDoModeloFormulario[];
};

export type ModeloValido = {
  nome: string;
  observacao: string | null;
  exercicios: {
    exercicioId: string;
    seriesSugeridas: number;
    repsMin: number;
    repsMax: number | null;
  }[];
};

/**
 * Valida o modelo: nome, observação e pelo menos um exercício, cada um com
 * séries sugeridas e faixa de repetições (o máximo é opcional). Sem carga
 * (D-032).
 */
export function validarModelo(
  f: ModeloDoFormulario,
): { ok: true; modelo: ModeloValido } | { ok: false; erro: string } {
  const nome = limparNome(f.nome);
  if (nome === "") return { ok: false, erro: "Dê um nome ao modelo." };
  if (nome.length > NOME_TREINO_MAXIMO) {
    return {
      ok: false,
      erro: `Use no máximo ${NOME_TREINO_MAXIMO} caracteres no nome.`,
    };
  }
  if (f.exercicios.length === 0) {
    return { ok: false, erro: "Adicione pelo menos um exercício." };
  }
  if (f.exercicios.length > EXERCICIOS_MAXIMOS) {
    return {
      ok: false,
      erro: `Use no máximo ${EXERCICIOS_MAXIMOS} exercícios.`,
    };
  }

  const exercicios: ModeloValido["exercicios"] = [];
  for (const e of f.exercicios) {
    if (!uuid.safeParse(e.exercicioId).success) {
      return { ok: false, erro: "Exercício não encontrado." };
    }
    const seriesSugeridas = lerInteiro(e.seriesSugeridas);
    if (
      seriesSugeridas === null ||
      seriesSugeridas < 1 ||
      seriesSugeridas > SERIES_SUGERIDAS_MAXIMAS
    ) {
      return {
        ok: false,
        erro: `${e.nome}: as séries vão de 1 a ${SERIES_SUGERIDAS_MAXIMAS}.`,
      };
    }
    const repsMin = lerInteiro(e.repsMin);
    if (repsMin === null || repsMin < 1 || repsMin > REPETICOES_MAXIMAS) {
      return {
        ok: false,
        erro: `${e.nome}: informe as repetições, de 1 a ${REPETICOES_MAXIMAS}.`,
      };
    }
    let repsMax: number | null = null;
    if (e.repsMax.trim() !== "") {
      repsMax = lerInteiro(e.repsMax);
      if (
        repsMax === null ||
        repsMax < repsMin ||
        repsMax > REPETICOES_MAXIMAS
      ) {
        return {
          ok: false,
          erro: `${e.nome}: o máximo de repetições precisa ser maior ou igual ao mínimo.`,
        };
      }
    }
    exercicios.push({
      exercicioId: e.exercicioId,
      seriesSugeridas,
      repsMin,
      repsMax: repsMax === repsMin ? null : repsMax,
    });
  }

  return {
    ok: true,
    modelo: {
      nome,
      observacao: textoOuNull(f.observacao, OBSERVACAO_MAXIMA),
      exercicios,
    },
  };
}
