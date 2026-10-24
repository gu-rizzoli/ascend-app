"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { diaDaSemana, type DataCivil } from "@/domain/datas";
import type { Frequencia } from "@/domain/recorrencia";
import { criarMeta } from "@/server/acoes-metas";
import { Botao } from "@/ui/botao";
import { Campo } from "@/ui/campo";

const FREQUENCIAS: { valor: Frequencia; nome: string }[] = [
  { valor: "unica", nome: "Só nesta data" },
  { valor: "diaria", nome: "Todo dia" },
  { valor: "semanal", nome: "Dias da semana" },
  { valor: "intervalo", nome: "A cada X dias" },
];

const DIAS = [
  { valor: 0, letra: "D", nome: "Domingo" },
  { valor: 1, letra: "S", nome: "Segunda" },
  { valor: 2, letra: "T", nome: "Terça" },
  { valor: 3, letra: "Q", nome: "Quarta" },
  { valor: 4, letra: "Q", nome: "Quinta" },
  { valor: 5, letra: "S", nome: "Sexta" },
  { valor: 6, letra: "S", nome: "Sábado" },
];

function Erro({ id, texto }: { id: string; texto?: string }) {
  if (!texto) return null;
  return (
    <span id={id} className="text-sm text-red-700">
      {texto}
    </span>
  );
}

/** Opções lado a lado, com cara de botão, para escolher com um toque. */
function Opcao({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex-1 cursor-pointer rounded-lg border border-neutral-300 px-3 py-2.5 text-center text-sm font-medium has-checked:border-neutral-900 has-checked:bg-neutral-900 has-checked:text-white">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {children}
    </label>
  );
}

type Props = {
  dataAberta: DataCivil;
  hoje: DataCivil;
  frequenciaInicial: Frequencia;
  voltar: string;
};

export function FormularioNovaMeta({
  dataAberta,
  hoje,
  frequenciaInicial,
  voltar,
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
    maisOpcoes || Boolean(erros.descricao || erros.horario || erros.dataInicio);

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

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Frequência</legend>
        <div className="grid grid-cols-2 gap-2">
          {FREQUENCIAS.map((f) => (
            <Opcao
              key={f.valor}
              name="frequencia"
              value={f.valor}
              checked={frequencia === f.valor}
              onChange={() => setFrequencia(f.valor)}
            >
              {f.nome}
            </Opcao>
          ))}
        </div>

        {frequencia === "semanal" && (
          <div className="flex flex-col gap-1">
            <div
              className="flex justify-between gap-1"
              aria-describedby={
                erros.diasSemana ? "diasSemana-erro" : undefined
              }
            >
              {DIAS.map((dia) => (
                <label
                  key={dia.valor}
                  title={dia.nome}
                  className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-neutral-300 text-sm font-medium has-checked:border-neutral-900 has-checked:bg-neutral-900 has-checked:text-white"
                >
                  <input
                    type="checkbox"
                    name="diasSemana"
                    value={dia.valor}
                    aria-label={dia.nome}
                    defaultChecked={diasMarcados.includes(String(dia.valor))}
                    className="sr-only"
                  />
                  {dia.letra}
                </label>
              ))}
            </div>
            <Erro id="diasSemana-erro" texto={erros.diasSemana} />
          </div>
        )}

        {frequencia === "intervalo" && (
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 text-sm">
              A cada
              <input
                name="intervaloDias"
                inputMode="numeric"
                defaultValue={v?.intervaloDias ?? "2"}
                aria-invalid={erros.intervaloDias ? true : undefined}
                aria-describedby={
                  erros.intervaloDias ? "intervaloDias-erro" : undefined
                }
                className="w-16 rounded-lg border border-neutral-300 px-3 py-2 text-center text-base outline-none focus:border-neutral-900 aria-invalid:border-red-600"
              />
              dias
            </label>
            <Erro id="intervaloDias-erro" texto={erros.intervaloDias} />
          </div>
        )}
      </fieldset>

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
