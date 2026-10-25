import { expect, test } from "@playwright/test";

import { cadastrar } from "./ajuda";

test("cria, marca e soma metas em Hoje", async ({ page }) => {
  await cadastrar(page);
  await expect(page.getByText("Você ainda não tem metas.")).toBeVisible();

  // Binária, todo dia.
  await page.getByRole("link", { name: "Criar primeira meta" }).click();
  await page.getByLabel("Título").fill("Ler 10 páginas");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page).toHaveURL(/\/hoje$/);

  const ler = page.getByRole("checkbox", { name: "Ler 10 páginas" });
  await ler.click();
  await expect(ler).toBeChecked();
  await page.reload();
  await expect(ler).toBeChecked();

  // Numérica com ponto de milhar, pelo botão da área.
  await page.getByRole("link", { name: "Nova meta" }).click();
  await page.getByLabel("Título").fill("Beber água");
  await page.getByRole("radio", { name: "Numérica" }).check({ force: true });
  await page.getByLabel("Alvo").fill("2.000");
  await page.getByLabel("Unidade").fill("ml");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page).toHaveURL(/\/hoje$/);
  await expect(page.getByText("0 / 2.000 ml")).toBeVisible();

  await page.getByRole("button", { name: "Atualizar Beber água" }).click();
  await page.getByLabel("Quanto somar em Beber água").fill("1.500");
  await page.getByRole("button", { name: "Somar", exact: true }).click();
  await expect(page.getByText("1.500 / 2.000 ml")).toBeVisible();

  // Corrigir o total também aceita o ponto de milhar.
  await page.getByLabel("Corrigir o total").fill("2.000");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText("2.000 / 2.000 ml")).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "Progresso de Beber água" }),
  ).toHaveAttribute("aria-valuenow", "100");

  // Amanhã as duas aparecem de novo, em aberto.
  await page.getByRole("link", { name: "Próximo dia" }).click();
  await expect(page).toHaveURL(/\/dia\/\d{4}-\d{2}-\d{2}$/);
  await expect(
    page.getByRole("checkbox", { name: "Ler 10 páginas" }),
  ).not.toBeChecked();
  await expect(page.getByText("0 / 2.000 ml")).toBeVisible();
});
