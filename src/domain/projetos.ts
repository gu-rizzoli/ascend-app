import { z } from "zod";

import { ehDataCivil, type DataCivil } from "./datas";
import { versaoDeReferencia, type Vigencia } from "./vigencia";

/** Regras de Projetos (8.x, docs/produto/projetos.md) sem banco nem tela. */

export const STATUS_PROJETO = [
  "planejado",
  "em_andamento",
  "pausado",
  "concluido",
  "arquivado",
] as const;
export type StatusProjeto = (typeof STATUS_PROJETO)[number];

/** Os status de um projeto aberto, os únicos que se escolhem no formulário. */
export const STATUS_ABERTOS = ["em_andamento", "planejado", "pausado"] as const;
export type StatusAberto = (typeof STATUS_ABERTOS)[number];

export const NOME_DO_STATUS: Record<StatusProjeto, string> = {
  planejado: "Planejado",
  em_andamento: "Em andamento",
  pausado: "Pausado",
  concluido: "Concluído",
  arquivado: "Arquivado",
};

export const NOME_MAXIMO = 120;
export const DESCRICAO_MAXIMA = 1000;
export const PROXIMO_PASSO_MAXIMO = 200;

/** Concluído ou arquivado: sai do destaque e não recebe metas novas. */
export function projetoEncerrado(status: StatusProjeto): boolean {
  return status === "concluido" || status === "arquivado";
}

/**
 * Prazo vencido (15.4): o prazo é anterior a hoje e o projeto ainda está
 * aberto. É só um selo, calculado na leitura, sem lembrete.
 */
export function prazoVencido(
  p: { prazo: DataCivil | null; status: StatusProjeto },
  hoje: DataCivil,
): boolean {
  return p.prazo !== null && p.prazo < hoje && !projetoEncerrado(p.status);
}

// ---------------------------------------------------------------------------
// Criar e editar (RF-PRO-01, 05, 06)

const textoOpcional = (maximo: number) =>
  z
    .string()
    .trim()
    .max(maximo, `Use no máximo ${maximo} caracteres.`)
    .transform((v) => (v === "" ? null : v));

/** Campos crus do formulário de projeto, todos como texto. */
export type CamposProjeto = {
  nome: string;
  descricao: string;
  status: string;
  proximoPasso: string;
  dataInicio: string;
  prazo: string;
};

export type DadosProjeto = {
  nome: string;
  descricao: string | null;
  status: StatusProjeto;
  proximoPasso: string | null;
  dataInicio: DataCivil;
  prazo: DataCivil | null;
};

/**
 * Valida o formulário. O status escolhido é sempre um dos abertos: concluir
 * e arquivar têm botão próprio, porque perguntam o que fazer com as metas
 * (RF-PRO-09). `statusAtual` deixa um projeto encerrado ser salvo sem
 * reabrir.
 */
export function esquemaProjeto(statusAtual: StatusProjeto | null = null) {
  const permitidos: readonly string[] =
    statusAtual && projetoEncerrado(statusAtual)
      ? [...STATUS_ABERTOS, statusAtual]
      : STATUS_ABERTOS;
  return z
    .object({
      nome: z
        .string()
        .trim()
        .min(1, "Digite um nome.")
        .max(NOME_MAXIMO, `Use no máximo ${NOME_MAXIMO} caracteres.`),
      descricao: textoOpcional(DESCRICAO_MAXIMA),
      status: z
        .string()
        .refine((s) => permitidos.includes(s), "Escolha o status."),
      proximoPasso: textoOpcional(PROXIMO_PASSO_MAXIMO),
      dataInicio: z.string().refine(ehDataCivil, "Escolha uma data válida."),
      prazo: z
        .string()
        .refine((v) => v === "" || ehDataCivil(v), "Escolha uma data válida."),
    })
    .transform((c, ctx): DadosProjeto => {
      const prazo = c.prazo === "" ? null : (c.prazo as DataCivil);
      if (prazo !== null && prazo < c.dataInicio) {
        ctx.addIssue({
          code: "custom",
          path: ["prazo"],
          message: "O prazo não pode ser antes do início.",
        });
      }
      return {
        nome: c.nome,
        descricao: c.descricao,
        status: c.status as StatusProjeto,
        proximoPasso: c.proximoPasso,
        dataInicio: c.dataInicio as DataCivil,
        prazo,
      };
    });
}

/** Próximo passo editado direto na lista ou em Hoje: vazio apaga. */
export function lerProximoPasso(texto: string): string | null {
  const limpo = texto.trim().slice(0, PROXIMO_PASSO_MAXIMO);
  return limpo === "" ? null : limpo;
}

// ---------------------------------------------------------------------------
// Lista de projetos (RNF-13)

export type GruposDeProjetos<P> = {
  atual: P | null;
  emAndamento: P[];
  planejados: P[];
  pausados: P[];
  concluidos: P[];
  arquivados: P[];
};

/**
 * O atual vai para o topo e sai do grupo dele, para não aparecer duas vezes.
 * Dentro de cada grupo, a ordem de quem chama é mantida.
 */
export function agruparProjetos<
  P extends { id: string; status: StatusProjeto },
>(projetos: P[], atualId: string | null): GruposDeProjetos<P> {
  const grupos: GruposDeProjetos<P> = {
    atual: null,
    emAndamento: [],
    planejados: [],
    pausados: [],
    concluidos: [],
    arquivados: [],
  };
  const grupo: Record<StatusProjeto, P[]> = {
    em_andamento: grupos.emAndamento,
    planejado: grupos.planejados,
    pausado: grupos.pausados,
    concluido: grupos.concluidos,
    arquivado: grupos.arquivados,
  };
  for (const p of projetos) {
    if (p.id === atualId) grupos.atual = p;
    else grupo[p.status].push(p);
  }
  return grupos;
}

// ---------------------------------------------------------------------------
// Projeto atual (RF-PRO-03, 04, 08, D-018)

/**
 * O que gravar ao tocar na estrela de um projeto: ele vira o atual, ou, se já
 * era, ninguém fica atual. Null quando não há o que gravar (um projeto
 * encerrado não pode virar o atual). O status de nenhum dos dois muda.
 */
export function trocaPelaEstrela(
  tocado: { id: string; status: StatusProjeto },
  atualId: string | null,
): { projetoId: string | null } | null {
  if (tocado.id === atualId) return { projetoId: null };
  if (projetoEncerrado(tocado.status)) return null;
  return { projetoId: tocado.id };
}

/**
 * Mudar o status tira o destaque só ao concluir ou arquivar (RF-PRO-08,
 * decisões 3 e 4). Devolve true quando é preciso gravar uma troca para
 * nenhum.
 */
export function saiDoDestaque(
  projetoId: string,
  novoStatus: StatusProjeto,
  atualId: string | null,
): boolean {
  return projetoId === atualId && projetoEncerrado(novoStatus);
}

// ---------------------------------------------------------------------------
// Metas associadas (RF-PRO-07, 09)

type MetaComProjeto = {
  id: string;
  estado: "ativa" | "pausada" | "excluida";
  versoes: (Vigencia & { frequencia: string; projetoId: string | null })[];
};

/**
 * As metas ativas que hoje estão associadas ao projeto: a versão que vale de
 * hoje em diante aponta para ele. Versões antigas não contam, porque a
 * associação delas é só histórica, e uma meta de ocorrência única que já
 * passou também não.
 */
export function metasAtivasDoProjeto<M extends MetaComProjeto>(
  metas: M[],
  projetoId: string,
  hoje: DataCivil,
): M[] {
  return metas.filter((m) => {
    if (m.estado !== "ativa") return false;
    const v = versaoDeReferencia(m.versoes, hoje);
    if (!v || (v.vigenteAte !== null && v.vigenteAte < hoje)) return false;
    return v.projetoId === projetoId;
  });
}

/** As que entram na pergunta ao concluir ou arquivar: só as recorrentes. */
export function metasRecorrentesDoProjeto<M extends MetaComProjeto>(
  metas: M[],
  projetoId: string,
  hoje: DataCivil,
): M[] {
  return metasAtivasDoProjeto(metas, projetoId, hoje).filter(
    (m) => versaoDeReferencia(m.versoes, hoje)?.frequencia !== "unica",
  );
}

export type DestinoDasMetas = "manter" | "pausar_todas" | "escolher";

/**
 * Quais metas pausar ao concluir ou arquivar. Em "Escolher uma a uma", só as
 * marcadas que de fato são recorrentes ativas do projeto; nada vindo do
 * navegador passa direto.
 */
export function metasParaPausar(
  destino: DestinoDasMetas,
  recorrentes: string[],
  escolhidas: string[],
): string[] {
  if (destino === "pausar_todas") return recorrentes;
  if (destino === "escolher") {
    return recorrentes.filter((id) => escolhidas.includes(id));
  }
  return [];
}

// ---------------------------------------------------------------------------
// Excluir (RF-PRO-11, 12)

/**
 * Com metas associadas, em qualquer versão, excluir exige digitar o nome do
 * projeto. Espaços nas pontas e maiúsculas não contam.
 */
export function nomeConfere(digitado: string, nome: string): boolean {
  const normal = (t: string) => t.trim().toLocaleLowerCase("pt-BR");
  return normal(digitado) === normal(nome);
}
