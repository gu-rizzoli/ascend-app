import Link from "next/link";

import { exigirUsuario } from "@/server/sessao";

// Áreas logadas (RF-GLO-04). O fechamento preguiçoso dos dias vencidos
// (fecharDiasVencidos) entra aqui na entrega 3, quando existirem ocorrências.
export const dynamic = "force-dynamic";

const AREAS = [
  { nome: "Hoje", href: "/hoje", pronta: true },
  { nome: "Projetos", href: "/projetos", pronta: false },
  { nome: "Treinos", href: "/treinos", pronta: false },
  { nome: "Histórico", href: "/historico", pronta: false },
];

export default async function LayoutApp({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const usuario = await exigirUsuario();

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="flex items-center justify-between px-4 pt-4">
        <span className="text-lg font-semibold tracking-tight">Ascend</span>
        <Link
          href="/conta"
          aria-label="Conta"
          className="flex size-9 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold"
        >
          {usuario.nome.charAt(0).toUpperCase()}
        </Link>
      </header>

      <div className="flex flex-1 flex-col px-4 pt-4 pb-24">{children}</div>

      <nav className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white">
        <ul className="mx-auto grid max-w-md grid-cols-4 text-center text-xs">
          {AREAS.map((area) => (
            <li key={area.href}>
              {area.pronta ? (
                <Link href={area.href} className="block py-4 font-semibold">
                  {area.nome}
                </Link>
              ) : (
                // As outras áreas chegam nas próximas entregas.
                <span
                  aria-disabled="true"
                  className="block py-4 text-neutral-400"
                >
                  {area.nome}
                </span>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
