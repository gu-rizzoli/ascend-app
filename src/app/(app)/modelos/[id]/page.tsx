import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { apagarModelo } from "@/server/acoes-treinos";
import { exigirUsuario } from "@/server/sessao";
import { exerciciosDoUsuario, modeloDoUsuario } from "@/server/treinos";

import { ExcluirComConfirmacao } from "../../treinos/[id]/excluir";
import { FormularioModelo } from "../formulario";

export const metadata: Metadata = { title: "Modelo · Ascend" };

type Props = { params: Promise<{ id: string }> };

/**
 * Editar ou excluir um modelo. Nenhuma das duas coisas muda os treinos já
 * registrados com ele (D-045).
 */
export default async function PaginaModelo({ params }: Props) {
  const usuario = await exigirUsuario();
  const { id } = await params;
  const [m, catalogo] = await Promise.all([
    modeloDoUsuario(usuario.id, id),
    exerciciosDoUsuario(usuario.id),
  ]);
  if (!m) notFound();

  return (
    <FormularioModelo
      titulo="Editar modelo"
      modeloId={m.id}
      catalogo={catalogo}
      inicial={{
        nome: m.nome,
        observacao: m.observacao ?? "",
        exercicios: m.exercicios.map((e) => ({
          exercicioId: e.exercicioId,
          nome: e.nome,
          seriesSugeridas: String(e.seriesSugeridas),
          repsMin: String(e.repsMin),
          repsMax: e.repsMax === null ? "" : String(e.repsMax),
        })),
      }}
      acoes={
        <>
          <Link
            href={`/treinos/novo?modelo=${m.id}`}
            className="rounded-lg border border-neutral-300 px-4 py-3 text-center font-medium"
          >
            Registrar treino com este modelo
          </Link>
          <ExcluirComConfirmacao
            acao={apagarModelo}
            campo="modeloId"
            id={m.id}
            pergunta={`Excluir o modelo “${m.nome}”?`}
            aviso="Os treinos já registrados com ele continuam iguais."
          />
        </>
      }
    />
  );
}
