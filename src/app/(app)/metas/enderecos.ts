import { ehDataCivil, type DataCivil } from "@/domain/datas";
import type { ItemDoDia } from "@/domain/metas";

/**
 * Endereços do detalhe e da edição de uma meta (navegacao.md, /metas/:id).
 * Vindo de uma lista, levam a data dela (`dia`, para voltar) e a ocorrência
 * aberta: a vaga da regra (`vaga`) ou, numa reagendada, o id (`ocorrencia`).
 */
export type ContextoDaMeta = {
  dia: DataCivil | null;
  vaga: DataCivil | null;
  ocorrencia: string | null;
};

function busca(c: ContextoDaMeta): string {
  const p = new URLSearchParams();
  if (c.dia) p.set("dia", c.dia);
  if (c.vaga) p.set("vaga", c.vaga);
  if (c.ocorrencia) p.set("ocorrencia", c.ocorrencia);
  const texto = p.toString();
  return texto ? `?${texto}` : "";
}

export function contextoDoItem(
  item: Pick<ItemDoDia, "dataPrevista" | "ocorrenciaId">,
  dia: DataCivil,
): ContextoDaMeta {
  return item.dataPrevista !== null
    ? { dia, vaga: item.dataPrevista, ocorrencia: null }
    : { dia, vaga: null, ocorrencia: item.ocorrenciaId };
}

export const enderecoDoDetalhe = (metaId: string, c: ContextoDaMeta) =>
  `/metas/${metaId}${busca(c)}`;

export const enderecoDaEdicao = (metaId: string, c: ContextoDaMeta) =>
  `/metas/${metaId}/editar${busca(c)}`;

type Busca = Record<string, string | string[] | undefined>;

const um = (valor: string | string[] | undefined) =>
  typeof valor === "string" ? valor : "";

/** Lê o contexto do endereço, descartando o que não for válido. */
export function lerContexto(b: Busca): ContextoDaMeta {
  const dia = um(b.dia);
  const vaga = um(b.vaga);
  const ocorrencia = um(b.ocorrencia);
  return {
    dia: ehDataCivil(dia) ? dia : null,
    vaga: ehDataCivil(vaga) ? vaga : null,
    ocorrencia: /^[0-9a-f-]{36}$/i.test(ocorrencia) ? ocorrencia : null,
  };
}

/** A lista de onde a pessoa veio, ou Todas as metas. */
export function enderecoDeVolta(dia: DataCivil | null, hoje: DataCivil) {
  if (dia === null) return "/metas";
  return dia === hoje ? "/hoje" : `/dia/${dia}`;
}
