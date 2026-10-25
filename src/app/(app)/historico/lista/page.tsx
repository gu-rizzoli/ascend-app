import type { Metadata } from "next";
import Link from "next/link";

import { formatarDataLonga, hoje } from "@/domain/datas";
import {
  agruparPorData,
  estatisticas,
  filtrosDaLista,
  fimDasMetas,
  fimDosTreinos,
  percentual,
  type Parametros,
} from "@/domain/historico";
import { usuarioComDiasFechados } from "@/server/fechamento";
import {
  focosDosDias,
  metasDoPeriodo,
  treinosDoPeriodo,
} from "@/server/historico";
import { projetosDoUsuario } from "@/server/projetos";

import { tituloDoTreino } from "../../treinos/abas";
import {
  AbasDoHistorico,
  FormularioDeFiltros,
  LinhaDoHistorico,
  LinhaDoTreino,
  PainelDeEstatisticas,
} from "../pecas";

export const metadata: Metadata = { title: "Histórico · Ascend" };

type Props = { searchParams: Promise<Parametros> };

/**
 * Lista cronológica agrupada por data, do dia mais recente para o mais
 * antigo (10.4, RF-HIS-03). Só aparecem dias com algum registro.
 */
export default async function PaginaListaDoHistorico({ searchParams }: Props) {
  const usuario = await usuarioComDiasFechados();
  const dataHoje = hoje();
  const filtros = filtrosDaLista(await searchParams, dataHoje);
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
  const dias = agruparPorData(metas, treinos);
  const focos = await focosDosDias(
    usuario.id,
    dias.map((d) => d.data),
  );

  return (
    <>
      <h1 className="text-xl font-semibold">Histórico</h1>
      <div className="mt-3">
        <AbasDoHistorico atual="lista" filtros={filtros} />
      </div>
      <FormularioDeFiltros
        acao="/historico/lista"
        filtros={filtros}
        projetos={projetos}
        periodo
      />

      <PainelDeEstatisticas
        e={estatisticas(metas, treinos.length)}
        tipo={tipo}
      />

      {dias.length === 0 ? (
        <p className="mt-8 text-center text-neutral-600">
          Nada registrado neste período.
        </p>
      ) : (
        <ol className="mt-4 flex flex-col gap-4">
          {dias.map((dia) => {
            const taxa = percentual(dia.contagem);
            const foco = focos.get(dia.data);
            return (
              <li
                key={dia.data}
                className="rounded-lg border border-neutral-200 px-3 pt-2"
              >
                <Link
                  href={
                    dia.data === dataHoje ? "/hoje" : `/historico/${dia.data}`
                  }
                  className="flex items-baseline justify-between gap-2"
                >
                  <h2 className="font-semibold">
                    {formatarDataLonga(dia.data)}
                  </h2>
                  {taxa !== null && (
                    <span className="shrink-0 text-sm text-neutral-600 tabular-nums">
                      {dia.contagem.concluidas} de {dia.contagem.total} · {taxa}
                      %
                    </span>
                  )}
                </Link>
                {foco && (
                  <p className="text-xs text-amber-800">
                    <span aria-hidden="true">★ </span>
                    {foco.nome} em foco
                  </p>
                )}
                <ul className="divide-y divide-neutral-100">
                  {dia.metas.map((m) => (
                    <LinhaDoHistorico
                      key={m.ocorrenciaId}
                      item={m}
                      dataHoje={dataHoje}
                    />
                  ))}
                  {dia.treinos.map((t) => (
                    <LinhaDoTreino key={t.id} treino={t} />
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
