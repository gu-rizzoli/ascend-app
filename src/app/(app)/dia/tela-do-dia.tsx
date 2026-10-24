import Link from "next/link";

import {
  diferencaEmDias,
  formatarDataLonga,
  hoje,
  somarDias,
  type DataCivil,
} from "@/domain/datas";
import { diaEditavel, resumoDoDia } from "@/domain/metas";
import { listaDoDia, temAlgumaMeta } from "@/server/metas";
import { exigirUsuario } from "@/server/sessao";
import { classeBotao } from "@/ui/botao";

import { LinhaBinaria, LinhaNumerica } from "./linhas";

function enderecoDoDia(data: DataCivil, dataHoje: DataCivil): string {
  return data === dataHoje ? "/hoje" : `/dia/${data}`;
}

function rotuloRelativo(data: DataCivil, dataHoje: DataCivil): string | null {
  const distancia = diferencaEmDias(dataHoje, data);
  if (distancia === 0) return "Hoje";
  if (distancia === 1) return "Amanhã";
  if (distancia === -1) return "Ontem";
  return null;
}

function textoDoResumo(concluidas: number, total: number): string {
  return `${concluidas} de ${total} ${total === 1 ? "concluída" : "concluídas"}`;
}

/**
 * A lista de uma data (fluxos-metas.md, "Tela Hoje"). Hoje e datas futuras
 * são editáveis; dias passados ficam só para leitura.
 */
export async function TelaDoDia({ data }: { data: DataCivil }) {
  const usuario = await exigirUsuario();
  const dataHoje = hoje();
  const [itens, temMeta] = await Promise.all([
    listaDoDia(usuario.id, data),
    temAlgumaMeta(usuario.id),
  ]);
  const editavel = diaEditavel(data, dataHoje);
  const { concluidas, total } = resumoDoDia(itens);
  const novaMeta = `/metas/novo?data=${data}`;
  const rotulo = rotuloRelativo(data, dataHoje);

  return (
    <>
      <header className="flex items-center justify-between gap-2">
        <Link
          href={enderecoDoDia(somarDias(data, -1), dataHoje)}
          aria-label="Dia anterior"
          className="flex size-10 items-center justify-center rounded-full text-2xl text-neutral-600 hover:bg-neutral-100"
        >
          ‹
        </Link>
        <div className="text-center">
          {rotulo && (
            <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
              {rotulo}
            </p>
          )}
          <h1 className="text-xl font-semibold">{formatarDataLonga(data)}</h1>
        </div>
        <Link
          href={enderecoDoDia(somarDias(data, 1), dataHoje)}
          aria-label="Próximo dia"
          className="flex size-10 items-center justify-center rounded-full text-2xl text-neutral-600 hover:bg-neutral-100"
        >
          ›
        </Link>
      </header>

      <div className="mt-1 flex min-h-6 items-center justify-center gap-3 text-sm">
        {total > 0 && (
          <span className="text-neutral-600">
            {textoDoResumo(concluidas, total)}
          </span>
        )}
        {data !== dataHoje && (
          <Link href="/hoje" className="font-medium underline">
            Voltar para hoje
          </Link>
        )}
      </div>

      {!editavel && (
        <p className="mt-4 rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
          Este dia já passou e fica só para leitura.
        </p>
      )}

      {itens.length > 0 ? (
        <ul className="mt-4 divide-y divide-neutral-200">
          {itens.map((item) =>
            item.tipo === "numerica" ? (
              <LinhaNumerica key={item.chave} item={item} editavel={editavel} />
            ) : (
              <LinhaBinaria key={item.chave} item={item} editavel={editavel} />
            ),
          )}
        </ul>
      ) : !temMeta ? (
        // Primeiro acesso (11.2, RF-GLO-06).
        <section className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="max-w-64 text-neutral-600">
            Você ainda não tem metas. Comece pela primeira e ela aparece aqui no
            dia certo.
          </p>
          {editavel && (
            <Link href={novaMeta} className={classeBotao}>
              Criar primeira meta
            </Link>
          )}
        </section>
      ) : (
        <section className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-neutral-600">
            {editavel
              ? "Nada planejado para este dia."
              : "Nada registrado neste dia."}
          </p>
        </section>
      )}

      {editavel && temMeta && (
        <div className="pointer-events-none fixed inset-x-0 bottom-20 z-10 mx-auto flex max-w-md justify-end px-4">
          <Link
            href={novaMeta}
            aria-label="Nova meta"
            className="pointer-events-auto flex size-14 items-center justify-center rounded-full bg-neutral-900 text-3xl leading-none text-white shadow-lg"
          >
            +
          </Link>
        </div>
      )}
    </>
  );
}
