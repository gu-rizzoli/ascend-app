"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { errosPorCampo, type ErrosDeCampo } from "@/domain/conta";
import { ehDataCivil, hoje, type DataCivil } from "@/domain/datas";
import { esquemaEdicaoMeta, type CamposEdicaoMeta } from "@/domain/metas";
import { versaoDeReferencia } from "@/domain/vigencia";

import { fecharSePreciso } from "./fechamento";
import { metaDoUsuario } from "./metas";
import { projetoValidoParaMeta } from "./projetos";
import {
  adiar,
  editar,
  excluir,
  pausar,
  reagendar,
  reativar,
  type Escopo,
} from "./recorrencia";
import { exigirUsuario } from "./sessao";

/**
 * Ações da recorrência completa (entrega 4): editar, pausar, reativar,
 * excluir, adiar e reagendar. Todas conferem o dono, fecham os dias vencidos
 * antes (11.5) e rodam numa transação. Mudam muitos dias de uma vez, então
 * descartam as cópias de todas as listas já carregadas.
 */

function texto(form: FormData, campo: string): string {
  const valor = form.get(campo);
  return typeof valor === "string" ? valor : "";
}

const dataOuNull = (valor: string) =>
  ehDataCivil(valor) ? (valor as DataCivil) : null;

const uuidOuNull = (valor: string) =>
  z.uuid().safeParse(valor).success ? valor : null;

/**
 * Para onde voltar: a lista do dia de onde a pessoa veio, ou Todas as metas.
 * Calculado aqui, e não aceito pronto do navegador.
 */
function enderecoDeVolta(dia: DataCivil | null): string {
  if (dia === null) return "/metas";
  return dia === hoje() ? "/hoje" : `/dia/${dia}`;
}

async function usuarioComDiasEmDia() {
  const usuario = await exigirUsuario();
  const dataHoje = hoje();
  await fecharSePreciso(usuario, dataHoje);
  return { usuario, dataHoje };
}

// ---------------------------------------------------------------------------
// Editar (RF-MET-09)

export type EstadoEdicao = {
  erros?: ErrosDeCampo<CamposEdicaoMeta>;
  erro?: string;
  valores?: CamposEdicaoMeta;
};

export async function editarMeta(
  _anterior: EstadoEdicao,
  form: FormData,
): Promise<EstadoEdicao> {
  const { usuario, dataHoje } = await usuarioComDiasEmDia();
  const metaId = uuidOuNull(texto(form, "metaId"));
  const m = metaId ? await metaDoUsuario(usuario.id, metaId) : null;
  if (!m) return { erro: "Meta não encontrada." };

  const valores: CamposEdicaoMeta = {
    titulo: texto(form, "titulo"),
    descricao: texto(form, "descricao"),
    valorAlvo: texto(form, "valorAlvo"),
    frequencia: texto(form, "frequencia"),
    diasSemana: form.getAll("diasSemana").map(String),
    intervaloDias: texto(form, "intervaloDias"),
    horario: texto(form, "horario"),
    projeto: texto(form, "projeto"),
  };
  const referencia = versaoDeReferencia(m.versoes, dataHoje);
  const recorrente = referencia?.frequencia !== "unica";
  const resultado = esquemaEdicaoMeta(m.tipo, recorrente).safeParse(valores);
  if (!resultado.success) {
    return { erros: errosPorCampo(resultado.error), valores };
  }
  const projetoValido = await projetoValidoParaMeta(
    usuario.id,
    resultado.data.projetoId,
    referencia?.projetoId ?? null,
  );
  if (!projetoValido) {
    return { erros: { projeto: "Escolha outro projeto." }, valores };
  }

  const escopo: Escopo =
    texto(form, "escopo") === "so_esta" ? "so_esta" : "proximas";
  const erro = await db().transaction((tx) =>
    editar(
      tx,
      usuario.id,
      {
        metaId: m.id,
        vaga: dataOuNull(texto(form, "vaga")),
        ocorrenciaId: uuidOuNull(texto(form, "ocorrencia")),
        escopo,
        edicao: resultado.data,
      },
      dataHoje,
    ),
  );
  if (erro) return { erro, valores };

  revalidatePath("/", "layout");
  redirect(enderecoDeVolta(dataOuNull(texto(form, "dia"))));
}

// ---------------------------------------------------------------------------
// Pausar, reativar e excluir (RF-MET-10, 10.9)

/** Pausa e continua no detalhe, que passa a mostrar "Reativar". */
export async function pausarMeta(form: FormData): Promise<void> {
  const { usuario, dataHoje } = await usuarioComDiasEmDia();
  const metaId = uuidOuNull(texto(form, "metaId"));
  if (metaId) {
    await db().transaction((tx) => pausar(tx, usuario.id, metaId, dataHoje));
  }
  revalidatePath("/", "layout");
}

export async function reativarMeta(form: FormData): Promise<void> {
  const { usuario, dataHoje } = await usuarioComDiasEmDia();
  const metaId = uuidOuNull(texto(form, "metaId"));
  if (metaId) {
    await db().transaction((tx) => reativar(tx, usuario.id, metaId, dataHoje));
  }
  revalidatePath("/", "layout");
}

/** Exclui e volta para a lista: a meta some das listas. */
export async function excluirMeta(form: FormData): Promise<void> {
  const { usuario, dataHoje } = await usuarioComDiasEmDia();
  const metaId = uuidOuNull(texto(form, "metaId"));
  if (metaId) {
    await db().transaction((tx) => excluir(tx, usuario.id, metaId, dataHoje));
  }
  revalidatePath("/", "layout");
  redirect(enderecoDeVolta(dataOuNull(texto(form, "dia"))));
}

// ---------------------------------------------------------------------------
// Adiar e reagendar (RF-MET-13)

export type EstadoNovaData = { erro?: string };

/** Muda a data de uma pendente de hoje ou do futuro ("só esta"). */
export async function adiarOcorrencia(
  _anterior: EstadoNovaData,
  form: FormData,
): Promise<EstadoNovaData> {
  const { usuario, dataHoje } = await usuarioComDiasEmDia();
  const novaData = dataOuNull(texto(form, "novaData"));
  if (!novaData || novaData < dataHoje) {
    return { erro: "Escolha hoje ou uma data futura." };
  }
  const ocorrenciaId = uuidOuNull(texto(form, "ocorrencia"));
  const metaId = uuidOuNull(texto(form, "metaId"));
  const vaga = dataOuNull(texto(form, "vaga"));
  const ref = ocorrenciaId
    ? { ocorrenciaId }
    : metaId && vaga
      ? { metaId, dataPrevista: vaga }
      : null;
  const feito =
    ref !== null &&
    (await db().transaction((tx) =>
      adiar(tx, usuario.id, ref, novaData, dataHoje),
    ));
  if (!feito) return { erro: "Não foi possível mudar a data." };

  revalidatePath("/", "layout");
  redirect(enderecoDeVolta(dataOuNull(texto(form, "dia"))));
}

/** Cria a ocorrência nova de uma não concluída, ligada à original. */
export async function reagendarOcorrencia(
  _anterior: EstadoNovaData,
  form: FormData,
): Promise<EstadoNovaData> {
  const { usuario, dataHoje } = await usuarioComDiasEmDia();
  const novaData = dataOuNull(texto(form, "novaData"));
  if (!novaData || novaData < dataHoje) {
    return { erro: "Escolha hoje ou uma data futura." };
  }
  const ocorrenciaId = uuidOuNull(texto(form, "original"));
  const feito =
    ocorrenciaId !== null &&
    (await db().transaction((tx) =>
      reagendar(tx, usuario.id, ocorrenciaId, novaData, dataHoje),
    ));
  if (!feito) return { erro: "Não foi possível reagendar." };

  revalidatePath("/", "layout");
  redirect(enderecoDeVolta(dataOuNull(texto(form, "dia"))));
}
