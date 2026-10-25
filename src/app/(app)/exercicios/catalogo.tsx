"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { buscarExercicios } from "@/domain/treinos";

import {
  EscolherExercicio,
  type ExercicioDoCatalogo,
} from "../treinos/escolher-exercicio";

/**
 * O catálogo com busca (RF-TRE-01, 02). "Novo exercício" usa a mesma busca:
 * os parecidos aparecem antes de criar, e o nome igual não vira outro.
 */
export function Catalogo({
  exercicios,
}: {
  exercicios: ExercicioDoCatalogo[];
}) {
  const router = useRouter();
  const [criando, setCriando] = useState(false);
  const [busca, setBusca] = useState("");
  const achados = buscarExercicios(busca, exercicios);

  if (criando) {
    return (
      <div className="mt-4">
        <EscolherExercicio
          catalogo={exercicios}
          rotulo="Nome do exercício"
          aoFechar={() => setCriando(false)}
          aoEscolher={(e) => router.push(`/exercicios/${e.id}`)}
        />
      </div>
    );
  }

  return (
    <>
      <div className="mt-4 flex gap-2">
        <input
          type="search"
          aria-label="Buscar exercício"
          placeholder="Buscar"
          value={busca}
          onChange={(e) => setBusca(e.currentTarget.value)}
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2.5 text-base outline-none focus:border-neutral-900"
        />
        <button
          type="button"
          onClick={() => setCriando(true)}
          className="shrink-0 rounded-lg bg-neutral-900 px-4 py-2.5 font-medium text-white"
        >
          Novo exercício
        </button>
      </div>
      {exercicios.length === 0 ? (
        <p className="mt-6 text-center text-neutral-600">
          Nenhum exercício ainda. Crie aqui ou direto ao registrar um treino.
        </p>
      ) : achados.length === 0 ? (
        <p className="mt-6 text-center text-neutral-600">
          Nenhum exercício com esse nome.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-neutral-200">
          {achados.map((e) => (
            <li key={e.id}>
              <Link
                href={`/exercicios/${e.id}`}
                className="block truncate py-3"
              >
                {e.nome}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
