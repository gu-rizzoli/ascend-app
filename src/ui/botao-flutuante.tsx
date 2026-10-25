import Link from "next/link";

/**
 * A ação principal da área (navegacao.md, decisão 6). No celular é o botão
 * redondo acima da barra; no computador vira um botão com nome no topo da
 * tela (navegacao.md, "Celular e computador").
 */
export function BotaoFlutuante({
  href,
  rotulo,
}: {
  href: string;
  rotulo: string;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-10 mx-auto flex max-w-md justify-end px-4 md:absolute md:inset-x-auto md:top-5 md:right-8 md:bottom-auto md:px-0">
      <Link
        href={href}
        aria-label={rotulo}
        className="bg-acento pointer-events-auto flex size-14 items-center justify-center gap-1.5 rounded-full text-3xl leading-none text-white shadow-lg md:size-auto md:rounded-lg md:px-4 md:py-2.5 md:text-base md:font-medium md:shadow-none"
      >
        +<span className="hidden md:inline">{rotulo}</span>
      </Link>
    </div>
  );
}
