"use client";

import { useState, useTransition } from "react";

import {
  buscarExercicios,
  NOME_EXERCICIO_MAXIMO,
  nomeJaExiste,
} from "@/domain/treinos";
import { novoExercicio } from "@/server/acoes-treinos";

export type ExercicioDoCatalogo = { id: string; nome: string };

const MOSTRADOS = 30;

/**
 * Busca no catálogo enquanto se digita (RF-TRE-02). Se nada servir, a última
 * opção cria o exercício com o nome digitado e já o escolhe, sem sair da tela
 * (RF-TRE-03). Os parecidos são só sugeridos; o nome igual não vira outro.
 */
export function EscolherExercicio({
  catalogo,
  rotulo = "Buscar exercício",
  aoEscolher,
  aoFechar,
}: {
  catalogo: ExercicioDoCatalogo[];
  rotulo?: string;
  aoEscolher: (e: ExercicioDoCatalogo, novo: boolean) => void;
  aoFechar?: () => void;
}) {
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [criando, iniciar] = useTransition();
  const achados = buscarExercicios(busca, catalogo).slice(0, MOSTRADOS);
  const limpo = busca.trim();
  const podeCriar = limpo !== "" && !nomeJaExiste(limpo, catalogo);

  function criar() {
    setErro(null);
    iniciar(async () => {
      const r = await novoExercicio(limpo);
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      setBusca("");
      aoEscolher(r.exercicio, !r.jaExistia);
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-neutral-300 bg-white p-2">
      <div className="flex items-center gap-2">
        <input
          autoFocus
          type="search"
          aria-label={rotulo}
          placeholder={rotulo}
          value={busca}
          maxLength={NOME_EXERCICIO_MAXIMO}
          onChange={(e) => {
            setBusca(e.currentTarget.value);
            setErro(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (achados.length === 1 && !podeCriar) {
                aoEscolher(achados[0]!, false);
                setBusca("");
              } else if (podeCriar && achados.length === 0) {
                criar();
              }
            } else if (e.key === "Escape") {
              aoFechar?.();
            }
          }}
          className="min-w-0 flex-1 rounded-md border border-neutral-300 px-3 py-2 text-base outline-none focus:border-neutral-900"
        />
        {aoFechar && (
          <button
            type="button"
            onClick={aoFechar}
            className="shrink-0 px-2 py-2 text-sm font-medium text-neutral-600"
          >
            Fechar
          </button>
        )}
      </div>
      <ul className="max-h-64 overflow-y-auto">
        {achados.map((e) => (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => {
                aoEscolher(e, false);
                setBusca("");
              }}
              className="block w-full truncate rounded-md px-3 py-2 text-left hover:bg-neutral-100"
            >
              {e.nome}
            </button>
          </li>
        ))}
        {podeCriar && (
          <li>
            <button
              type="button"
              onClick={criar}
              disabled={criando}
              className="block w-full truncate rounded-md px-3 py-2 text-left font-medium text-neutral-900 hover:bg-neutral-100 disabled:opacity-50"
            >
              {criando ? "Criando…" : `+ Criar “${limpo}”`}
            </button>
          </li>
        )}
        {achados.length === 0 && !podeCriar && (
          <li className="px-3 py-2 text-sm text-neutral-500">
            Digite o nome do exercício.
          </li>
        )}
      </ul>
      {erro && (
        <p role="alert" className="px-1 text-sm text-red-700">
          {erro}
        </p>
      )}
    </div>
  );
}
