import Link from "next/link";

import { exigirUsuario } from "@/server/sessao";

import { BarraDeAreas } from "./barra-de-areas";

// Áreas logadas (RF-GLO-04). O fechamento preguiçoso dos dias vencidos
// (fecharDiasVencidos) entra aqui na entrega 3.
export const dynamic = "force-dynamic";

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

      <div className="flex flex-1 flex-col px-4 pt-4 pb-28">{children}</div>

      <BarraDeAreas />
    </div>
  );
}
