"use client";

import { useEffect } from "react";

const PERGUNTA = "Sair sem salvar? As alterações serão perdidas.";

/**
 * Com alterações não salvas, pede confirmação antes de sair do formulário
 * por qualquer caminho (treinos.md, "Registrar treino", item 8): fechar ou
 * recarregar a aba, tocar num link da tela (voltar, cancelar, o menu, a
 * Conta) e o voltar do navegador ou o gesto de voltar do celular.
 */
export function useConfirmarSaida(alterado: boolean) {
  useEffect(() => {
    if (!alterado) return;

    const aviso = (e: BeforeUnloadEvent) => e.preventDefault();

    // Na captura, antes de o Link do Next navegar.
    const clique = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank") {
        return;
      }
      if (!window.confirm(PERGUNTA)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // O voltar não pode ser cancelado. Uma cópia da entrada atual no
    // histórico segura o primeiro voltar: se a pessoa desistir de sair, a
    // cópia volta para o lugar; se confirmar, o app volta de verdade.
    const segurar = () =>
      window.history.pushState(
        { ...window.history.state, ascendSaida: true },
        "",
        window.location.href,
      );
    if (!window.history.state?.ascendSaida) segurar();
    let saindo = false;
    const voltar = (e: PopStateEvent) => {
      if (saindo) return;
      // Antes do roteador do Next, que trocaria de tela.
      e.stopImmediatePropagation();
      if (window.confirm(PERGUNTA)) {
        saindo = true;
        window.history.back();
      } else {
        segurar();
      }
    };

    window.addEventListener("beforeunload", aviso);
    document.addEventListener("click", clique, { capture: true });
    window.addEventListener("popstate", voltar, { capture: true });
    return () => {
      window.removeEventListener("beforeunload", aviso);
      document.removeEventListener("click", clique, { capture: true });
      window.removeEventListener("popstate", voltar, { capture: true });
    };
  }, [alterado]);
}

/** Os botões pequenos de subir, descer e remover itens da lista. */
export function BotoesDeOrdem({
  nome,
  aoSubir,
  aoDescer,
  aoRemover,
}: {
  nome: string;
  aoSubir?: () => void;
  aoDescer?: () => void;
  aoRemover: () => void;
}) {
  const classe =
    "flex size-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 disabled:opacity-30";
  return (
    <div className="flex shrink-0 items-center">
      <button
        type="button"
        aria-label={`Subir ${nome}`}
        disabled={!aoSubir}
        onClick={aoSubir}
        className={classe}
      >
        ↑
      </button>
      <button
        type="button"
        aria-label={`Descer ${nome}`}
        disabled={!aoDescer}
        onClick={aoDescer}
        className={classe}
      >
        ↓
      </button>
      <button
        type="button"
        aria-label={`Remover ${nome}`}
        onClick={aoRemover}
        className={classe}
      >
        ✕
      </button>
    </div>
  );
}
