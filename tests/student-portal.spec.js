import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const title = "Equações em situações do cotidiano";
async function start(page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Somente essenciais", exact: true })
    .click();
}
async function student(page, id = "1") {
  await page
    .getByRole("combobox", { name: "Área", exact: true })
    .selectOption("student");
  if (id !== "1")
    await page
      .getByRole("combobox", { name: "Aluno", exact: true })
      .selectOption(id);
}
async function openTask(page, name = title) {
  await page
    .getByRole("button", { name: "Minhas atividades", exact: true })
    .click();
  await page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name, exact: true }) })
    .getByRole("button", { name: "Abrir atividade" })
    .click();
}
test("aluno estuda, marca feita, entrega e recebe correção que alimenta o gráfico", async ({
  page,
}) => {
  await start(page);
  await student(page);
  await openTask(page);
  await page
    .getByRole("button", { name: "Marcar como feita", exact: true })
    .click();
  await expect(
    page.getByText("Você marcou a atividade como feita.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ver alertas", exact: true }).click();
  await expect(
    page.getByText(title + " · feita, mas ainda não entregue.", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ver avaliação", exact: true })
    .click();
  await page.getByRole("button", { name: "Ver conteúdo de apoio" }).click();
  await expect(
    page.getByRole("heading", { name: "Uma equação, uma estratégia" }),
  ).toBeVisible();
  await page.getByText("Conferir resolução", { exact: true }).click();
  await expect(
    page.getByText("3x = 15; x = 5.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ver entrega e orientações" }).click();
  await page
    .getByLabel("Sua resolução")
    .fill("2x + 6 = 14. Subtraindo 6, 2x = 8. Dividindo por 2, x = 4.");
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await page.reload();
  await expect(page.getByLabel("Sua resolução")).toHaveValue(/2x/);
  await page
    .getByRole("button", { name: "Entregar atividade", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Sua entrega" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ver alertas", exact: true }).click();
  await expect(
    page.getByText("Nenhuma pendência de prazo ou correção agora."),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Área", exact: true })
    .selectOption("teacher");
  await page.getByRole("button", { name: "Avaliações", exact: true }).click();
  await page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) })
    .getByRole("button", { name: "Abrir avaliação" })
    .click();
  const row = page.locator(".review-row").filter({
    has: page.getByRole("heading", {
      name: "Ana Clara Martins",
      exact: true,
    }),
  });
  await expect(row).toContainText("2x + 6 = 14");
  await page
    .getByLabel("Nota de Ana Clara Martins", { exact: true })
    .fill("8.6");
  await page
    .getByLabel("Devolutiva para Ana Clara Martins")
    .fill("Ótima verificação da igualdade.");
  await row.getByRole("button", { name: "Salvar correção" }).click();
  await student(page);
  await page.getByRole("button", { name: "Ver alertas", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Sua avaliação foi corrigida" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ver avaliação", exact: true })
    .click();
  await expect(
    page.getByText("Ótima verificação da igualdade.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".grade-feedback")).toContainText("8,6");
  await page.getByRole("button", { name: "Ver alertas", exact: true }).click();
  await expect(
    page.getByText("Nenhuma pendência de prazo ou correção agora."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Meu desempenho", exact: true })
    .click();
  await expect(
    page
      .getByRole("row")
      .filter({ has: page.getByRole("cell", { name: title, exact: true }) }),
  ).toContainText("8,6");
});
test("lembrete de projeto aparece automaticamente na antecedência e vira atraso", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-11-24T12:00:00-03:00") });
  await start(page);
  await student(page, "3");
  await page.getByRole("button", { name: "Ver alertas", exact: true }).click();
  await expect(
    page.getByText("Nenhuma pendência de prazo ou correção agora."),
  ).toBeVisible();
  await page.clock.fastForward(5 * 86400000 + 30000);
  await expect(
    page.getByRole("heading", { name: "Prazo em 7 dia(s)", exact: true }),
  ).toBeVisible();
  await page.clock.fastForward(7 * 86400000 + 30000);
  await expect(
    page.getByRole("heading", { name: "Prazo encerrado", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ver avaliação", exact: true })
    .click();
  await expect(
    page.getByText("O prazo terminou.", { exact: false }),
  ).toBeVisible();
});
test("professor recebe mudanças de entrega de outra aba sem recarregar", async ({
  page,
  context,
}) => {
  await start(page);
  await page.getByRole("button", { name: "Avaliações", exact: true }).click();
  const card = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
  await expect(card).toContainText("0/5 entregas");
  const pupil = await context.newPage();
  await pupil.goto("/");
  await student(pupil);
  await openTask(pupil);
  await pupil
    .getByLabel("Sua resolução")
    .fill("Minha estratégia de resolução com etapas e conferência.");
  await pupil.getByRole("button", { name: "Salvar rascunho" }).click();
  await card.getByRole("button", { name: "Abrir avaliação" }).click();
  await expect(
    page.getByText("Minha estratégia de resolução com etapas e conferência.", {
      exact: true,
    }),
  ).toHaveCount(0);
  await pupil
    .getByRole("button", { name: "Entregar atividade", exact: true })
    .click();
  await expect(
    page.getByText("Minha estratégia de resolução com etapas e conferência.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Voltar às avaliações" }).click();
  await expect(card).toContainText("1/5 entregas");
  await page.getByRole("button", { name: "Ver alertas", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Correções aguardando seu olhar" }),
  ).toBeVisible();
});
test("publicação e turma controlam a lista do aluno e a prova não pede entrega textual", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-11-24T12:00:00-03:00") });
  await start(page);
  await page.getByRole("button", { name: "Avaliações", exact: true }).click();
  await page.getByRole("button", { name: "Nova avaliação" }).click();
  await page.getByLabel("Título", { exact: true }).fill("Prova agendada");
  await page
    .getByRole("combobox", { name: "Formato", exact: true })
    .selectOption("Prova");
  await page.getByLabel("Publicação", { exact: true }).fill("2026-11-26T11:00");
  await page
    .getByLabel("Prazo de entrega ou data da prova")
    .fill("2026-11-28T12:00");
  await page
    .getByLabel("Orientações")
    .fill("Revisar frações para a prova em sala.");
  await page.getByRole("button", { name: "Salvar avaliação" }).click();
  await student(page);
  await page
    .getByRole("button", { name: "Minhas atividades", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Prova agendada", exact: true }),
  ).toHaveCount(0);
  await page.clock.fastForward(2 * 86400000 + 30000);
  await expect(
    page.getByRole("heading", { name: "Prova agendada", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Aluno", exact: true })
    .selectOption("3");
  await page
    .getByRole("button", { name: "Minhas atividades", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Prova agendada", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("combobox", { name: "Aluno", exact: true })
    .selectOption("1");
  await openTask(page, "Prova agendada");
  await expect(
    page.getByRole("button", { name: "Entregar atividade", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Marcar preparação concluída",
      exact: true,
    }),
  ).toBeVisible();
});
test("portal do aluno acessível no celular e sem rolagem horizontal da página", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  await student(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  let result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  await page
    .getByRole("button", { name: "Ver avaliação", exact: true })
    .click();
  result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
