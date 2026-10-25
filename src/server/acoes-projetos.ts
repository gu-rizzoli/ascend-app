"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { projeto } from "@/db/schema";
import { errosPorCampo, type ErrosDeCampo } from "@/domain/conta";
import { hoje } from "@/domain/datas";
import {
  esquemaProjeto,
  lerProximoPasso,
  metasParaPausar,
  metasRecorrentesDoProjeto,
  nomeConfere,
  saiDoDestaque,
  STATUS_ABERTOS,
  trocaPelaEstrela,
  type CamposProjeto,
  type DestinoDasMetas,
} from "@/domain/projetos";

import { fecharSePreciso } from "./fechamento";
import { metasDoUsuario } from "./metas";
import {
  gravarTroca,
  projetoAtualId,
  projetoDoUsuario,
  temMetasAssociadas,
  travarUsuario,
} from "./projetos";
import { pausar } from "./recorrencia";
import { exigirUsuario } from "./sessao";

/**
 * Ações de Projetos (entrega 5, docs/produto/projetos.md). Todas conferem o
 * dono. O projeto atual aparece em Hoje, então quem mexe nele descarta as
 * cópias de todas as telas já carregadas.
 */

function texto(form: FormData, campo: string): string {
  const valor = form.get(campo);
  return typeof valor === "string" ? valor : "";
}

const uuidOuNull = (valor: string) =>
  z.uuid().safeParse(valor).success ? valor : null;

function camposDoFormulario(form: FormData): CamposProjeto {
  return {
    nome: texto(form, "nome"),
    descricao: texto(form, "descricao"),
    status: texto(form, "status"),
    proximoPasso: texto(form, "proximoPasso"),
    dataInicio: texto(form, "dataInicio"),
    prazo: texto(form, "prazo"),
  };
}

export type EstadoProjeto = {
  erros?: ErrosDeCampo<CamposProjeto>;
  erro?: string;
  // Devolvido para o formulário não apagar o que a pessoa digitou.
  valores?: CamposProjeto & { tornarAtual?: boolean };
};

// ---------------------------------------------------------------------------
// Criar e editar (RF-PRO-01, 05, 06)

/** Cria 1 projeto e, se "Tornar projeto atual" estiver marcado, 1 troca. */
export async function criarProjeto(
  _anterior: EstadoProjeto,
  form: FormData,
): Promise<EstadoProjeto> {
  const usuario = await exigirUsuario();
  const valores = camposDoFormulario(form);
  const tornarAtual = form.get("tornarAtual") === "on";
  const resultado = esquemaProjeto().safeParse(valores);
  if (!resultado.success) {
    return {
      erros: errosPorCampo(resultado.error),
      valores: { ...valores, tornarAtual },
    };
  }
  const novo = resultado.data;

  const id = await db().transaction(async (tx) => {
    const [criado] = await tx
      .insert(projeto)
      .values({ usuarioId: usuario.id, ...novo })
      .returning({ id: projeto.id });
    if (tornarAtual) {
      await travarUsuario(tx, usuario.id);
      await gravarTroca(tx, usuario.id, criado!.id, hoje());
    }
    return criado!.id;
  });

  revalidatePath("/", "layout");
  redirect(`/projetos/${id}`);
}

/**
 * Salva nome, descrição, status, próximo passo e datas. Mudar de um status
 * encerrado para um aberto reabre o projeto, sem reativar metas (decisão 7).
 */
export async function editarProjeto(
  _anterior: EstadoProjeto,
  form: FormData,
): Promise<EstadoProjeto> {
  const usuario = await exigirUsuario();
  const projetoId = uuidOuNull(texto(form, "projetoId"));
  const atual = projetoId
    ? await projetoDoUsuario(usuario.id, projetoId)
    : null;
  if (!atual) return { erro: "Projeto não encontrado." };

  const valores = camposDoFormulario(form);
  const resultado = esquemaProjeto(atual.status).safeParse(valores);
  if (!resultado.success) {
    return { erros: errosPorCampo(resultado.error), valores };
  }
  await db()
    .update(projeto)
    .set({ ...resultado.data, atualizadoEm: new Date() })
    .where(and(eq(projeto.id, atual.id), eq(projeto.usuarioId, usuario.id)));

  revalidatePath("/", "layout");
  redirect(`/projetos/${atual.id}`);
}

// ---------------------------------------------------------------------------
// Projeto atual e próximo passo (RF-PRO-03, 04, 05)

/**
 * A estrela: transfere o destaque para este projeto, ou o remove se ele já
 * era o atual. Cada toque grava uma troca (D-053).
 */
export async function alternarProjetoAtual(form: FormData): Promise<void> {
  const usuario = await exigirUsuario();
  const projetoId = uuidOuNull(texto(form, "projetoId"));
  if (projetoId) {
    await db().transaction(async (tx) => {
      await travarUsuario(tx, usuario.id);
      const p = await projetoDoUsuario(usuario.id, projetoId, tx);
      if (!p) return;
      const troca = trocaPelaEstrela(p, await projetoAtualId(usuario.id, tx));
      if (troca) await gravarTroca(tx, usuario.id, troca.projetoId, hoje());
    });
  }
  revalidatePath("/", "layout");
}

/** Próximo passo editado direto na lista ou em Hoje. Sem histórico (D-019). */
export async function definirProximoPasso(
  projetoId: string,
  proximoPasso: string,
): Promise<void> {
  const usuario = await exigirUsuario();
  if (uuidOuNull(projetoId) && typeof proximoPasso === "string") {
    await db()
      .update(projeto)
      .set({
        proximoPasso: lerProximoPasso(proximoPasso),
        atualizadoEm: new Date(),
      })
      .where(and(eq(projeto.id, projetoId), eq(projeto.usuarioId, usuario.id)));
  }
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Concluir, arquivar e reabrir (RF-PRO-02, 08, 09, 10)

const DESTINOS: DestinoDasMetas[] = ["manter", "pausar_todas", "escolher"];

/**
 * Conclui ou arquiva. Se era o atual, grava uma troca para nenhum. Pausa as
 * metas recorrentes que a pessoa escolheu, como a pausa de Metas. A
 * associação das metas com o projeto continua, porque ela é histórica. Tudo
 * numa transação.
 */
export async function encerrarProjeto(form: FormData): Promise<void> {
  const usuario = await exigirUsuario();
  const dataHoje = hoje();
  const projetoId = uuidOuNull(texto(form, "projetoId"));
  const status = texto(form, "status");
  const destino = DESTINOS.find((d) => d === texto(form, "destino"));
  if (!projetoId || (status !== "concluido" && status !== "arquivado")) {
    redirect("/projetos");
  }

  // A pausa de Metas parte do estado final dos dias passados (11.5).
  await fecharSePreciso(usuario, dataHoje);
  const recorrentes = metasRecorrentesDoProjeto(
    await metasDoUsuario(usuario.id),
    projetoId,
    dataHoje,
  ).map((m) => m.id);
  const pausarIds = metasParaPausar(
    destino ?? "manter",
    recorrentes,
    form.getAll("pausar").map(String),
  );

  await db().transaction(async (tx) => {
    await travarUsuario(tx, usuario.id);
    const p = await projetoDoUsuario(usuario.id, projetoId, tx);
    // Um concluído ainda pode ser arquivado; o contrário é reabrir antes.
    if (!p || p.status === status || p.status === "arquivado") return;
    await tx
      .update(projeto)
      .set({ status, atualizadoEm: new Date() })
      .where(eq(projeto.id, p.id));
    if (saiDoDestaque(p.id, status, await projetoAtualId(usuario.id, tx))) {
      await gravarTroca(tx, usuario.id, null, dataHoje);
    }
    for (const metaId of pausarIds) {
      await pausar(tx, usuario.id, metaId, dataHoje);
    }
  });

  revalidatePath("/", "layout");
  redirect(`/projetos/${projetoId}`);
}

/** Volta um projeto encerrado para um status aberto. Metas pausadas ficam. */
export async function reabrirProjeto(form: FormData): Promise<void> {
  const usuario = await exigirUsuario();
  const projetoId = uuidOuNull(texto(form, "projetoId"));
  const status = STATUS_ABERTOS.find((s) => s === texto(form, "status"));
  if (projetoId && status) {
    await db()
      .update(projeto)
      .set({ status, atualizadoEm: new Date() })
      .where(and(eq(projeto.id, projetoId), eq(projeto.usuarioId, usuario.id)));
  }
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Excluir (RF-PRO-11, 12)

export type EstadoExclusao = { erro?: string };

/**
 * Apaga o projeto. Com metas associadas, mesmo só no passado, exige o nome
 * digitado. O `ON DELETE SET NULL` tira a associação das versões das metas e
 * das trocas: se ele era o atual, a última troca passa a ser "nenhum".
 */
export async function excluirProjeto(
  _anterior: EstadoExclusao,
  form: FormData,
): Promise<EstadoExclusao> {
  const usuario = await exigirUsuario();
  const projetoId = uuidOuNull(texto(form, "projetoId"));
  if (!projetoId) return { erro: "Projeto não encontrado." };

  const erro = await db().transaction(async (tx) => {
    await travarUsuario(tx, usuario.id);
    const p = await projetoDoUsuario(usuario.id, projetoId, tx);
    if (!p) return "Projeto não encontrado.";
    if (
      (await temMetasAssociadas(p.id, tx)) &&
      !nomeConfere(texto(form, "confirmacao"), p.nome)
    ) {
      return "Digite o nome do projeto para confirmar.";
    }
    await tx.delete(projeto).where(eq(projeto.id, p.id));
    return null;
  });
  if (erro) return { erro };

  revalidatePath("/", "layout");
  redirect("/projetos");
}
