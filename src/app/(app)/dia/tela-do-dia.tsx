import Link from "next/link";

import {
  diferencaEmDias,
  formatarDataLonga,
  hoje,
  somarDias,
  type DataCivil,
} from "@/domain/datas";
import { diaEditavel, resumoDoDia } from "@/domain/metas";
import { prazoVencido } from "@/domain/projetos";
import { usuarioComDiasFechados } from "@/server/fechamento";
import { listaDoDia, temAlgumaMeta } from "@/server/metas";
import { projetoAtual, projetoEmFoco } from "@/server/projetos";
import { classeBotao } from "@/ui/botao";
import { BotaoFlutuante } from "@/ui/botao-flutuante";

import { ProximoPasso, SeloPrazoVencido } from "../projetos/pecas";
import { LinhaBinaria, LinhaNumerica, type Modo } from "./linhas";
import { SetaDoDia } from "./seta-do-dia";

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
  voltarAoHistorico = false,
}: {
  data: DataCivil;
  corrigindo?: boolean;
  voltarAoHistorico?: boolean;
}) {
  // Fecha os dias vencidos antes de ler: um dia passado nunca aparece com
  // metas pendentes.
  const usuario = await usuarioComDiasFechados();
  const dataHoje = hoje();
  // Hoje e os próximos dias mostram o projeto atual. Um dia passado mostra o
  // que estava em foco naquele dia, sem o próximo passo, que é de agora
  // (projetos.md, decisão 12).
  const passado = data < dataHoje;
  const [itens, temMeta, projeto] = await Promise.all([
    listaDoDia(usuario.id, data),
    temAlgumaMeta(usuario.id),
    passado ? projetoEmFoco(usuario.id, data) : projetoAtual(usuario.id),
  ]);
  const editavel = diaEditavel(data, dataHoje);
  const modo: Modo = editavel ? "editar" : corrigindo ? "corrigir" : "ler";
  const { concluidas, total } = resumoDoDia(itens);
  const novaMeta = `/metas/novo?data=${data}`;
  const rotulo = rotuloRelativo(data, dataHoje);

  return (
    <>
      <header className="flex items-center justify-between gap-2">
        <SetaDoDia
          href={enderecoDoDia(somarDias(data, -1), dataHoje)}
          rotulo="Dia anterior"
        >
          ‹
        </SetaDoDia>
        <div className="text-center">
          {rotulo && (
            <p className="text-acento text-xs font-bold tracking-widest uppercase">
              {rotulo}
            </p>
          )}
          <h1 className="text-xl font-bold tracking-tight">
            {formatarDataLonga(data)}
          </h1>
        </div>
        <SetaDoDia
          href={enderecoDoDia(somarDias(data, 1), dataHoje)}
          rotulo="Próximo dia"
        >
          ›
        </SetaDoDia>
      </header>

      {total > 0 && (
        // O resumo do dia, também como barra.
        <div className="bg-superficie mt-4 rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-semibold">
              {textoDoResumo(concluidas, total)}
            </span>
            <span className="text-acento font-bold tabular-nums">
              {Math.round((concluidas / total) * 100)}%
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-200">
            <div
              className="bg-acento h-full rounded-full transition-[width]"
              style={{ width: `${(concluidas / total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-2 flex min-h-6 items-center justify-center gap-3 text-sm">
        {data !== dataHoje && (
          <Link
            href="/hoje"
            prefetch
            className="text-acento font-semibold underline"
          >
            Voltar para hoje
          </Link>
        )}
        {temMeta && (
          <Link href="/metas" className="text-neutral-600 underline">
            Todas as metas
          </Link>
        )}
      </div>

      {projeto && (
        // Projeto atual (fluxos-metas.md, "Tela Hoje", item 3).
        <section className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-amber-500">
              ★
            </span>
            <Link
              href={`/projetos/${projeto.id}`}
              className="min-w-0 truncate text-sm font-medium"
            >
              {projeto.nome}
            </Link>
            {passado ? (
              <span className="shrink-0 text-xs text-amber-800">
                em foco neste dia
              </span>
            ) : (
              prazoVencido(projeto, dataHoje) && <SeloPrazoVencido />
            )}
          </div>
          {!passado && (
            <ProximoPasso projetoId={projeto.id} texto={projeto.proximoPasso} />
          )}
        </section>
      )}

      {modo === "ler" && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
          <p>Dia encerrado.</p>
          {itens.length > 0 && (
            <Link
              href={`/dia/${data}?corrigir=1`}
              className="bg-superficie text-acento rounded-full px-3 py-1.5 font-medium shadow-sm"
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
            href={voltarAoHistorico ? `/historico/${data}` : `/dia/${data}`}
            className="bg-acento shrink-0 rounded-full px-3 py-1.5 font-medium text-white"
          >
            Pronto
          </Link>
        </div>
      )}

      {itens.length > 0 ? (
        <ul className="bg-superficie mt-3 divide-y divide-neutral-200 rounded-2xl px-4 shadow-sm">
          {itens.map((item) =>
            item.tipo === "numerica" ? (
              <LinhaNumerica
                key={item.chave}
                item={item}
                modo={modo}
                dia={data}
              />
            ) : (
              <LinhaBinaria
                key={item.chave}
                item={item}
                modo={modo}
                dia={data}
              />
            ),
          )}
        </ul>
      ) : !temMeta && editavel ? (
        // Primeiro acesso (11.2, RF-GLO-06). Num dia encerrado, cai no
        // "Nada registrado".
        <section className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="max-w-64 text-neutral-600">
            Você ainda não tem metas. Comece pela primeira e ela aparece aqui no
            dia certo.
          </p>
          <Link href={novaMeta} className={classeBotao}>
            Criar primeira meta
          </Link>
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
        <BotaoFlutuante href={novaMeta} rotulo="Nova meta" />
      )}
    </>
  );
}
