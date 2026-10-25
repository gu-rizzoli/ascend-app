import type { Metadata } from "next";
import Link from "next/link";

import { exigirUsuario } from "@/server/sessao";
import { exerciciosDoUsuario } from "@/server/treinos";

import { AbasDeTreinos } from "../treinos/abas";
import { Catalogo } from "./catalogo";

export const metadata: Metadata = { title: "Exercícios · Ascend" };

type Props = { searchParams: Promise<{ arquivados?: string }> };

/**
 * Catálogo de exercícios (RF-TRE-01 a 05). Os arquivados ficam fora da busca
 * e aparecem com o filtro "Mostrar arquivados".
 */
export default async function PaginaExercicios({ searchParams }: Props) {
  const usuario = await exigirUsuario();
  const arquivados = Boolean((await searchParams).arquivados);
  const exercicios = await exerciciosDoUsuario(usuario.id, { arquivados });

  return (
    <>
      <h1 className="text-xl font-semibold">Treinos</h1>
      <div className="mt-3">
        <AbasDeTreinos atual="/exercicios" />
      </div>

      {arquivados ? (
        <>
          <p className="mt-4 text-sm text-neutral-600">
            Arquivados não aparecem na busca, mas continuam nos treinos antigos.
          </p>
          {exercicios.length > 0 ? (
            <ul className="bg-superficie mt-2 divide-y divide-neutral-200 rounded-2xl px-4 shadow-sm">
              {exercicios.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/exercicios/${e.id}`}
                    className="block truncate py-3 text-neutral-600"
                  >
                    {e.nome}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-center text-neutral-600">
              Nenhum exercício arquivado.
            </p>
          )}
        </>
      ) : (
        <Catalogo exercicios={exercicios} />
      )}

      <Link
        href={arquivados ? "/exercicios" : "/exercicios?arquivados=1"}
        className="mt-6 text-center text-sm text-neutral-600 underline"
      >
        {arquivados ? "Voltar aos exercícios ativos" : "Mostrar arquivados"}
      </Link>
    </>
  );
}
