"use client";

import Link, { useLinkStatus } from "next/link";

/**
 * Seta para o dia anterior ou o próximo. O dia vizinho é carregado por
 * inteiro em segundo plano (prefetch), então o toque troca o dia na hora.
 * Se o toque chegar antes de o vizinho estar pronto, a seta pulsa até a
 * resposta chegar, para o toque não parecer perdido.
 */
export function SetaDoDia({
  href,
  rotulo,
  children,
}: {
  href: string;
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch
      aria-label={rotulo}
      className="flex size-10 items-center justify-center rounded-full text-2xl text-neutral-600 hover:bg-neutral-100"
    >
      <Simbolo>{children}</Simbolo>
    </Link>
  );
}

function Simbolo({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return (
    <span className={pending ? "animate-pulse opacity-40" : undefined}>
      {children}
    </span>
  );
}
