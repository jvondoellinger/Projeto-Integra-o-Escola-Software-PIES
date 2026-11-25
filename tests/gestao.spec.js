import { test, expect } from "@playwright/test";
import { once } from "node:events";

test.describe.configure({ mode: "serial" });
const password = "Senha institucional 2026!";
let server, url, fixture, secondSchool;
test.beforeAll(async () => {
  process.env.PIES_DB = ":memory:";
  process.env.PIES_PORT = "0";
  const store = await import("../server/store.mjs");
  const { perform } = await import("../server/school.mjs");
  const school = store.createSchool({
    name: "Escola do Ipê",
    network: "Rede de Teste",
    email: "secretaria@ipe.example",
    password,
  });
  secondSchool = store.createSchool({
    name: "Escola da Serra",
    network: "Outra Rede",
    email: "secretaria@serra.example",
    password,
  });
  const office = store.db
    .prepare("SELECT * FROM accounts WHERE school=?")
    .get(school);
  const account = (name, email, role) =>
    store.createAccount(school, { name, email, password, role });
  const teacher = account(
    "Professor de Matemática",
    "professor@ipe.example",
    "professor",
  );
  const parent = account(
    "Responsável de Alice",
    "familia@ipe.example",
    "responsavel",
  );
  const pupil = account("Alice Santos", "aluna@ipe.example", "aluno");
  const day = store.today(),
    year = Number(day.slice(0, 4));
  let i = 0;
  const apply = (kind, data) => perform(office, kind, data, `test-${++i}`);
  apply("class", {
    name: "7º B",
    stage: "Ensino Fundamental",
    subject: "Matemática",
    year,
    shift: "Manhã",
    teachers: [teacher],
  });
  apply("student", {
    name: "Alice Santos",
    registration: "2026-01",
    account: pupil,
    guardians: [parent],
  });
  apply("student", {
    name: "Estudante sem vínculo familiar",
    registration: "2026-02",
  });
  const setup = store.loadSchool(school);
  const c = setup.classes[0];
  const s = setup.students[0];
  for (const student of setup.students)
    apply("enroll", {
      studentId: student.id,
      classId: c.id,
      start: `${year}-01-01`,
    });
  apply("period", {
    name: "Período letivo",
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  });
  fixture = { school, c, s, day, year, pupils: setup.students };
  ({ server } = await import("../server/http.mjs"));
  if (!server.listening) await once(server, "listening");
  url = `http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});
async function signIn(page, email) {
  await page.goto(url);
  await page.getByLabel("E-mail escolar").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Operação escolar", exact: true }),
  ).toBeVisible();
}
const go = (page, name) =>
  page
    .getByRole("navigation")
    .getByRole("button", { name, exact: true })
    .click();
test("professor registra chamada desconectado, sincroniza, corrige e família recebe boletim publicado", async ({
  page,
  context,
}) => {
  await signIn(page, "professor@ipe.example");
  const feed = page.getByRole("region", { name: "Feed escolar" });
  await expect(feed.getByRole("heading", { name: "Seu feed" })).toBeVisible();
  await feed.getByRole("button", { name: "Agenda", exact: true }).click();
  await expect(
    feed.getByRole("button", { name: "Agenda", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page
      .getByRole("navigation")
      .getByRole("button", { name: "Secretaria", exact: true }),
  ).toHaveCount(0);
  await go(page, "Diário de classe");
  await page.getByLabel("Turma da chamada").selectOption(fixture.c.id);
  await page.getByLabel("Horário da aula").fill("08:00");
  await page.getByLabel("Conteúdo ministrado").fill("Operações e problemas");
  await context.setOffline(true);
  await page
    .getByRole("button", { name: "Registrar aula", exact: true })
    .click();
  await expect(page.getByText("1 chamada(s) aguardando envio")).toBeVisible();
  await context.setOffline(false);
  await expect(page.getByText("1 chamada(s) aguardando envio")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Operações e problemas" }),
  ).toBeVisible();
  await go(page, "Avaliações");
  await expect(
    page
      .getByRole("complementary", {
        name: "Indicadores e informações auxiliares",
      })
      .getByRole("heading", { name: "Avaliações por formato" }),
  ).toBeVisible();
  await page.getByLabel("Turma da avaliação").selectOption(fixture.c.id);
  await page.getByLabel("Título da avaliação").fill("Prova de operações");
  await page
    .getByRole("combobox", { name: "Formato", exact: true })
    .selectOption("Prova");
  await page.getByLabel("Prazo ou dia da prova").fill(fixture.day);
  await page
    .getByLabel("Orientações", { exact: true })
    .fill("Resolva e mostre a operação.");
  await page.getByRole("button", { name: "Publicar ou agendar" }).click();
  await page.getByRole("button", { name: "Abrir correção" }).click();
  for (const [i, s] of fixture.pupils.entries()) {
    await page
      .getByLabel(`Nota de ${s.name}`, { exact: true })
      .fill(i ? "7" : "9");
    await page
      .getByRole("button", {
        name: `Salvar avaliação de ${s.name}`,
        exact: true,
      })
      .click();
    await expect(page.getByRole("status")).toContainText("Registro atualizado");
  }
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await signIn(page, "secretaria@ipe.example");
  await go(page, "Fechamento e boletins");
  await page.getByLabel("Turma do boletim").selectOption(fixture.c.id);
  await page
    .getByLabel("Período do boletim")
    .selectOption({ label: "Período letivo" });
  await page
    .getByRole("button", { name: "Fechar período", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publicar boletins", exact: true })
    .click();
  await expect(page.getByText(/· Publicado$/)).toBeVisible();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await signIn(page, "familia@ipe.example");
  await go(page, "Boletins e frequência");
  await page.getByRole("button", { name: "Abrir boletim" }).click();
  await expect(
    page.getByRole("heading", { name: "Boletim escolar", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".print-target").getByRole("cell", { name: "9", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Estudante sem vínculo familiar", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Operações e problemas", { exact: true }),
  ).toBeVisible();
});
test("API isola escolas e bloqueia alterações de professor em período publicado", async ({
  request,
}) => {
  const invalid = await request.post(url + "/api/login", {
    data: { email: "professor@ipe.example", password: "qualquer senha" },
  });
  expect(invalid.status()).toBe(401);
  await request.post(url + "/api/login", {
    data: { email: "professor@ipe.example", password },
  });
  const foreign = await request.get(
    url + `/api/workspace?school=${secondSchool}`,
  );
  expect(foreign.status()).toBe(403);
  const { state } = await (await request.get(url + "/api/workspace")).json();
  const changed = await request.post(url + "/api/command", {
    data: {
      id: "closed-grade",
      kind: "grade",
      data: {
        assessmentId: state.assessments[0].id,
        studentId: fixture.s.id,
        score: 1,
        feedback: "",
      },
    },
  });
  expect(changed.status()).toBe(409);
  const forbidden = await request.post(url + "/api/command", {
    data: {
      id: "forbidden-student",
      kind: "student",
      data: { name: "Outro nome", registration: "99" },
    },
  });
  expect(forbidden.status()).toBe(403);
});

test("calendário mensal permite abrir o dia, criar compromisso e acessar a prova", async ({
  page,
}) => {
  await signIn(page, "secretaria@ipe.example");
  await go(page, "Calendário");
  const calendar = page.getByRole("region", { name: "Calendário mensal" });
  const month = await calendar.getByRole("heading", { level: 3 }).textContent();
  await calendar.getByRole("button", { name: "Próximo mês" }).click();
  await expect(calendar.getByRole("heading", { level: 3 })).not.toHaveText(
    month,
  );
  await calendar.getByRole("button", { name: "Hoje", exact: true }).click();
  await expect(calendar.getByRole("heading", { level: 3 })).toHaveText(month);
  const day = calendar.locator(`[data-day="${fixture.day}"]`);
  await expect(day).toHaveAttribute("aria-pressed", "true");
  await day.press("ArrowRight");
  await expect(day).toHaveAttribute("aria-pressed", "false");
  await day.click();
  await page.getByRole("button", { name: "Adicionar compromisso" }).click();
  await expect(page.getByLabel("Data do compromisso")).toHaveValue(fixture.day);
  await page
    .getByLabel("Compromisso", { exact: true })
    .fill("Encontro de leitura");
  await page
    .getByRole("combobox", { name: "Tipo do novo compromisso" })
    .selectOption("Reunião");
  await page.getByRole("button", { name: "Salvar compromisso" }).click();
  await expect(
    page.getByRole("heading", { name: "Encontro de leitura", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Abrir avaliações", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Correção · Prova de operações",
      exact: true,
    }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Encontro de leitura", exact: true }),
  ).toBeVisible();
});
