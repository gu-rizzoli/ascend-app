"use server";

import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { usuario } from "@/db/schema";
import {
  errosPorCampo,
  esquemaCadastro,
  esquemaEntrada,
  type DadosCadastro,
  type DadosEntrada,
  type ErrosDeCampo,
} from "@/domain/conta";
import { hoje, somarDias } from "@/domain/datas";

import { conferirSenha, gerarHashDeSenha } from "./senha";
import { encerrarSessao, iniciarSessao } from "./sessao";
import { semearExercicios } from "./treinos";

export type EstadoFormulario<T> = {
  erros?: ErrosDeCampo<T>;
  mensagem?: string;
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
