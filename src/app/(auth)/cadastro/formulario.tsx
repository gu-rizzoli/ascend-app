"use client";

import { useActionState } from "react";

import { SENHA_MINIMA } from "@/domain/conta";
import { cadastrar } from "@/server/conta";
import { Botao } from "@/ui/botao";
import { Campo } from "@/ui/campo";

export function FormularioCadastro() {
  const [estado, acao, enviando] = useActionState(cadastrar, {});

  return (
    <form action={acao} className="flex flex-col gap-4" noValidate>
      <Campo
        rotulo="Nome"
        name="nome"
        autoComplete="name"
        required
        defaultValue={estado.valores?.nome}
        erro={estado.erros?.nome}
      />
      <Campo
        rotulo="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={estado.valores?.email}
        erro={estado.erros?.email}
      />
      <Campo
        rotulo="Senha"
        name="senha"
        type="password"
        autoComplete="new-password"
        minLength={SENHA_MINIMA}
        required
        placeholder={`Pelo menos ${SENHA_MINIMA} caracteres`}
        erro={estado.erros?.senha}
      />
      <Botao type="submit" disabled={enviando}>
        {enviando ? "Criando…" : "Criar conta"}
      </Botao>
    </form>
  );
}
