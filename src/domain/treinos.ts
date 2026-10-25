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
 * O catálogo com que toda conta começa: os exercícios mais comuns, para o
 * primeiro registro não exigir cadastro. São exercícios como os outros: dá
 * para renomear, arquivar ou excluir (treinos.md, decisão 16). A migração
 * 0005 grava a mesma lista nas contas que já existiam.
 */
export const EXERCICIOS_INICIAIS = [
  // Peito
  "Supino reto",
  "Supino inclinado",
  "Supino declinado",
  "Crucifixo",
  "Crossover",
  "Flexão",
  // Costas
  "Puxada frontal",
  "Barra fixa",
  "Remada curvada",
  "Remada baixa",
  "Remada unilateral",
  "Levantamento terra",
  // Ombros
  "Desenvolvimento",
  "Elevação lateral",
  "Elevação frontal",
  "Crucifixo inverso",
  // Bíceps
  "Rosca direta",
  "Rosca alternada",
  "Rosca martelo",
  "Rosca Scott",
  // Tríceps
  "Tríceps pulley",
  "Tríceps testa",
  "Tríceps francês",
  "Paralelas",
  // Pernas
  "Agachamento livre",
  "Leg press",
  "Cadeira extensora",
  "Mesa flexora",
  "Stiff",
  "Afundo",
  "Elevação pélvica",
  "Cadeira abdutora",
  "Panturrilha em pé",
  // Abdômen
  "Abdominal",
  "Abdominal infra",
] as const;

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
  if (n <= 0) return null;
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
