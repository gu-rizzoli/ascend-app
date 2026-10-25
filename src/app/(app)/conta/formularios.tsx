"use client";

import { useActionState } from "react";

import { SENHA_MINIMA } from "@/domain/conta";
import { alterarEmail, alterarNome, alterarSenha } from "@/server/conta";
import { Botao } from "@/ui/botao";
import { Campo } from "@/ui/campo";

function Salvo({ texto }: { texto?: string }) {
  if (!texto) return null;
  return (
    <p role="status" className="text-sm text-green-700">
      {texto}
    </p>
  );
}

function Secao({
  titulo,
  children,
  acao,
}: {
  titulo: string;
  children: React.ReactNode;
  acao: (form: FormData) => void;
}) {
  return (
    <form
      action={acao}
      aria-label={titulo}
      noValidate
      className="flex flex-col gap-3 border-t border-neutral-200 pt-5"
    >
      <h2 className="font-semibold">{titulo}</h2>
      {children}
    </form>
  );
}

export function FormularioNome({ nome }: { nome: string }) {
  const [estado, acao, enviando] = useActionState(alterarNome, {});
  return (
    <Secao titulo="Nome" acao={acao}>
      <Campo
        rotulo="Nome"
        name="nome"
        autoComplete="name"
        required
        defaultValue={estado.valores?.nome ?? nome}
        erro={estado.erros?.nome}
      />
      <Salvo texto={estado.salvo} />
      <Botao type="submit" disabled={enviando}>
        {enviando ? "Salvando…" : "Salvar nome"}
      </Botao>
    </Secao>
  );
}

export function FormularioEmail({ email }: { email: string }) {
  const [estado, acao, enviando] = useActionState(alterarEmail, {});
  return (
    <Secao titulo="E-mail" acao={acao}>
      <Campo
        rotulo="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={estado.valores?.email ?? email}
        erro={estado.erros?.email}
      />
      <Campo
        rotulo="Senha atual"
        name="senhaAtual"
        type="password"
        autoComplete="current-password"
        required
        erro={estado.erros?.senhaAtual}
      />
      <Salvo texto={estado.salvo} />
      <Botao type="submit" disabled={enviando}>
        {enviando ? "Salvando…" : "Salvar e-mail"}
      </Botao>
    </Secao>
  );
}

export function FormularioSenha() {
  const [estado, acao, enviando] = useActionState(alterarSenha, {});
  return (
    <Secao titulo="Senha" acao={acao}>
      <Campo
        rotulo="Senha atual"
        name="senhaAtual"
        type="password"
        autoComplete="current-password"
        required
        erro={estado.erros?.senhaAtual}
      />
      <Campo
        rotulo="Nova senha"
        name="novaSenha"
        type="password"
        autoComplete="new-password"
        minLength={SENHA_MINIMA}
        required
        placeholder={`Pelo menos ${SENHA_MINIMA} caracteres`}
        erro={estado.erros?.novaSenha}
      />
      <Campo
        rotulo="Repita a nova senha"
        name="confirmacao"
        type="password"
        autoComplete="new-password"
        required
        erro={estado.erros?.confirmacao}
      />
      <Salvo texto={estado.salvo} />
      <Botao type="submit" disabled={enviando}>
        {enviando ? "Salvando…" : "Alterar senha"}
      </Botao>
    </Secao>
  );
}
