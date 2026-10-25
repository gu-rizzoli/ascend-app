import Link from "next/link";

import {
  formatarDataCurta,
  formatarInstante,
  type DataCivil,
} from "@/domain/datas";
import {
  enderecoDaData,
  parametrosDosFiltros,
  type Estatisticas,
  type Filtros,
  type MetaDoHistorico,
  type TreinoDoHistorico,
} from "@/domain/historico";
import { formatarNumero } from "@/domain/metas";

/** Calendário e Lista são duas formas de ver o mesmo Histórico (10.2). */
export function AbasDoHistorico({
  atual,
  filtros,
}: {
  atual: "calendario" | "lista";
  filtros: Pick<Filtros, "tipo" | "projetoId">;
}) {
  const abas = [
    { id: "calendario", nome: "Calendário", href: "/historico" },
    { id: "lista", nome: "Lista", href: "/historico/lista" },
  ] as const;
  return (
    <nav className="grid grid-cols-2 gap-1 rounded-xl bg-neutral-200/70 p-1 text-center text-sm">
      {abas.map((a) => (
        <Link
          key={a.id}
          href={`${a.href}${parametrosDosFiltros(filtros)}`}
          aria-current={a.id === atual ? "page" : undefined}
          className="aria-[current=page]:bg-superficie aria-[current=page]:text-acento-forte rounded-lg py-2 font-medium text-neutral-600 aria-[current=page]:shadow-sm"
        >
          {a.nome}
        </Link>
      ))}
    </nav>
  );
}

const classeSelect =
  "rounded-lg border border-neutral-300 bg-superficie px-3 py-2.5 text-base outline-none focus:border-acento";

/**
 * Período, tipo de registro e projeto (10.7). É um formulário GET comum: os
 * filtros ficam no endereço e o botão voltar funciona.
 */
export function FormularioDeFiltros({
  acao,
  filtros,
  projetos,
  periodo,
  ocultos = {},
}: {
  acao: string;
  filtros: Filtros;
  projetos: { id: string; nome: string }[];
  // A lista escolhe as datas; o calendário anda de mês em mês.
  periodo: boolean;
  ocultos?: Record<string, string>;
}) {
  const ativos =
    (filtros.tipo !== "tudo" ? 1 : 0) + (filtros.projetoId ? 1 : 0);
  return (
    <details
      className="bg-superficie mt-3 rounded-2xl shadow-sm"
      open={ativos > 0}
    >
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
        Filtros{ativos > 0 && ` (${ativos})`}
      </summary>
      <form action={acao} className="flex flex-col gap-3 px-3 pt-1 pb-3">
        {Object.entries(ocultos).map(([nome, valor]) => (
          <input key={nome} type="hidden" name={nome} value={valor} />
        ))}
        {periodo && (
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">De</span>
              <input
                type="date"
                name="de"
                defaultValue={filtros.de}
                className={classeSelect}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Até</span>
              <input
                type="date"
                name="ate"
                defaultValue={filtros.ate}
                className={classeSelect}
              />
            </label>
          </div>
        )}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Mostrar</span>
          <select
            name="tipo"
            defaultValue={filtros.tipo}
            className={classeSelect}
          >
            <option value="tudo">Metas e treinos</option>
            <option value="metas">Só metas</option>
            <option value="treinos">Só treinos</option>
          </select>
        </label>
        {projetos.length > 0 && (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Projeto das metas</span>
            <select
              name="projeto"
              defaultValue={filtros.projetoId ?? ""}
              className={classeSelect}
            >
              <option value="">Todos</option>
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="bg-acento rounded-lg px-4 py-2 font-medium text-white"
          >
            Aplicar
          </button>
          {ativos > 0 && (
            <Link
              href={`${acao}${parametrosDosFiltros({ tipo: "tudo", projetoId: null }, ocultos)}`}
              className="text-sm text-neutral-600 underline"
            >
              Limpar
            </Link>
          )}
        </div>
      </form>
    </details>
  );
}

function Numero({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <div className="bg-superficie rounded-2xl px-4 py-3 shadow-sm">
      <p className="text-acento text-2xl font-bold tabular-nums">{valor}</p>
      <p className="text-xs text-neutral-600">{rotulo}</p>
    </div>
  );
}

/**
 * As quatro estatísticas do período (10.10). Com o filtro de tipo, aparecem
 * só as que dizem respeito ao que está sendo mostrado.
 */
export function PainelDeEstatisticas({
  e,
  tipo,
}: {
  e: Estatisticas;
  tipo: Filtros["tipo"];
}) {
  return (
    <section
      aria-label="Estatísticas do período"
      className={`mt-4 grid gap-2 ${tipo === "treinos" ? "grid-cols-1" : tipo === "metas" ? "grid-cols-3" : "grid-cols-2"}`}
    >
      {tipo !== "treinos" && (
        <>
          <Numero valor={String(e.concluidas)} rotulo="metas concluídas" />
          <Numero valor={String(e.naoConcluidas)} rotulo="não concluídas" />
          <Numero
            valor={e.taxa === null ? "–" : `${e.taxa}%`}
            rotulo="taxa de conclusão"
          />
        </>
      )}
      {tipo !== "metas" && (
        <Numero
          valor={String(e.treinos)}
          rotulo={e.treinos === 1 ? "treino" : "treinos"}
        />
      )}
    </section>
  );
}

function Selo({
  children,
  cor = "neutro",
}: {
  children: React.ReactNode;
  cor?: "neutro" | "correcao";
}) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 ${cor === "correcao" ? "bg-amber-100 text-amber-900" : "bg-neutral-200 text-neutral-700"}`}
    >
      {children}
    </span>
  );
}

/**
 * Uma meta do dia, só para leitura (10.5): estado final, valor alcançado,
 * projeto, reagendamento e correção. Para mudar, existe o Corrigir.
 */
export function LinhaDoHistorico({
  item,
  dataHoje,
  completa = false,
}: {
  item: MetaDoHistorico;
  dataHoje: DataCivil;
  // No detalhe do dia aparecem também o horário e quando foi corrigida.
  completa?: boolean;
}) {
  const concluida = item.estado === "concluida";
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span
        aria-label={concluida ? "Concluída" : "Não concluída"}
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] ${
          concluida
            ? "border-acento bg-acento text-white"
            : "border-neutral-300"
        }`}
      >
        {concluida && "✓"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="break-words">{item.titulo}</p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
          {completa && item.horario && (
            <span className="tabular-nums">{item.horario}</span>
          )}
          {item.tipo === "numerica" && item.valorAlvo !== null && (
            <span className="tabular-nums">
              {formatarNumero(item.valorAtual ?? 0)} /{" "}
              {formatarNumero(item.valorAlvo)} {item.unidade}
            </span>
          )}
          {!concluida && <span>Não concluída</span>}
          {item.projeto && (
            <Link href={`/projetos/${item.projeto.id}`} className="underline">
              {item.projeto.nome}
            </Link>
          )}
          {item.reagendadaDe && (
            <Link href={enderecoDaData(item.reagendadaDe, dataHoje)}>
              <Selo>Reagendada de {formatarDataCurta(item.reagendadaDe)}</Selo>
            </Link>
          )}
          {item.reagendadaPara && (
            <Link href={enderecoDaData(item.reagendadaPara, dataHoje)}>
              <Selo>
                Reagendada para {formatarDataCurta(item.reagendadaPara)}
              </Selo>
            </Link>
          )}
          {item.corrigida && (
            <Selo cor="correcao">
              Corrigida
              {completa &&
                item.corrigidaEm &&
                ` em ${formatarInstante(item.corrigidaEm)}`}
            </Selo>
          )}
        </p>
      </div>
    </li>
  );
}

export function LinhaDoTreino({ treino }: { treino: TreinoDoHistorico }) {
  return (
    <li>
      <Link
        href={`/treinos/${treino.id}`}
        className="flex items-center gap-3 py-2.5"
      >
        <span className="bg-acento-suave text-acento-forte shrink-0 rounded px-1.5 py-0.5 text-xs font-medium">
          Treino
        </span>
        <span className="min-w-0 flex-1 truncate">{treino.titulo}</span>
        <span aria-hidden="true" className="text-neutral-400">
          ›
        </span>
      </Link>
    </li>
  );
}
