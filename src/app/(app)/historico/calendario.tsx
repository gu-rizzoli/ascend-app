import Link from "next/link";

import type { DataCivil } from "@/domain/datas";
import {
  enderecoDaData,
  formatarMes,
  mesDe,
  nivelDaTaxa,
  percentual,
  semanasDoMes,
  somarMeses,
  type Contagem,
  type Mes,
} from "@/domain/historico";

// Uma cor só, mais forte quanto maior a taxa (10.3).
const FUNDO = {
  1: "bg-calor-1",
  2: "bg-calor-2",
  3: "bg-calor-3",
  4: "bg-calor-4",
  5: "bg-calor-5",
} as const;

const SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

function Dia({
  data,
  dataHoje,
  contagem,
  treino,
  aberto,
}: {
  data: DataCivil;
  dataHoje: DataCivil;
  contagem: Contagem | undefined;
  treino: boolean;
  aberto: boolean;
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
          className="bg-acento absolute top-1 right-1 size-1.5 rounded-full"
        />
      )}
    </>
  );
  const classe = `relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-sm ${
    taxa !== null ? FUNDO[nivelDaTaxa(taxa)] : ""
  } ${data === dataHoje ? "ring-2 ring-acento" : ""} ${
    aberto ? "ring-2 ring-acento-forte" : ""
  }`;
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
      aria-current={aberto ? "date" : undefined}
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
export function CalendarioDoMes({
  mes,
  dataHoje,
  porDia,
  diasComTreino,
  enderecoDoMes,
  selecionado,
}: {
  mes: Mes;
  dataHoje: DataCivil;
  porDia: Map<DataCivil, Contagem>;
  diasComTreino: Set<DataCivil>;
  enderecoDoMes: (mes: Mes) => string;
  /** O dia aberto ao lado, no computador. */
  selecionado?: DataCivil;
}) {
  const anterior = somarMeses(mes, -1);
  const proximo = somarMeses(mes, 1);
  const temProximo = proximo <= mesDe(dataHoje);

  return (
    <>
      <header className="mt-4 flex items-center justify-between">
        <Link
          href={enderecoDoMes(anterior)}
          aria-label="Mês anterior"
          className="flex size-10 items-center justify-center rounded-full text-2xl text-neutral-600 hover:bg-neutral-100"
        >
          ‹
        </Link>
        <h2 className="font-semibold">{formatarMes(mes)}</h2>
        {temProximo ? (
          <Link
            href={enderecoDoMes(proximo)}
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
                aberto={data === selecionado}
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
    </>
  );
}
