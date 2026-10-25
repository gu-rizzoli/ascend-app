import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { hoje } from "@/domain/datas";
import { treinoDoModelo, type TreinoDoFormulario } from "@/domain/treinos";
import { exigirUsuario } from "@/server/sessao";
import {
  exerciciosDoUsuario,
  modeloDoUsuario,
  modelosDoUsuario,
} from "@/server/treinos";

import { FormularioTreino } from "../formulario";

export const metadata: Metadata = { title: "Registrar treino · Ascend" };

type Props = {
  searchParams: Promise<{ modelo?: string; livre?: string }>;
};

/**
 * Registrar treino (RF-TRE-08, 09). Primeiro escolhe entre um modelo e o
 * treino livre; depois, o formulário. A partir do modelo, ele vem com os
 * exercícios e as séries sugeridas em branco (D-033).
 */
export default async function PaginaNovoTreino({ searchParams }: Props) {
  const usuario = await exigirUsuario();
  const dataHoje = hoje();
  const { modelo: modeloId, livre } = await searchParams;

  if (modeloId || livre) {
    const [catalogo, modelo] = await Promise.all([
      exerciciosDoUsuario(usuario.id),
      modeloId ? modeloDoUsuario(usuario.id, modeloId) : null,
    ]);
    if (modeloId && !modelo) notFound();
    const inicial: TreinoDoFormulario = modelo
      ? treinoDoModelo(modelo, dataHoje)
      : {
          nome: "",
          data: dataHoje,
          observacao: "",
          modeloId: null,
          exercicios: [],
        };
    return (
      <FormularioTreino
        titulo="Registrar treino"
        inicial={inicial}
        catalogo={catalogo}
        hoje={dataHoje}
        voltar="/treinos/novo"
      />
    );
  }

  const modelos = await modelosDoUsuario(usuario.id);
  return (
    <>
      <header className="flex items-center gap-2">
        <Link
          href="/treinos"
          aria-label="Voltar"
          className="-ml-2 flex size-10 items-center justify-center rounded-full text-2xl text-neutral-600 hover:bg-neutral-100"
        >
          ‹
        </Link>
        <h1 className="text-xl font-semibold">Registrar treino</h1>
      </header>

      <Link
        href="/treinos/novo?livre=1"
        className="mt-4 flex flex-col rounded-lg border border-neutral-300 px-4 py-3"
      >
        <span className="font-medium">Treino livre</span>
        <span className="text-sm text-neutral-500">
          Sem modelo: escolha os exercícios na hora.
        </span>
      </Link>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-neutral-500">
          A partir de um modelo
        </h2>
        {modelos.length > 0 ? (
          <ul className="bg-superficie mt-1 divide-y divide-neutral-200 rounded-2xl px-4 shadow-sm">
            {modelos.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/treinos/novo?modelo=${m.id}`}
                  className="flex items-baseline justify-between gap-2 py-3"
                >
                  <span className="min-w-0 truncate">{m.nome}</span>
                  <span className="shrink-0 text-sm text-neutral-500">
                    {m.exercicios}{" "}
                    {m.exercicios === 1 ? "exercício" : "exercícios"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-neutral-500">
            Você ainda não tem modelos.{" "}
            <Link href="/modelos/novo" className="underline">
              Criar um modelo
            </Link>
          </p>
        )}
      </section>
    </>
  );
}
