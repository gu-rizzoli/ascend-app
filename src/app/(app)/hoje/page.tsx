import type { Metadata } from "next";

import { hoje } from "@/domain/datas";

import { TelaDoDia } from "../dia/tela-do-dia";

export const metadata: Metadata = { title: "Hoje · Ascend" };

export default function PaginaHoje() {
  return <TelaDoDia data={hoje()} />;
}
