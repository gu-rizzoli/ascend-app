"use client";

import { useActionState } from "react";

import { entrar } from "@/server/conta";
import { Botao } from "@/ui/botao";
import { Campo } from "@/ui/campo";

export function FormularioEntrar() {
  const [estado, acao, enviando] = useActionState(entrar, {});

  return (
    <form action={acao} className="flex flex-col gap-4" noValidate>
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
        autoComplete="current-password"
        required
        erro={estado.erros?.senha}
      />
      {estado.mensagem && (
        <p role="alert" className="text-sm text-red-700">
          {estado.mensagem}
        </p>
      )}
      <Botao type="submit" disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </Botao>
    </form>
  );
}
