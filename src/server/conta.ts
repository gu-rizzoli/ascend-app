"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { sessao, usuario } from "@/db/schema";
import {
  errosPorCampo,
  esquemaCadastro,
  esquemaEmail,
  esquemaEntrada,
  esquemaNome,
  esquemaSenha,
  type DadosCadastro,
  type DadosEmail,
  type DadosEntrada,
  type DadosNome,
  type DadosSenha,
  type ErrosDeCampo,
} from "@/domain/conta";
import { hoje, somarDias } from "@/domain/datas";

import { conferirSenha, gerarHashDeSenha } from "./senha";
import { encerrarSessao, exigirUsuario, iniciarSessao } from "./sessao";
import { semearExercicios } from "./treinos";

export type EstadoFormulario<T> = {
  erros?: ErrosDeCampo<T>;
  mensagem?: string;
  // Aviso de sucesso, para o formulário dizer que salvou.
  salvo?: string;
  // Devolvido para o formulário não apagar o que a pessoa digitou.
  valores?: Partial<Record<keyof T, string>>;
};

function texto(form: FormData, campo: string): string {
  const valor = form.get(campo);
  return typeof valor === "string" ? valor : "";
}

export async function cadastrar(
  _anterior: EstadoFormulario<DadosCadastro>,
  form: FormData,
): Promise<EstadoFormulario<DadosCadastro>> {
  const valores = { nome: texto(form, "nome"), email: texto(form, "email") };
  const resultado = esquemaCadastro.safeParse({
    ...valores,
    senha: texto(form, "senha"),
  });
  if (!resultado.success) {
    return { erros: errosPorCampo(resultado.error), valores };
  }
  const { nome, email, senha } = resultado.data;

  const senhaHash = await gerarHashDeSenha(senha);
  // A conta nasce com o catálogo inicial de exercícios (treinos.md, 16).
  const novo = await db().transaction(async (tx) => {
    const [criado] = await tx
      .insert(usuario)
      .values({ nome, email, senhaHash, fechadoAte: somarDias(hoje(), -1) })
      .onConflictDoNothing()
      .returning({ id: usuario.id });
    if (criado) await semearExercicios(tx, criado.id);
    return criado;
  });
  if (!novo) {
    return {
      erros: { email: "Já existe uma conta com este e-mail." },
      valores,
    };
  }

  await iniciarSessao(novo.id);
  redirect("/hoje");
}

export async function entrar(
  _anterior: EstadoFormulario<DadosEntrada>,
  form: FormData,
): Promise<EstadoFormulario<DadosEntrada>> {
  const valores = { email: texto(form, "email") };
  const resultado = esquemaEntrada.safeParse({
    ...valores,
    senha: texto(form, "senha"),
  });
  if (!resultado.success) {
    return { erros: errosPorCampo(resultado.error), valores };
  }
  const { email, senha } = resultado.data;

  const [encontrado] = await db()
    .select({ id: usuario.id, senhaHash: usuario.senhaHash })
    .from(usuario)
    .where(eq(sql`lower(${usuario.email})`, email))
    .limit(1);

  if (!(await conferirSenha(encontrado?.senhaHash, senha)) || !encontrado) {
    return { mensagem: "E-mail ou senha incorretos.", valores };
  }

  await iniciarSessao(encontrado.id);
  redirect("/hoje");
}

export async function sair(): Promise<void> {
  await encerrarSessao();
  redirect("/entrar");
}

// Configurações mínimas (11.6, RF-GLO-11). Cada formulário de /conta salva
// uma coisa só.

async function senhaConfere(usuarioId: string, senha: string) {
  const [dono] = await db()
    .select({ senhaHash: usuario.senhaHash })
    .from(usuario)
    .where(eq(usuario.id, usuarioId));
  return conferirSenha(dono?.senhaHash, senha);
}

const SENHA_ERRADA = "Senha incorreta.";

/** Violação do índice único (e-mail já usado por outra conta). */
function emailRepetido(erro: unknown): boolean {
  const codigo = (e: unknown) =>
    typeof e === "object" && e !== null && "code" in e ? e.code : undefined;
  return (
    codigo(erro) === "23505" ||
    (erro instanceof Error && codigo(erro.cause) === "23505")
  );
}

export async function alterarNome(
  _anterior: EstadoFormulario<DadosNome>,
  form: FormData,
): Promise<EstadoFormulario<DadosNome>> {
  const atual = await exigirUsuario();
  const valores = { nome: texto(form, "nome") };
  const resultado = esquemaNome.safeParse(valores);
  if (!resultado.success) {
    return { erros: errosPorCampo(resultado.error), valores };
  }

  await db()
    .update(usuario)
    .set({ nome: resultado.data.nome })
    .where(eq(usuario.id, atual.id));
  // A inicial do nome aparece no topo de todas as telas.
  revalidatePath("/", "layout");
  return { salvo: "Nome salvo." };
}

export async function alterarEmail(
  _anterior: EstadoFormulario<DadosEmail>,
  form: FormData,
): Promise<EstadoFormulario<DadosEmail>> {
  const atual = await exigirUsuario();
  const valores = { email: texto(form, "email") };
  const resultado = esquemaEmail.safeParse({
    ...valores,
    senhaAtual: texto(form, "senhaAtual"),
  });
  if (!resultado.success) {
    return { erros: errosPorCampo(resultado.error), valores };
  }
  const { email, senhaAtual } = resultado.data;
  if (!(await senhaConfere(atual.id, senhaAtual))) {
    return { erros: { senhaAtual: SENHA_ERRADA }, valores };
  }

  try {
    await db().update(usuario).set({ email }).where(eq(usuario.id, atual.id));
  } catch (erro) {
    if (!emailRepetido(erro)) throw erro;
    return {
      erros: { email: "Já existe uma conta com este e-mail." },
      valores,
    };
  }
  revalidatePath("/conta");
  return { salvo: "E-mail salvo. Use o novo para entrar." };
}

export async function alterarSenha(
  _anterior: EstadoFormulario<DadosSenha>,
  form: FormData,
): Promise<EstadoFormulario<DadosSenha>> {
  const atual = await exigirUsuario();
  const resultado = esquemaSenha.safeParse({
    senhaAtual: texto(form, "senhaAtual"),
    novaSenha: texto(form, "novaSenha"),
    confirmacao: texto(form, "confirmacao"),
  });
  if (!resultado.success) return { erros: errosPorCampo(resultado.error) };
  const { senhaAtual, novaSenha } = resultado.data;
  if (!(await senhaConfere(atual.id, senhaAtual))) {
    return { erros: { senhaAtual: SENHA_ERRADA } };
  }

  const senhaHash = await gerarHashDeSenha(novaSenha);
  // Quem estava logado com a senha antiga em outro aparelho sai; este
  // aparelho continua entrando.
  await db().transaction(async (tx) => {
    await tx.update(usuario).set({ senhaHash }).where(eq(usuario.id, atual.id));
    await tx
      .delete(sessao)
      .where(
        and(eq(sessao.usuarioId, atual.id), ne(sessao.id, atual.sessaoId)),
      );
  });
  return {
    salvo: "Senha alterada. Os outros aparelhos precisam entrar de novo.",
  };
}
