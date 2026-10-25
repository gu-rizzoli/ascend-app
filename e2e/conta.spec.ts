import { expect, test } from "@playwright/test";

import { abrirConta, cadastrar, entrar, SENHA } from "./ajuda";

test("sem sessão, as áreas mandam para o login", async ({ page }) => {
  await page.goto("/hoje");
  await expect(page).toHaveURL(/\/entrar$/);
});

test("altera nome, e-mail e senha (RF-GLO-11)", async ({ page }) => {
  const { email } = await cadastrar(page);
  await abrirConta(page);

  // Nome: a inicial no topo acompanha.
  const nome = page.getByRole("form", { name: "Nome" });
  await nome.getByLabel("Nome").fill("Rafael");
  await nome.getByRole("button", { name: "Salvar nome" }).click();
  await expect(nome.getByRole("status")).toHaveText("Nome salvo.");
  await expect(
    page.getByRole("link", { name: "Conta" }).filter({ visible: true }),
  ).toContainText("R");

  // E-mail: pede a senha atual.
  const novoEmail = email.replace("teste-", "novo-");
  const formEmail = page.getByRole("form", { name: "E-mail" });
  await formEmail.getByLabel("E-mail").fill(novoEmail);
  await formEmail.getByLabel("Senha atual").fill("errada");
  await formEmail.getByRole("button", { name: "Salvar e-mail" }).click();
  await expect(formEmail.getByText("Senha incorreta.")).toBeVisible();
  await formEmail.getByLabel("Senha atual").fill(SENHA);
  await formEmail.getByRole("button", { name: "Salvar e-mail" }).click();
  await expect(formEmail.getByRole("status")).toContainText("E-mail salvo");

  // Senha: a repetição precisa bater.
  const formSenha = page.getByRole("form", { name: "Senha" });
  await formSenha.getByLabel("Senha atual").fill(SENHA);
  await formSenha
    .getByLabel("Nova senha", { exact: true })
    .fill("outra-senha-1");
  await formSenha.getByLabel("Repita a nova senha").fill("outra-senha-2");
  await formSenha.getByRole("button", { name: "Alterar senha" }).click();
  await expect(
    formSenha.getByText("As duas senhas não são iguais."),
  ).toBeVisible();
  await formSenha.getByLabel("Senha atual").fill(SENHA);
  await formSenha
    .getByLabel("Nova senha", { exact: true })
    .fill("outra-senha-1");
  await formSenha.getByLabel("Repita a nova senha").fill("outra-senha-1");
  await formSenha.getByRole("button", { name: "Alterar senha" }).click();
  await expect(formSenha.getByRole("status")).toContainText("Senha alterada");

  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/entrar$/);

  // O e-mail antigo e a senha antiga não entram mais.
  await entrar(page, email, "outra-senha-1");
  await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
  await entrar(page, novoEmail, SENHA);
  await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();

  await entrar(page, novoEmail, "outra-senha-1");
  await expect(page).toHaveURL(/\/hoje$/);
});

test("trocar a senha tira a conta dos outros aparelhos", async ({
  browser,
}) => {
  const celular = await browser.newPage();
  const { email } = await cadastrar(celular);
  const computador = await browser.newPage();
  await entrar(computador, email, SENHA);
  await expect(computador).toHaveURL(/\/hoje$/);

  await celular.goto("/conta");
  const formSenha = celular.getByRole("form", { name: "Senha" });
  await formSenha.getByLabel("Senha atual").fill(SENHA);
  await formSenha
    .getByLabel("Nova senha", { exact: true })
    .fill("nova-senha-123");
  await formSenha.getByLabel("Repita a nova senha").fill("nova-senha-123");
  await formSenha.getByRole("button", { name: "Alterar senha" }).click();
  await expect(formSenha.getByRole("status")).toBeVisible();

  // Quem trocou continua dentro; o outro aparelho volta para o login.
  await celular.goto("/hoje");
  await expect(celular).toHaveURL(/\/hoje$/);
  await computador.goto("/hoje");
  await expect(computador).toHaveURL(/\/entrar$/);
});

test("não deixa usar o e-mail de outra conta", async ({ browser }) => {
  const outra = await browser.newPage();
  const { email: ocupado } = await cadastrar(outra);
  const page = await browser.newPage();
  await cadastrar(page);
  await page.goto("/conta");
  const formEmail = page.getByRole("form", { name: "E-mail" });
  await formEmail.getByLabel("E-mail").fill(ocupado.toUpperCase());
  await formEmail.getByLabel("Senha atual").fill(SENHA);
  await formEmail.getByRole("button", { name: "Salvar e-mail" }).click();
  await expect(
    formEmail.getByText("Já existe uma conta com este e-mail."),
  ).toBeVisible();
});
