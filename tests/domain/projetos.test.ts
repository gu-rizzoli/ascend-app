import { describe, expect, it } from "vitest";

import { paraDataCivil } from "@/domain/datas";
import {
  agruparProjetos,
  esquemaProjeto,
  lerProximoPasso,
  metasAtivasDoProjeto,
  metasParaPausar,
  metasRecorrentesDoProjeto,
  nomeConfere,
  prazoVencido,
  saiDoDestaque,
  trocaPelaEstrela,
  type CamposProjeto,
  type StatusProjeto,
} from "@/domain/projetos";

const d = paraDataCivil;
const HOJE = d("2026-10-25");

function campos(extra: Partial<CamposProjeto> = {}): CamposProjeto {
  return {
    nome: "TCC",
    descricao: "",
    status: "em_andamento",
    proximoPasso: "",
    dataInicio: "2026-10-25",
    prazo: "",
    ...extra,
  };
}

describe("esquemaProjeto", () => {
  it("só exige o nome", () => {
    const r = esquemaProjeto().safeParse(campos({ nome: "  TCC  " }));
    expect(r.success && r.data).toEqual({
      nome: "TCC",
      descricao: null,
      status: "em_andamento",
      proximoPasso: null,
      dataInicio: "2026-10-25",
      prazo: null,
    });
  });

  it("recusa nome vazio", () => {
    expect(esquemaProjeto().safeParse(campos({ nome: " " })).success).toBe(
      false,
    );
  });

  it("aceita início no passado e prazo no mesmo dia do início", () => {
    const r = esquemaProjeto().safeParse(
      campos({ dataInicio: "2026-01-10", prazo: "2026-01-10" }),
    );
    expect(r.success).toBe(true);
  });

  it("recusa prazo antes do início", () => {
    const r = esquemaProjeto().safeParse(
      campos({ dataInicio: "2026-10-25", prazo: "2026-10-24" }),
    );
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(["prazo"]);
  });

  it("não deixa concluir nem arquivar pelo formulário", () => {
    for (const status of ["concluido", "arquivado"]) {
      expect(esquemaProjeto().safeParse(campos({ status })).success).toBe(
        false,
      );
    }
  });

  it("deixa um projeto encerrado ser salvo sem reabrir", () => {
    const r = esquemaProjeto("concluido").safeParse(
      campos({ status: "concluido" }),
    );
    expect(r.success).toBe(true);
    expect(
      esquemaProjeto("concluido").safeParse(campos({ status: "arquivado" }))
        .success,
    ).toBe(false);
  });
});

describe("prazoVencido", () => {
  it("vence só depois do dia do prazo", () => {
    expect(prazoVencido({ prazo: HOJE, status: "em_andamento" }, HOJE)).toBe(
      false,
    );
    expect(
      prazoVencido({ prazo: d("2026-10-24"), status: "pausado" }, HOJE),
    ).toBe(true);
  });

  it("não vale para concluídos, arquivados ou sem prazo", () => {
    const ontem = d("2026-10-24");
    expect(prazoVencido({ prazo: ontem, status: "concluido" }, HOJE)).toBe(
      false,
    );
    expect(prazoVencido({ prazo: ontem, status: "arquivado" }, HOJE)).toBe(
      false,
    );
    expect(prazoVencido({ prazo: null, status: "planejado" }, HOJE)).toBe(
      false,
    );
  });
});

describe("lerProximoPasso", () => {
  it("vazio apaga e o texto é limpo", () => {
    expect(lerProximoPasso("   ")).toBeNull();
    expect(lerProximoPasso("  Ler o cap. 2 ")).toBe("Ler o cap. 2");
  });
});

describe("agruparProjetos", () => {
  const p = (id: string, status: StatusProjeto) => ({ id, status });

  it("põe o atual no topo, fora do grupo dele", () => {
    const g = agruparProjetos(
      [
        p("a", "em_andamento"),
        p("b", "em_andamento"),
        p("c", "planejado"),
        p("d", "pausado"),
        p("e", "concluido"),
        p("f", "arquivado"),
      ],
      "b",
    );
    expect(g.atual?.id).toBe("b");
    expect(g.emAndamento.map((x) => x.id)).toEqual(["a"]);
    expect(g.planejados.map((x) => x.id)).toEqual(["c"]);
    expect(g.pausados.map((x) => x.id)).toEqual(["d"]);
    expect(g.concluidos.map((x) => x.id)).toEqual(["e"]);
    expect(g.arquivados.map((x) => x.id)).toEqual(["f"]);
  });

  it("sem atual, ninguém fica no topo", () => {
    expect(agruparProjetos([p("a", "pausado")], null).atual).toBeNull();
  });
});

describe("trocaPelaEstrela", () => {
  it("tocar em outro projeto transfere o destaque", () => {
    expect(trocaPelaEstrela({ id: "b", status: "pausado" }, "a")).toEqual({
      projetoId: "b",
    });
  });

  it("tocar no atual deixa sem projeto atual", () => {
    expect(trocaPelaEstrela({ id: "a", status: "em_andamento" }, "a")).toEqual({
      projetoId: null,
    });
  });

  it("um projeto encerrado não vira o atual", () => {
    expect(trocaPelaEstrela({ id: "b", status: "concluido" }, null)).toBeNull();
  });
});

describe("saiDoDestaque", () => {
  it("só ao concluir ou arquivar o atual", () => {
    expect(saiDoDestaque("a", "concluido", "a")).toBe(true);
    expect(saiDoDestaque("a", "arquivado", "a")).toBe(true);
    expect(saiDoDestaque("a", "pausado", "a")).toBe(false);
    expect(saiDoDestaque("a", "concluido", "b")).toBe(false);
  });
});

describe("metas do projeto", () => {
  const versao = (
    id: string,
    vigenteDe: string,
    vigenteAte: string | null,
    projetoId: string | null,
    frequencia = "diaria",
  ) => ({
    id,
    vigenteDe: d(vigenteDe),
    vigenteAte: vigenteAte === null ? null : d(vigenteAte),
    projetoId,
    frequencia,
  });

  const metas = [
    // Recorrente associada hoje.
    {
      id: "m1",
      estado: "ativa" as const,
      versoes: [versao("v1", "2026-10-01", null, "P")],
    },
    // Era do projeto, mudou de projeto ontem: associação só histórica.
    {
      id: "m2",
      estado: "ativa" as const,
      versoes: [
        versao("v2", "2026-10-01", "2026-10-24", "P"),
        versao("v3", "2026-10-25", null, null),
      ],
    },
    // Pausada: não entra.
    {
      id: "m3",
      estado: "pausada" as const,
      versoes: [versao("v4", "2026-10-01", "2026-10-20", "P")],
    },
    // Única no futuro: ativa, mas não recorrente.
    {
      id: "m4",
      estado: "ativa" as const,
      versoes: [versao("v5", "2026-10-30", "2026-10-30", "P", "unica")],
    },
    // Única que já passou: fica só no Histórico.
    {
      id: "m5",
      estado: "ativa" as const,
      versoes: [versao("v6", "2026-10-20", "2026-10-20", "P", "unica")],
    },
    // Passa a ser do projeto amanhã.
    {
      id: "m6",
      estado: "ativa" as const,
      versoes: [
        versao("v7", "2026-10-01", "2026-10-25", null),
        versao("v8", "2026-10-26", null, "P"),
      ],
    },
  ];

  it("ativas: a regra que vale hoje aponta para o projeto", () => {
    expect(metasAtivasDoProjeto(metas, "P", HOJE).map((m) => m.id)).toEqual([
      "m1",
      "m4",
    ]);
  });

  it("recorrentes: só as ativas que se repetem", () => {
    expect(
      metasRecorrentesDoProjeto(metas, "P", HOJE).map((m) => m.id),
    ).toEqual(["m1"]);
  });
});

describe("metasParaPausar", () => {
  const recorrentes = ["m1", "m2", "m3"];

  it("manter ativas não pausa nada", () => {
    expect(metasParaPausar("manter", recorrentes, ["m1"])).toEqual([]);
  });

  it("pausar todas pausa as recorrentes", () => {
    expect(metasParaPausar("pausar_todas", recorrentes, [])).toEqual(
      recorrentes,
    );
  });

  it("uma a uma ignora o que não é recorrente do projeto", () => {
    expect(metasParaPausar("escolher", recorrentes, ["m2", "outra"])).toEqual([
      "m2",
    ]);
  });
});

describe("nomeConfere", () => {
  it("ignora espaços nas pontas e maiúsculas", () => {
    expect(nomeConfere("  tcc ", "TCC")).toBe(true);
    expect(nomeConfere("TC", "TCC")).toBe(false);
  });
});
