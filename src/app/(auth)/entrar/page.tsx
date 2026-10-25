import type { Metadata } from "next";
import Link from "next/link";

import { FormularioEntrar } from "./formulario";

export const metadata: Metadata = { title: "Entrar · Ascend" };

export default function PaginaEntrar() {
  return (
    <>
      <h1 className="text-xl font-bold tracking-tight">Entrar</h1>
      <FormularioEntrar />
      <p className="text-center text-sm text-neutral-600">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="text-acento font-medium underline">
          Criar conta
        </Link>
      </p>
    </>
  );
}
