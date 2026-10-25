"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Avisa o navegador para confirmar antes de fechar com alterações. */
export function useConfirmarSaida(alterado: boolean) {
  useEffect(() => {
    if (!alterado) return;
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [alterado]);
}

const PERGUNTA = "Sair sem salvar? As alterações serão perdidas.";

/**
 * Link de sair do formulário (voltar, cancelar). Com alterações não salvas,
 * pede confirmação antes (treinos.md, "Registrar treino", item 8).
 */
export function LinkDeSaida({
  href,
  alterado,
  className,
  children,
  ...resto
}: {
  href: string;
  alterado: boolean;
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        if (alterado && !window.confirm(PERGUNTA)) e.preventDefault();
      }}
      {...resto}
    >
      {children}
    </Link>
  );
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
