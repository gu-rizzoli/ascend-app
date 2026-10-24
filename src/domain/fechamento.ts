import { somarDias, type DataCivil } from "./datas";
import type { EstadoOcorrencia, TipoMeta } from "./metas";
import { caiNaData, type Regra } from "./recorrencia";

/**
 * Encerramento lógico do dia (7.10, 11.5, RF-MET-11, RF-GLO-10). Não existe
 * tarefa à meia-noite: antes de ler ou alterar, o servidor fecha os dias que
 * passaram desde `usuario.fechado_ate`. Tudo aqui é idempotente (13.8).
 */

/**
 * Os dias que ainda precisam ser fechados, de `fechadoAte + 1` até ontem, ou
 * null se não há nada a fazer. Rodar de novo no mesmo dia devolve null.
 */
export function periodoAFechar(
  fechadoAte: DataCivil,
  hoje: DataCivil,
): { de: DataCivil; ate: DataCivil } | null {
  const ontem = somarDias(hoje, -1);
  if (fechadoAte >= ontem) return null;
  return { de: somarDias(fechadoAte, 1), ate: ontem };
}

/** Uma versão de meta com o que o fechamento precisa para gerar as vagas. */
export type VersaoAFechar = {
  metaId: string;
  versaoId: string;
  tipo: TipoMeta;
  regra: Regra;
};

export type VagaFaltante = {
  metaId: string;
  versaoId: string;
  tipo: TipoMeta;
  dataPrevista: DataCivil;
};

/**
 * As vagas que a regra gerou no período, inclusive nos dias que o usuário
 * nunca abriu. Quem grava descarta as que já existem (ON CONFLICT DO
 * NOTHING), então elas podem vir repetidas sem problema. A vigência de cada
 * versão já diz se a meta estava pausada ou excluída naquele dia.
 */
export function vagasDoPeriodo(
  versoes: VersaoAFechar[],
  de: DataCivil,
  ate: DataCivil,
): VagaFaltante[] {
  const vagas: VagaFaltante[] = [];
  for (const v of versoes) {
    // Percorre só a parte do período em que a versão vale.
    const inicio = v.regra.vigenteDe > de ? v.regra.vigenteDe : de;
    const fim =
      v.regra.vigenteAte !== null && v.regra.vigenteAte < ate
        ? v.regra.vigenteAte
        : ate;
    for (let dia = inicio; dia <= fim; dia = somarDias(dia, 1)) {
      if (caiNaData(v.regra, dia)) {
        vagas.push({
          metaId: v.metaId,
          versaoId: v.versaoId,
          tipo: v.tipo,
          dataPrevista: dia,
        });
      }
    }
  }
  return vagas;
}

// ---------------------------------------------------------------------------
// Correção retroativa (7.11, 10.6, RF-MET-12)

/**
 * Num dia encerrado não existe "pendente": a ocorrência foi concluída ou não.
 * A numérica decide pelo valor, a binária pelo toque.
 */
export function estadoCorrigido(
  tipo: TipoMeta,
  pedido: { concluida?: boolean; valor?: number },
  valorAlvo: number | null,
): EstadoOcorrencia | null {
  if (tipo === "binaria") {
    if (pedido.concluida === undefined) return null;
    return pedido.concluida ? "concluida" : "nao_concluida";
  }
  if (pedido.valor === undefined || valorAlvo === null) return null;
  return pedido.valor >= valorAlvo ? "concluida" : "nao_concluida";
}

/** Só dias encerrados são corrigidos; hoje e o futuro se editam direto. */
export function diaCorrigivel(data: DataCivil, hoje: DataCivil): boolean {
  return data < hoje;
}
