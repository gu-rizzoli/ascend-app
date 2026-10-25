"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { diaDaSemana, type DataCivil } from "@/domain/datas";
import type { Frequencia } from "@/domain/recorrencia";
import { criarMeta } from "@/server/acoes-metas";
import { Botao } from "@/ui/botao";
import { Campo } from "@/ui/campo";

import { CampoProjeto, CamposFrequencia, Erro, Opcao } from "../campos-meta";

type Props = {
  dataAberta: DataCivil;
  hoje: DataCivil;
  frequenciaInicial: Frequencia;
  voltar: string;
  projetos: { id: string; nome: string }[];
};

export function FormularioNovaMeta({
  dataAberta,
  hoje,
  frequenciaInicial,
  voltar,
  projetos,
}: Props) {
  const [estado, acao, enviando] = useActionState(criarMeta, {});
  const v = estado.valores;
  const erros = estado.erros ?? {};

  const [tipo, setTipo] = useState(v?.tipo ?? "binaria");
  const [frequencia, setFrequencia] = useState<string>(
    v?.frequencia ?? frequenciaInicial,
  );
  const [maisOpcoes, setMaisOpcoes] = useState(false);
  const abrirMaisOpcoes =
    maisOpcoes ||
    Boolean(
      erros.descricao || erros.horario || erros.dataInicio || erros.projeto,
    );

  // Em "Dias da semana", o dia da data aberta já vem marcado.
  const diasMarcados = v?.diasSemana ?? [String(diaDaSemana(dataAberta))];

  return (
    <form action={acao} className="mt-4 flex flex-col gap-5" noValidate>
      <Campo
        rotulo="Título"
        name="titulo"
        autoFocus
        autoComplete="off"
        maxLength={120}
        placeholder="Ex.: Beber água"
        defaultValue={v?.titulo}
        erro={erros.titulo}
      />

      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-medium">Tipo</legend>
        <div className="flex gap-2">
          <Opcao
            name="tipo"
            value="binaria"
            checked={tipo === "binaria"}
            onChange={() => setTipo("binaria")}
          >
            Binária
          </Opcao>
          <Opcao
            name="tipo"
            value="numerica"
            checked={tipo === "numerica"}
            onChange={() => setTipo("numerica")}
          >
            Numérica
          </Opcao>
        </div>
        <span className="text-xs text-neutral-500">
          {tipo === "binaria"
            ? "Feita ou não feita, ex.: ir à academia."
            : "Um valor para atingir, ex.: 3 L de água."}
        </span>
      </fieldset>

      {tipo === "numerica" && (
        <div className="grid grid-cols-2 gap-3">
          <Campo
            rotulo="Alvo"
            name="valorAlvo"
            inputMode="decimal"
            placeholder="Ex.: 3"
            defaultValue={v?.valorAlvo}
            erro={erros.valorAlvo}
          />
          <Campo
            rotulo="Unidade"
            name="unidade"
            maxLength={20}
            placeholder="Ex.: L"
            defaultValue={v?.unidade}
            erro={erros.unidade}
          />
        </div>
      )}

      <CamposFrequencia
        frequencia={frequencia}
        mudarFrequencia={setFrequencia}
        diasMarcados={diasMarcados}
        intervalo={v?.intervaloDias ?? "2"}
        erros={erros}
      />

      <details
        open={abrirMaisOpcoes}
        onToggle={(e) => setMaisOpcoes(e.currentTarget.open)}
        className="group"
      >
        <summary className="cursor-pointer text-sm font-medium text-neutral-700 select-none">
          Mais opções
        </summary>
        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Descrição</span>
            <textarea
              name="descricao"
              rows={2}
              maxLength={500}
              defaultValue={v?.descricao}
              className="rounded-lg border border-neutral-300 px-3 py-2.5 text-base outline-none focus:border-neutral-900"
            />
            <Erro id="descricao-erro" texto={erros.descricao} />
          </label>
          <Campo
            rotulo="Horário"
            name="horario"
            type="time"
            defaultValue={v?.horario}
            erro={erros.horario}
          />
          <Campo
            rotulo={frequencia === "unica" ? "Data" : "Começa em"}
            name="dataInicio"
            type="date"
            min={hoje}
            defaultValue={v?.dataInicio ?? dataAberta}
            erro={erros.dataInicio}
          />
          {projetos.length > 0 && (
            <CampoProjeto
              projetos={projetos}
              valor={v?.projeto ?? ""}
              erro={erros.projeto}
            />
          )}
        </div>
      </details>

      <div className="mt-2 flex flex-col gap-2">
        <Botao type="submit" disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar"}
        </Botao>
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
