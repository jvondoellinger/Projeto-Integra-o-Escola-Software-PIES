import { test, expect } from "@playwright/test";
test("recarregar preserva a tela e voltar restaura a navegação", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Somente essenciais", exact: true })
    .click();
  await page.getByRole("button", { name: "Meus alunos", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Ver perfil de Ana Clara Martins",
      exact: true,
    })
    .click();
  await page.reload();
  await expect(
    page
      .getByRole("heading", { name: "Ana Clara Martins", exact: true })
      .first(),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Meus alunos", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Um olhar para cada aluno." }),
  ).toBeVisible();
});
