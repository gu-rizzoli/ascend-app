import Link from "next/link";

const ABAS = [
  { nome: "Treinos", href: "/treinos" },
  { nome: "Exercícios", href: "/exercicios" },
  { nome: "Modelos", href: "/modelos" },
] as const;

/** Exercícios e Modelos são abas dentro de Treinos (navegacao.md, decisão 5). */
export function AbasDeTreinos({
  atual,
}: {
  atual: (typeof ABAS)[number]["href"];
}) {
  return (
    <nav className="grid grid-cols-3 gap-1 rounded-lg bg-neutral-100 p-1 text-center text-sm">
      {ABAS.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          aria-current={a.href === atual ? "page" : undefined}
          className="rounded-md py-2 font-medium text-neutral-600 aria-[current=page]:bg-white aria-[current=page]:text-neutral-900 aria-[current=page]:shadow-sm"
        >
          {a.nome}
        </Link>
      ))}
    </nav>
  );
}

/** O botão flutuante da área (navegacao.md, decisão 6). */
export function BotaoFlutuante({
  href,
  rotulo,
}: {
  href: string;
  rotulo: string;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-10 mx-auto flex max-w-md justify-end px-4">
      <Link
        href={href}
        aria-label={rotulo}
        className="pointer-events-auto flex size-14 items-center justify-center rounded-full bg-neutral-900 text-3xl leading-none text-white shadow-lg"
      >
        +
      </Link>
    </div>
  );
}

/** O título de um treino na lista e no detalhe. */
export function tituloDoTreino(t: {
  nome: string | null;
  exercicios: readonly string[] | readonly { nome: string }[];
}): string {
  if (t.nome) return t.nome;
  const nomes = t.exercicios.map((e) => (typeof e === "string" ? e : e.nome));
  return nomes.length > 0 ? nomes.join(", ") : "Treino";
}
