import { expect, test, type Page } from "@playwright/test";

import { cadastrar } from "./ajuda";

/** Abre um treino livre com uma série preenchida, ainda sem salvar. */
async function treinoComUmaSerie(page: Page) {
  await page.goto("/treinos/novo");
  await page.getByRole("link", { name: /Treino livre/ }).click();
  await page.getByPlaceholder("Buscar exercício").fill("supino");
  await page.getByRole("button", { name: /^Supino reto Peito/ }).click();
  const reps = page.getByLabel("Repetições da série 1 de Supino reto");
  await reps.fill("10");
  return reps;
}

test("sair do treino sem salvar pergunta antes, por qualquer caminho", async ({
  page,
}) => {
  await cadastrar(page);
  const reps = await treinoComUmaSerie(page);
  const perguntas: string[] = [];
  let aceitar = false;
  page.on("dialog", async (d) => {
    perguntas.push(d.message());
    await (aceitar ? d.accept() : d.dismiss());
  });

  // A Conta fica fora do formulário: ícone no topo ou barra lateral.
  await page
    .getByRole("link", { name: "Conta" })
    .filter({ visible: true })
    .click();
  await expect(reps).toHaveValue("10");

  // O voltar do navegador (ou o gesto do celular).
  await page.goBack();
  await expect(reps).toHaveValue("10");
  expect(perguntas).toEqual([
    "Sair sem salvar? As alterações serão perdidas.",
    "Sair sem salvar? As alterações serão perdidas.",
  ]);

  // Confirmando, sai de verdade.
  aceitar = true;
  await page.goBack();
  await expect(page).toHaveURL(/\/treinos\/novo$/);
  await expect(page.getByRole("link", { name: /Treino livre/ })).toBeVisible();
});

test("salvar o treino não deixa o formulário repetido no voltar", async ({
  page,
}) => {
  await cadastrar(page);
  await treinoComUmaSerie(page);
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page).toHaveURL(/\/treinos\/[0-9a-f-]{36}$/);

  // Do treino salvo para o formulário vazio, e dele para a escolha.
  page.on("dialog", (d) => d.dismiss());
  await page.goBack();
  await expect(page).toHaveURL(/\/treinos\/novo\?livre=1$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/treinos\/novo$/);
});
