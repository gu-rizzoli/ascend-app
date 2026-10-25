"use client";

import { useOptimistic, useState, useTransition } from "react";

import { PROXIMO_PASSO_MAXIMO } from "@/domain/projetos";
import {
  alternarProjetoAtual,
  definirProximoPasso,
} from "@/server/acoes-projetos";

/** Pedaços de Projetos usados na lista, no detalhe e em Hoje. */

/**
 * A estrela do projeto atual (RF-PRO-03, 04). Tocar em outro projeto
 * transfere o destaque; tocar no atual o remove. O status não muda (D-018).
 */
export function Estrela({
  projetoId,
  atual,
}: {
  projetoId: string;
  atual: boolean;
}) {
  const [marcada, marcar] = useOptimistic(atual);
  return (
    <form
      action={async (form) => {
        marcar(!marcada);
        await alternarProjetoAtual(form);
      }}
    >
      <input type="hidden" name="projetoId" value={projetoId} />
      <button
        type="submit"
        aria-pressed={marcada}
        aria-label={marcada ? "Remover destaque de atual" : "Tornar atual"}
        title={marcada ? "Projeto atual" : "Tornar atual"}
        className={`flex size-10 shrink-0 items-center justify-center rounded-full text-2xl leading-none hover:bg-neutral-100 ${
          marcada ? "text-amber-500" : "text-neutral-300"
        }`}
      >
        {marcada ? "★" : "☆"}
      </button>
    </form>
  );
}

/** O selo de prazo vencido (15.4): só aviso, sem lembrete. */
export function SeloPrazoVencido() {
  return (
    <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-800">
      Prazo vencido
    </span>
  );
}

/**
 * Próximo passo editável com um toque no texto, na lista e em Hoje. Enter ou
 * sair do campo salva; Esc desiste. Texto vazio apaga (D-019).
 */
export function ProximoPasso({
  projetoId,
  texto,
}: {
  projetoId: string;
  texto: string | null;
}) {
  const [mostrado, mostrar] = useOptimistic(texto);
  const [editando, setEditando] = useState(false);
  const [, iniciar] = useTransition();

  function salvar(novo: string) {
    setEditando(false);
    const limpo = novo.trim();
    if (limpo === (mostrado ?? "")) return;
    iniciar(async () => {
      mostrar(limpo === "" ? null : limpo);
      await definirProximoPasso(projetoId, limpo);
    });
  }

  if (editando) {
    return (
      <input
        autoFocus
        aria-label="Próximo passo"
        defaultValue={mostrado ?? ""}
        maxLength={PROXIMO_PASSO_MAXIMO}
        placeholder="Qual é o próximo passo?"
        onBlur={(e) => salvar(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            salvar(e.currentTarget.value);
          } else if (e.key === "Escape") {
            setEditando(false);
          }
        }}
        className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm outline-none focus:border-neutral-900"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditando(true)}
      aria-label={
        mostrado
          ? `Próximo passo: ${mostrado}. Editar`
          : "Definir próximo passo"
      }
      className={`block w-full truncate rounded-md py-1 text-left text-sm hover:bg-neutral-100 ${
        mostrado ? "text-neutral-600" : "text-neutral-400 italic"
      }`}
    >
      {mostrado ? `→ ${mostrado}` : "+ próximo passo"}
    </button>
  );
}
