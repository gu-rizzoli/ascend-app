import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  rotulo: string;
  name: string;
  erro?: string;
};

/** Campo de formulário com rótulo e mensagem de erro logo abaixo. */
export function Campo({ rotulo, name, erro, ...input }: Props) {
  const idErro = `${name}-erro`;
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium">{rotulo}</span>
      <input
        name={name}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? idErro : undefined}
        className="rounded-lg border border-neutral-300 px-3 py-2.5 text-base outline-none focus:border-neutral-900 aria-invalid:border-red-600"
        {...input}
      />
      {erro && (
        <span id={idErro} className="text-sm text-red-700">
          {erro}
        </span>
      )}
    </label>
  );
}
