import type { Metadata } from "next";
import Link from "next/link";

import { hoje } from "@/domain/datas";
import { projetoAtualId } from "@/server/projetos";
import { exigirUsuario } from "@/server/sessao";

import { FormularioProjeto } from "../formulario";

export const metadata: Metadata = { title: "Novo projeto · Ascend" };

/**
 * Criar projeto (RF-PRO-01). Vem Em andamento, começando hoje, e já marcado
 * como atual se ainda não houver um (projetos.md, decisões 1 e 2).
 */
export default async function PaginaNovoProjeto() {
  const usuario = await exigirUsuario();
  const atual = await projetoAtualId(usuario.id);

  return (
    <>
      <header className="flex items-center gap-2">
        <Link
          href="/projetos"
          aria-label="Voltar"
          className="-ml-2 flex size-10 items-center justify-center rounded-full text-2xl text-neutral-600 hover:bg-neutral-100"
        >
          ‹
        </Link>
        <h1 className="text-xl font-semibold">Novo projeto</h1>
      </header>
      <FormularioProjeto
        modo="criar"
        semAtual={atual === null}
        voltar="/projetos"
        inicial={{
          nome: "",
          descricao: "",
          status: "em_andamento",
          proximoPasso: "",
          dataInicio: hoje(),
          prazo: "",
        }}
      />
    </>
  );
}
