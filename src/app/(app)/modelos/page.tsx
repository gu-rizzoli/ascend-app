import type { Metadata } from "next";
import Link from "next/link";

import { exigirUsuario } from "@/server/sessao";
import { modelosDoUsuario } from "@/server/treinos";
import { classeBotao } from "@/ui/botao";
import { BotaoFlutuante } from "@/ui/botao-flutuante";

import { AbasDeTreinos } from "../treinos/abas";

export const metadata: Metadata = { title: "Modelos · Ascend" };

/** Modelos de treino (RF-TRE-06): só pontos de partida para registrar. */
export default async function PaginaModelos() {
  const usuario = await exigirUsuario();
  const modelos = await modelosDoUsuario(usuario.id);

  return (
    <>
      <h1 className="text-xl font-bold tracking-tight">Treinos</h1>
      <div className="mt-3">
        <AbasDeTreinos atual="/modelos" />
      </div>

      {modelos.length === 0 ? (
        <section className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="max-w-64 text-neutral-600">
            Um modelo traz os exercícios, as séries e as repetições sugeridas
            para começar o registro mais rápido.
          </p>
          <Link href="/modelos/novo" className={classeBotao}>
            Criar primeiro modelo
          </Link>
        </section>
      ) : (
        <>
          <ul className="bg-superficie mt-4 divide-y divide-neutral-200 rounded-2xl px-4 shadow-sm">
            {modelos.map((m) => (
              <li key={m.id} className="flex items-center gap-2 py-2">
                <Link href={`/modelos/${m.id}`} className="min-w-0 flex-1 py-1">
                  <span className="block truncate">{m.nome}</span>
                  <span className="text-xs text-neutral-500">
                    {m.exercicios}{" "}
                    {m.exercicios === 1 ? "exercício" : "exercícios"}
                  </span>
                </Link>
                <Link
                  href={`/treinos/novo?modelo=${m.id}`}
                  className="shrink-0 rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-medium"
                >
                  Registrar
                </Link>
              </li>
            ))}
          </ul>
          <BotaoFlutuante href="/modelos/novo" rotulo="Novo modelo" />
        </>
      )}
    </>
  );
}
