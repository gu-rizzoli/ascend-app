"use client";

import {
  GRUPOS_MUSCULARES,
  NOME_DO_GRUPO,
  type GrupoMuscular,
} from "@/domain/treinos";

/**
 * Filtro por grupo muscular, em fichas que rolam de lado (decisão 17).
 * Nulo é "Todos".
 */
export function FiltroDeGrupo({
  grupo,
  aoEscolher,
}: {
  grupo: GrupoMuscular | null;
  aoEscolher: (g: GrupoMuscular | null) => void;
}) {
  const ficha = (ativa: boolean) =>
    `shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
      ativa
        ? "border-neutral-900 bg-neutral-900 text-white"
        : "border-neutral-300 text-neutral-700"
    }`;
  return (
    <div
      role="group"
      aria-label="Filtrar por grupo muscular"
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
    >
      <button
        type="button"
        aria-pressed={grupo === null}
        onClick={() => aoEscolher(null)}
        className={ficha(grupo === null)}
      >
        Todos
      </button>
      {GRUPOS_MUSCULARES.map((g) => (
        <button
          key={g}
          type="button"
          aria-pressed={grupo === g}
          onClick={() => aoEscolher(grupo === g ? null : g)}
          className={ficha(grupo === g)}
        >
          {NOME_DO_GRUPO[g]}
        </button>
      ))}
    </div>
  );
}
