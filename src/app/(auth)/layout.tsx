import { redirect } from "next/navigation";

import { usuarioAtual } from "@/server/sessao";
import { Marca } from "@/ui/marca";

// Telas de acesso: quem já está logado vai direto para Hoje.
export default async function LayoutAcesso({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (await usuarioAtual()) redirect("/hoje");

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-4 py-10">
      <p className="flex justify-center text-3xl">
        <Marca />
      </p>
      {children}
    </main>
  );
}
