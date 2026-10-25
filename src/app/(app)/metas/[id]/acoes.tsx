"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { formatarDataCurta, somarDias, type DataCivil } from "@/domain/datas";
import {
  adiarOcorrencia,
  excluirMeta,
  reagendarOcorrencia,
  type EstadoNovaData,
} from "@/server/acoes-recorrencia";

import type { ContextoDaMeta } from "../enderecos";

const classeSecundario =
  "w-full rounded-lg border border-neutral-300 px-4 py-3 text-center font-medium disabled:opacity-50";

function CamposDoContexto({
  metaId,
  contexto,
}: {
  metaId: string;
  contexto: ContextoDaMeta;
}) {
  return (
    <>
      <input type="hidden" name="metaId" value={metaId} />
      <input type="hidden" name="dia" value={contexto.dia ?? ""} />
      <input type="hidden" name="vaga" value={contexto.vaga ?? ""} />
      <input
        type="hidden"
        name="ocorrencia"
        value={contexto.ocorrencia ?? ""}
      />
    </>
  );
}

function BotaoEnviar({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? "Salvando…" : children}
    </button>
  );
}

/**
 * Escolher uma data nova, com atalhos "Hoje" e "Amanhã" e um calendário
 * (fluxos-metas.md, "Reagendar"). Serve para adiar uma pendente e para
 * reagendar uma não concluída.
 */
export function EscolherData({
  modo,
  metaId,
  contexto,
  hoje,
  dataAtual,
  ocorrenciaId,
}: {
  modo: "adiar" | "reagendar";
  metaId: string;
  contexto: ContextoDaMeta;
  hoje: DataCivil;
  dataAtual: DataCivil;
  // A ocorrência gravada; reagendar só existe para uma não concluída, que
  // sempre está gravada.
  ocorrenciaId: string | null;
}) {
  const [aberto, setAberto] = useState(false);
  const acao = modo === "adiar" ? adiarOcorrencia : reagendarOcorrencia;
  const [estado, enviar] = useActionState<EstadoNovaData, FormData>(acao, {});
  const amanha = somarDias(hoje, 1);
  const [escolhida, setEscolhida] = useState<string>(
    dataAtual < hoje ? hoje : amanha,
  );
  const rotulo = modo === "adiar" ? "Mudar a data" : "Reagendar";

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

  const atalhos = [
    { data: hoje, nome: "Hoje" },
    { data: amanha, nome: "Amanhã" },
  ].filter((a) => a.data !== dataAtual);

  return (
    <form
      action={enviar}
      className="flex flex-col gap-3 rounded-lg bg-neutral-100 p-3"
    >
      <CamposDoContexto metaId={metaId} contexto={contexto} />
      <input type="hidden" name="original" value={ocorrenciaId ?? ""} />
      <p className="text-sm text-neutral-600">
        {modo === "adiar"
          ? "Esta ocorrência passa para outra data. Ela ainda não falhou, então nada fica registrado como não concluído."
          : `A ocorrência de ${formatarDataCurta(dataAtual)} continua não concluída, e uma nova é criada na data escolhida, com o mesmo valor.`}
      </p>
      <div className="flex gap-2">
        {atalhos.map((a) => (
          <button
            key={a.data}
            type="button"
            aria-pressed={escolhida === a.data}
            onClick={() => setEscolhida(a.data)}
            className="flex-1 rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm aria-pressed:bg-neutral-900 aria-pressed:text-white"
          >
            {a.nome}
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-neutral-600">
          Ou escolha no calendário
        </span>
        <input
          type="date"
          name="novaData"
          min={hoje}
          value={escolhida}
          onChange={(e) => setEscolhida(e.target.value)}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base outline-none focus:border-neutral-900"
        />
      </label>
      {estado.erro && <p className="text-sm text-red-700">{estado.erro}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="flex-1 rounded-lg px-4 py-3 font-medium text-neutral-600"
        >
          Cancelar
        </button>
        <BotaoEnviar className="flex-1 rounded-lg bg-neutral-900 px-4 py-3 font-medium text-white disabled:opacity-50">
          {rotulo}
        </BotaoEnviar>
      </div>
    </form>
  );
}

/** Excluir pede confirmação e diz o que acontece com o passado (10.9). */
export function ConfirmarExclusao({
  metaId,
  contexto,
  recorrente,
}: {
  metaId: string;
  contexto: ContextoDaMeta;
  recorrente: boolean;
}) {
  const [confirmando, setConfirmando] = useState(false);
  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="w-full rounded-lg px-4 py-3 text-center font-medium text-red-700"
      >
        Excluir meta
      </button>
    );
  }
  return (
    <form
      action={excluirMeta}
      className="flex flex-col gap-3 rounded-lg bg-red-50 p-3"
    >
      <CamposDoContexto metaId={metaId} contexto={contexto} />
      <p className="text-sm text-red-900">
        {recorrente
          ? "A meta para de aparecer nos próximos dias. Os dias que já passaram continuam no Histórico."
          : "A meta é apagada. Se ela já tiver um dia registrado, esse dia continua no Histórico."}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="flex-1 rounded-lg px-4 py-3 font-medium text-neutral-600"
        >
          Cancelar
        </button>
        <BotaoEnviar className="flex-1 rounded-lg bg-red-700 px-4 py-3 font-medium text-white disabled:opacity-50">
          Excluir
        </BotaoEnviar>
      </div>
    </form>
  );
}
