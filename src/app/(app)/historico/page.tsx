import type { Metadata } from "next";

import { hoje } from "@/domain/datas";
import {
  contagemPorDia,
  estatisticas,
  filtrosDoCalendario,
  fimDasMetas,
  fimDosTreinos,
  parametrosDosFiltros,
  type Parametros,
} from "@/domain/historico";
import { usuarioComDiasFechados } from "@/server/fechamento";
import { metasDoPeriodo, treinosDoPeriodo } from "@/server/historico";
import { projetosDoUsuario } from "@/server/projetos";

import { tituloDoTreino } from "../treinos/abas";
import { CalendarioDoMes } from "./calendario";
import {
  AbasDoHistorico,
  FormularioDeFiltros,
  PainelDeEstatisticas,
} from "./pecas";

export const metadata: Metadata = { title: "Histórico · Ascend" };

type Props = { searchParams: Promise<Parametros> };

/**
 * Calendário do mês com a taxa de cada dia (10.3, RF-HIS-01, 02). Dia sem
 * metas fica neutro, sem número e sem cor: não é 0% nem falha.
 */
export default async function PaginaHistorico({ searchParams }: Props) {
  // Fecha os dias vencidos antes de ler (11.5, "ao abrir o Histórico").
  const usuario = await usuarioComDiasFechados();
  const dataHoje = hoje();
  const { mes, filtros } = filtrosDoCalendario(await searchParams, dataHoje);
  const { tipo, projetoId } = filtros;

  const [metas, treinos, projetos] = await Promise.all([
    tipo === "treinos"
      ? []
      : metasDoPeriodo(
          usuario.id,
          filtros.de,
          fimDasMetas(filtros.ate, dataHoje),
          projetoId,
        ),
    tipo === "metas"
      ? []
      : treinosDoPeriodo(
          usuario.id,
          filtros.de,
          fimDosTreinos(filtros.ate, dataHoje),
          tituloDoTreino,
        ),
    projetosDoUsuario(usuario.id),
  ]);
  const e = estatisticas(metas, treinos.length);

  return (
    <>
      <h1 className="text-xl font-bold tracking-tight">Histórico</h1>
      <div className="mt-3">
        <AbasDoHistorico atual="calendario" filtros={filtros} />
      </div>
      <FormularioDeFiltros
        acao="/historico"
        filtros={filtros}
        projetos={projetos}
        periodo={false}
        ocultos={{ mes }}
      />

      <div className="md:mt-2 md:grid md:grid-cols-2 md:items-start md:gap-8">
        <div>
          <CalendarioDoMes
            mes={mes}
            dataHoje={dataHoje}
            porDia={contagemPorDia(metas)}
            diasComTreino={new Set(treinos.map((t) => t.data))}
            enderecoDoMes={(outro) =>
              `/historico${parametrosDosFiltros(filtros, { mes: outro })}`
            }
          />
        </div>
        <PainelDeEstatisticas e={e} tipo={tipo} />
      </div>
    </>
  );
}
