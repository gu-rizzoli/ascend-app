import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ehDataCivil, formatarDataLonga, hoje } from "@/domain/datas";

import { TelaDoDia } from "../tela-do-dia";

type Props = { params: Promise<{ data: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await params;
  if (!ehDataCivil(data)) return { title: "Ascend" };
  return { title: `${formatarDataLonga(data)} · Ascend` };
}

/** A lista de outra data, para planejar ou consultar (navegacao.md). */
export default async function PaginaDia({ params }: Props) {
  const { data } = await params;
  if (!ehDataCivil(data)) notFound();
  if (data === hoje()) redirect("/hoje");
  return <TelaDoDia data={data} />;
}
