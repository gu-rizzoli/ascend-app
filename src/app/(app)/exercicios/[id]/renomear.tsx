"use client";

import { useActionState, useState } from "react";

import { NOME_EXERCICIO_MAXIMO } from "@/domain/treinos";
import { renomear, type EstadoFormulario } from "@/server/acoes-treinos";

/**
 * O nome do exercício, que se edita com um toque. O nome novo vale em todos
 * os treinos, porque é o mesmo exercício (decisão 4).
 */
export function NomeDoExercicio({
  exercicioId,
  nome,
}: {
  exercicioId: string;
  nome: string;
}) {
  const [editando, setEditando] = useState(false);
  const [estado, acao, enviando] = useActionState<EstadoFormulario, FormData>(
    async (anterior, form) => {
      const r = await renomear(anterior, form);
      if (!r.erro) setEditando(false);
      return r;
    },
    {},
  );

  if (!editando) {
    return (
      <button
        type="button"
        onClick={() => setEditando(true)}
        aria-label={`${nome}. Renomear`}
        className="min-w-0 flex-1 rounded-md pt-1 text-left text-xl font-semibold break-words hover:bg-neutral-100"
      >
        {nome}
      </button>
    );
  }

  return (
    <form action={acao} className="flex min-w-0 flex-1 flex-col gap-2">
      <input type="hidden" name="exercicioId" value={exercicioId} />
      <input
        autoFocus
        name="nome"
        aria-label="Nome do exercício"
        defaultValue={nome}
        maxLength={NOME_EXERCICIO_MAXIMO}
        autoComplete="off"
        className="rounded-lg border border-neutral-300 px-3 py-2 text-base outline-none focus:border-neutral-900"
      />
      <p className="text-xs text-neutral-500">
        O nome muda em todos os treinos. Para uma variação, crie outro
        exercício.
      </p>
      {estado.erro && (
        <p role="alert" className="text-sm text-red-700">
          {estado.erro}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="flex-1 rounded-lg px-4 py-2.5 font-medium text-neutral-600"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={enviando}
          className="flex-1 rounded-lg bg-neutral-900 px-4 py-2.5 font-medium text-white disabled:opacity-50"
        >
          {enviando ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
