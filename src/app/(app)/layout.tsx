import Link from "next/link";

import { hoje } from "@/domain/datas";
import { usuarioComDiasFechados } from "@/server/fechamento";
import { Marca } from "@/ui/marca";

import { AvisoNovoDia } from "./aviso-novo-dia";
import { BarraDeAreas, Conteudo } from "./barra-de-areas";

// Áreas logadas (RF-GLO-04). Antes de renderizar, fecha os dias vencidos
// (fecharDiasVencidos, 11.5): é o "próximo acesso" que encerra o dia.
export const dynamic = "force-dynamic";

export default async function LayoutApp({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const usuario = await usuarioComDiasFechados();

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col md:max-w-none md:pl-56">
      {/* No computador o nome do app e a Conta ficam na barra lateral. */}
      <header className="flex items-center justify-between px-4 pt-4 md:hidden">
        <Marca />
        <Link
          href="/conta"
          aria-label="Conta"
          className="bg-acento-suave text-acento-forte flex size-9 items-center justify-center rounded-full text-sm font-bold"
        >
          {usuario.nome.charAt(0).toUpperCase()}
        </Link>
      </header>

      <Conteudo>{children}</Conteudo>

      <BarraDeAreas nome={usuario.nome} />
      <AvisoNovoDia hoje={hoje()} />
    </div>
  );
}
