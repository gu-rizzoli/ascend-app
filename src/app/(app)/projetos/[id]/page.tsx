import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { formatarDataCurta, hoje } from "@/domain/datas";
import {
  metasAtivasDoProjeto,
  NOME_DO_STATUS,
  prazoVencido,
  projetoEncerrado,
} from "@/domain/projetos";
import { descreverFrequencia } from "@/domain/recorrencia";
import { versaoDeReferencia } from "@/domain/vigencia";
import { metasDoUsuario } from "@/server/metas";
import {
  projetoAtualId,
  projetoDoUsuario,
  temMetasAssociadas,
} from "@/server/projetos";
import { exigirUsuario } from "@/server/sessao";
import { classeBotao } from "@/ui/botao";

import { Estrela, ProximoPasso, SeloPrazoVencido } from "../pecas";
import { Encerrar, Excluir, Reabrir } from "./acoes";

export const metadata: Metadata = { title: "Projeto · Ascend" };

type Props = { params: Promise<{ id: string }> };

/**
 * Detalhe do projeto (navegacao.md, /projetos/:id): dados, próximo passo,
 * metas ativas associadas (só leitura) e as ações de status e exclusão.
 */
export default async function PaginaProjeto({ params }: Props) {
  const usuario = await exigirUsuario();
  const dataHoje = hoje();
  const { id } = await params;
  const p = await projetoDoUsuario(usuario.id, id);
  if (!p) notFound();

  const [atualId, metas, temMetas] = await Promise.all([
    projetoAtualId(usuario.id),
    metasDoUsuario(usuario.id),
    temMetasAssociadas(p.id),
  ]);
  const encerrado = projetoEncerrado(p.status);
  const ativas = metasAtivasDoProjeto(metas, p.id, dataHoje).map((m) => {
    const v = versaoDeReferencia(m.versoes, dataHoje)!;
    return { id: m.id, titulo: v.titulo, versao: v };
  });
  const recorrentes = ativas
    .filter((m) => m.versao.frequencia !== "unica")
    .map(({ id, titulo }) => ({ id, titulo }));

  const resumo = [
    NOME_DO_STATUS[p.status],
    `Início ${formatarDataCurta(p.dataInicio)}`,
    p.prazo && `Prazo ${formatarDataCurta(p.prazo)}`,
  ].filter(Boolean);

  return (
    <>
      <header className="flex items-start gap-2">
        <Link
          href="/projetos"
          aria-label="Voltar"
          className="-ml-2 flex size-10 shrink-0 items-center justify-center rounded-full text-2xl text-neutral-600 hover:bg-neutral-100"
        >
          ‹
        </Link>
        <h1 className="min-w-0 flex-1 pt-1 text-xl font-semibold break-words">
          {p.nome}
        </h1>
        {!encerrado && <Estrela projetoId={p.id} atual={p.id === atualId} />}
      </header>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-600">
        {p.id === atualId && (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900">
            Projeto atual
          </span>
        )}
        <span>{resumo.join(" · ")}</span>
        {prazoVencido(p, dataHoje) && <SeloPrazoVencido />}
      </div>

      <section className="mt-4">
        <h2 className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
          Próximo passo
        </h2>
        {encerrado ? (
          <p className="py-1 text-sm text-neutral-600">
            {p.proximoPasso ?? "—"}
          </p>
        ) : (
          <ProximoPasso projetoId={p.id} texto={p.proximoPasso} />
        )}
      </section>

      {p.descricao && (
        <p className="mt-4 text-sm whitespace-pre-line text-neutral-700">
          {p.descricao}
        </p>
      )}

      <section className="mt-6">
        <h2 className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
          Metas ativas
        </h2>
        {ativas.length > 0 ? (
          <ul className="bg-superficie mt-1 divide-y divide-neutral-200 rounded-2xl px-4 shadow-sm">
            {ativas.map((m) => (
              <li key={m.id}>
                <Link href={`/metas/${m.id}`} className="flex flex-col py-2.5">
                  <span className="truncate">{m.titulo}</span>
                  <span className="text-xs text-neutral-500">
                    {descreverFrequencia(m.versao)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-neutral-500">
            Nenhuma. Associe uma meta pelo campo Projeto, ao criar ou editar a
            meta.
          </p>
        )}
      </section>

      <section className="mt-8 flex flex-col gap-3">
        <Link href={`/projetos/${p.id}/editar`} className={classeBotao}>
          Editar
        </Link>
        {encerrado && <Reabrir projetoId={p.id} />}
        {!encerrado && (
          <Encerrar projetoId={p.id} status="concluido" metas={recorrentes} />
        )}
        {p.status !== "arquivado" && (
          <Encerrar projetoId={p.id} status="arquivado" metas={recorrentes} />
        )}
        <Excluir
          projetoId={p.id}
          nome={p.nome}
          temMetas={temMetas}
          podeArquivar={p.status !== "arquivado"}
          recorrentes={recorrentes}
        />
      </section>
    </>
  );
}
