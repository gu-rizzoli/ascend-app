import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ehDataCivil, formatarDataLonga, hoje } from "@/domain/datas";

import { TelaDoDia } from "../tela-do-dia";

type Props = {
  params: Promise<{ data: string }>;
  searchParams: Promise<{
    corrigir?: string | string[];
    voltar?: string | string[];
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await params;
  if (!ehDataCivil(data)) return { title: "Ascend" };
  return { title: `${formatarDataLonga(data)} · Ascend` };
}

/** A lista de outra data, para planejar, consultar ou corrigir (navegacao.md). */
export default async function PaginaDia({ params, searchParams }: Props) {
  const { data } = await params;
  if (!ehDataCivil(data)) notFound();
  if (data === hoje()) redirect("/hoje");
  // "?corrigir=1" abre a correção retroativa de um dia encerrado (RF-MET-12).
  // "&voltar=historico": o Pronto leva de volta ao detalhe do Histórico.
  const { corrigir, voltar } = await searchParams;
  return (
    <TelaDoDia
      data={data}
      corrigindo={corrigir !== undefined}
      voltarAoHistorico={voltar === "historico"}
    />
  );
}
