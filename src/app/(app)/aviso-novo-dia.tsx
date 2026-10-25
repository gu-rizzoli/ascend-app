"use client";

import { useEffect, useRef, useState } from "react";

/**
 * "Um novo dia começou" (fluxos-metas.md, "Encerramento do dia"). Se o app
 * ficou aberto na virada da meia-noite, a próxima ação recarrega a tela com
 * a data nova; este aviso discreto explica a mudança, sem bloquear nada.
 */
export function AvisoNovoDia({ hoje }: { hoje: string }) {
  const anterior = useRef(hoje);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (anterior.current === hoje) return;
    anterior.current = hoje;
    // Só reage à troca de data vinda do servidor.
    setVisivel(true);
    const t = setTimeout(() => setVisivel(false), 5000);
    return () => clearTimeout(t);
  }, [hoje]);

  if (!visivel) return null;
  return (
    <div
      role="status"
      className="bg-acento fixed inset-x-0 top-4 z-20 mx-auto w-fit rounded-full px-4 py-2 text-sm text-white shadow-lg"
    >
      Um novo dia começou
    </div>
  );
}
