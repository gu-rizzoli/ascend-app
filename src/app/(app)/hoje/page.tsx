import type { Metadata } from "next";

import { formatarDataLonga, hoje } from "@/domain/datas";
import { Botao } from "@/ui/botao";

export const metadata: Metadata = { title: "Hoje · Ascend" };

// Estado vazio do primeiro acesso (11.2, RF-GLO-06). A lista de metas e o
// formulário de nova meta chegam na entrega 2.
export default function PaginaHoje() {
  return (
    <>
      <h1 className="text-2xl font-semibold">{formatarDataLonga(hoje())}</h1>
      <section className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="max-w-64 text-neutral-600">
          Você ainda não tem metas. Comece pela primeira e ela aparece aqui no
          dia certo.
        </p>
        <Botao type="button" disabled title="Chega na próxima entrega">
          Criar primeira meta
        </Botao>
      </section>
    </>
  );
}
