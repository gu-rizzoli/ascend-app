import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { diaDaSemana, formatarDataCurta, hoje } from "@/domain/datas";
import { versaoDeReferencia } from "@/domain/vigencia";
import { usuarioComDiasFechados } from "@/server/fechamento";
import { metaDoUsuario, ocorrenciaDoDetalhe } from "@/server/metas";

import { enderecoDoDetalhe, lerContexto } from "../../enderecos";
import { FormularioEdicao, type Pergunta } from "./formulario";

export const metadata: Metadata = { title: "Editar meta · Ascend" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Editar meta (RF-MET-09). Vindo de uma ocorrência recorrente, a pergunta
 * "Só esta" ou "Esta e as próximas" aparece ao salvar. Uma reagendada só
 * muda sozinha; vindo de Todas as metas, a mudança vale de hoje em diante.
 */
export default async function PaginaEditarMeta({
  params,
  searchParams,
}: Props) {
  const usuario = await usuarioComDiasFechados();
  const dataHoje = hoje();
  const { id } = await params;
  const contexto = lerContexto(await searchParams);

  const m = await metaDoUsuario(usuario.id, id);
  if (!m) notFound();
  const referencia = versaoDeReferencia(m.versoes, dataHoje);
  if (!referencia) notFound();
  const detalhe = enderecoDoDetalhe(m.id, contexto);
  if (m.estado !== "ativa") redirect(detalhe);

  const ref = contexto.ocorrencia
    ? { ocorrenciaId: contexto.ocorrencia }
    : contexto.vaga
      ? { metaId: m.id, dataPrevista: contexto.vaga }
      : null;
  const o = ref ? await ocorrenciaDoDetalhe(usuario.id, m, ref) : null;
  // Dia encerrado se muda pela correção retroativa, não pela edição.
  if (o && o.data < dataHoje) redirect(detalhe);

  const versao =
    (o && m.versoes.find((v) => v.id === o.versaoId)) || referencia;
  const recorrente = referencia.frequencia !== "unica";
  const pergunta: Pergunta = !recorrente
    ? { tipo: "unica" }
    : o?.ocorrenciaId && o.dataPrevista === null
      ? { tipo: "so_esta" }
      : o
        ? { tipo: "perguntar", data: formatarDataCurta(o.data) }
        : {
            tipo: "proximas",
            desde:
              referencia.vigenteDe > dataHoje
                ? formatarDataCurta(referencia.vigenteDe)
                : "hoje",
          };

  return (
    <>
      <header className="flex items-center gap-2">
        <Link
          href={detalhe}
          aria-label="Voltar"
          className="-ml-2 flex size-10 items-center justify-center rounded-full text-2xl text-neutral-600 hover:bg-neutral-100"
        >
          ‹
        </Link>
        <h1 className="text-xl font-semibold">Editar meta</h1>
      </header>
      <FormularioEdicao
        metaId={m.id}
        contexto={contexto}
        tipo={m.tipo}
        unidade={m.unidade}
        pergunta={pergunta}
        voltar={detalhe}
        inicial={{
          titulo: o?.titulo ?? versao.titulo,
          descricao: versao.descricao ?? "",
          valorAlvo:
            (o ? o.valorAlvo : versao.valorAlvo)
              ?.toString()
              .replace(".", ",") ?? "",
          horario: (o ? o.horario : versao.horario) ?? "",
          frequencia: versao.frequencia,
          // Em "Dias da semana", o dia da ocorrência já vem marcado.
          diasSemana: (
            versao.diasSemana ?? [diaDaSemana(o?.data ?? dataHoje)]
          ).map(String),
          intervaloDias: versao.intervaloDias?.toString() ?? "2",
        }}
      />
    </>
  );
}
