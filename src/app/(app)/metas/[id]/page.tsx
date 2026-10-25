import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { formatarDataCurta, formatarDataLonga, hoje } from "@/domain/datas";
import { formatarNumero, type EstadoOcorrencia } from "@/domain/metas";
import { descreverFrequencia } from "@/domain/recorrencia";
import {
  podeAdiar,
  podeReagendar,
  versaoDeReferencia,
} from "@/domain/vigencia";
import { pausarMeta, reativarMeta } from "@/server/acoes-recorrencia";
import { usuarioComDiasFechados } from "@/server/fechamento";
import { metaDoUsuario, ocorrenciaDoDetalhe } from "@/server/metas";
import { projetoDoUsuario } from "@/server/projetos";
import { classeBotao } from "@/ui/botao";

import {
  enderecoDaEdicao,
  enderecoDeVolta,
  lerContexto,
  type ContextoDaMeta,
} from "../enderecos";
import { ConfirmarExclusao, EscolherData } from "./acoes";

export const metadata: Metadata = { title: "Meta · Ascend" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const NOME_DO_ESTADO: Record<EstadoOcorrencia, string> = {
  pendente: "Pendente",
  concluida: "Concluída",
  nao_concluida: "Não concluída",
};

const classeSecundario =
  "block w-full rounded-lg border border-neutral-300 px-4 py-3 text-center font-medium";

function Selo({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-xs text-neutral-700">
      {children}
    </span>
  );
}

function FormularioDaMeta({
  acao,
  metaId,
  children,
}: {
  acao: (form: FormData) => Promise<void>;
  metaId: string;
  children: React.ReactNode;
}) {
  return (
    <form action={acao}>
      <input type="hidden" name="metaId" value={metaId} />
      <button type="submit" className={classeSecundario}>
        {children}
      </button>
    </form>
  );
}

/**
 * Detalhe da meta (navegacao.md, /metas/:id). Vindo de uma lista, mostra
 * também a ocorrência tocada, com mudar a data ou reagendar. Daqui saem
 * editar, pausar, reativar e excluir (RF-MET-09, 10, 13).
 */
export default async function PaginaMeta({ params, searchParams }: Props) {
  const usuario = await usuarioComDiasFechados();
  const dataHoje = hoje();
  const { id } = await params;
  const contexto: ContextoDaMeta = lerContexto(await searchParams);

  const m = await metaDoUsuario(usuario.id, id);
  if (!m) notFound();
  const referencia = versaoDeReferencia(m.versoes, dataHoje);
  if (!referencia) notFound();

  const ref = contexto.ocorrencia
    ? { ocorrenciaId: contexto.ocorrencia }
    : contexto.vaga
      ? { metaId: m.id, dataPrevista: contexto.vaga }
      : null;
  const o = ref ? await ocorrenciaDoDetalhe(usuario.id, m, ref) : null;
  if (m.estado === "excluida" && !o) notFound();

  const versao =
    (o && m.versoes.find((v) => v.id === o.versaoId)) || referencia;
  const recorrente = referencia.frequencia !== "unica";
  const titulo = o?.titulo ?? referencia.titulo;
  const horario = o ? o.horario : referencia.horario;
  const valorAlvo = o ? o.valorAlvo : referencia.valorAlvo;
  const voltar = enderecoDeVolta(contexto.dia, dataHoje);
  const ativa = m.estado === "ativa";
  const podeEditar = ativa && (!o || o.data >= dataHoje);
  // A regra que vale para o futuro, não a de uma ocorrência antiga.
  const projeto = versao.projetoId
    ? await projetoDoUsuario(usuario.id, versao.projetoId)
    : null;
  const comeca =
    referencia.vigenteDe > dataHoje
      ? `Começa em ${formatarDataCurta(referencia.vigenteDe)}`
      : null;

  return (
    <>
      <header className="flex items-center gap-2">
        <Link
          href={voltar}
          aria-label="Voltar"
          className="-ml-2 flex size-10 items-center justify-center rounded-full text-2xl text-neutral-600 hover:bg-neutral-100"
        >
          ‹
        </Link>
        <h1 className="min-w-0 flex-1 text-xl font-bold tracking-tight break-words">
          {titulo}
        </h1>
      </header>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-600">
        <span>{descreverFrequencia(referencia)}</span>
        {horario && <span className="tabular-nums">· {horario}</span>}
        {m.tipo === "numerica" && valorAlvo !== null && (
          <span>
            · Alvo {formatarNumero(valorAlvo)} {m.unidade}
          </span>
        )}
        {comeca && <span>· {comeca}</span>}
        {m.estado === "pausada" && <Selo>Pausada</Selo>}
        {m.estado === "excluida" && <Selo>Excluída</Selo>}
      </div>
      {versao.descricao && (
        <p className="mt-3 text-sm whitespace-pre-line text-neutral-700">
          {versao.descricao}
        </p>
      )}
      {projeto && (
        <p className="mt-3 text-sm text-neutral-600">
          Projeto:{" "}
          <Link
            href={`/projetos/${projeto.id}`}
            className="text-acento font-medium underline"
          >
            {projeto.nome}
          </Link>
        </p>
      )}

      {o && (
        <section className="mt-6 flex flex-col gap-3 rounded-lg border border-neutral-200 p-3">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">{formatarDataLonga(o.data)}</p>
            <p className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
              <span>{NOME_DO_ESTADO[o.estado]}</span>
              {o.tipo === "numerica" && (
                <span className="tabular-nums">
                  · {formatarNumero(o.valorAtual ?? 0)} /{" "}
                  {formatarNumero(o.valorAlvo ?? 0)} {o.unidade}
                </span>
              )}
              {o.reagendadaDe && (
                <Selo>Reagendada de {formatarDataCurta(o.reagendadaDe)}</Selo>
              )}
              {o.reagendadaPara && (
                <Selo>
                  Reagendada para {formatarDataCurta(o.reagendadaPara)}
                </Selo>
              )}
              {o.corrigida && <Selo>Corrigida</Selo>}
            </p>
          </div>
          {podeAdiar(o, dataHoje) && m.estado !== "excluida" && (
            <EscolherData
              modo="adiar"
              metaId={m.id}
              contexto={contexto}
              hoje={dataHoje}
              dataAtual={o.data}
              ocorrenciaId={o.ocorrenciaId}
            />
          )}
          {podeReagendar(o, dataHoje) && m.estado !== "excluida" && (
            <EscolherData
              modo="reagendar"
              metaId={m.id}
              contexto={contexto}
              hoje={dataHoje}
              dataAtual={o.data}
              ocorrenciaId={o.ocorrenciaId}
            />
          )}
          {o.data < dataHoje && (
            <Link
              href={`/dia/${o.data}?corrigir=1`}
              className="text-center text-sm font-medium underline"
            >
              Corrigir este dia
            </Link>
          )}
        </section>
      )}

      {m.estado !== "excluida" && (
        <section className="mt-6 flex flex-col gap-3">
          {podeEditar && (
            <Link
              href={enderecoDaEdicao(m.id, contexto)}
              className={classeBotao}
            >
              Editar
            </Link>
          )}
          {ativa && recorrente && (
            <FormularioDaMeta acao={pausarMeta} metaId={m.id}>
              Pausar
            </FormularioDaMeta>
          )}
          {m.estado === "pausada" && (
            <>
              <p className="text-sm text-neutral-600">
                Pausada: não aparece nos próximos dias e os dias pausados não
                contam como falha.
              </p>
              <FormularioDaMeta acao={reativarMeta} metaId={m.id}>
                Reativar
              </FormularioDaMeta>
            </>
          )}
          <ConfirmarExclusao
            metaId={m.id}
            contexto={contexto}
            recorrente={recorrente}
          />
        </section>
      )}
    </>
  );
}
