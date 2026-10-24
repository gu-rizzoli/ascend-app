import { describe, expect, it } from "vitest";

import {
  DIAS_DE_SESSAO,
  errosPorCampo,
  esquemaCadastro,
  esquemaEntrada,
  expiracaoDaSessao,
  sessaoExpirada,
  sessaoPrecisaRenovar,
} from "@/domain/conta";

describe("esquemaCadastro", () => {
  it("limpa o nome e normaliza o e-mail", () => {
    const r = esquemaCadastro.parse({
      nome: "  Gustavo ",
      email: " Gu@Exemplo.COM ",
      senha: "12345678",
    });
    expect(r).toEqual({
      nome: "Gustavo",
      email: "gu@exemplo.com",
      senha: "12345678",
    });
  });

  it("não mexe nos espaços da senha", () => {
    const r = esquemaCadastro.parse({
      nome: "G",
      email: "g@x.com",
      senha: " senha longa ",
    });
    expect(r.senha).toBe(" senha longa ");
  });

  it("aponta o erro de cada campo em português", () => {
    const r = esquemaCadastro.safeParse({
      nome: "   ",
      email: "sem-arroba",
      senha: "curta",
    });
    expect(r.success).toBe(false);
    expect(errosPorCampo(r.error!)).toEqual({
      nome: "Digite seu nome.",
      email: "Digite um e-mail válido.",
      senha: "A senha precisa ter pelo menos 8 caracteres.",
    });
  });
});

describe("esquemaEntrada", () => {
  it("normaliza o e-mail e exige senha", () => {
    expect(esquemaEntrada.parse({ email: "A@B.co", senha: "x" }).email).toBe(
      "a@b.co",
    );
    const r = esquemaEntrada.safeParse({ email: "a@b.co", senha: "" });
    expect(errosPorCampo(r.error!)).toEqual({ senha: "Digite sua senha." });
  });
});

describe("sessão", () => {
  const agora = new Date("2026-10-24T12:00:00Z");

  it(`dura ${DIAS_DE_SESSAO} dias`, () => {
    expect(expiracaoDaSessao(agora).toISOString()).toBe(
      "2026-11-23T12:00:00.000Z",
    );
  });

  it("expira exatamente no instante de expiração", () => {
    const expira = new Date("2026-10-24T12:00:00Z");
    expect(sessaoExpirada(expira, new Date("2026-10-24T11:59:59Z"))).toBe(
      false,
    );
    expect(sessaoExpirada(expira, agora)).toBe(true);
  });

  it("renova só depois da metade da validade", () => {
    const expira = expiracaoDaSessao(agora);
    expect(sessaoPrecisaRenovar(expira, agora)).toBe(false);
    expect(sessaoPrecisaRenovar(expira, new Date("2026-11-08T11:00:00Z"))).toBe(
      false,
    );
    expect(sessaoPrecisaRenovar(expira, new Date("2026-11-08T13:00:00Z"))).toBe(
      true,
    );
  });
});
