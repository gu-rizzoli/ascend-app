import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { formatarDataLonga } from "@/domain/datas";
import { avisoDeDescartadas, formatarCarga } from "@/domain/treinos";
import { apagarTreino } from "@/server/acoes-treinos";
import { exigirUsuario } from "@/server/sessao";
import { treinoDoUsuario } from "@/server/treinos";
import { classeBotao } from "@/ui/botao";

import { tituloDoTreino } from "../abas";
import { ExcluirComConfirmacao } from "./excluir";

export const metadata: Metadata = { title: "Treino · Ascend" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ descartadas?: string }>;
};

/** Detalhe da sessão (RF-TRE-15): exercícios e séries, na ordem. */
export default async function PaginaTreino({ params, searchParams }: Props) {
  const usuario = await exigirUsuario();
  const { id } = await params;
  const t = await treinoDoUsuario(usuario.id, id);
  if (!t) notFound();
  const aviso = avisoDeDescartadas(Number((await searchParams).descartadas));

  return (
    <>
      <header className="flex items-start gap-2">
        <Link
          href="/treinos"
          aria-label="Voltar"
          className="-ml-2 flex size-10 shrink-0 items-center justify-center rounded-full text-2xl text-neutral-600 hover:bg-neutral-100"
        >
          ‹
        </Link>
        <div className="min-w-0 flex-1 pt-1">
          <h1 className="text-xl font-bold tracking-tight break-words">
            {tituloDoTreino(t)}
          </h1>
          <p className="text-sm text-neutral-600">
            {formatarDataLonga(t.data)}
            {t.modelo && ` · modelo ${t.modelo.nome}`}
          </p>
        </div>
      </header>

      {aviso && (
        <p
          role="status"
          className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900"
        >
          Treino salvo. {aviso}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {t.exercicios.map((e, i) => (
          <section key={i}>
            <Link
              href={`/exercicios/${e.exercicioId}`}
              className="font-medium underline-offset-2 hover:underline"
            >
              {e.nome}
            </Link>
            {e.arquivado && (
              <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600">
                Arquivado
              </span>
            )}
            <ol className="mt-1 flex flex-col gap-0.5 text-sm">
              {e.series.map((s, j) => (
                <li key={j} className="flex gap-3">
                  <span className="w-4 text-right text-neutral-400 tabular-nums">
                    {j + 1}
                  </span>
                  <span className="tabular-nums">
                    {s.cargaKg === null
                      ? `${s.repeticoes} reps`
                      : `${formatarCarga(s.cargaKg)} kg × ${s.repeticoes}`}
                  </span>
                  {s.observacao && (
                    <span className="min-w-0 text-neutral-500">
                      {s.observacao}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      {t.observacao && (
        <p className="mt-4 text-sm whitespace-pre-line text-neutral-700">
          {t.observacao}
        </p>
      )}

      <section className="mt-8 flex flex-col gap-3">
        <Link href={`/treinos/${t.id}/editar`} className={classeBotao}>
          Editar
        </Link>
        <ExcluirComConfirmacao
          acao={apagarTreino}
          campo="treinoId"
          id={t.id}
          pergunta="Excluir este treino?"
          aviso="As séries saem do histórico. Os exercícios continuam no catálogo."
        />
      </section>
    </>
  );
}
