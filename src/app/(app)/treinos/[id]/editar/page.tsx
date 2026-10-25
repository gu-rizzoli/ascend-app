import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { hoje } from "@/domain/datas";
import { formatarCarga } from "@/domain/treinos";
import { exigirUsuario } from "@/server/sessao";
import { exerciciosDoUsuario, treinoDoUsuario } from "@/server/treinos";

import { FormularioTreino } from "../../formulario";

export const metadata: Metadata = { title: "Editar treino · Ascend" };

type Props = { params: Promise<{ id: string }> };

/** Editar treino (RF-TRE-17): o mesmo formulário do registro. */
export default async function PaginaEditarTreino({ params }: Props) {
  const usuario = await exigirUsuario();
  const { id } = await params;
  const [t, catalogo] = await Promise.all([
    treinoDoUsuario(usuario.id, id),
    exerciciosDoUsuario(usuario.id),
  ]);
  if (!t) notFound();

  return (
    <FormularioTreino
      titulo="Editar treino"
      treinoId={t.id}
      catalogo={catalogo}
      hoje={hoje()}
      voltar={`/treinos/${t.id}`}
      inicial={{
        nome: t.nome ?? "",
        data: t.data,
        observacao: t.observacao ?? "",
        modeloId: t.modelo?.id ?? null,
        exercicios: t.exercicios.map((e) => ({
          exercicioId: e.exercicioId,
          nome: e.nome,
          series: e.series.map((s) => ({
            repeticoes: String(s.repeticoes),
            carga: s.cargaKg === null ? "" : formatarCarga(s.cargaKg),
            observacao: s.observacao ?? "",
          })),
        })),
      }}
    />
  );
}
