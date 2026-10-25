"use client";

import { useActionState, useState } from "react";

import type { DataCivil } from "@/domain/datas";
import {
  mover,
  NOME_TREINO_MAXIMO,
  novaSerie,
  OBSERVACAO_MAXIMA,
  OBSERVACAO_SERIE_MAXIMA,
  type ExercicioDoFormulario,
  type SerieDoFormulario,
  type TreinoDoFormulario,
} from "@/domain/treinos";
import { salvarTreino, type EstadoFormulario } from "@/server/acoes-treinos";
import { Botao } from "@/ui/botao";

import {
  EscolherExercicio,
  type ExercicioDoCatalogo,
} from "./escolher-exercicio";
import { BotoesDeOrdem, LinkDeSaida, useConfirmarSaida } from "./saida";

const classeCampo =
  "rounded-lg border border-neutral-300 px-3 py-2.5 text-base outline-none focus:border-neutral-900";

/**
 * Registrar ou editar um treino (treinos.md, "Registrar treino"). Nada é
 * gravado até Salvar, que manda tudo de uma vez (9.9).
 */
export function FormularioTreino({
  inicial,
  treinoId,
  catalogo: catalogoInicial,
  hoje,
  voltar,
  titulo,
}: {
  inicial: TreinoDoFormulario;
  treinoId?: string;
  catalogo: ExercicioDoCatalogo[];
  hoje: DataCivil;
  voltar: string;
  titulo: string;
}) {
  const [estado, acao, enviando] = useActionState<EstadoFormulario, FormData>(
    salvarTreino,
    {},
  );
  const [f, setF] = useState(inicial);
  const [alterado, setAlterado] = useState(false);
  const [catalogo, setCatalogo] = useState(catalogoInicial);
  const [escolhendo, setEscolhendo] = useState(inicial.exercicios.length === 0);
  // Ao enviar, sair da página é o próprio salvar.
  useConfirmarSaida(alterado && !enviando);

  function mudar(novo: Partial<TreinoDoFormulario>) {
    setF((atual) => ({ ...atual, ...novo }));
    setAlterado(true);
  }

  function mudarExercicio(i: number, novo: ExercicioDoFormulario) {
    mudar({ exercicios: f.exercicios.map((e, j) => (j === i ? novo : e)) });
  }

  return (
    <form action={acao} className="flex flex-col gap-5" noValidate>
      <header className="flex items-center gap-2">
        <LinkDeSaida
          href={voltar}
          alterado={alterado}
          aria-label="Voltar"
          className="-ml-2 flex size-10 items-center justify-center rounded-full text-2xl text-neutral-600 hover:bg-neutral-100"
        >
          ‹
        </LinkDeSaida>
        <h1 className="text-xl font-semibold">{titulo}</h1>
      </header>

      {treinoId && <input type="hidden" name="treinoId" value={treinoId} />}
      <input type="hidden" name="dados" value={JSON.stringify(f)} />

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-sm font-medium">Nome (opcional)</span>
          <input
            value={f.nome}
            maxLength={NOME_TREINO_MAXIMO}
            autoComplete="off"
            placeholder="Ex.: Peito e tríceps"
            onChange={(e) => mudar({ nome: e.currentTarget.value })}
            className={classeCampo}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Data</span>
          <input
            type="date"
            value={f.data}
            max={hoje}
            onChange={(e) => mudar({ data: e.currentTarget.value })}
            className={classeCampo}
          />
        </label>
      </div>

      {f.exercicios.map((e, i) => (
        <BlocoDoExercicio
          key={`${e.exercicioId}-${i}`}
          exercicio={e}
          aoMudar={(novo) => mudarExercicio(i, novo)}
          aoSubir={
            i > 0
              ? () => mudar({ exercicios: mover(f.exercicios, i, -1) })
              : undefined
          }
          aoDescer={
            i < f.exercicios.length - 1
              ? () => mudar({ exercicios: mover(f.exercicios, i, 1) })
              : undefined
          }
          aoRemover={() =>
            mudar({ exercicios: f.exercicios.filter((_, j) => j !== i) })
          }
        />
      ))}

      {escolhendo ? (
        <EscolherExercicio
          catalogo={catalogo}
          aoFechar={
            f.exercicios.length > 0 ? () => setEscolhendo(false) : undefined
          }
          aoEscolher={(ex, novo) => {
            if (novo) setCatalogo((c) => [...c, ex]);
            mudar({
              exercicios: [
                ...f.exercicios,
                { exercicioId: ex.id, nome: ex.nome, series: [novaSerie()] },
              ],
            });
            setEscolhendo(false);
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEscolhendo(true)}
          className="rounded-lg border border-dashed border-neutral-400 px-4 py-3 font-medium text-neutral-700"
        >
          + Exercício
        </button>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Observação (opcional)</span>
        <textarea
          rows={2}
          value={f.observacao}
          maxLength={OBSERVACAO_MAXIMA}
          onChange={(e) => mudar({ observacao: e.currentTarget.value })}
          className={classeCampo}
        />
      </label>

      {estado.erro && (
        <p role="alert" className="text-sm text-red-700">
          {estado.erro}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Botao type="submit" disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar"}
        </Botao>
        <LinkDeSaida
          href={voltar}
          alterado={alterado}
          className="rounded-lg px-4 py-3 text-center font-medium text-neutral-600"
        >
          Cancelar
        </LinkDeSaida>
      </div>
    </form>
  );
}

function BlocoDoExercicio({
  exercicio: e,
  aoMudar,
  aoSubir,
  aoDescer,
  aoRemover,
}: {
  exercicio: ExercicioDoFormulario;
  aoMudar: (e: ExercicioDoFormulario) => void;
  aoSubir?: () => void;
  aoDescer?: () => void;
  aoRemover: () => void;
}) {
  const mudarSeries = (series: SerieDoFormulario[]) =>
    aoMudar({ ...e, series });

  return (
    <section className="rounded-lg border border-neutral-200 p-3">
      <div className="flex items-center gap-2">
        <h2 className="min-w-0 flex-1 truncate font-medium">{e.nome}</h2>
        <BotoesDeOrdem
          nome={e.nome}
          aoSubir={aoSubir}
          aoDescer={aoDescer}
          aoRemover={aoRemover}
        />
      </div>

      {e.series.length > 0 && (
        <div className="mt-2 grid grid-cols-[1.5rem_1fr_1fr_2.25rem] items-center gap-x-2 text-xs text-neutral-500">
          <span />
          <span>Repetições</span>
          <span>Carga (kg)</span>
          <span />
        </div>
      )}
      <ol className="flex flex-col">
        {e.series.map((s, i) => (
          <LinhaDaSerie
            key={i}
            numero={i + 1}
            serie={s}
            exercicio={e.nome}
            aoMudar={(nova) =>
              mudarSeries(e.series.map((x, j) => (j === i ? nova : x)))
            }
            aoSubir={
              i > 0 ? () => mudarSeries(mover(e.series, i, -1)) : undefined
            }
            aoDescer={
              i < e.series.length - 1
                ? () => mudarSeries(mover(e.series, i, 1))
                : undefined
            }
            aoRemover={() => mudarSeries(e.series.filter((_, j) => j !== i))}
          />
        ))}
      </ol>
      <button
        type="button"
        onClick={() => mudarSeries([...e.series, novaSerie(e.series.at(-1))])}
        className="mt-2 rounded-md px-2 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
      >
        + Série
      </button>
    </section>
  );
}

function LinhaDaSerie({
  numero,
  serie: s,
  exercicio,
  aoMudar,
  aoSubir,
  aoDescer,
  aoRemover,
}: {
  numero: number;
  serie: SerieDoFormulario;
  exercicio: string;
  aoMudar: (s: SerieDoFormulario) => void;
  aoSubir?: () => void;
  aoDescer?: () => void;
  aoRemover: () => void;
}) {
  // A observação fica recolhida até ser pedida (treinos.md, item 3).
  const [aberta, setAberta] = useState(s.observacao !== "");
  const nome = `série ${numero} de ${exercicio}`;
  const classe =
    "w-full min-w-0 rounded-md border border-neutral-300 px-2 py-2 text-base outline-none focus:border-neutral-900";

  return (
    <li className="py-1">
      <div className="grid grid-cols-[1.5rem_1fr_1fr_2.25rem] items-center gap-x-2">
        <span className="text-center text-sm text-neutral-500">{numero}</span>
        <input
          inputMode="numeric"
          aria-label={`Repetições da ${nome}`}
          placeholder={s.dica ?? ""}
          value={s.repeticoes}
          onChange={(ev) =>
            aoMudar({ ...s, repeticoes: ev.currentTarget.value })
          }
          className={classe}
        />
        <input
          inputMode="decimal"
          aria-label={`Carga em kg da ${nome}`}
          placeholder="—"
          value={s.carga}
          onChange={(ev) => aoMudar({ ...s, carga: ev.currentTarget.value })}
          className={classe}
        />
        <button
          type="button"
          aria-expanded={aberta}
          aria-label={`Mais opções da ${nome}`}
          onClick={() => setAberta(!aberta)}
          className="flex size-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
        >
          ⋯
        </button>
      </div>
      {aberta && (
        <div className="mt-1 flex items-center gap-1 pl-8">
          <input
            aria-label={`Observação da ${nome}`}
            placeholder="Observação"
            value={s.observacao}
            maxLength={OBSERVACAO_SERIE_MAXIMA}
            onChange={(ev) =>
              aoMudar({ ...s, observacao: ev.currentTarget.value })
            }
            className="min-w-0 flex-1 rounded-md border border-neutral-300 px-2 py-1.5 text-sm outline-none focus:border-neutral-900"
          />
          <BotoesDeOrdem
            nome={nome}
            aoSubir={aoSubir}
            aoDescer={aoDescer}
            aoRemover={aoRemover}
          />
        </div>
      )}
    </li>
  );
}
