"use client";

import { useOptimistic, useTransition } from "react";

import {
  GRUPOS_MUSCULARES,
  NOME_DO_GRUPO,
  SEM_GRUPO,
  type GrupoMuscular,
} from "@/domain/treinos";
import { mudarGrupo } from "@/server/acoes-treinos";

/** O grupo muscular do exercício, salvo ao escolher (decisão 17). */
export function GrupoDoExercicio({
  exercicioId,
  grupo,
}: {
  exercicioId: string;
  grupo: GrupoMuscular | null;
}) {
  const [mostrado, mostrar] = useOptimistic(grupo ?? "");
  const [, iniciar] = useTransition();

  return (
    <label className="mt-3 flex items-center gap-3 text-sm">
      <span className="text-neutral-600">Grupo muscular</span>
      <select
        value={mostrado}
        onChange={(e) => {
          const valor = e.currentTarget.value;
          iniciar(async () => {
            mostrar(valor);
            const form = new FormData();
            form.set("exercicioId", exercicioId);
            form.set("grupo", valor);
            await mudarGrupo(form);
          });
        }}
        className="bg-superficie focus:border-acento rounded-lg border border-neutral-300 px-3 py-2 text-base outline-none"
      >
        <option value="">{SEM_GRUPO}</option>
        {GRUPOS_MUSCULARES.map((g) => (
          <option key={g} value={g}>
            {NOME_DO_GRUPO[g]}
          </option>
        ))}
      </select>
    </label>
  );
}
