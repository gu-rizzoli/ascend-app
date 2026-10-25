import type { Frequencia } from "@/domain/recorrencia";

/** Pedaços dos formulários de criar e de editar meta. */

const FREQUENCIAS: { valor: Frequencia; nome: string }[] = [
  { valor: "unica", nome: "Só nesta data" },
  { valor: "diaria", nome: "Todo dia" },
  { valor: "semanal", nome: "Dias da semana" },
  { valor: "intervalo", nome: "A cada X dias" },
];

const DIAS = [
  { valor: 0, letra: "D", nome: "Domingo" },
  { valor: 1, letra: "S", nome: "Segunda" },
  { valor: 2, letra: "T", nome: "Terça" },
  { valor: 3, letra: "Q", nome: "Quarta" },
  { valor: 4, letra: "Q", nome: "Quinta" },
  { valor: 5, letra: "S", nome: "Sexta" },
  { valor: 6, letra: "S", nome: "Sábado" },
];

export function Erro({ id, texto }: { id: string; texto?: string }) {
  if (!texto) return null;
  return (
    <span id={id} className="text-sm text-red-700">
      {texto}
    </span>
  );
}

/** Opções lado a lado, com cara de botão, para escolher com um toque. */
export function Opcao({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="has-checked:border-acento has-checked:bg-acento flex-1 cursor-pointer rounded-lg border border-neutral-300 px-3 py-2.5 text-center text-sm font-medium has-checked:text-white">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {children}
    </label>
  );
}

/**
 * Frequência, com os dias da semana ou o intervalo quando for o caso. Uma
 * meta recorrente sendo editada não mostra "Só nesta data" (`semUnica`).
 */
export function CamposFrequencia({
  frequencia,
  mudarFrequencia,
  diasMarcados,
  intervalo,
  erros,
  semUnica = false,
}: {
  frequencia: string;
  mudarFrequencia: (f: Frequencia) => void;
  diasMarcados: string[];
  intervalo: string;
  erros: { frequencia?: string; diasSemana?: string; intervaloDias?: string };
  semUnica?: boolean;
}) {
  const opcoes = semUnica
    ? FREQUENCIAS.filter((f) => f.valor !== "unica")
    : FREQUENCIAS;
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium">Frequência</legend>
      <div className={`grid gap-2 ${semUnica ? "grid-cols-3" : "grid-cols-2"}`}>
        {opcoes.map((f) => (
          <Opcao
            key={f.valor}
            name="frequencia"
            value={f.valor}
            checked={frequencia === f.valor}
            onChange={() => mudarFrequencia(f.valor)}
          >
            {f.nome}
          </Opcao>
        ))}
      </div>
      <Erro id="frequencia-erro" texto={erros.frequencia} />

      {frequencia === "semanal" && (
        <div className="flex flex-col gap-1">
          <div
            className="flex justify-between gap-1"
            aria-describedby={erros.diasSemana ? "diasSemana-erro" : undefined}
          >
            {DIAS.map((dia) => (
              <label
                key={dia.valor}
                title={dia.nome}
                className="has-checked:border-acento has-checked:bg-acento flex size-10 cursor-pointer items-center justify-center rounded-full border border-neutral-300 text-sm font-medium has-checked:text-white"
              >
                <input
                  type="checkbox"
                  name="diasSemana"
                  value={dia.valor}
                  aria-label={dia.nome}
                  defaultChecked={diasMarcados.includes(String(dia.valor))}
                  className="sr-only"
                />
                {dia.letra}
              </label>
            ))}
          </div>
          <Erro id="diasSemana-erro" texto={erros.diasSemana} />
        </div>
      )}

      {frequencia === "intervalo" && (
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-2 text-sm">
            A cada
            <input
              name="intervaloDias"
              inputMode="numeric"
              defaultValue={intervalo}
              aria-invalid={erros.intervaloDias ? true : undefined}
              aria-describedby={
                erros.intervaloDias ? "intervaloDias-erro" : undefined
              }
              className="focus:border-acento w-16 rounded-lg border border-neutral-300 px-3 py-2 text-center text-base outline-none aria-invalid:border-red-600"
            />
            dias
          </label>
          <Erro id="intervaloDias-erro" texto={erros.intervaloDias} />
        </div>
      )}
    </fieldset>
  );
}

/** O projeto associado (RF-PRO-07): só projetos não concluídos nem arquivados. */
export function CampoProjeto({
  projetos,
  valor,
  erro,
}: {
  projetos: { id: string; nome: string }[];
  valor: string;
  erro?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium">Projeto</span>
      <select
        name="projeto"
        defaultValue={valor}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? "projeto-erro" : undefined}
        className="bg-superficie focus:border-acento rounded-lg border border-neutral-300 px-3 py-2.5 text-base outline-none aria-invalid:border-red-600"
      >
        <option value="">Nenhum</option>
        {projetos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
          </option>
        ))}
      </select>
      <Erro id="projeto-erro" texto={erro} />
    </label>
  );
}
