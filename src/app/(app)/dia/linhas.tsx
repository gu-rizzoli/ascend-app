"use client";

import { useEffect, useOptimistic, useState, useTransition } from "react";

import {
  formatarNumero,
  lerNumero,
  progresso,
  type EstadoOcorrencia,
  type ItemDoDia,
} from "@/domain/metas";
import {
  alternarConclusao,
  corrigirConclusao,
  corrigirValor,
  definirValor,
  somarValor,
} from "@/server/acoes-metas";

/**
 * editar: hoje e datas futuras. ler: dia encerrado. corrigir: dia encerrado
 * aberto com o botão Corrigir (RF-MET-12).
 */
export type Modo = "editar" | "ler" | "corrigir";

type Props = { item: ItemDoDia; modo: Modo };

/** Editar mexe na vaga (meta, data prevista); corrigir, na ocorrência gravada. */
function podeTocar(item: ItemDoDia, modo: Modo): boolean {
  if (modo === "editar") return item.dataPrevista !== null;
  if (modo === "corrigir") return item.ocorrenciaId !== null;
  return false;
}

/** Horário, "Não concluída" e o selo de corrigida, numa linha discreta. */
function Detalhes({
  horario,
  estado,
  corrigida,
}: {
  horario: string | null;
  estado: EstadoOcorrencia;
  corrigida: boolean;
}) {
  const naoConcluida = estado === "nao_concluida";
  if (!horario && !naoConcluida && !corrigida) return null;
  return (
    <span className="flex flex-wrap items-center gap-x-2 text-xs text-neutral-500">
      {horario && <span className="tabular-nums">{horario}</span>}
      {naoConcluida && <span>Não concluída</span>}
      {corrigida && (
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900">
          Corrigida
        </span>
      )}
    </span>
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

/**
 * Binária: um toque conclui, outro desmarca, salvando na hora. Num dia em
 * correção, alterna entre concluída e não concluída.
 */
export function LinhaBinaria({ item, modo }: Props) {
  const [estado, mudarEstado] = useOptimistic(item.estado);
  const [corrigida, marcarCorrigida] = useOptimistic(item.corrigida);
  const [, iniciar] = useTransition();
  const concluida = estado === "concluida";

  function alternar() {
    iniciar(async () => {
      if (modo === "corrigir") {
        mudarEstado(concluida ? "nao_concluida" : "concluida");
        marcarCorrigida(true);
        await corrigirConclusao(item.ocorrenciaId!, !concluida);
      } else {
        mudarEstado(concluida ? "pendente" : "concluida");
        await alternarConclusao(item.metaId, item.dataPrevista!);
      }
    });
  }

  return (
    <li>
      <button
        type="button"
        role="checkbox"
        aria-checked={concluida}
        disabled={!podeTocar(item, modo)}
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
          <Detalhes
            horario={item.horario}
            estado={estado}
            corrigida={corrigida}
          />
        </span>
      </button>
    </li>
  );
}

const chaveIncremento = (metaId: string) => `ascend:incremento:${metaId}`;

// Sem separador de milhar, para o campo aceitar o valor de volta.
const paraCampo = (valor: number) =>
  String(Math.round(valor * 1000) / 1000).replace(".", ",");

/**
 * Numérica: "1,5 / 3 L", barra que para em 100% e um + que abre atalhos de
 * incremento e o campo do total, já preenchido com o valor atual para corrigir
 * um valor errado (fluxos-metas.md). Num dia em correção, o painel mostra só o
 * campo do total corrigido.
 */
export function LinhaNumerica({ item, modo }: Props) {
  const alvo = item.valorAlvo ?? 0;
  const unidade = item.unidade ?? "";
  const corrigindo = modo === "corrigir";
  const [valor, mudarValor] = useOptimistic(item.valorAtual ?? 0);
  const [corrigida, marcarCorrigida] = useOptimistic(item.corrigida);
  const [, iniciar] = useTransition();
  const [aberto, setAberto] = useState(false);
  const [somaDigitada, setSomaDigitada] = useState("");
  const [totalDigitado, setTotalDigitado] = useState("");
  // O último incremento usado fica só neste aparelho: o v0.4 não pede log de
  // incrementos (fluxos-metas.md, decisão 4).
  const [ultimo, setUltimo] = useState<number | null>(null);
  const tocavel = podeTocar(item, modo);
  const concluida = valor >= alvo && alvo > 0;
  // O estado da tela segue o valor otimista; num dia encerrado, abaixo do
  // alvo é "não concluída".
  const estado: EstadoOcorrencia = concluida
    ? "concluida"
    : modo === "editar"
      ? "pendente"
      : "nao_concluida";

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
    setTotalDigitado(paraCampo(valor + incremento));
    iniciar(async () => {
      mudarValor(valor + incremento);
      await somarValor(item.metaId, item.dataPrevista!, String(incremento));
    });
  }

  function definir(total: number) {
    iniciar(async () => {
      mudarValor(total);
      if (corrigindo) {
        marcarCorrigida(true);
        await corrigirValor(item.ocorrenciaId!, String(total));
      } else {
        await definirValor(item.metaId, item.dataPrevista!, String(total));
      }
    });
  }

  // Ao abrir, o campo do total já vem com o valor atual: corrigir um valor
  // errado é só apagar e digitar o certo.
  function alternarPainel() {
    if (!aberto) setTotalDigitado(paraCampo(valor));
    setAberto(!aberto);
  }

  const soma = lerNumero(somaDigitada);
  const total = lerNumero(totalDigitado);

  return (
    <li className="py-3.5">
      <div className="flex items-center gap-3">
        <Marca concluida={concluida} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="flex min-w-0 flex-col">
              <span>{item.titulo}</span>
              <Detalhes
                horario={item.horario}
                estado={estado}
                corrigida={corrigida}
              />
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
        {tocavel && (
          <button
            type="button"
            aria-label={`Atualizar ${item.titulo}`}
            aria-expanded={aberto}
            onClick={alternarPainel}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-xl leading-none"
          >
            {aberto ? "×" : "+"}
          </button>
        )}
      </div>

      {tocavel && aberto && (
        <div className="mt-3 flex flex-col gap-4 rounded-lg bg-neutral-100 p-3">
          {!corrigindo && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-neutral-600">
                Somar
              </span>
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
                  if (soma === null || soma === 0) return;
                  somar(soma);
                  setSomaDigitada("");
                }}
              >
                <input
                  aria-label={`Quanto somar em ${item.titulo}`}
                  inputMode="decimal"
                  placeholder="Outro valor"
                  value={somaDigitada}
                  onChange={(e) => setSomaDigitada(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base outline-none focus:border-neutral-900"
                />
                <button
                  type="submit"
                  disabled={soma === null || soma === 0}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-medium shadow-sm disabled:opacity-50"
                >
                  Somar
                </button>
              </form>
            </div>
          )}
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (total === null) return;
              definir(total);
              setAberto(false);
            }}
          >
            <label
              htmlFor={`total-${item.chave}`}
              className="text-xs font-medium text-neutral-600"
            >
              {corrigindo ? "Total corrigido" : "Corrigir o total"}
            </label>
            <div className="flex items-center gap-2">
              <input
                id={`total-${item.chave}`}
                inputMode="decimal"
                value={totalDigitado}
                onChange={(e) => setTotalDigitado(e.target.value)}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base outline-none focus:border-neutral-900"
              />
              <span className="text-sm text-neutral-600">{unidade}</span>
              <button
                type="submit"
                disabled={total === null}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}
    </li>
  );
}
