import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { hoje } from "@/domain/datas";
import { formatarSeries, rotuloDaData } from "@/domain/treinos";
import { arquivarExercicio, excluirExercicio } from "@/server/acoes-treinos";
import { exigirUsuario } from "@/server/sessao";
import {
  exercicioDoUsuario,
  exercicioUsado,
  historicoDoExercicio,
} from "@/server/treinos";

import { ExcluirComConfirmacao } from "../../treinos/[id]/excluir";
import { GrupoDoExercicio } from "./grupo";
import { NomeDoExercicio } from "./renomear";

export const metadata: Metadata = { title: "Exercício · Ascend" };

type Props = { params: Promise<{ id: string }> };

/**
 * Histórico do exercício (RF-TRE-16): uma linha por sessão, da mais recente
 * para a mais antiga. Daqui também se renomeia, arquiva ou exclui (RF-TRE-04,
 * 05).
 */
export default async function PaginaExercicio({ params }: Props) {
  const usuario = await exigirUsuario();
  const dataHoje = hoje();
  const { id } = await params;
  const e = await exercicioDoUsuario(usuario.id, id);
  if (!e) notFound();
  const [historico, usado] = await Promise.all([
    historicoDoExercicio(usuario.id, e.id),
    exercicioUsado(e.id),
  ]);

  return (
    <>
      <header className="flex items-start gap-2">
        <Link
          href={e.arquivado ? "/exercicios?arquivados=1" : "/exercicios"}
          aria-label="Voltar"
          className="-ml-2 flex size-10 shrink-0 items-center justify-center rounded-full text-2xl text-neutral-600 hover:bg-neutral-100"
        >
          ‹
        </Link>
        <NomeDoExercicio exercicioId={e.id} nome={e.nome} />
      </header>
      <GrupoDoExercicio exercicioId={e.id} grupo={e.grupo} />
      {e.arquivado && (
        <p className="mt-2 rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
          Arquivado: não aparece na busca, mas continua nos treinos antigos.
        </p>
      )}

      <section className="mt-4">
        <h2 className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
          Histórico
        </h2>
        {historico.length > 0 ? (
          <ul className="bg-superficie mt-1 divide-y divide-neutral-200 rounded-2xl px-4 shadow-sm">
            {historico.map((h) => (
              <li key={h.treinoId}>
                <Link
                  href={`/treinos/${h.treinoId}`}
                  className="flex gap-3 py-2.5 text-sm"
                >
                  <span className="shrink-0 text-neutral-500 tabular-nums">
                    {rotuloDaData(h.data, dataHoje)}
                  </span>
                  <span className="min-w-0 tabular-nums">
                    {formatarSeries(h.series)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-neutral-500">
            Ainda não aparece em nenhum treino.
          </p>
        )}
      </section>

      <section className="mt-8 flex flex-col gap-3">
        {usado || e.arquivado ? (
          <form action={arquivarExercicio}>
            <input type="hidden" name="exercicioId" value={e.id} />
            {e.arquivado && (
              <input type="hidden" name="desarquivar" value="1" />
            )}
            <button
              type="submit"
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-center font-medium"
            >
              {e.arquivado ? "Desarquivar" : "Arquivar"}
            </button>
          </form>
        ) : null}
        {!usado && (
          <ExcluirComConfirmacao
            acao={excluirExercicio}
            campo="exercicioId"
            id={e.id}
            pergunta={`Excluir “${e.nome}”?`}
            aviso="Ele nunca foi usado em treinos nem modelos, então sai do catálogo de vez."
          />
        )}
        {usado && !e.arquivado && (
          <p className="text-center text-xs text-neutral-500">
            Usado em treinos ou modelos: pode ser arquivado, mas não excluído.
          </p>
        )}
      </section>
    </>
  );
}
