import { describe, expect, it } from "vitest";

import { paraDataCivil } from "@/domain/datas";
import type { Regra } from "@/domain/recorrencia";
import {
  agruparMetas,
  ajusteSoEsta,
  novaDataValida,
  planoDeEdicao,
  planoDeEncerramento,
  planoDeReativacao,
  podeAdiar,
  podeReagendar,
  temProgresso,
  versaoDeReferencia,
  versaoVazia,
  type OcorrenciaDaMeta,
  type Vigencia,
} from "@/domain/vigencia";

const d = paraDataCivil;
const HOJE = d("2026-10-25");
const ONTEM = d("2026-10-24");
const AMANHA = d("2026-10-26");

function versao(
  id: string,
  vigenteDe: string,
  vigenteAte: string | null = null,
): Vigencia {
  return {
    id,
    vigenteDe: d(vigenteDe),
    vigenteAte: vigenteAte === null ? null : d(vigenteAte),
  };
}

function oc(
  id: string,
  data: string,
  parcial: Partial<OcorrenciaDaMeta> = {},
): OcorrenciaDaMeta {
  return {
    id,
    versaoId: "v1",
    origem: "regra",
    dataPrevista: d(data),
    data: d(data),
    estado: "pendente",
    valorAtual: null,
    ajustada: false,
    ...parcial,
  };
}

const diaria = (vigenteDe: string): Regra => ({
  frequencia: "diaria",
  vigenteDe: d(vigenteDe),
  vigenteAte: null,
  diasSemana: null,
  intervaloDias: null,
});

describe("temProgresso / versaoVazia", () => {
  it("progresso é conclusão ou algum valor", () => {
    expect(temProgresso({ estado: "pendente", valorAtual: null })).toBe(false);
    expect(temProgresso({ estado: "pendente", valorAtual: 0 })).toBe(false);
    expect(temProgresso({ estado: "pendente", valorAtual: 0.5 })).toBe(true);
    expect(temProgresso({ estado: "concluida", valorAtual: null })).toBe(true);
  });

  it("versão fechada antes de começar não vale em nenhum dia", () => {
    expect(versaoVazia(versao("v", "2026-10-26", "2026-10-25"))).toBe(true);
    expect(versaoVazia(versao("v", "2026-10-26", "2026-10-26"))).toBe(false);
    expect(versaoVazia(versao("v", "2026-10-26"))).toBe(false);
  });
});

describe("versaoDeReferencia", () => {
  it("a vigente hoje, senão a próxima, senão a última", () => {
    const antiga = versao("a", "2026-10-01", "2026-10-20");
    const atual = versao("b", "2026-10-21");
    expect(versaoDeReferencia([antiga, atual], HOJE)?.id).toBe("b");

    const futura = versao("c", "2026-11-01");
    expect(versaoDeReferencia([antiga, futura], HOJE)?.id).toBe("c");
    expect(versaoDeReferencia([antiga], HOJE)?.id).toBe("a");
  });

  it("ignora versões vazias se houver outra", () => {
    const vazia = versao("v", "2026-11-01", "2026-10-31");
    const antiga = versao("a", "2026-10-01", "2026-10-20");
    expect(versaoDeReferencia([antiga, vazia], HOJE)?.id).toBe("a");
    expect(versaoDeReferencia([vazia], HOJE)?.id).toBe("v");
  });
});

describe("planoDeEncerramento", () => {
  const v1 = versao("v1", "2026-10-01");

  it("hoje intocada: sai, e a regra termina ontem", () => {
    const plano = planoDeEncerramento("pausar", HOJE, [v1], [oc("hoje", HOJE)]);
    expect(plano.apagar).toEqual(["hoje"]);
    expect(plano.fechar).toEqual([{ id: "v1", vigenteAte: ONTEM }]);
  });

  it("hoje com progresso: fica, e a regra vale até hoje", () => {
    const plano = planoDeEncerramento(
      "pausar",
      HOJE,
      [v1],
      [oc("hoje", HOJE, { valorAtual: 1 })],
    );
    expect(plano.apagar).toEqual([]);
    expect(plano.fechar).toEqual([{ id: "v1", vigenteAte: HOJE }]);
  });

  it("sem nada gravado hoje: a regra termina ontem", () => {
    const plano = planoDeEncerramento("pausar", HOJE, [v1], []);
    expect(plano.fechar).toEqual([{ id: "v1", vigenteAte: ONTEM }]);
  });

  it("o passado não é tocado", () => {
    const plano = planoDeEncerramento(
      "excluir",
      HOJE,
      [v1],
      [
        oc("falhou", ONTEM, { estado: "nao_concluida" }),
        oc("feita", "2026-10-20", { estado: "concluida" }),
      ],
    );
    expect(plano.apagar).toEqual([]);
  });

  it("pausar: futuras pendentes saem, concluídas antecipadas ficam", () => {
    const plano = planoDeEncerramento(
      "pausar",
      HOJE,
      [v1],
      [
        oc("ajustada", AMANHA, { ajustada: true }),
        oc("parcial", "2026-10-27", { valorAtual: 2 }),
        oc("adiantada", "2026-10-28", { estado: "concluida" }),
      ],
    );
    expect(plano.apagar).toEqual(["ajustada", "parcial"]);
  });

  it("excluir: o futuro todo sai, até as concluídas antecipadas", () => {
    const plano = planoDeEncerramento(
      "excluir",
      HOJE,
      [v1],
      [
        oc("hoje", HOJE, { estado: "concluida" }),
        oc("adiantada", "2026-10-28", { estado: "concluida" }),
      ],
    );
    expect(plano.apagar).toEqual(["adiantada"]);
    expect(plano.fechar).toEqual([{ id: "v1", vigenteAte: HOJE }]);
  });

  it("vaga de hoje adiada para o futuro conta como futura", () => {
    const plano = planoDeEncerramento(
      "pausar",
      HOJE,
      [v1],
      [oc("adiada", HOJE, { data: AMANHA, ajustada: true })],
    );
    expect(plano.apagar).toEqual(["adiada"]);
    expect(plano.fechar).toEqual([{ id: "v1", vigenteAte: ONTEM }]);
  });

  it("reagendada pendente de hoje intocada também sai", () => {
    const plano = planoDeEncerramento(
      "pausar",
      HOJE,
      [v1],
      [oc("r", HOJE, { origem: "reagendada", dataPrevista: null })],
    );
    expect(plano.apagar).toEqual(["r"]);
  });

  it("versão que ainda não começou fica vazia", () => {
    const plano = planoDeEncerramento(
      "pausar",
      HOJE,
      [versao("v1", "2026-10-01", "2026-10-29"), versao("v2", "2026-10-30")],
      [],
    );
    expect(plano.fechar).toEqual([
      { id: "v1", vigenteAte: ONTEM },
      { id: "v2", vigenteAte: d("2026-10-29") },
    ]);
  });

  it("versão criada hoje e intocada fica vazia", () => {
    const plano = planoDeEncerramento("pausar", HOJE, [versao("v1", HOJE)], []);
    expect(plano.fechar).toEqual([{ id: "v1", vigenteAte: ONTEM }]);
  });

  it("versões já encerradas antes não mudam", () => {
    const plano = planoDeEncerramento(
      "excluir",
      HOJE,
      [versao("v1", "2026-10-01", "2026-10-10")],
      [],
    );
    expect(plano.fechar).toEqual([]);
  });
});

describe("planoDeReativacao", () => {
  it("pausa de hoje mesmo: só reabre a versão", () => {
    expect(
      planoDeReativacao(HOJE, [versao("v1", "2026-10-01", ONTEM)]),
    ).toEqual({ tipo: "reabrir", versaoId: "v1" });
    expect(planoDeReativacao(HOJE, [versao("v1", "2026-10-01", HOJE)])).toEqual(
      { tipo: "reabrir", versaoId: "v1" },
    );
  });

  it("depois de dias pausados: nova versão a partir de hoje", () => {
    expect(
      planoDeReativacao(HOJE, [
        versao("v0", "2026-09-01", "2026-09-30"),
        versao("v1", "2026-10-01", "2026-10-20"),
      ]),
    ).toEqual({ tipo: "copiar", versaoId: "v1", vigenteDe: HOJE });
  });

  it("regra que ainda não tinha começado volta como estava", () => {
    expect(
      planoDeReativacao(HOJE, [versao("v1", "2026-11-01", "2026-10-31")]),
    ).toEqual({ tipo: "reabrir", versaoId: "v1" });
  });

  it("sem versões não há o que reativar", () => {
    expect(planoDeReativacao(HOJE, [])).toBeNull();
  });
});

describe("planoDeEdicao", () => {
  const v1 = versao("v1", "2026-10-01");
  const semanalSegunda: Regra = {
    frequencia: "semanal",
    vigenteDe: HOJE,
    vigenteAte: null,
    diasSemana: [1], // 26/10/2026 é segunda
    intervaloDias: null,
  };

  it("fecha a versão atual em D − 1", () => {
    const plano = planoDeEdicao(HOJE, diaria(HOJE), [v1], [], null);
    expect(plano.fechar).toEqual([{ id: "v1", vigenteAte: ONTEM }]);
    expect(plano.remover).toEqual([]);
  });

  it("versões que começam em D ou depois são substituídas", () => {
    const plano = planoDeEdicao(
      HOJE,
      diaria(HOJE),
      [versao("v1", "2026-10-01", ONTEM), versao("v2", HOJE)],
      [oc("o", AMANHA, { versaoId: "v2", ajustada: true })],
      null,
    );
    expect(plano.fechar).toEqual([]);
    expect(plano.remover).toEqual(["v2"]);
    // Presa numa versão removida: passa para a nova, com o ajuste.
    expect(plano.repontar).toEqual([{ id: "o", limparAjuste: false }]);
  });

  it("o passado fica com a versão antiga", () => {
    const plano = planoDeEdicao(
      HOJE,
      diaria(HOJE),
      [v1],
      [oc("ontem", ONTEM, { estado: "nao_concluida" })],
      null,
    );
    expect(plano.repontar).toEqual([]);
    expect(plano.apagar).toEqual([]);
  });

  it("ajustes individuais ficam como estão (decisão 7)", () => {
    const plano = planoDeEdicao(
      HOJE,
      diaria(HOJE),
      [v1],
      [oc("ajustada", AMANHA, { ajustada: true })],
      null,
    );
    expect(plano.repontar).toEqual([]);
    expect(plano.apagar).toEqual([]);
  });

  it("sem ajuste, passa para a nova regra se ela cai na data", () => {
    const plano = planoDeEdicao(
      HOJE,
      semanalSegunda,
      [v1],
      [
        oc("segunda", AMANHA, { estado: "concluida" }),
        oc("terca-feita", "2026-10-27", { estado: "concluida" }),
        oc("quarta-intocada", "2026-10-28"),
      ],
      null,
    );
    expect(plano.repontar).toEqual([{ id: "segunda", limparAjuste: false }]);
    // Terça já tem conclusão: fica, com a regra antiga.
    expect(plano.apagar).toEqual(["quarta-intocada"]);
  });

  it("a ocorrência editada segue a nova regra e perde o ajuste", () => {
    const plano = planoDeEdicao(
      HOJE,
      diaria(HOJE),
      [v1],
      [oc("hoje", HOJE, { ajustada: true, valorAtual: 1 })],
      "hoje",
    );
    expect(plano.repontar).toEqual([{ id: "hoje", limparAjuste: true }]);
  });

  it("a editada adiada de um dia anterior não é apagada", () => {
    const plano = planoDeEdicao(
      HOJE,
      semanalSegunda,
      [v1],
      [oc("adiada", ONTEM, { data: AMANHA, ajustada: true })],
      "adiada",
    );
    expect(plano.repontar).toEqual([{ id: "adiada", limparAjuste: true }]);
    expect(plano.apagar).toEqual([]);
  });

  it("reagendadas não são afetadas", () => {
    const plano = planoDeEdicao(
      HOJE,
      semanalSegunda,
      [v1],
      [oc("r", AMANHA, { origem: "reagendada", dataPrevista: null })],
      null,
    );
    expect(plano.repontar).toEqual([]);
    expect(plano.apagar).toEqual([]);
  });
});

describe("ajusteSoEsta", () => {
  const v = { titulo: "Ler", horario: "07:00", valorAlvo: 20 };

  it("guarda só o que difere da versão", () => {
    expect(
      ajusteSoEsta(v, { titulo: "Ler", horario: "09:00", valorAlvo: 20 }),
    ).toEqual({ titulo: null, horario: "09:00", valorAlvo: null });
  });

  it("voltar ao valor da regra desfaz o ajuste", () => {
    expect(ajusteSoEsta(v, v)).toEqual({
      titulo: null,
      horario: null,
      valorAlvo: null,
    });
  });
});

describe("adiar e reagendar", () => {
  it("adiar só pendentes de hoje ou do futuro", () => {
    expect(podeAdiar({ data: HOJE, estado: "pendente" }, HOJE)).toBe(true);
    expect(podeAdiar({ data: AMANHA, estado: "pendente" }, HOJE)).toBe(true);
    expect(podeAdiar({ data: HOJE, estado: "concluida" }, HOJE)).toBe(false);
    expect(podeAdiar({ data: ONTEM, estado: "nao_concluida" }, HOJE)).toBe(
      false,
    );
  });

  it("reagendar só não concluídas, uma vez", () => {
    const falha = {
      data: ONTEM,
      estado: "nao_concluida" as const,
      reagendadaPara: null,
    };
    expect(podeReagendar(falha, HOJE)).toBe(true);
    expect(podeReagendar({ ...falha, reagendadaPara: HOJE }, HOJE)).toBe(false);
    expect(podeReagendar({ ...falha, estado: "concluida" }, HOJE)).toBe(false);
  });

  it("a data nova é hoje ou depois, e diferente da atual", () => {
    expect(novaDataValida(HOJE, ONTEM, HOJE)).toBe(true);
    expect(novaDataValida(ONTEM, d("2026-10-20"), HOJE)).toBe(false);
    expect(novaDataValida(AMANHA, AMANHA, HOJE)).toBe(false);
  });
});

describe("agruparMetas", () => {
  const meta = (
    id: string,
    estado: "ativa" | "pausada" | "excluida",
    frequencia: string,
    vigenteDe: string,
  ) => ({
    id,
    estado,
    versoes: [
      {
        ...versao(
          `${id}-v`,
          vigenteDe,
          frequencia === "unica" ? vigenteDe : null,
        ),
        frequencia,
      },
    ],
  });

  it("separa recorrentes, únicas futuras e pausadas", () => {
    const grupos = agruparMetas(
      [
        meta("agua", "ativa", "diaria", "2026-10-01"),
        meta("medico", "ativa", "unica", "2026-10-30"),
        meta("passada", "ativa", "unica", "2026-10-20"),
        meta("corrida", "pausada", "semanal", "2026-10-01"),
        meta("velha", "excluida", "diaria", "2026-10-01"),
      ],
      HOJE,
    );
    expect(grupos.recorrentes.map((m) => m.id)).toEqual(["agua"]);
    expect(grupos.unicas.map((m) => m.id)).toEqual(["medico"]);
    expect(grupos.pausadas.map((m) => m.id)).toEqual(["corrida"]);
  });
});
