import type { ButtonHTMLAttributes } from "react";

/** Visual do botão principal, também usado em links que agem como botão. */
export const classeBotao =
  "rounded-lg bg-acento px-4 py-3 text-center font-medium text-white disabled:opacity-50";

/** Botão principal: preto, largura total no celular. */
export function Botao({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`${classeBotao} ${className}`} {...props} />;
}
