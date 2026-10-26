import type { Metadata } from "next";

import { Marca } from "@/ui/marca";
import { NaoEncontrado } from "@/ui/nao-encontrado";

export const metadata: Metadata = { title: "Página não encontrada · Ascend" };

/** Endereço fora das áreas do app, sem o menu (que exige login). */
export default function PaginaNaoEncontrada() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">
      <p className="flex justify-center text-3xl">
        <Marca />
      </p>
      <NaoEncontrado />
    </main>
  );
}
