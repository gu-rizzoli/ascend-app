"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const AREAS = [
  // Metas vivem em Hoje (navegacao.md, decisão 2).
  { nome: "Hoje", href: "/hoje", inclui: ["/hoje", "/dia", "/metas"] },
  { nome: "Projetos", href: "/projetos", inclui: ["/projetos"] },
  { nome: "Treinos", href: "/treinos", inclui: null },
  { nome: "Histórico", href: "/historico", inclui: null },
];

// Formulários ocupam a tela toda e escondem a barra, para dar espaço ao
// teclado (navegacao.md, "Celular e computador").
const FORMULARIOS = [
  /^\/metas\/novo/,
  /^\/metas\/[^/]+\/editar/,
  /^\/projetos\/novo/,
  /^\/projetos\/[^/]+\/editar/,
];

export function BarraDeAreas() {
  const caminho = usePathname();
  if (FORMULARIOS.some((f) => f.test(caminho))) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-neutral-200 bg-white">
      <ul className="mx-auto grid max-w-md grid-cols-4 text-center text-xs">
        {AREAS.map((area) => (
          <li key={area.href}>
            {area.inclui ? (
              <Link
                href={area.href}
                aria-current={
                  area.inclui.some((p) => caminho.startsWith(p))
                    ? "page"
                    : undefined
                }
                className="block py-4 text-neutral-500 aria-[current=page]:font-semibold aria-[current=page]:text-neutral-900"
              >
                {area.nome}
              </Link>
            ) : (
              // As outras áreas chegam nas próximas entregas.
              <span
                aria-disabled="true"
                className="block py-4 text-neutral-300"
              >
                {area.nome}
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
