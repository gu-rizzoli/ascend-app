import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { projetoDoUsuario } from "@/server/projetos";
import { exigirUsuario } from "@/server/sessao";

import { FormularioProjeto } from "../../formulario";

export const metadata: Metadata = { title: "Editar projeto · Ascend" };

type Props = { params: Promise<{ id: string }> };

export default async function PaginaEditarProjeto({ params }: Props) {
  const usuario = await exigirUsuario();
  const { id } = await params;
  const p = await projetoDoUsuario(usuario.id, id);
  if (!p) notFound();
  const voltar = `/projetos/${p.id}`;

  return (
    <>
      <header className="flex items-center gap-2">
        <Link
          href={voltar}
          aria-label="Voltar"
          className="-ml-2 flex size-10 items-center justify-center rounded-full text-2xl text-neutral-600 hover:bg-neutral-100"
        >
          ‹
        </Link>
        <h1 className="text-xl font-semibold">Editar projeto</h1>
      </header>
      <FormularioProjeto
        modo="editar"
        projetoId={p.id}
        statusAtual={p.status}
        voltar={voltar}
        inicial={{
          nome: p.nome,
          descricao: p.descricao ?? "",
          status: p.status,
          proximoPasso: p.proximoPasso ?? "",
          dataInicio: p.dataInicio,
          prazo: p.prazo ?? "",
        }}
      />
    </>
  );
}
