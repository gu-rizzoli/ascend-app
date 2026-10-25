import type { Metadata } from "next";
import Link from "next/link";

import { ehDataCivil, hoje } from "@/domain/datas";
import { diaEditavel } from "@/domain/metas";
import { frequenciaPadrao } from "@/domain/recorrencia";
import { projetosParaAssociar } from "@/server/projetos";
import { exigirUsuario } from "@/server/sessao";

import { FormularioNovaMeta } from "./formulario";

export const metadata: Metadata = { title: "Nova meta · Ascend" };

type Props = { searchParams: Promise<{ data?: string | string[] }> };

/** Criar meta (RF-MET-01 a 05). A data vem da lista que estava aberta. */
export default async function PaginaNovaMeta({ searchParams }: Props) {
  const usuario = await exigirUsuario();
  const { data: pedida } = await searchParams;
  const dataHoje = hoje();
  const data =
    typeof pedida === "string" &&
    ehDataCivil(pedida) &&
    diaEditavel(pedida, dataHoje)
      ? pedida
      : dataHoje;
  const voltar = data === dataHoje ? "/hoje" : `/dia/${data}`;

  return (
    <>
      <header className="flex items-center gap-2">
        <Link
          href={voltar}
          aria-label="Voltar"
          className="-ml-2 flex size-10 items-center justify-center rounded-full text-2xl text-neutral-600 hover:bg-neutral-100"
        >
          ‹
        </Link>
        <h1 className="text-xl font-semibold">Nova meta</h1>
      </header>
      <FormularioNovaMeta
        dataAberta={data}
        hoje={dataHoje}
        frequenciaInicial={frequenciaPadrao(data, dataHoje)}
        voltar={voltar}
        projetos={await projetosParaAssociar(usuario.id)}
      />
    </>
  );
}
