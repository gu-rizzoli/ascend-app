import type { Metadata } from "next";
import Link from "next/link";

import { FormularioCadastro } from "./formulario";

export const metadata: Metadata = { title: "Criar conta · Ascend" };

export default function PaginaCadastro() {
  return (
    <>
      <h1 className="text-xl font-semibold">Criar conta</h1>
      <FormularioCadastro />
      <p className="text-center text-sm text-neutral-600">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-medium text-neutral-900 underline">
          Entrar
        </Link>
      </p>
    </>
  );
}
