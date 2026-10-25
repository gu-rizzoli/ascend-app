import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  ehDataCivil,
  formatarDataLonga,
  hoje,
  somarDias,
} from "@/domain/datas";
import {
  contagemPorDia,
  enderecoDaData,
  mesDe,
  percentual,
} from "@/domain/historico";
import { usuarioComDiasFechados } from "@/server/fechamento";
import {
  focosDosDias,
  metasDoPeriodo,
  treinosDoPeriodo,
} from "@/server/historico";

import { SetaDoDia } from "../../dia/seta-do-dia";
import { tituloDoTreino } from "../../treinos/abas";
import { LinhaDoHistorico, LinhaDoTreino } from "../pecas";

type Props = { params: Promise<{ data: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await params;
  if (!ehDataCivil(data)) return { title: "Histórico · Ascend" };
  return { title: `${formatarDataLonga(data)} · Histórico · Ascend` };
}

/**
 * Detalhe de um dia encerrado (10.5, RF-HIS-04 a 11): metas com o estado
 * final, valores, projetos, reagendamentos e correções, o projeto em foco
 * naquele dia e o treino. Hoje e o futuro ficam na tela do dia.
 */
export default async function PaginaDiaDoHistorico({ params }: Props) {
  const { data } = await params;
  if (!ehDataCivil(data)) notFound();
  const dataHoje = hoje();
  if (data >= dataHoje) redirect(enderecoDaData(data, dataHoje));

  const usuario = await usuarioComDiasFechados();
  const [metas, treinos, focos] = await Promise.all([
    metasDoPeriodo(usuario.id, data, data, null),
    treinosDoPeriodo(usuario.id, data, data, tituloDoTreino),
    focosDosDias(usuario.id, [data]),
  ]);
  const contagem = contagemPorDia(metas).get(data);
  const taxa = contagem ? percentual(contagem) : null;
  const foco = focos.get(data) ?? null;
  const seguinte = somarDias(data, 1);

  return (
    <>
      <header className="flex items-center justify-between gap-2">
        <SetaDoDia
          href={`/historico/${somarDias(data, -1)}`}
          rotulo="Dia anterior"
        >
          ‹
        </SetaDoDia>
        <div className="text-center">
          <Link
            href={`/historico?mes=${mesDe(data)}`}
            className="text-xs font-medium tracking-wide text-neutral-500 uppercase"
          >
            Histórico
          </Link>
          <h1 className="text-xl font-semibold">{formatarDataLonga(data)}</h1>
        </div>
        <SetaDoDia
          href={enderecoDaData(seguinte, dataHoje)}
          rotulo="Próximo dia"
        >
          ›
        </SetaDoDia>
      </header>

      <p className="mt-1 min-h-6 text-center text-sm text-neutral-600">
        {contagem &&
          `${contagem.concluidas} de ${contagem.total} ${contagem.total === 1 ? "concluída" : "concluídas"} · ${taxa}%`}
      </p>

      {foco && (
        <section className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
          <span aria-hidden="true" className="text-amber-500">
            ★
          </span>
          <Link href={`/projetos/${foco.id}`} className="font-medium">
            {foco.nome}
          </Link>
          <span className="text-xs text-amber-800">em foco neste dia</span>
        </section>
      )}

      {metas.length > 0 && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
          <p>Dia encerrado.</p>
          <Link
            href={`/dia/${data}?corrigir=1&voltar=historico`}
            className="rounded-full bg-white px-3 py-1.5 font-medium text-neutral-900 shadow-sm"
          >
            Corrigir
          </Link>
        </div>
      )}

      {metas.length === 0 && treinos.length === 0 ? (
        <section className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-neutral-600">Nada registrado neste dia.</p>
        </section>
      ) : (
        <>
          {metas.length > 0 && (
            <section className="mt-4">
              <h2 className="text-sm font-medium text-neutral-500">Metas</h2>
              <ul className="divide-y divide-neutral-200">
                {metas.map((m) => (
                  <LinhaDoHistorico
                    key={m.ocorrenciaId}
                    item={m}
                    dataHoje={dataHoje}
                    completa
                  />
                ))}
              </ul>
            </section>
          )}
          {treinos.length > 0 && (
            <section className="mt-4">
              <h2 className="text-sm font-medium text-neutral-500">
                {treinos.length === 1 ? "Treino" : "Treinos"}
              </h2>
              <ul className="divide-y divide-neutral-200">
                {treinos.map((t) => (
                  <LinhaDoTreino key={t.id} treino={t} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
}
