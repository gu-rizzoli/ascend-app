import type { Metadata } from "next";
import Link from "next/link";

import { hoje, type DataCivil } from "@/domain/datas";
import {
  agruparProjetos,
  NOME_DO_STATUS,
  prazoVencido,
  projetoEncerrado,
} from "@/domain/projetos";
import {
  projetoAtualId,
  projetosDoUsuario,
  type Projeto,
} from "@/server/projetos";
import { exigirUsuario } from "@/server/sessao";
import { classeBotao } from "@/ui/botao";
import { BotaoFlutuante } from "@/ui/botao-flutuante";

import { Estrela, ProximoPasso, SeloPrazoVencido } from "./pecas";

export const metadata: Metadata = { title: "Projetos · Ascend" };

function LinhaDoProjeto({
  p,
  atual,
  dataHoje,
}: {
  p: Projeto;
  atual: boolean;
  dataHoje: DataCivil;
}) {
  const encerrado = projetoEncerrado(p.status);
  return (
    <li className="flex items-start gap-2 py-2">
      {encerrado ? (
        <span className="size-10 shrink-0" />
      ) : (
        <Estrela projetoId={p.id} atual={atual} />
      )}
      <div className="flex min-w-0 flex-1 flex-col pt-1.5">
        <div className="flex items-center gap-2">
          <Link
            href={`/projetos/${p.id}`}
            className="min-w-0 truncate font-medium"
          >
            {p.nome}
          </Link>
          {prazoVencido(p, dataHoje) && <SeloPrazoVencido />}
        </div>
        {encerrado ? (
          p.proximoPasso && (
            <p className="truncate py-1 text-sm text-neutral-500">
              → {p.proximoPasso}
            </p>
          )
        ) : (
          <ProximoPasso projetoId={p.id} texto={p.proximoPasso} />
        )}
      </div>
    </li>
  );
}

function Grupo({
  titulo,
  projetos,
  dataHoje,
}: {
  titulo: string;
  projetos: Projeto[];
  dataHoje: DataCivil;
}) {
  if (projetos.length === 0) return null;
  return (
    <section className="mt-6">
      <h2 className="text-sm font-medium text-neutral-500">
        {titulo} · {projetos.length}
      </h2>
      <ul className="mt-1 divide-y divide-neutral-200">
        {projetos.map((p) => (
          <LinhaDoProjeto key={p.id} p={p} atual={false} dataHoje={dataHoje} />
        ))}
      </ul>
    </section>
  );
}

/** Concluídos e arquivados ficam recolhidos no fim (RNF-13). */
function GrupoRecolhido({
  titulo,
  projetos,
  dataHoje,
}: {
  titulo: string;
  projetos: Projeto[];
  dataHoje: DataCivil;
}) {
  if (projetos.length === 0) return null;
  return (
    <details className="mt-6">
      <summary className="cursor-pointer text-sm font-medium text-neutral-500 select-none">
        {titulo} · {projetos.length}
      </summary>
      <ul className="mt-1 divide-y divide-neutral-200">
        {projetos.map((p) => (
          <LinhaDoProjeto key={p.id} p={p} atual={false} dataHoje={dataHoje} />
        ))}
      </ul>
    </details>
  );
}

/**
 * Lista de projetos (projetos.md, "Lista de projetos"): o atual no topo, em
 * destaque, e abaixo os grupos por status.
 */
export default async function PaginaProjetos() {
  const usuario = await exigirUsuario();
  const dataHoje = hoje();
  const [projetos, atualId] = await Promise.all([
    projetosDoUsuario(usuario.id),
    projetoAtualId(usuario.id),
  ]);
  const g = agruparProjetos(projetos, atualId);

  return (
    <>
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Projetos</h1>
      </header>

      {projetos.length === 0 ? (
        <section className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="max-w-64 text-neutral-600">
            Um projeto é um foco com status e próximo passo. O projeto atual
            aparece em Hoje.
          </p>
          <Link href="/projetos/novo" className={classeBotao}>
            Criar primeiro projeto
          </Link>
        </section>
      ) : (
        <>
          {g.atual ? (
            <section className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1">
              <h2 className="px-1 pt-2 text-xs font-medium tracking-wide text-amber-800 uppercase">
                Projeto atual · {NOME_DO_STATUS[g.atual.status]}
              </h2>
              <ul>
                <LinhaDoProjeto p={g.atual} atual dataHoje={dataHoje} />
              </ul>
            </section>
          ) : (
            <p className="mt-4 rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
              Nenhum projeto atual. Toque na estrela de um projeto para
              destacá-lo em Hoje.
            </p>
          )}
          <Grupo
            titulo="Em andamento"
            projetos={g.emAndamento}
            dataHoje={dataHoje}
          />
          <Grupo
            titulo="Planejados"
            projetos={g.planejados}
            dataHoje={dataHoje}
          />
          <Grupo titulo="Pausados" projetos={g.pausados} dataHoje={dataHoje} />
          <GrupoRecolhido
            titulo="Concluídos"
            projetos={g.concluidos}
            dataHoje={dataHoje}
          />
          <GrupoRecolhido
            titulo="Arquivados"
            projetos={g.arquivados}
            dataHoje={dataHoje}
          />

          <BotaoFlutuante href="/projetos/novo" rotulo="Novo projeto" />
        </>
      )}
    </>
  );
}
