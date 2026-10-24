import type { ButtonHTMLAttributes } from "react";

/** Botão principal: preto, largura total no celular. */
export function Botao({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`rounded-lg bg-neutral-900 px-4 py-3 font-medium text-white disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
