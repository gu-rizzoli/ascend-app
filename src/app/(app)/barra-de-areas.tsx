"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

const AREAS = [
  // Metas vivem em Hoje (navegacao.md, decisão 2).
  { nome: "Hoje", href: "/hoje", inclui: ["/hoje", "/dia", "/metas"] },
  { nome: "Projetos", href: "/projetos", inclui: ["/projetos"] },
  {
    nome: "Treinos",
    href: "/treinos",
    // Exercícios e Modelos são abas de Treinos (navegacao.md, decisão 5).
    inclui: ["/treinos", "/exercicios", "/modelos"],
  },
  { nome: "Histórico", href: "/historico", inclui: ["/historico"] },
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
      className={`fixed inset-x-0 bottom-0 z-10 border-t border-neutral-200 bg-white md:inset-y-0 md:right-auto md:flex md:w-56 md:flex-col md:border-t-0 md:border-r md:px-3 md:py-5 ${
        emFormulario ? "hidden" : ""
      }`}
    >
      <span className="hidden px-3 pb-6 text-lg font-semibold tracking-tight md:block">
        Ascend
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
              className="block py-4 text-neutral-500 hover:text-neutral-900 aria-[current=page]:font-semibold aria-[current=page]:text-neutral-900 md:rounded-lg md:px-3 md:py-2 md:aria-[current=page]:bg-neutral-100"
            >
              <Nome>{area.nome}</Nome>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/conta"
        aria-current={caminho.startsWith("/conta") ? "page" : undefined}
        className="mt-auto hidden items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 aria-[current=page]:bg-neutral-100 aria-[current=page]:font-semibold aria-[current=page]:text-neutral-900 md:flex"
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
