import type { Metadata } from "next";

import { sair } from "@/server/conta";
import { exigirUsuario } from "@/server/sessao";
import { EscolhaDaAparencia } from "@/ui/aparencia";

import {
  FormularioEmail,
  FormularioNome,
  FormularioSenha,
} from "./formularios";

export const metadata: Metadata = { title: "Conta · Ascend" };

/** Nome, e-mail, senha, aparência e sair (11.6, RF-GLO-11). */
export default async function PaginaConta() {
  const usuario = await exigirUsuario();

  return (
    <div className="flex flex-col gap-6 md:max-w-md">
      <h1 className="text-2xl font-bold tracking-tight">Conta</h1>
      <FormularioNome nome={usuario.nome} />
      <FormularioEmail email={usuario.email} />
      <FormularioSenha />
      <EscolhaDaAparencia />
      <form action={sair} className="border-t border-neutral-200 pt-5">
        <button
          type="submit"
          className="w-full rounded-lg border border-neutral-300 px-4 py-3 font-medium"
        >
          Sair
        </button>
      </form>
    </div>
  );
}
