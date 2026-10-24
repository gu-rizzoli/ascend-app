"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { meta, metaVersao, ocorrencia } from "@/db/schema";
import { errosPorCampo, type ErrosDeCampo } from "@/domain/conta";
import { ehDataCivil, hoje, type DataCivil } from "@/domain/datas";
import { diaCorrigivel, estadoCorrigido } from "@/domain/fechamento";
import {
  diaEditavel,
  esquemaNovaMeta,
  estadoPeloValor,
  lerNumero,
  VALOR_MAXIMO,
  type CamposNovaMeta,
} from "@/domain/metas";

import { fecharSePreciso } from "./fechamento";
import { garantirOcorrencia, type OcorrenciaParaAlterar } from "./metas";
import { exigirUsuario } from "./sessao";

export type EstadoNovaMeta = {
  erros?: ErrosDeCampo<CamposNovaMeta>;
  // Devolvido para o formulário não apagar o que a pessoa digitou.
  valores?: CamposNovaMeta;
};

function texto(form: FormData, campo: string): string {
  const valor = form.get(campo);
  return typeof valor === "string" ? valor : "";
}

/** Endereço da lista de uma data (navegacao.md). */
function enderecoDoDia(data: DataCivil): string {
  return data === hoje() ? "/hoje" : `/dia/${data}`;
}

/** Cria 1 meta e 1 versão. Nenhuma ocorrência: a lista as calcula. */
export async function criarMeta(
  _anterior: EstadoNovaMeta,
  form: FormData,
): Promise<EstadoNovaMeta> {
  const usuario = await exigirUsuario();

  const valores: CamposNovaMeta = {
    titulo: texto(form, "titulo"),
    descricao: texto(form, "descricao"),
    tipo: texto(form, "tipo"),
    valorAlvo: texto(form, "valorAlvo"),
    unidade: texto(form, "unidade"),
    frequencia: texto(form, "frequencia"),
    diasSemana: form.getAll("diasSemana").map(String),
    intervaloDias: texto(form, "intervaloDias"),
    horario: texto(form, "horario"),
    dataInicio: texto(form, "dataInicio"),
  };
  const resultado = esquemaNovaMeta(hoje()).safeParse(valores);
  if (!resultado.success) {
    return { erros: errosPorCampo(resultado.error), valores };
  }
  const nova = resultado.data;

  await db().transaction(async (tx) => {
    const [criada] = await tx
      .insert(meta)
      .values({ usuarioId: usuario.id, tipo: nova.tipo, unidade: nova.unidade })
      .returning({ id: meta.id });
    await tx.insert(metaVersao).values({
      metaId: criada!.id,
      vigenteDe: nova.regra.vigenteDe,
      vigenteAte: nova.regra.vigenteAte,
      titulo: nova.titulo,
      descricao: nova.descricao,
      horario: nova.horario,
      valorAlvo: nova.valorAlvo,
      frequencia: nova.regra.frequencia,
      diasSemana: nova.regra.diasSemana,
      intervaloDias: nova.regra.intervaloDias,
    });
  });

  redirect(enderecoDoDia(nova.regra.vigenteDe));
}

// ---------------------------------------------------------------------------
// Marcar e somar valor (RF-MET-07, 08). A vaga é gravada na primeira vez que
// é tocada; datas futuras também valem (fluxos-metas.md, decisão 2).

const vaga = z.object({
  metaId: z.uuid(),
  dataPrevista: z.string().refine(ehDataCivil),
});

/**
 * Roda `alterar` sobre a ocorrência da vaga, numa transação. Se a data já
 * passou (o dia virou com a tela aberta), não grava nada: a tela recarrega e
 * mostra o dia como só leitura.
 */
async function alterarOcorrencia(
  metaId: string,
  dataPrevista: string,
  alterar: (
    o: OcorrenciaParaAlterar,
  ) => Partial<typeof ocorrencia.$inferInsert> | null,
): Promise<void> {
  const usuario = await exigirUsuario();
  const entrada = vaga.safeParse({ metaId, dataPrevista });
  if (entrada.success) {
    const data = entrada.data.dataPrevista as DataCivil;
    await db().transaction(async (tx) => {
      const o = await garantirOcorrencia(tx, usuario.id, metaId, data);
      if (!o || !diaEditavel(o.data, hoje())) return;
      const mudanca = alterar(o);
      if (!mudanca) return;
      await tx
        .update(ocorrencia)
        .set({ ...mudanca, atualizadoEm: new Date() })
        .where(eq(ocorrencia.id, o.id));
    });
  }
  refresh();
}

/** Binária: um toque conclui, outro volta a pendente. */
export async function alternarConclusao(
  metaId: string,
  dataPrevista: string,
): Promise<void> {
  await alterarOcorrencia(metaId, dataPrevista, (o) => {
    if (o.tipo !== "binaria") return null;
    return o.estado === "concluida"
      ? { estado: "pendente", concluidaEm: null }
      : { estado: "concluida", concluidaEm: new Date() };
  });
}

function comValor(o: OcorrenciaParaAlterar, valor: number) {
  if (o.tipo !== "numerica" || o.valorAlvo === null) return null;
  const novo = Math.min(VALOR_MAXIMO, Math.max(0, valor));
  const estado = estadoPeloValor(novo, o.valorAlvo);
  // concluida_em marca quando o alvo foi atingido; somar mais não o move.
  if (estado === o.estado) return { valorAtual: novo };
  return {
    valorAtual: novo,
    estado,
    concluidaEm: estado === "concluida" ? new Date() : null,
  };
}

/** Numérica: soma um incremento ao valor atual. */
export async function somarValor(
  metaId: string,
  dataPrevista: string,
  incremento: string,
): Promise<void> {
  const n = lerNumero(incremento);
  await alterarOcorrencia(metaId, dataPrevista, (o) =>
    n === null || n === 0 ? null : comValor(o, (o.valorAtual ?? 0) + n),
  );
}

/** Numérica: troca o valor atual por um novo total, que pode ser menor. */
export async function definirValor(
  metaId: string,
  dataPrevista: string,
  total: string,
): Promise<void> {
  const n = lerNumero(total);
  await alterarOcorrencia(metaId, dataPrevista, (o) =>
    n === null ? null : comValor(o, n),
  );
}

// ---------------------------------------------------------------------------
// Correção retroativa (7.11, 10.6, RF-MET-12). Só em dias encerrados, sem
// pedir justificativa. Cada mudança fica marcada como feita depois do
// encerramento, para que o histórico nunca mude em silêncio.

async function corrigirOcorrencia(
  ocorrenciaId: string,
  pedido: { concluida?: boolean; valor?: number },
): Promise<void> {
  const usuario = await exigirUsuario();
  const dataHoje = hoje();
  if (z.uuid().safeParse(ocorrenciaId).success) {
    // "Antes de alterar uma ocorrência vencida" (11.5): o dia precisa estar
    // encerrado para a correção partir do estado final.
    await fecharSePreciso(usuario, dataHoje);
    await db().transaction(async (tx) => {
      const [linha] = await tx
        .select({ meta, versao: metaVersao, ocorrencia })
        .from(ocorrencia)
        .innerJoin(meta, eq(ocorrencia.metaId, meta.id))
        .innerJoin(metaVersao, eq(ocorrencia.versaoId, metaVersao.id))
        .where(
          and(
            eq(ocorrencia.id, ocorrenciaId),
            eq(ocorrencia.usuarioId, usuario.id),
          ),
        )
        .for("update", { of: ocorrencia })
        .limit(1);
      if (!linha) return;
      const { meta: m, versao: v, ocorrencia: o } = linha;
      if (!diaCorrigivel(o.data as DataCivil, dataHoje)) return;

      const valor =
        m.tipo === "numerica" && pedido.valor !== undefined
          ? Math.min(VALOR_MAXIMO, Math.max(0, pedido.valor))
          : undefined;
      const estado = estadoCorrigido(
        m.tipo,
        { concluida: pedido.concluida, valor },
        o.valorAlvo ?? v.valorAlvo,
      );
      if (!estado) return;
      const mesmoValor = valor === undefined || valor === o.valorAtual;
      if (estado === o.estado && mesmoValor) return;

      await tx
        .update(ocorrencia)
        .set({
          estado,
          ...(valor !== undefined && { valorAtual: valor }),
          concluidaEm:
            estado !== "concluida"
              ? null
              : o.estado === "concluida"
                ? o.concluidaEm
                : new Date(),
          corrigidaAposEncerramento: true,
          atualizadoEm: new Date(),
        })
        .where(eq(ocorrencia.id, o.id));
    });
  }
  refresh();
}

/** Binária num dia encerrado: concluída ou não concluída. */
export async function corrigirConclusao(
  ocorrenciaId: string,
  concluida: boolean,
): Promise<void> {
  await corrigirOcorrencia(ocorrenciaId, { concluida: concluida === true });
}

/** Numérica num dia encerrado: o novo total decide se foi concluída. */
export async function corrigirValor(
  ocorrenciaId: string,
  total: string,
): Promise<void> {
  const n = lerNumero(total);
  if (n === null) {
    refresh();
    return;
  }
  await corrigirOcorrencia(ocorrenciaId, { valor: n });
}
