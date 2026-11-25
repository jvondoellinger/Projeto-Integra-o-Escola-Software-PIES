import { test, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { once } from "node:events";
import { addSampleSubmissions } from "../server/sample-submissions.mjs";

test("prévia isolada aceita qualquer senha nos perfis e carrega duas unidades", async ({
  request,
}) => {
  test.setTimeout(60000);
  const cwd = await mkdtemp(join(tmpdir(), "pies-preview-"));
  const child = spawn(process.execPath, [resolve("server/preview.mjs")], {
    cwd,
    env: { ...process.env, PIES_PORT: "0", PIES_HOST: "0.0.0.0" },
    windowsHide: true,
  });
  const ended = once(child, "exit");
  try {
    const url = await new Promise((resolve, reject) => {
      let output = "";
      child.stdout.on("data", (chunk) => {
        output += chunk;
        const url = /http:\/\/127\.0\.0\.1:\d+/.exec(output)?.[0];
        if (url) resolve(url);
      });
      child.stderr.on("data", (chunk) => {
        output += chunk;
      });
      child.on("error", reject);
      child.on("exit", () => reject(Error(output)));
    });
    const profiles = await (await request.get(`${url}/api/workspace`)).json();
    expect(profiles.profiles).toHaveLength(6);
    const unknown = await request.post(`${url}/api/login`, {
      data: { email: "desconhecido@horizonte.example", password: "abc" },
    });
    expect(unknown.status()).toBe(401);
    const disallowed = await request.get(`${url}/api/workspace`, {
      headers: { host: "public.example" },
    });
    expect(disallowed.status()).toBe(403);
    const login = (email) =>
      request.post(`${url}/api/login`, {
        data: { email, password: "qualquer senha 😀" },
      });
    expect((await login("secretaria@horizonte.example")).status()).toBe(200);
    const { state } = await (await request.get(`${url}/api/workspace`)).json();
    expect(state.students).toHaveLength(172);
    expect(state.classes).toHaveLength(24);
    expect(new Set(state.classes.map((c) => c.subject)).size).toBe(3);
    expect(state.lessons.length).toBeGreaterThan(0);
    expect((await login("rede@horizonte.example")).status()).toBe(200);
    const network = await (await request.get(`${url}/api/workspace`)).json();
    expect(network.state.schools).toHaveLength(2);
  } finally {
    child.kill();
    await ended;
    await rm(cwd, { recursive: true, force: true });
  }
});

test("carga de respostas preserva entregas e rascunhos existentes", () => {
  const day = "2026-11-24";
  const original = {
    assessmentId: "activity",
    studentId: "marina",
    text: "Meu rascunho",
    submitted: null,
  };
  const assignment = {
    id: "activity",
    classId: "math",
    day,
    published: day,
    format: "Atividade em sala",
    title: "Atividade · Estatística e leitura de gráficos",
    instructions:
      "Use os métodos estudados em estatística e leitura de gráficos e justifique suas escolhas.",
  };
  const school = {
    students: [
      { id: "marina", name: "Marina Almeida" },
      { id: "davi", name: "Davi Santos" },
    ],
    enrollments: ["marina", "davi"].map((studentId) => ({
      studentId,
      classId: "math",
      start: "2026-02-01",
    })),
    assessments: [
      assignment,
      { ...assignment, id: "exam", format: "Prova" },
      { ...assignment, id: "future", published: "2026-11-26" },
      {
        ...assignment,
        id: "custom",
        instructions: "Descreva os resultados da pesquisa.",
      },
    ],
    submissions: [original],
  };
  expect(addSampleSubmissions(school, day)).toBe(true);
  expect(school.submissions).toEqual([
    original,
    expect.objectContaining({
      assessmentId: "activity",
      studentId: "davi",
      submitted: expect.stringMatching(/^2026-11-24T/),
    }),
  ]);
  expect(addSampleSubmissions(school, day)).toBe(false);
  expect(school.submissions).toHaveLength(2);
});
