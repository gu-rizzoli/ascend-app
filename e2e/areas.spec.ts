import { expect, test } from "@playwright/test";

import { abrirArea, cadastrar } from "./ajuda";

test("projeto atual aparece em Hoje com o próximo passo", async ({ page }) => {
  await cadastrar(page);
  await abrirArea(page, "Projetos");
  await page
    .getByRole("link", { name: /novo projeto|criar/i })
    .first()
    .click();
  await page.getByLabel("Nome").fill("TCC");
  await page.getByLabel("Próximo passo").fill("Escrever a introdução");
  await page.getByLabel("Tornar projeto atual").check();
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page).toHaveURL(/\/projetos\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: "TCC" })).toBeVisible();

  await abrirArea(page, "Hoje");
  await expect(page.getByRole("link", { name: /TCC/ })).toBeVisible();
  await expect(page.getByText("Escrever a introdução")).toBeVisible();
});

test("registra um treino livre e vê o histórico do exercício", async ({
  page,
}) => {
  await cadastrar(page);
  await abrirArea(page, "Treinos");
  await page.getByRole("link", { name: "Registrar primeiro treino" }).click();
  await page.getByRole("link", { name: /Treino livre/ }).click();

  await page.getByPlaceholder("Buscar exercício").fill("supino");
  await page.getByRole("button", { name: /^Supino reto Peito/ }).click();
  await page.getByLabel("Repetições da série 1 de Supino reto").fill("10");
  await page.getByLabel("Carga em kg da série 1 de Supino reto").fill("37,5");
  await page.getByRole("button", { name: "Salvar" }).click();

  await expect(page).toHaveURL(/\/treinos\/[0-9a-f-]{36}/);
  await expect(page.getByText("37,5")).toBeVisible();

  await page.getByRole("link", { name: "Supino reto" }).first().click();
  await expect(page).toHaveURL(/\/exercicios\/[0-9a-f-]{36}$/);
  await expect(page.getByText("37,5").first()).toBeVisible();
});

test("o Histórico abre o calendário do mês", async ({ page }) => {
  await cadastrar(page);
  await abrirArea(page, "Histórico");
  await expect(page).toHaveURL(/\/historico$/);
  await expect(page.getByRole("link", { name: "Mês anterior" })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Estatísticas do período" }),
  ).toBeVisible();
});

test("menu embaixo no celular e na lateral no computador", async ({
  page,
}, info) => {
  await cadastrar(page);
  const menu = page.getByRole("navigation");
  const caixa = (await menu.boundingBox())!;
  const tela = page.viewportSize()!;

  if (info.project.name === "computador") {
    // Barra lateral à esquerda, com a Conta no fim (navegacao.md).
    expect(caixa.x).toBe(0);
    expect(caixa.height).toBe(tela.height);
    await expect(menu.getByRole("link", { name: "Conta" })).toBeVisible();
    // Formulários mantêm a barra lateral.
    await page.goto("/metas/novo");
    await expect(menu).toBeVisible();
  } else {
    // Barra fixa embaixo; a Conta fica no ícone do topo.
    expect(caixa.y + caixa.height).toBe(tela.height);
    await expect(menu.getByRole("link", { name: "Conta" })).toBeHidden();
    // Formulários escondem a barra para dar espaço ao teclado.
    await page.goto("/metas/novo");
    await expect(menu).toBeHidden();
  }
});

test("no computador, o dia do Histórico abre ao lado do calendário", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "computador", "só no computador");
  await cadastrar(page);
  await abrirArea(page, "Histórico");
  // O último dia encerrado do mês (o dia 1 abre o Histórico mesmo no dia 1).
  const encerrado = page.locator('a[href^="/historico/2"]');
  if ((await encerrado.count()) === 0) {
    await page.getByRole("link", { name: "Mês anterior" }).click();
  }
  await encerrado.last().click();
  await expect(page).toHaveURL(/\/historico\/\d{4}-\d{2}-\d{2}$/);
  await expect(page.getByText("Nada registrado neste dia.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Mês anterior" })).toBeVisible();
  await expect(page.locator('[aria-current="date"]')).toBeVisible();
});
