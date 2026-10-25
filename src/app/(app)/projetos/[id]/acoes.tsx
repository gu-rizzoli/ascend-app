"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  NOME_DO_STATUS,
  STATUS_ABERTOS,
  type DestinoDasMetas,
} from "@/domain/projetos";
import {
  encerrarProjeto,
  excluirProjeto,
  reabrirProjeto,
} from "@/server/acoes-projetos";

const classeSecundario =
  "w-full rounded-lg border border-neutral-300 px-4 py-3 text-center font-medium disabled:opacity-50";
const classePrincipal =
  "flex-1 rounded-lg bg-neutral-900 px-4 py-3 font-medium text-white disabled:opacity-50";
const classeCancelar =
  "flex-1 rounded-lg px-4 py-3 font-medium text-neutral-600";

function BotaoEnviar({
  children,
  className,
  disabled,
}: {
  children: React.ReactNode;
  className: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} className={className}>
      {pending ? "Salvando…" : children}
    </button>
  );
}

type MetaRecorrente = { id: string; titulo: string };

const DESTINOS: { valor: DestinoDasMetas; nome: string }[] = [
  { valor: "manter", nome: "Manter ativas" },
  { valor: "pausar_todas", nome: "Pausar todas" },
  { valor: "escolher", nome: "Escolher uma a uma" },
];

/**
 * Concluir ou arquivar (RF-PRO-08, 09, 10). Com metas recorrentes ativas no
 * projeto, pergunta o que fazer com elas; sem nenhuma, conclui direto.
 */
export function Encerrar({
  projetoId,
  status,
  metas,
  principal = false,
}: {
  projetoId: string;
  status: "concluido" | "arquivado";
  metas: MetaRecorrente[];
  // Como ação principal (no diálogo de excluir), já abre com a pergunta.
  principal?: boolean;
}) {
  const [aberto, setAberto] = useState(principal);
  const [destino, setDestino] = useState<DestinoDasMetas>("manter");
  const rotulo = status === "concluido" ? "Concluir" : "Arquivar";
  const campos = (
    <>
      <input type="hidden" name="projetoId" value={projetoId} />
      <input type="hidden" name="status" value={status} />
    </>
  );

  if (metas.length === 0) {
    return (
      <form action={encerrarProjeto}>
        {campos}
        <input type="hidden" name="destino" value="manter" />
        <BotaoEnviar
          className={
            principal
              ? "w-full rounded-lg bg-neutral-900 px-4 py-3 font-medium text-white disabled:opacity-50"
              : classeSecundario
          }
        >
          {rotulo}
        </BotaoEnviar>
      </form>
    );
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={classeSecundario}
      >
        {rotulo}
      </button>
    );
  }

  const n = metas.length;
  return (
    <form
      action={encerrarProjeto}
      className="flex flex-col gap-3 rounded-lg bg-neutral-100 p-3"
    >
      {campos}
      <p className="text-sm font-medium">
        {n === 1
          ? "Este projeto tem 1 meta recorrente. O que fazer com ela?"
          : `Este projeto tem ${n} metas recorrentes. O que fazer com elas?`}
      </p>
      <div className="flex flex-col gap-2">
        {DESTINOS.filter((d) => n > 1 || d.valor !== "escolher").map((d) => (
          <label
            key={d.valor}
            className="flex cursor-pointer items-center gap-3 rounded-lg bg-white px-3 py-2.5 text-sm font-medium shadow-sm has-checked:ring-2 has-checked:ring-neutral-900"
          >
            <input
              type="radio"
              name="destino"
              value={d.valor}
              checked={destino === d.valor}
              onChange={() => setDestino(d.valor)}
              className="accent-neutral-900"
            />
            {n === 1 && d.valor === "pausar_todas" ? "Pausar" : d.nome}
          </label>
        ))}
      </div>
      {destino === "escolher" && (
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-xs text-neutral-600">
            Marque as que devem ser pausadas.
          </legend>
          {metas.map((m) => (
            <label
              key={m.id}
              className="flex items-center gap-3 py-1.5 text-sm"
            >
              <input
                type="checkbox"
                name="pausar"
                value={m.id}
                className="size-4 accent-neutral-900"
              />
              <span className="min-w-0 truncate">{m.titulo}</span>
            </label>
          ))}
        </fieldset>
      )}
      <p className="text-xs text-neutral-600">
        As metas continuam ligadas ao projeto no Histórico.
      </p>
      <div className="flex gap-2">
        {!principal && (
          <button
            type="button"
            onClick={() => setAberto(false)}
            className={classeCancelar}
          >
            Cancelar
          </button>
        )}
        <BotaoEnviar className={classePrincipal}>{rotulo}</BotaoEnviar>
      </div>
    </form>
  );
}

/** Reabrir um concluído ou arquivado. Metas pausadas continuam pausadas. */
export function Reabrir({ projetoId }: { projetoId: string }) {
  const [aberto, setAberto] = useState(false);
  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={classeSecundario}
      >
        Reabrir
      </button>
    );
  }
  return (
    <form
      action={reabrirProjeto}
      className="flex flex-col gap-3 rounded-lg bg-neutral-100 p-3"
    >
      <input type="hidden" name="projetoId" value={projetoId} />
      <p className="text-sm font-medium">Voltar para qual status?</p>
      <div className="flex flex-col gap-2">
        {STATUS_ABERTOS.map((s) => (
          <label
            key={s}
            className="flex cursor-pointer items-center gap-3 rounded-lg bg-white px-3 py-2.5 text-sm font-medium shadow-sm has-checked:ring-2 has-checked:ring-neutral-900"
          >
            <input
              type="radio"
              name="status"
              value={s}
              defaultChecked={s === "em_andamento"}
              className="accent-neutral-900"
            />
            {NOME_DO_STATUS[s]}
          </label>
        ))}
      </div>
      <p className="text-xs text-neutral-600">
        Metas que foram pausadas não voltam sozinhas.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAberto(false)}
          className={classeCancelar}
        >
          Cancelar
        </button>
        <BotaoEnviar className={classePrincipal}>Reabrir</BotaoEnviar>
      </div>
    </form>
  );
}

/**
 * Excluir (RF-PRO-11, 12). Sem metas associadas, basta confirmar. Com metas,
 * mesmo só no passado, sugere arquivar e pede o nome para excluir mesmo
 * assim. As metas ficam, sem associação.
 */
export function Excluir({
  projetoId,
  nome,
  temMetas,
  podeArquivar,
  recorrentes,
}: {
  projetoId: string;
  nome: string;
  temMetas: boolean;
  podeArquivar: boolean;
  recorrentes: MetaRecorrente[];
}) {
  const [aberto, setAberto] = useState(false);
  const [digitado, setDigitado] = useState("");
  const [estado, acao] = useActionState(excluirProjeto, {});

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="w-full rounded-lg px-4 py-3 text-center font-medium text-red-700"
      >
        Excluir projeto
      </button>
    );
  }

  const confere =
    digitado.trim().toLocaleLowerCase("pt-BR") ===
    nome.trim().toLocaleLowerCase("pt-BR");

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-red-50 p-3">
      {temMetas ? (
        <>
          <p className="text-sm text-red-900">
            Este projeto tem metas associadas. Arquivar guarda o projeto e o
            histórico. Excluir apaga o projeto para sempre, e as metas ficam sem
            projeto.
          </p>
          {podeArquivar && (
            <Encerrar
              projetoId={projetoId}
              status="arquivado"
              metas={recorrentes}
              principal
            />
          )}
        </>
      ) : (
        <p className="text-sm text-red-900">O projeto é apagado para sempre.</p>
      )}
      <form action={acao} className="flex flex-col gap-3">
        <input type="hidden" name="projetoId" value={projetoId} />
        {temMetas && (
          <label className="flex flex-col gap-1">
            <span className="text-xs text-red-900">
              Para excluir mesmo assim, digite <strong>{nome}</strong>
            </span>
            <input
              name="confirmacao"
              autoComplete="off"
              value={digitado}
              onChange={(e) => setDigitado(e.target.value)}
              className="rounded-lg border border-red-300 bg-white px-3 py-2.5 text-base outline-none focus:border-red-700"
            />
          </label>
        )}
        {estado.erro && <p className="text-sm text-red-700">{estado.erro}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAberto(false)}
            className={classeCancelar}
          >
            Cancelar
          </button>
          <BotaoEnviar
            disabled={temMetas && !confere}
            className="flex-1 rounded-lg bg-red-700 px-4 py-3 font-medium text-white disabled:opacity-50"
          >
            {temMetas ? "Excluir mesmo assim" : "Excluir"}
          </BotaoEnviar>
        </div>
      </form>
    </div>
  );
}
