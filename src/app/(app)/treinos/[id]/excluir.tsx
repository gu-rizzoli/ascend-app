"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * Excluir com confirmação (RF-TRE-18 e modelos). Abre uma caixa com a
 * pergunta antes de mandar o formulário.
 */
export function ExcluirComConfirmacao({
  acao,
  campo,
  id,
  pergunta,
  aviso,
}: {
  acao: (form: FormData) => Promise<void>;
  campo: string;
  id: string;
  pergunta: string;
  aviso: string;
}) {
  const [aberto, setAberto] = useState(false);
  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="w-full rounded-lg px-4 py-3 text-center font-medium text-red-700"
      >
        Excluir
      </button>
    );
  }
  return (
    <form
      action={acao}
      className="flex flex-col gap-3 rounded-lg bg-neutral-100 p-3"
    >
      <input type="hidden" name={campo} value={id} />
      <p className="text-sm font-medium">{pergunta}</p>
      <p className="text-xs text-neutral-600">{aviso}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="flex-1 rounded-lg px-4 py-3 font-medium text-neutral-600"
        >
          Cancelar
        </button>
        <Confirmar />
      </div>
    </form>
  );
}

function Confirmar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-1 rounded-lg bg-red-700 px-4 py-3 font-medium text-white disabled:opacity-50"
    >
      {pending ? "Excluindo…" : "Excluir"}
    </button>
  );
}
