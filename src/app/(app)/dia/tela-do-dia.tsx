import Link from "next/link";

import {
  diferencaEmDias,
  formatarDataLonga,
  hoje,
  somarDias,
  type DataCivil,
} from "@/domain/datas";
import { diaEditavel, resumoDoDia } from "@/domain/metas";
import { usuarioComDiasFechados } from "@/server/fechamento";
import { listaDoDia, temAlgumaMeta } from "@/server/metas";
import { classeBotao } from "@/ui/botao";

import { LinhaBinaria, LinhaNumerica, type Modo } from "./linhas";

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
 * são editáveis. Dias passados já estão encerrados: ficam só para leitura,
 * com o botão Corrigir para a correção retroativa (RF-MET-12).
 */
export async function TelaDoDia({
  data,
  corrigindo = false,
}: {
  data: DataCivil;
  corrigindo?: boolean;
}) {
  // Fecha os dias vencidos antes de ler: um dia passado nunca aparece com
  // metas pendentes.
  const usuario = await usuarioComDiasFechados();
  const dataHoje = hoje();
  const [itens, temMeta] = await Promise.all([
    listaDoDia(usuario.id, data),
    temAlgumaMeta(usuario.id),
  ]);
  const editavel = diaEditavel(data, dataHoje);
  const modo: Modo = editavel ? "editar" : corrigindo ? "corrigir" : "ler";
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

      {modo === "ler" && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
          <p>Dia encerrado.</p>
          {itens.length > 0 && (
            <Link
              href={`/dia/${data}?corrigir=1`}
              className="rounded-full bg-white px-3 py-1.5 font-medium text-neutral-900 shadow-sm"
            >
              Corrigir
            </Link>
          )}
        </div>
      )}

      {modo === "corrigir" && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <p>
            Corrigindo este dia. Cada mudança salva na hora e fica marcada como
            corrigida.
          </p>
          <Link
            href={`/dia/${data}`}
            className="shrink-0 rounded-full bg-neutral-900 px-3 py-1.5 font-medium text-white"
          >
            Pronto
          </Link>
        </div>
      )}

      {itens.length > 0 ? (
        <ul className="mt-4 divide-y divide-neutral-200">
          {itens.map((item) =>
            item.tipo === "numerica" ? (
              <LinhaNumerica key={item.chave} item={item} modo={modo} />
            ) : (
              <LinhaBinaria key={item.chave} item={item} modo={modo} />
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
