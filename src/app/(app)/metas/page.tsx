import type { Metadata } from "next";
import Link from "next/link";

import { formatarDataCurta, hoje, type DataCivil } from "@/domain/datas";
import { formatarNumero } from "@/domain/metas";
import { descreverFrequencia } from "@/domain/recorrencia";
import { agruparMetas, versaoDeReferencia } from "@/domain/vigencia";
import { reativarMeta } from "@/server/acoes-recorrencia";
import { usuarioComDiasFechados } from "@/server/fechamento";
import { metasDoUsuario, type MetaComVersoes } from "@/server/metas";
import { classeBotao } from "@/ui/botao";

export const metadata: Metadata = { title: "Todas as metas · Ascend" };

function LinhaDaMeta({
  m,
  dataHoje,
  pausada = false,
}: {
  m: MetaComVersoes;
  dataHoje: DataCivil;
  pausada?: boolean;
}) {
  const v = versaoDeReferencia(m.versoes, dataHoje)!;
  const detalhes = [
    descreverFrequencia(v),
    v.horario,
    m.tipo === "numerica" && v.valorAlvo !== null
      ? `${formatarNumero(v.valorAlvo)} ${m.unidade}`
      : null,
    v.frequencia !== "unica" && v.vigenteDe > dataHoje
      ? `começa em ${formatarDataCurta(v.vigenteDe)}`
      : null,
  ].filter(Boolean);

  return (
    <li className="flex items-center gap-3 py-3">
      <Link href={`/metas/${m.id}`} className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{v.titulo}</span>
        <span className="text-xs text-neutral-500">{detalhes.join(" · ")}</span>
      </Link>
      {pausada && (
        <form action={reativarMeta}>
          <input type="hidden" name="metaId" value={m.id} />
          <button
            type="submit"
            className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm font-medium"
          >
            Reativar
          </button>
        </form>
      )}
    </li>
  );
}

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
        {titulo}
      </h2>
      <ul className="bg-superficie mt-1 divide-y divide-neutral-200 rounded-2xl px-4 shadow-sm">
        {children}
      </ul>
    </section>
  );
}

/**
 * Todas as metas (navegacao.md, /metas): recorrentes ativas, de ocorrência
 * única ainda por vir e pausadas, com Reativar. Excluídas não aparecem.
 */
export default async function PaginaTodasAsMetas() {
  const usuario = await usuarioComDiasFechados();
  const dataHoje = hoje();
  const grupos = agruparMetas(await metasDoUsuario(usuario.id), dataHoje);
  const vazio =
    grupos.recorrentes.length +
      grupos.unicas.length +
      grupos.pausadas.length ===
    0;

  return (
    <>
      <header className="flex items-center gap-2">
        <Link
          href="/hoje"
          aria-label="Voltar"
          className="-ml-2 flex size-10 items-center justify-center rounded-full text-2xl text-neutral-600 hover:bg-neutral-100"
        >
          ‹
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Todas as metas</h1>
      </header>

      {vazio ? (
        <section className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="max-w-64 text-neutral-600">
            Nenhuma meta por aqui. As metas que você criar aparecem nesta lista.
          </p>
          <Link href="/metas/novo" className={classeBotao}>
            Nova meta
          </Link>
        </section>
      ) : (
        <>
          {grupos.recorrentes.length > 0 && (
            <Secao titulo="Recorrentes">
              {grupos.recorrentes.map((m) => (
                <LinhaDaMeta key={m.id} m={m} dataHoje={dataHoje} />
              ))}
            </Secao>
          )}
          {grupos.unicas.length > 0 && (
            <Secao titulo="Datas marcadas">
              {grupos.unicas.map((m) => (
                <LinhaDaMeta key={m.id} m={m} dataHoje={dataHoje} />
              ))}
            </Secao>
          )}
          {grupos.pausadas.length > 0 && (
            <Secao titulo="Pausadas">
              {grupos.pausadas.map((m) => (
                <LinhaDaMeta key={m.id} m={m} dataHoje={dataHoje} pausada />
              ))}
            </Secao>
          )}
        </>
      )}
    </>
  );
}
