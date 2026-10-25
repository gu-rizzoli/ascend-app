"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

import { Marca } from "@/ui/marca";

// Ícones de traço, desenhados em 24×24.
const ICONES = {
  hoje: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM8.5 12l2.5 2.5 4.5-5",
  projetos:
    "M5 21V4c2.3-1.5 4.7-1.5 7 0s4.7 1.5 7 0v10c-2.3 1.5-4.7 1.5-7 0s-4.7-1.5-7 0",
  treinos: "M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11",
  historico: "M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2zM3 10h18M8 2v4M16 2v4",
};

const AREAS = [
  // Metas vivem em Hoje (navegacao.md, decisão 2).
  {
    nome: "Hoje",
    href: "/hoje",
    icone: ICONES.hoje,
    inclui: ["/hoje", "/dia", "/metas"],
  },
  {
    nome: "Projetos",
    href: "/projetos",
    icone: ICONES.projetos,
    inclui: ["/projetos"],
  },
  {
    nome: "Treinos",
    href: "/treinos",
    icone: ICONES.treinos,
    // Exercícios e Modelos são abas de Treinos (navegacao.md, decisão 5).
    inclui: ["/treinos", "/exercicios", "/modelos"],
  },
  {
    nome: "Histórico",
    href: "/historico",
    icone: ICONES.historico,
    inclui: ["/historico"],
  },
];

// Formulários ocupam a tela toda e escondem a barra, para dar espaço ao
// teclado (navegacao.md, "Celular e computador").
const FORMULARIOS = [
  /^\/metas\/novo/,
  /^\/metas\/[^/]+\/editar/,
  /^\/projetos\/novo/,
  /^\/projetos\/[^/]+\/editar/,
  /^\/treinos\/novo/,
  /^\/treinos\/[^/]+\/editar/,
  /^\/modelos\/.+/,
];

/**
 * O menu das 4 áreas: barra fixa embaixo no celular, barra lateral à esquerda
 * no computador, com a Conta no fim (navegacao.md, "Celular e computador").
 */
/**
 * A área de conteúdo. No computador, formulários ficam mais estreitos para as
 * linhas não esticarem (navegacao.md, decisão 7 de 25/10/2026).
 */
export function Conteudo({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();
  const emFormulario = FORMULARIOS.some((f) => f.test(caminho));
  return (
    <div
      className={`relative flex w-full flex-1 flex-col px-4 pt-4 pb-28 md:mx-auto md:px-8 md:pt-20 md:pb-12 ${
        emFormulario ? "md:max-w-xl" : "md:max-w-3xl"
      }`}
    >
      {children}
    </div>
  );
}

export function BarraDeAreas({ nome }: { nome: string }) {
  const caminho = usePathname();
  // No computador o teclado não cobre nada: a barra lateral fica sempre.
  const emFormulario = FORMULARIOS.some((f) => f.test(caminho));

  return (
    <nav
      className={`bg-superficie/90 fixed inset-x-0 bottom-0 z-10 border-t border-neutral-200 backdrop-blur md:inset-y-0 md:right-auto md:flex md:w-56 md:flex-col md:border-t-0 md:border-r md:px-3 md:py-5 ${
        emFormulario ? "hidden" : ""
      }`}
    >
      <span className="hidden px-3 pb-6 md:block">
        <Marca />
      </span>
      <ul className="mx-auto grid max-w-md grid-cols-4 text-center text-xs md:mx-0 md:flex md:max-w-none md:flex-col md:gap-1 md:text-left md:text-sm">
        {AREAS.map((area) => (
          <li key={area.href}>
            {/* As abas são carregadas inteiras em segundo plano (prefetch):
                o toque troca de área na hora. */}
            <Link
              href={area.href}
              prefetch
              aria-current={
                area.inclui.some((p) => caminho.startsWith(p))
                  ? "page"
                  : undefined
              }
              className="group hover:text-acento aria-[current=page]:text-acento-forte md:aria-[current=page]:bg-acento-suave flex flex-col items-center gap-1 pt-2.5 pb-3 text-neutral-500 aria-[current=page]:font-bold md:flex-row md:gap-3 md:rounded-xl md:px-3 md:py-2.5"
            >
              <span className="group-aria-[current=page]:bg-acento-suave flex h-7 w-14 items-center justify-center rounded-full md:h-auto md:w-auto md:group-aria-[current=page]:bg-transparent">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={area.icone} />
                </svg>
              </span>
              <Nome>{area.nome}</Nome>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/conta"
        aria-current={caminho.startsWith("/conta") ? "page" : undefined}
        className="hover:text-acento aria-[current=page]:bg-acento-suave aria-[current=page]:text-acento-forte mt-auto hidden items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-600 aria-[current=page]:font-semibold md:flex"
      >
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold"
        >
          {nome.charAt(0).toUpperCase()}
        </span>
        Conta
      </Link>
    </nav>
  );
}

/** Se o toque chegar antes da área estar pronta, o nome pulsa até ela abrir. */
function Nome({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return (
    <span className={pending ? "animate-pulse opacity-50" : undefined}>
      {children}
    </span>
  );
}
