"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  DESCRICAO_MAXIMA,
  NOME_DO_STATUS,
  NOME_MAXIMO,
  PROXIMO_PASSO_MAXIMO,
  STATUS_ABERTOS,
  type CamposProjeto,
  type StatusProjeto,
} from "@/domain/projetos";
import {
  criarProjeto,
  editarProjeto,
  type EstadoProjeto,
} from "@/server/acoes-projetos";
import { Botao } from "@/ui/botao";
import { Campo } from "@/ui/campo";

import { Erro } from "../metas/campos-meta";

type Props = {
  voltar: string;
  inicial: CamposProjeto;
} & (
  | { modo: "criar"; semAtual: boolean }
  | { modo: "editar"; projetoId: string; statusAtual: StatusProjeto }
);

/**
 * Criar ou editar projeto (RF-PRO-01, 05, 06). Só o nome é obrigatório.
 * Concluir e arquivar ficam no detalhe, porque perguntam o que fazer com as
 * metas (RF-PRO-09).
 */
export function FormularioProjeto(props: Props) {
  const [estado, acao, enviando] = useActionState<EstadoProjeto, FormData>(
    props.modo === "criar" ? criarProjeto : editarProjeto,
    {},
  );
  const v = estado.valores ?? props.inicial;
  const erros = estado.erros ?? {};
  const encerrado =
    props.modo === "editar" &&
    (props.statusAtual === "concluido" || props.statusAtual === "arquivado");
  const opcoes: StatusProjeto[] = encerrado
    ? [props.statusAtual, ...STATUS_ABERTOS]
    : [...STATUS_ABERTOS];

  return (
    <form action={acao} className="mt-4 flex flex-col gap-5" noValidate>
      {props.modo === "editar" && (
        <input type="hidden" name="projetoId" value={props.projetoId} />
      )}
      <Campo
        rotulo="Nome"
        name="nome"
        autoFocus={props.modo === "criar"}
        autoComplete="off"
        maxLength={NOME_MAXIMO}
        placeholder="Ex.: TCC"
        defaultValue={v.nome}
        erro={erros.nome}
      />

      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-medium">Status</legend>
        <div
          className={`grid gap-2 ${encerrado ? "grid-cols-2" : "grid-cols-3"}`}
        >
          {opcoes.map((s) => (
            <OpcaoStatus key={s} status={s} inicial={v.status} />
          ))}
        </div>
        {encerrado && (
          <span className="text-xs text-neutral-500">
            Escolher outro status reabre o projeto. Metas pausadas continuam
            pausadas.
          </span>
        )}
        <Erro id="status-erro" texto={erros.status} />
      </fieldset>

      <Campo
        rotulo="Próximo passo"
        name="proximoPasso"
        autoComplete="off"
        maxLength={PROXIMO_PASSO_MAXIMO}
        placeholder="Ex.: Ler o capítulo 2"
        defaultValue={v.proximoPasso}
        erro={erros.proximoPasso}
      />

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Descrição</span>
        <textarea
          name="descricao"
          rows={3}
          maxLength={DESCRICAO_MAXIMA}
          defaultValue={v.descricao}
          className="focus:border-acento rounded-lg border border-neutral-300 px-3 py-2.5 text-base outline-none"
        />
        <Erro id="descricao-erro" texto={erros.descricao} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <Campo
          rotulo="Início"
          name="dataInicio"
          type="date"
          defaultValue={v.dataInicio}
          erro={erros.dataInicio}
        />
        <Campo
          rotulo="Prazo (opcional)"
          name="prazo"
          type="date"
          defaultValue={v.prazo}
          erro={erros.prazo}
        />
      </div>

      {props.modo === "criar" && (
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="tornarAtual"
            defaultChecked={estado.valores?.tornarAtual ?? props.semAtual}
            className="accent-acento size-5"
          />
          <span>Tornar projeto atual</span>
        </label>
      )}

      {estado.erro && (
        <p role="alert" className="text-sm text-red-700">
          {estado.erro}
        </p>
      )}

      <div className="mt-2 flex flex-col gap-2">
        <Botao type="submit" disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar"}
        </Botao>
        <Link
          href={props.voltar}
          className="rounded-lg px-4 py-3 text-center font-medium text-neutral-600"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}

function OpcaoStatus({
  status,
  inicial,
}: {
  status: StatusProjeto;
  inicial: string;
}) {
  return (
    <label className="has-checked:border-acento has-checked:bg-acento cursor-pointer rounded-lg border border-neutral-300 px-2 py-2.5 text-center text-sm font-medium has-checked:text-white">
      <input
        type="radio"
        name="status"
        value={status}
        defaultChecked={inicial === status}
        className="sr-only"
      />
      {NOME_DO_STATUS[status]}
    </label>
  );
}
