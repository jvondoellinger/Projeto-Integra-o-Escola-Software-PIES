import { test, expect } from "@playwright/test";
test("histórico anual tem escala completa, lacunas e notas consultáveis", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Somente essenciais", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Ver perfil de Ana Clara Martins",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Desempenho ao longo do ano" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Jan", exact: true }).click();
  await expect(
    page.getByText("Jan de 2026: sem avaliações registradas"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fev", exact: true }).click();
  await expect(page.getByText("Fev de 2026: média 5,2")).toBeVisible();
  await page.getByText("Consultar avaliações que compõem o gráfico").click();
  await expect(
    page.getByRole("cell", { name: "5,2", exact: true }),
  ).toBeVisible();
});
