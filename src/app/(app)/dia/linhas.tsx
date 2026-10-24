"use client";

import { useEffect, useOptimistic, useState, useTransition } from "react";

import {
  formatarNumero,
  lerNumero,
  progresso,
  type ItemDoDia,
} from "@/domain/metas";
import {
  alternarConclusao,
  definirValor,
  somarValor,
} from "@/server/acoes-metas";

type Props = { item: ItemDoDia; editavel: boolean };

function Horario({ horario }: { horario: string | null }) {
  if (!horario) return null;
  return (
    <span className="text-xs text-neutral-500 tabular-nums">{horario}</span>
  );
}

function Marca({ concluida }: { concluida: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 ${
        concluida
          ? "border-neutral-900 bg-neutral-900 text-white"
          : "border-neutral-300"
      }`}
    >
      {concluida && (
        <svg viewBox="0 0 16 16" className="size-4" fill="none">
          <path
            d="M3.5 8.5l3 3 6-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

/** Binária: um toque conclui, outro desmarca, salvando na hora. */
export function LinhaBinaria({ item, editavel }: Props) {
  const [estado, mudarEstado] = useOptimistic(item.estado);
  const [, iniciar] = useTransition();
  const concluida = estado === "concluida";
  const podeTocar = editavel && item.dataPrevista !== null;

  function alternar() {
    iniciar(async () => {
      mudarEstado(concluida ? "pendente" : "concluida");
      await alternarConclusao(item.metaId, item.dataPrevista!);
    });
  }

  return (
    <li>
      <button
        type="button"
        role="checkbox"
        aria-checked={concluida}
        disabled={!podeTocar}
        onClick={alternar}
        className="flex w-full items-center gap-3 py-3.5 text-left disabled:cursor-default"
      >
        <Marca concluida={concluida} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span
            className={concluida ? "text-neutral-500 line-through" : undefined}
          >
            {item.titulo}
          </span>
          <Horario horario={item.horario} />
        </span>
      </button>
    </li>
  );
}

const chaveIncremento = (metaId: string) => `ascend:incremento:${metaId}`;

/**
 * Numérica: "1,5 / 3 L", barra que para em 100% e um + que abre atalhos de
 * incremento e o campo de novo total (fluxos-metas.md).
 */
export function LinhaNumerica({ item, editavel }: Props) {
  const alvo = item.valorAlvo ?? 0;
  const unidade = item.unidade ?? "";
  const [valor, mudarValor] = useOptimistic(item.valorAtual ?? 0);
  const [, iniciar] = useTransition();
  const [aberto, setAberto] = useState(false);
  const [digitado, setDigitado] = useState("");
  // O último incremento usado fica só neste aparelho: o v0.4 não pede log de
  // incrementos (fluxos-metas.md, decisão 4).
  const [ultimo, setUltimo] = useState<number | null>(null);
  const podeTocar = editavel && item.dataPrevista !== null;
  const concluida = valor >= alvo && alvo > 0;

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(chaveIncremento(item.metaId));
      const n = salvo === null ? null : lerNumero(salvo);
      // Ler do aparelho só depois de montar evita divergir do servidor.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (n) setUltimo(n);
    } catch {
      // Sem armazenamento local (aba anônima): fica só o +1.
    }
  }, [item.metaId]);

  function somar(incremento: number) {
    if (incremento !== 1) {
      setUltimo(incremento);
      try {
        localStorage.setItem(chaveIncremento(item.metaId), String(incremento));
      } catch {}
    }
    iniciar(async () => {
      mudarValor(valor + incremento);
      await somarValor(item.metaId, item.dataPrevista!, String(incremento));
    });
  }

  function definir(total: number) {
    iniciar(async () => {
      mudarValor(total);
      await definirValor(item.metaId, item.dataPrevista!, String(total));
    });
  }

  const n = lerNumero(digitado);

  return (
    <li className="py-3.5">
      <div className="flex items-center gap-3">
        <Marca concluida={concluida} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="flex min-w-0 flex-col">
              <span>{item.titulo}</span>
              <Horario horario={item.horario} />
            </span>
            <span className="shrink-0 text-sm text-neutral-600 tabular-nums">
              {formatarNumero(valor)} / {formatarNumero(alvo)} {unidade}
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progresso(valor, alvo) * 100)}
            aria-label={`Progresso de ${item.titulo}`}
            className="h-1.5 overflow-hidden rounded-full bg-neutral-200"
          >
            <div
              className="h-full rounded-full bg-neutral-900 transition-[width]"
              style={{ width: `${progresso(valor, alvo) * 100}%` }}
            />
          </div>
        </div>
        {podeTocar && (
          <button
            type="button"
            aria-label={`Atualizar ${item.titulo}`}
            aria-expanded={aberto}
            onClick={() => setAberto((a) => !a)}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-xl leading-none"
          >
            {aberto ? "×" : "+"}
          </button>
        )}
      </div>

      {podeTocar && aberto && (
        <div className="mt-3 flex flex-col gap-3 rounded-lg bg-neutral-100 p-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => somar(1)}
              className="rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm"
            >
              +1 {unidade}
            </button>
            {ultimo !== null && ultimo !== 1 && (
              <button
                type="button"
                onClick={() => somar(ultimo)}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm"
              >
                +{formatarNumero(ultimo)} {unidade}
              </button>
            )}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (n === null) return;
              definir(n);
              setDigitado("");
              setAberto(false);
            }}
          >
            <input
              aria-label="Quantidade"
              inputMode="decimal"
              placeholder="Ex.: 0,5"
              value={digitado}
              onChange={(e) => setDigitado(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base outline-none focus:border-neutral-900"
            />
            <button
              type="button"
              disabled={n === null || n === 0}
              onClick={() => {
                if (n === null || n === 0) return;
                somar(n);
                setDigitado("");
              }}
              className="rounded-lg bg-white px-3 py-2 text-sm font-medium shadow-sm disabled:opacity-50"
            >
              Somar
            </button>
            <button
              type="submit"
              disabled={n === null}
              className="rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Novo total
            </button>
          </form>
        </div>
      )}
    </li>
  );
}
