import type { Metadata } from "next";

import { exigirUsuario } from "@/server/sessao";
import { exerciciosDoUsuario } from "@/server/treinos";

import { FormularioModelo } from "../formulario";

export const metadata: Metadata = { title: "Novo modelo · Ascend" };

export default async function PaginaNovoModelo() {
  const usuario = await exigirUsuario();
  const catalogo = await exerciciosDoUsuario(usuario.id);
  return (
    <FormularioModelo
      titulo="Novo modelo"
      catalogo={catalogo}
      inicial={{ nome: "", observacao: "", exercicios: [] }}
    />
  );
}
