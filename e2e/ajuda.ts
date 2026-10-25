import { expect, type Page } from "@playwright/test";

export const SENHA = "senha-de-teste";

/** Um e-mail novo a cada chamada: os testes rodam em paralelo no mesmo banco. */
export function emailNovo(): string {
  return `teste-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@ascend.test`;
}

/** Cria uma conta e termina em Hoje, já logado. */
export async function cadastrar(page: Page, nome = "Gustavo") {
  const email = emailNovo();
  await page.goto("/cadastro");
  await page.getByLabel("Nome").fill(nome);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/hoje$/);
  return { email };
}

/** Entra pela tela de login. */
export async function entrar(page: Page, email: string, senha: string) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
}

/** Abre uma área pelo menu (barra de baixo ou barra lateral). */
export async function abrirArea(page: Page, area: string) {
  await page
    .getByRole("navigation")
    .getByRole("link", { name: area, exact: true })
    .click();
}

/** Abre a Conta: ícone no topo no celular, item da barra lateral no computador. */
export async function abrirConta(page: Page) {
  await page
    .getByRole("link", { name: "Conta" })
    .filter({ visible: true })
    .click();
  await expect(page).toHaveURL(/\/conta$/);
}
