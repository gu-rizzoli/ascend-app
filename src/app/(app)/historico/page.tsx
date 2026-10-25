import type { Metadata } from "next";
import Link from "next/link";

import { hoje, type DataCivil } from "@/domain/datas";
import {
  contagemPorDia,
  enderecoDaData,
  estatisticas,
  filtrosDoCalendario,
  fimDasMetas,
  fimDosTreinos,
  formatarMes,
  mesDe,
  nivelDaTaxa,
  parametrosDosFiltros,
  percentual,
  semanasDoMes,
  somarMeses,
  type Contagem,
  type Parametros,
} from "@/domain/historico";
import { usuarioComDiasFechados } from "@/server/fechamento";
import { metasDoPeriodo, treinosDoPeriodo } from "@/server/historico";
import { projetosDoUsuario } from "@/server/projetos";

import { tituloDoTreino } from "../treinos/abas";
import {
  AbasDoHistorico,
  FormularioDeFiltros,
  PainelDeEstatisticas,
} from "./pecas";

export const metadata: Metadata = { title: "Histórico · Ascend" };

type Props = { searchParams: Promise<Parametros> };

// Uma cor só, mais forte quanto maior a taxa (10.3).
const FUNDO = {
  1: "bg-sky-50",
  2: "bg-sky-100",
  3: "bg-sky-200",
  4: "bg-sky-300",
  5: "bg-sky-400",
} as const;

const SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

function Dia({
  data,
  dataHoje,
  contagem,
  treino,
}: {
  data: DataCivil;
  dataHoje: DataCivil;
  contagem: Contagem | undefined;
  treino: boolean;
}) {
  const taxa = contagem ? percentual(contagem) : null;
  const futuro = data > dataHoje;
  const numero = Number(data.slice(8));
  const conteudo = (
    <>
      <span className={data === dataHoje ? "font-bold" : undefined}>
        {numero}
      </span>
      <span className="text-[11px] leading-none tabular-nums">
        {taxa !== null ? `${taxa}%` : " "}
      </span>
      {treino && (
        <span
          aria-hidden="true"
          className="absolute top-1 right-1 size-1.5 rounded-full bg-neutral-900"
        />
      )}
    </>
  );
  const classe = `relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-sm ${
    taxa !== null ? FUNDO[nivelDaTaxa(taxa)] : ""
  } ${data === dataHoje ? "ring-2 ring-neutral-900" : ""}`;
  const rotulo = [
    data,
    taxa !== null && `${taxa}% das metas concluídas`,
    treino && "com treino",
  ]
    .filter(Boolean)
    .join(", ");

  if (futuro) {
    return <span className={`${classe} text-neutral-300`}>{conteudo}</span>;
  }
  return (
    <Link
      href={enderecoDaData(data, dataHoje)}
      aria-label={rotulo}
      className={classe}
    >
      {conteudo}
    </Link>
  );
}

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
  const porDia = contagemPorDia(metas);
  const diasComTreino = new Set(treinos.map((t) => t.data));
  const e = estatisticas(metas, treinos.length);

  const parametros = (outroMes: string) =>
    parametrosDosFiltros(filtros, { mes: outroMes });
  const anterior = somarMeses(mes, -1);
  const proximo = somarMeses(mes, 1);
  const temProximo = proximo <= mesDe(dataHoje);

  return (
    <>
      <h1 className="text-xl font-semibold">Histórico</h1>
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

      <header className="mt-4 flex items-center justify-between">
        <Link
          href={`/historico${parametros(anterior)}`}
          aria-label="Mês anterior"
          className="flex size-10 items-center justify-center rounded-full text-2xl text-neutral-600 hover:bg-neutral-100"
        >
          ‹
        </Link>
        <h2 className="font-semibold">{formatarMes(mes)}</h2>
        {temProximo ? (
          <Link
            href={`/historico${parametros(proximo)}`}
            aria-label="Próximo mês"
            className="flex size-10 items-center justify-center rounded-full text-2xl text-neutral-600 hover:bg-neutral-100"
          >
            ›
          </Link>
        ) : (
          <span className="size-10" />
        )}
      </header>

      <div className="mt-2 grid grid-cols-7 gap-1 text-center">
        {SEMANA.map((d, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="text-xs font-medium text-neutral-500"
          >
            {d}
          </span>
        ))}
        {semanasDoMes(mes)
          .flat()
          .map((data, i) =>
            data ? (
              <Dia
                key={data}
                data={data}
                dataHoje={dataHoje}
                contagem={porDia.get(data)}
                treino={diasComTreino.has(data)}
              />
            ) : (
              <span key={`vazio-${i}`} />
            ),
          )}
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        O número é a parte das metas concluídas no dia. Dias sem metas ficam em
        branco. O ponto marca um treino.
      </p>

      <PainelDeEstatisticas e={e} tipo={tipo} />
    </>
  );
}
