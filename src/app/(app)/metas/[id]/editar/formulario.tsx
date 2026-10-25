"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import type { CamposEdicaoMeta, TipoMeta } from "@/domain/metas";
import { editarMeta } from "@/server/acoes-recorrencia";
import { Botao } from "@/ui/botao";
import { Campo } from "@/ui/campo";

import { CampoProjeto, CamposFrequencia, Erro } from "../../campos-meta";
import type { ContextoDaMeta } from "../../enderecos";

/**
 * Como a edição vale:
 * - unica: meta de ocorrência única, muda direto;
 * - so_esta: uma reagendada, que só muda sozinha;
 * - perguntar: uma ocorrência recorrente; ao salvar, "Só esta" ou "Esta e as
 *   próximas" (RF-MET-09);
 * - proximas: vindo de Todas as metas, vale de `desde` em diante.
 */
export type Pergunta =
  | { tipo: "unica" }
  | { tipo: "so_esta" }
  | { tipo: "perguntar"; data: string }
  | { tipo: "proximas"; desde: string };

type Props = {
  metaId: string;
  contexto: ContextoDaMeta;
  tipo: TipoMeta;
  unidade: string | null;
  pergunta: Pergunta;
  voltar: string;
  inicial: CamposEdicaoMeta;
  projetos: { id: string; nome: string }[];
};

/**
 * Descrição, frequência e projeto são da regra: mudá-los não cabe em "só
 * esta".
 */
function mudouARegra(form: HTMLFormElement, inicial: CamposEdicaoMeta) {
  const dados = new FormData(form);
  const texto = (campo: string) => String(dados.get(campo) ?? "").trim();
  const frequencia = texto("frequencia");
  if (texto("descricao") !== inicial.descricao.trim()) return true;
  if (texto("projeto") !== inicial.projeto) return true;
  if (frequencia !== inicial.frequencia) return true;
  if (frequencia === "semanal") {
    const dias = dados.getAll("diasSemana").map(String).sort().join();
    if (dias !== [...inicial.diasSemana].sort().join()) return true;
  }
  return (
    frequencia === "intervalo" &&
    texto("intervaloDias") !== inicial.intervaloDias
  );
}

function BotaoEscopo({
  escopo,
  disabled,
  children,
}: {
  escopo: "so_esta" | "proximas";
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="escopo"
      value={escopo}
      disabled={disabled || pending}
      className={
        escopo === "proximas"
          ? "rounded-lg bg-neutral-900 px-4 py-3 font-medium text-white disabled:opacity-50"
          : "rounded-lg border border-neutral-300 bg-white px-4 py-3 font-medium disabled:opacity-40"
      }
    >
      {children}
    </button>
  );
}

export function FormularioEdicao({
  metaId,
  contexto,
  tipo,
  unidade,
  pergunta,
  voltar,
  inicial,
  projetos,
}: Props) {
  const [estado, acao, enviando] = useActionState(editarMeta, {});
  const v = estado.valores ?? inicial;
  const erros = estado.erros ?? {};
  const form = useRef<HTMLFormElement>(null);
  const [frequencia, setFrequencia] = useState<string>(v.frequencia);
  // Quando a pergunta está aberta: "só esta" ainda é possível?
  const [perguntando, setPerguntando] = useState<{ soEsta: boolean } | null>(
    null,
  );
  const soEsta = pergunta.tipo === "so_esta";

  return (
    <form
      ref={form}
      action={acao}
      className="mt-4 flex flex-col gap-5"
      noValidate
      onChange={() => setPerguntando(null)}
    >
      <input type="hidden" name="metaId" value={metaId} />
      <input type="hidden" name="dia" value={contexto.dia ?? ""} />
      <input type="hidden" name="vaga" value={contexto.vaga ?? ""} />
      <input
        type="hidden"
        name="ocorrencia"
        value={contexto.ocorrencia ?? ""}
      />
      {pergunta.tipo !== "perguntar" && (
        <input
          type="hidden"
          name="escopo"
          value={soEsta ? "so_esta" : "proximas"}
        />
      )}

      {pergunta.tipo === "proximas" && (
        <p className="rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
          A mudança vale de {pergunta.desde} em diante. Os dias que já passaram
          não mudam.
        </p>
      )}
      {soEsta && (
        <p className="rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
          Esta ocorrência foi reagendada, então a mudança vale só para ela.
        </p>
      )}

      <Campo
        rotulo="Título"
        name="titulo"
        autoComplete="off"
        maxLength={120}
        defaultValue={v.titulo}
        erro={erros.titulo}
      />

      {tipo === "numerica" && (
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Alvo</span>
          <span className="flex items-center gap-2">
            <input
              name="valorAlvo"
              inputMode="decimal"
              defaultValue={v.valorAlvo}
              aria-invalid={erros.valorAlvo ? true : undefined}
              className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2.5 text-base outline-none focus:border-neutral-900 aria-invalid:border-red-600"
            />
            <span className="text-sm text-neutral-600">{unidade}</span>
          </span>
          <Erro id="valorAlvo-erro" texto={erros.valorAlvo} />
        </label>
      )}

      <Campo
        rotulo="Horário"
        name="horario"
        type="time"
        defaultValue={v.horario}
        erro={erros.horario}
      />

      {soEsta ? (
        <>
          <input type="hidden" name="frequencia" value={inicial.frequencia} />
          <input type="hidden" name="descricao" value={inicial.descricao} />
          <input type="hidden" name="projeto" value={inicial.projeto} />
          {inicial.diasSemana.map((d) => (
            <input key={d} type="hidden" name="diasSemana" value={d} />
          ))}
          <input
            type="hidden"
            name="intervaloDias"
            value={inicial.intervaloDias}
          />
        </>
      ) : (
        <>
          <CamposFrequencia
            frequencia={frequencia}
            mudarFrequencia={setFrequencia}
            diasMarcados={v.diasSemana}
            intervalo={v.intervaloDias}
            erros={erros}
            semUnica={pergunta.tipo !== "unica"}
          />
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Descrição</span>
            <textarea
              name="descricao"
              rows={2}
              maxLength={500}
              defaultValue={v.descricao}
              className="rounded-lg border border-neutral-300 px-3 py-2.5 text-base outline-none focus:border-neutral-900"
            />
            <Erro id="descricao-erro" texto={erros.descricao} />
          </label>
          {projetos.length > 0 ? (
            <CampoProjeto
              projetos={projetos}
              valor={v.projeto}
              erro={erros.projeto}
            />
          ) : (
            <input type="hidden" name="projeto" value="" />
          )}
        </>
      )}

      {estado.erro && (
        <p role="alert" className="text-sm text-red-700">
          {estado.erro}
        </p>
      )}

      <div className="mt-2 flex flex-col gap-2">
        {pergunta.tipo !== "perguntar" ? (
          <Botao type="submit" disabled={enviando}>
            {enviando ? "Salvando…" : "Salvar"}
          </Botao>
        ) : perguntando ? (
          <div className="flex flex-col gap-2 rounded-lg bg-neutral-100 p-3">
            <p className="text-sm font-medium">Salvar a mudança para:</p>
            <BotaoEscopo escopo="so_esta" disabled={!perguntando.soEsta}>
              Só esta ({pergunta.data})
            </BotaoEscopo>
            {!perguntando.soEsta && (
              <p className="text-xs text-neutral-600">
                Frequência, descrição e projeto só mudam para esta e as
                próximas.
              </p>
            )}
            <BotaoEscopo escopo="proximas">Esta e as próximas</BotaoEscopo>
            <p className="text-xs text-neutral-600">
              Os dias que já passaram não mudam.
            </p>
          </div>
        ) : (
          <Botao
            type="button"
            onClick={() =>
              setPerguntando({
                soEsta: !form.current || !mudouARegra(form.current, inicial),
              })
            }
          >
            Salvar
          </Botao>
        )}
        <Link
          href={voltar}
          className="rounded-lg px-4 py-3 text-center font-medium text-neutral-600"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
