"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { exercicio } from "@/db/schema";
import { hoje } from "@/domain/datas";
import {
  esquemaNomeExercicio,
  validarModelo,
  validarTreino,
  type ModeloDoFormulario,
  type TreinoDoFormulario,
} from "@/domain/treinos";

import { exigirUsuario } from "./sessao";
import {
  criarExercicio,
  excluirModelo,
  excluirTreino,
  exercicioDoUsuario,
  exercicioUsado,
  gravarModelo,
  gravarTreino,
  renomearExercicio,
  type ResultadoExercicio,
} from "./treinos";

/**
 * Ações de Treinos (entrega 6, docs/produto/treinos.md). Todas conferem o
 * dono. Os formulários de treino e de modelo chegam como JSON num campo só,
 * porque são listas de listas.
 */

function texto(form: FormData, campo: string): string {
  const valor = form.get(campo);
  return typeof valor === "string" ? valor : "";
}

const uuidOuNull = (valor: string) =>
  z.uuid().safeParse(valor).success ? valor : null;

const esquemaSerie = z.object({
  repeticoes: z.string(),
  carga: z.string(),
  observacao: z.string(),
});

const esquemaTreinoDoFormulario = z.object({
  nome: z.string(),
  data: z.string(),
  observacao: z.string(),
  modeloId: z.string().nullable(),
  exercicios: z.array(
    z.object({
      exercicioId: z.string(),
      nome: z.string(),
      series: z.array(esquemaSerie),
    }),
  ),
});

const esquemaModeloDoFormulario = z.object({
  nome: z.string(),
  observacao: z.string(),
  exercicios: z.array(
    z.object({
      exercicioId: z.string(),
      nome: z.string(),
      seriesSugeridas: z.string(),
      repsMin: z.string(),
      repsMax: z.string(),
    }),
  ),
});

function lerJson<T>(form: FormData, esquema: z.ZodType<T>): T | null {
  try {
    const r = esquema.safeParse(JSON.parse(texto(form, "dados")));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

export type EstadoFormulario = { erro?: string };

// ---------------------------------------------------------------------------
// Exercícios (RF-TRE-01 a 05)

/**
 * Cria um exercício pelo nome, no catálogo ou durante o registro, sem sair
 * dele (RF-TRE-03). Um nome que já existe devolve o exercício existente.
 */
export async function novoExercicio(nome: string): Promise<ResultadoExercicio> {
  const usuario = await exigirUsuario();
  const r = esquemaNomeExercicio.safeParse(nome);
  if (!r.success) {
    return { ok: false, erro: r.error.issues[0]?.message ?? "Nome inválido." };
  }
  const resultado = await criarExercicio(db(), usuario.id, r.data);
  revalidatePath("/", "layout");
  return resultado;
}

export async function renomear(
  _anterior: EstadoFormulario,
  form: FormData,
): Promise<EstadoFormulario> {
  const usuario = await exigirUsuario();
  const exercicioId = uuidOuNull(texto(form, "exercicioId"));
  if (!exercicioId) return { erro: "Exercício não encontrado." };
  const r = esquemaNomeExercicio.safeParse(texto(form, "nome"));
  if (!r.success) return { erro: r.error.issues[0]?.message };
  const erro = await renomearExercicio(usuario.id, exercicioId, r.data);
  if (erro) return { erro };
  revalidatePath("/", "layout");
  return {};
}

/** Arquivar tira da busca; desarquivar devolve (9.4, decisão 6). */
export async function arquivarExercicio(form: FormData): Promise<void> {
  const usuario = await exigirUsuario();
  const exercicioId = uuidOuNull(texto(form, "exercicioId"));
  if (exercicioId) {
    await db()
      .update(exercicio)
      .set({ arquivadoEm: form.get("desarquivar") ? null : new Date() })
      .where(
        and(eq(exercicio.id, exercicioId), eq(exercicio.usuarioId, usuario.id)),
      );
  }
  revalidatePath("/", "layout");
}

/** Só um exercício nunca usado pode ser excluído (RF-TRE-04). */
export async function excluirExercicio(form: FormData): Promise<void> {
  const usuario = await exigirUsuario();
  const exercicioId = uuidOuNull(texto(form, "exercicioId"));
  if (!exercicioId) redirect("/exercicios");

  const excluido = await db().transaction(async (tx) => {
    const e = await exercicioDoUsuario(usuario.id, exercicioId, tx);
    if (!e || (await exercicioUsado(e.id, tx))) return false;
    await tx.delete(exercicio).where(eq(exercicio.id, e.id));
    return true;
  });

  revalidatePath("/", "layout");
  redirect(excluido ? "/exercicios" : `/exercicios/${exercicioId}`);
}

// ---------------------------------------------------------------------------
// Treinos (RF-TRE-08 a 18)

/** Registra ou edita um treino. Tudo de uma vez, numa transação (9.9). */
export async function salvarTreino(
  _anterior: EstadoFormulario,
  form: FormData,
): Promise<EstadoFormulario> {
  const usuario = await exigirUsuario();
  const treinoId = uuidOuNull(texto(form, "treinoId"));
  const dados: TreinoDoFormulario | null = lerJson(
    form,
    esquemaTreinoDoFormulario,
  );
  if (!dados) return { erro: "Não foi possível ler o treino. Tente de novo." };

  const r = validarTreino(dados, hoje());
  if (!r.ok) return { erro: r.erro };

  const id = await db().transaction((tx) =>
    gravarTreino(tx, usuario.id, r.treino, treinoId),
  );
  if (!id) return { erro: "Treino ou exercício não encontrado." };

  revalidatePath("/", "layout");
  redirect(
    r.descartadas > 0
      ? `/treinos/${id}?descartadas=${r.descartadas}`
      : `/treinos/${id}`,
  );
}

export async function apagarTreino(form: FormData): Promise<void> {
  const usuario = await exigirUsuario();
  const treinoId = uuidOuNull(texto(form, "treinoId"));
  if (treinoId) await excluirTreino(usuario.id, treinoId);
  revalidatePath("/", "layout");
  redirect("/treinos");
}

// ---------------------------------------------------------------------------
// Modelos (RF-TRE-06, 07)

export async function salvarModelo(
  _anterior: EstadoFormulario,
  form: FormData,
): Promise<EstadoFormulario> {
  const usuario = await exigirUsuario();
  const modeloId = uuidOuNull(texto(form, "modeloId"));
  const dados: ModeloDoFormulario | null = lerJson(
    form,
    esquemaModeloDoFormulario,
  );
  if (!dados) return { erro: "Não foi possível ler o modelo. Tente de novo." };

  const r = validarModelo(dados);
  if (!r.ok) return { erro: r.erro };

  const id = await db().transaction((tx) =>
    gravarModelo(tx, usuario.id, r.modelo, modeloId),
  );
  if (!id) return { erro: "Modelo ou exercício não encontrado." };

  revalidatePath("/", "layout");
  redirect("/modelos");
}

export async function apagarModelo(form: FormData): Promise<void> {
  const usuario = await exigirUsuario();
  const modeloId = uuidOuNull(texto(form, "modeloId"));
  if (modeloId) await excluirModelo(usuario.id, modeloId);
  revalidatePath("/", "layout");
  redirect("/modelos");
}
