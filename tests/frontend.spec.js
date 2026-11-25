import { test, expect } from "@playwright/test";
test("recusa, personalização, persistência e revogação de preferências", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Somente essenciais", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Privacidade e armazenamento" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  await page.getByLabel("Visualização compacta").check();
  expect(
    await page.evaluate(() => localStorage.getItem("pies-preferences")),
  ).toBeNull();
  await page.getByRole("button", { name: "Cookies", exact: true }).click();
  await page.getByRole("dialog").getByRole("checkbox").check();
  await page.getByRole("button", { name: "Salvar escolha" }).click();
  expect(
    JSON.parse(
      await page.evaluate(() => localStorage.getItem("pies-preferences")),
    ).compact,
  ).toBe(true);
  await page.reload();
  await expect(page.locator("body")).toHaveClass(/compact/);
  await page.getByRole("button", { name: "Cookies", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Somente essenciais" })
    .click();
  expect(
    await page.evaluate(() => localStorage.getItem("pies-preferences")),
  ).toBeNull();
  await page.reload();
  await expect(page.locator("body")).not.toHaveClass(/compact/);
});
test("busca, turma, bimestre e estado vazio", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Somente essenciais", exact: true })
    .click();
  await page.getByLabel("Filtrar turma").selectOption("8º ano B");
  await expect(page.locator("tbody tr")).toHaveCount(3);
  await page.getByLabel("Período", { exact: true }).selectOption("1º bimestre");
  await expect(page.locator("tbody tr").first()).toContainText("7,7");
  await page.getByLabel("Buscar aluno").fill("ninguém");
  await expect(
    page.getByText("Nenhum aluno encontrado.", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Buscar aluno").fill("Camila");
  await expect(page.locator("tbody tr")).toHaveCount(1);
});
test("cria, persiste, conclui e reabre plano; registra observações", async ({
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
    page.getByRole("heading", { name: "Potencialidades observadas" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Novo plano de apoio" }).click();
  await page
    .getByLabel("Objetivo", { exact: true })
    .fill("Resolver equações com autonomia");
  await page
    .getByLabel("Ação pedagógica")
    .fill("Revisar dois problemas por encontro e registrar estratégias.");
  await page.getByLabel("Data de revisão").fill("2030-12-03");
  await page.getByRole("button", { name: "Salvar plano" }).click();
  await expect(
    page.getByRole("heading", { name: "Resolver equações com autonomia" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Concluir plano", exact: true })
    .click();
  await expect(page.getByText("Concluído", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reabrir plano" }).click();
  await expect(page.getByText("Em andamento", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Registros pedagógicos" }).click();
  await page
    .getByLabel("Observações pedagógicas")
    .fill("Explicou sua estratégia com clareza.");
  await page.getByRole("button", { name: "Salvar registro" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Meus alunos", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Ver perfil de Ana Clara Martins",
      exact: true,
    })
    .click();
  await page.getByRole("tab", { name: "Plano de apoio", exact: false }).click();
  await expect(
    page.getByRole("heading", { name: "Resolver equações com autonomia" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Registros pedagógicos" }).click();
  await expect(page.getByLabel("Observações pedagógicas")).toHaveValue(
    "Explicou sua estratégia com clareza.",
  );
});
test("planeja avaliação, exporta CSV e gera solicitação sem enviar dados", async ({
  page,
}) => {
  const external = [];
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:5173") &&
      !r.url().startsWith("blob:")
    )
      external.push(r.url());
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Somente essenciais", exact: true })
    .click();
  await page.getByRole("button", { name: "Avaliações", exact: true }).click();
  await page.getByRole("button", { name: "Nova avaliação" }).click();
  await page.getByLabel("Título", { exact: true }).fill("Desafio de frações");
  await page.getByLabel("Data", { exact: true }).fill("2030-12-01");
  await page.getByLabel("Conteúdo", { exact: true }).fill("Frações");
  await page.getByRole("button", { name: "Salvar avaliação" }).click();
  await expect(
    page.getByRole("heading", { name: "Desafio de frações" }),
  ).toBeVisible();
  const [csv] = await Promise.all([
    page.waitForEvent("download"),
    page
      .getByRole("button", { name: "Exportar relatório", exact: true })
      .click(),
  ]);
  expect(csv.suggestedFilename()).toBe("pies-desempenho.csv");
  await page.getByRole("button", { name: "Privacidade", exact: true }).click();
  await page
    .getByLabel("Descreva seu pedido")
    .fill("Solicito a correção da frequência.");
  const [request] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Gerar documento do pedido" }).click(),
  ]);
  expect(request.suggestedFilename()).toBe("solicitacao-de-privacidade.txt");
  await expect(page.getByRole("status")).toContainText(
    "Nenhum pedido foi enviado",
  );
  expect(external).toEqual([]);
});
test("mobile: menu, perfil, consentimento por teclado e sem overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Personalizar", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page
    .getByRole("button", { name: "Somente essenciais", exact: true })
    .click();
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.getByRole("button", { name: "Meus alunos", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Ver perfil de Ana Clara Martins",
      exact: true,
    })
    .click();
  await expect(
    page
      .getByRole("heading", { name: "Ana Clara Martins", exact: true })
      .first(),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("nenhum erro de execução e limpeza dos dados de sessão", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Somente essenciais", exact: true })
    .click();
  for (const name of [
    "Turmas",
    "Avaliações",
    "Planos de apoio",
    "Relatórios",
    "Configurações",
  ])
    await page
      .getByRole("button", { name: new RegExp("^" + name) })
      .first()
      .click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Limpar dados da sessão" }).click();
  await expect(
    page.getByRole("heading", { name: "Um olhar para cada aluno." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
