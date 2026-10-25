import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { meta, metaVersao, ocorrencia } from "@/db/schema";
import type { DataCivil } from "@/domain/datas";
import {
  copiaSaiNaCorrecao,
  diaCorrigivel,
  estadoCorrigido,
} from "@/domain/fechamento";
import { VALOR_MAXIMO } from "@/domain/metas";

/**
 * Correção retroativa de uma ocorrência (7.11, 10.6, RF-MET-12), numa
 * transação. Quem chama confere a sessão e fecha os dias vencidos antes.
 * `copiaRemovida` avisa que outro dia mudou, para a tela revalidar.
 */
export async function corrigir(
  usuarioId: string,
  ocorrenciaId: string,
  pedido: { concluida?: boolean; valor?: number },
  dataHoje: DataCivil,
): Promise<{ alterou: boolean; copiaRemovida: boolean }> {
  return db().transaction(async (tx) => {
    const nada = { alterou: false, copiaRemovida: false };
    const [linha] = await tx
      .select({ meta, versao: metaVersao, ocorrencia })
      .from(ocorrencia)
      .innerJoin(meta, eq(ocorrencia.metaId, meta.id))
      .innerJoin(metaVersao, eq(ocorrencia.versaoId, metaVersao.id))
      .where(
        and(
          eq(ocorrencia.id, ocorrenciaId),
          eq(ocorrencia.usuarioId, usuarioId),
        ),
      )
      .for("update", { of: ocorrencia })
      .limit(1);
    if (!linha) return nada;
    const { meta: m, versao: v, ocorrencia: o } = linha;
    if (!diaCorrigivel(o.data as DataCivil, dataHoje)) return nada;

    const valor =
      m.tipo === "numerica" && pedido.valor !== undefined
        ? Math.min(VALOR_MAXIMO, Math.max(0, pedido.valor))
        : undefined;
    const estado = estadoCorrigido(
      m.tipo,
      { concluida: pedido.concluida, valor },
      o.valorAlvo ?? v.valorAlvo,
    );
    if (!estado) return nada;
    const mesmoValor = valor === undefined || valor === o.valorAtual;
    if (estado === o.estado && mesmoValor) return nada;

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

    const [copia] = await tx
      .select({
        id: ocorrencia.id,
        estado: ocorrencia.estado,
        data: ocorrencia.data,
      })
      .from(ocorrencia)
      .where(eq(ocorrencia.reagendadaDeId, o.id))
      .for("update")
      .limit(1);
    const sai =
      copia !== undefined &&
      copiaSaiNaCorrecao(
        estado,
        { estado: copia.estado, data: copia.data as DataCivil },
        dataHoje,
      );
    // Pendente de hoje ou do futuro: não tem histórico nem reagendada dela.
    if (sai) await tx.delete(ocorrencia).where(eq(ocorrencia.id, copia.id));
    return { alterou: true, copiaRemovida: sai };
  });
}
