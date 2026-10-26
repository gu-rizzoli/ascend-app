import Link from "next/link";

import { classeBotao } from "./botao";

/**
 * Endereço que não existe, ou item que não é desta conta ou já foi excluído
 * (em outro aparelho, por exemplo). Leva de volta para Hoje.
 */
export function NaoEncontrado() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="text-xl font-bold tracking-tight">
        Página não encontrada
      </h1>
      <p className="max-w-64 text-neutral-600">
        O endereço está errado, ou o que você procurava foi excluído.
      </p>
      <Link href="/hoje" className={classeBotao}>
        Ir para Hoje
      </Link>
    </section>
  );
}
