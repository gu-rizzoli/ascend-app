import type { Metadata } from "next";
import Link from "next/link";

import { hoje } from "@/domain/datas";
import { rotuloDaData } from "@/domain/treinos";
import { exigirUsuario } from "@/server/sessao";
import { treinosDoUsuario } from "@/server/treinos";
import { classeBotao } from "@/ui/botao";
import { BotaoFlutuante } from "@/ui/botao-flutuante";

import { AbasDeTreinos, tituloDoTreino } from "./abas";

export const metadata: Metadata = { title: "Treinos · Ascend" };

/** Histórico de sessões, da mais recente para a mais antiga (RF-TRE-15). */
export default async function PaginaTreinos() {
  const usuario = await exigirUsuario();
  const dataHoje = hoje();
  const treinos = await treinosDoUsuario(usuario.id);

  return (
    <>
      <h1 className="text-xl font-semibold">Treinos</h1>
      <div className="mt-3">
        <AbasDeTreinos atual="/treinos" />
      </div>

      {treinos.length === 0 ? (
        <section className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="max-w-64 text-neutral-600">
            Registre um treino depois de fazê-lo, série por série. Os exercícios
            ficam no catálogo para as próximas vezes.
          </p>
          <Link href="/treinos/novo" className={classeBotao}>
            Registrar primeiro treino
          </Link>
        </section>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-neutral-200">
            {treinos.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/treinos/${t.id}`}
                  className="flex items-baseline gap-2 py-3"
                >
                  <span className="shrink-0 text-sm text-neutral-500 tabular-nums">
                    {rotuloDaData(t.data, dataHoje)}
                  </span>
                  <span className="min-w-0 truncate">{tituloDoTreino(t)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <BotaoFlutuante href="/treinos/novo" rotulo="Registrar treino" />
        </>
      )}
    </>
  );
}
