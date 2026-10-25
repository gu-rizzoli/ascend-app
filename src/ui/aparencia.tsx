"use client";

import { useEffect, useState } from "react";

/**
 * Aparência claro (Menta) ou escuro (Noite), escolhida na Conta e guardada só
 * neste aparelho (navegacao.md, decisão 11). "Automático" segue o celular.
 */
type Aparencia = "automatico" | "claro" | "escuro";

const CHAVE = "ascend:aparencia";

/**
 * Roda no <head>, antes da página aparecer, para não piscar no tema errado.
 * Em Automático, acompanha a troca de claro/escuro do sistema.
 */
export const scriptDaAparencia = `(function(){var m=matchMedia("(prefers-color-scheme: dark)");function a(){var e;try{e=localStorage.getItem("${CHAVE}")}catch(_){}if(e!=="claro"&&e!=="escuro")e=m.matches?"escuro":"claro";document.documentElement.dataset.tema=e}a();m.addEventListener("change",a);window.__aplicarAparencia=a})()`;

const OPCOES: { valor: Aparencia; nome: string }[] = [
  { valor: "automatico", nome: "Automático" },
  { valor: "claro", nome: "Claro" },
  { valor: "escuro", nome: "Escuro" },
];

function lerAparencia(): Aparencia {
  try {
    const salva = localStorage.getItem(CHAVE);
    if (salva === "claro" || salva === "escuro") return salva;
  } catch {}
  return "automatico";
}

export function EscolhaDaAparencia() {
  // Só se sabe a escolha depois de montar: ela mora no aparelho.
  const [atual, setAtual] = useState<Aparencia | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAtual(lerAparencia());
  }, []);

  function escolher(valor: Aparencia) {
    setAtual(valor);
    try {
      if (valor === "automatico") localStorage.removeItem(CHAVE);
      else localStorage.setItem(CHAVE, valor);
    } catch {}
    (window as { __aplicarAparencia?: () => void }).__aplicarAparencia?.();
  }

  return (
    <fieldset className="flex flex-col gap-3 border-t border-neutral-200 pt-5">
      <legend className="float-left mb-3 font-semibold">Aparência</legend>
      <div className="clear-left grid grid-cols-3 gap-1 rounded-xl bg-neutral-200/70 p-1 text-center text-sm">
        {OPCOES.map((o) => (
          <label
            key={o.valor}
            className="has-checked:bg-superficie has-checked:text-acento-forte cursor-pointer rounded-lg py-2 font-medium text-neutral-600 has-checked:shadow-sm"
          >
            <input
              type="radio"
              name="aparencia"
              value={o.valor}
              checked={atual === o.valor}
              onChange={() => escolher(o.valor)}
              className="sr-only"
            />
            {o.nome}
          </label>
        ))}
      </div>
      <p className="text-sm text-neutral-600">
        Automático segue o claro ou escuro do aparelho. A escolha vale só neste
        aparelho.
      </p>
    </fieldset>
  );
}
