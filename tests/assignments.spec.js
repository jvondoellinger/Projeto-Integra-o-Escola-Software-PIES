import { test, expect } from "@playwright/test";
test("avaliação valida datas, preserva edição, registra correção e pode ser arquivada", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Somente essenciais", exact: true })
    .click();
  await page.getByRole("button", { name: "Avaliações", exact: true }).click();
  await page.getByRole("button", { name: "Nova avaliação" }).click();
  await page.getByLabel("Título", { exact: true }).fill("Prova de álgebra");
  await page
    .getByRole("combobox", { name: "Formato", exact: true })
    .selectOption("Prova");
  await page
    .getByLabel("Orientações")
    .fill("Resolva as equações e explique o raciocínio.");
  await page.getByLabel("Publicação", { exact: true }).fill("2026-11-20T08:00");
  await page
    .getByLabel("Prazo de entrega ou data da prova")
    .fill("2026-11-19T08:00");
  await page.getByRole("button", { name: "Salvar avaliação" }).click();
  await expect(page.getByRole("alert")).toContainText("posterior");
  await page
    .getByLabel("Prazo de entrega ou data da prova")
    .fill("2026-11-28T08:00");
  await page.getByRole("button", { name: "Salvar avaliação" }).click();
  const card = page
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", { name: "Prova de álgebra", exact: true }),
    });
  await card.getByRole("button", { name: "Abrir avaliação" }).click();
  await page
    .getByLabel("Nota de Ana Clara Martins", { exact: true })
    .fill("9.5");
  await page
    .getByLabel("Devolutiva para Ana Clara Martins")
    .fill("Boa organização dos cálculos.");
  await page
    .locator(".review-row")
    .filter({
      has: page.getByRole("heading", {
        name: "Ana Clara Martins",
        exact: true,
      }),
    })
    .getByRole("button", { name: "Salvar correção" })
    .click();
  await page.reload();
  await expect(
    page.getByLabel("Nota de Ana Clara Martins", { exact: true }),
  ).toHaveValue("9.5");
  const grades = await page.evaluate(
    () => JSON.parse(localStorage.getItem("pies-school-v1")).grades,
  );
  expect(
    grades
      .filter((g) => g.title === "Prova de álgebra" && g.studentId === 1)
      .map((g) => g.score),
  ).toEqual([9.5]);
  await page.getByRole("button", { name: "Editar avaliação" }).click();
  await page
    .getByLabel("Título", { exact: true })
    .fill("Prova de álgebra revisada");
  await page.getByRole("button", { name: "Salvar avaliação" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Prova de álgebra revisada",
      exact: true,
    }),
  ).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Arquivar avaliação" }).click();
  await expect(page.getByText("Arquivada", { exact: true })).toBeVisible();
});
