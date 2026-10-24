import type { Metadata } from "next";

import { sair } from "@/server/conta";
import { exigirUsuario } from "@/server/sessao";

export const metadata: Metadata = { title: "Conta · Ascend" };

// Por enquanto só mostra os dados e permite sair. Alterar nome, e-mail e
// senha (RF-GLO-11) fica para a entrega 8.
export default async function PaginaConta() {
  const usuario = await exigirUsuario();

  return (
    <>
      <h1 className="text-2xl font-semibold">Conta</h1>
      <dl className="mt-6 flex flex-col gap-4">
        <div>
          <dt className="text-sm text-neutral-500">Nome</dt>
          <dd className="text-base">{usuario.nome}</dd>
        </div>
        <div>
          <dt className="text-sm text-neutral-500">E-mail</dt>
          <dd className="text-base">{usuario.email}</dd>
        </div>
      </dl>
      <form action={sair} className="mt-8">
        <button
          type="submit"
          className="w-full rounded-lg border border-neutral-300 px-4 py-3 font-medium"
        >
          Sair
        </button>
      </form>
    </>
  );
}
