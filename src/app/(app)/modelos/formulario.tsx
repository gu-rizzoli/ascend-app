"use client";

import { useActionState, useState } from "react";

import {
  mover,
  NOME_TREINO_MAXIMO,
  OBSERVACAO_MAXIMA,
  type ExercicioDoModeloFormulario,
  type ModeloDoFormulario,
} from "@/domain/treinos";
import { salvarModelo, type EstadoFormulario } from "@/server/acoes-treinos";
import { Botao } from "@/ui/botao";

import {
  EscolherExercicio,
  type ExercicioDoCatalogo,
} from "../treinos/escolher-exercicio";
import {
  BotoesDeOrdem,
  LinkDeSaida,
  useConfirmarSaida,
} from "../treinos/saida";

const classeCampo =
  "rounded-lg border border-neutral-300 px-3 py-2.5 text-base outline-none focus:border-acento";
const classeNumero =
  "w-full min-w-0 rounded-md border border-neutral-300 px-2 py-2 text-base outline-none focus:border-acento";

/**
 * Criar ou editar modelo (RF-TRE-06, 07): nome, observação e exercícios na
 * ordem, com séries sugeridas e faixa de repetições. Sem carga (D-032).
 */
export function FormularioModelo({
  inicial,
  modeloId,
  catalogo: catalogoInicial,
  titulo,
  acoes,
}: {
  inicial: ModeloDoFormulario;
  modeloId?: string;
  catalogo: ExercicioDoCatalogo[];
  titulo: string;
  acoes?: React.ReactNode;
}) {
  const [estado, acao, enviando] = useActionState<EstadoFormulario, FormData>(
    salvarModelo,
    {},
  );
  const [f, setF] = useState(inicial);
  const [alterado, setAlterado] = useState(false);
  const [catalogo, setCatalogo] = useState(catalogoInicial);
  const [escolhendo, setEscolhendo] = useState(false);
  useConfirmarSaida(alterado && !enviando);

  function mudar(novo: Partial<ModeloDoFormulario>) {
    setF((atual) => ({ ...atual, ...novo }));
    setAlterado(true);
  }

  function mudarExercicio(
    i: number,
    novo: Partial<ExercicioDoModeloFormulario>,
  ) {
    mudar({
      exercicios: f.exercicios.map((e, j) => (j === i ? { ...e, ...novo } : e)),
    });
  }

  return (
    <>
      <form action={acao} className="flex flex-col gap-5" noValidate>
        <header className="flex items-center gap-2">
          <LinkDeSaida
            href="/modelos"
            alterado={alterado}
            aria-label="Voltar"
            className="-ml-2 flex size-10 items-center justify-center rounded-full text-2xl text-neutral-600 hover:bg-neutral-100"
          >
            ‹
          </LinkDeSaida>
          <h1 className="text-xl font-semibold">{titulo}</h1>
        </header>

        {modeloId && <input type="hidden" name="modeloId" value={modeloId} />}
        <input type="hidden" name="dados" value={JSON.stringify(f)} />

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Nome</span>
          <input
            value={f.nome}
            maxLength={NOME_TREINO_MAXIMO}
            autoComplete="off"
            placeholder="Ex.: Peito e tríceps"
            onChange={(e) => mudar({ nome: e.currentTarget.value })}
            className={classeCampo}
          />
        </label>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Exercícios</h2>
          {f.exercicios.length > 0 && (
            <ol className="flex flex-col divide-y divide-neutral-200 rounded-lg border border-neutral-200">
              {f.exercicios.map((e, i) => (
                <li key={`${e.exercicioId}-${i}`} className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {e.nome}
                    </span>
                    <BotoesDeOrdem
                      nome={e.nome}
                      aoSubir={
                        i > 0
                          ? () =>
                              mudar({ exercicios: mover(f.exercicios, i, -1) })
                          : undefined
                      }
                      aoDescer={
                        i < f.exercicios.length - 1
                          ? () =>
                              mudar({ exercicios: mover(f.exercicios, i, 1) })
                          : undefined
                      }
                      aoRemover={() =>
                        mudar({
                          exercicios: f.exercicios.filter((_, j) => j !== i),
                        })
                      }
                    />
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-neutral-500">
                    <label className="flex flex-col gap-1">
                      Séries
                      <input
                        inputMode="numeric"
                        value={e.seriesSugeridas}
                        onChange={(ev) =>
                          mudarExercicio(i, {
                            seriesSugeridas: ev.currentTarget.value,
                          })
                        }
                        className={classeNumero}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      Reps mín.
                      <input
                        inputMode="numeric"
                        value={e.repsMin}
                        onChange={(ev) =>
                          mudarExercicio(i, { repsMin: ev.currentTarget.value })
                        }
                        className={classeNumero}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      Reps máx.
                      <input
                        inputMode="numeric"
                        placeholder="opcional"
                        value={e.repsMax}
                        onChange={(ev) =>
                          mudarExercicio(i, { repsMax: ev.currentTarget.value })
                        }
                        className={classeNumero}
                      />
                    </label>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {escolhendo ? (
            <EscolherExercicio
              catalogo={catalogo}
              aoFechar={() => setEscolhendo(false)}
              aoEscolher={(ex, novo) => {
                if (novo) setCatalogo((c) => [...c, ex]);
                mudar({
                  exercicios: [
                    ...f.exercicios,
                    {
                      exercicioId: ex.id,
                      nome: ex.nome,
                      seriesSugeridas: "3",
                      repsMin: "8",
                      repsMax: "12",
                    },
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
        </section>

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
            href="/modelos"
            alterado={alterado}
            className="rounded-lg px-4 py-3 text-center font-medium text-neutral-600"
          >
            Cancelar
          </LinkDeSaida>
        </div>
      </form>
      {acoes && <div className="mt-6 flex flex-col gap-3">{acoes}</div>}
    </>
  );
}
