import Link from "next/link";

import { hoje } from "@/domain/datas";
import { usuarioComDiasFechados } from "@/server/fechamento";

import { AvisoNovoDia } from "./aviso-novo-dia";
import { BarraDeAreas } from "./barra-de-areas";

// Áreas logadas (RF-GLO-04). Antes de renderizar, fecha os dias vencidos
// (fecharDiasVencidos, 11.5): é o "próximo acesso" que encerra o dia.
export const dynamic = "force-dynamic";

export default async function LayoutApp({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const usuario = await usuarioComDiasFechados();

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
      <AvisoNovoDia hoje={hoje()} />
    </div>
  );
}
