import { students } from "./data.js";
const pages = [
  "Meu painel",
  "Minhas atividades",
  "Meu desempenho",
  "Conteúdos de apoio",
  "Visão geral",
  "Meus alunos",
  "Turmas",
  "Avaliações",
  "Planos de apoio",
  "Relatórios",
  "Alertas",
  "Privacidade",
  "Termos de uso",
  "Configurações",
];
export function readRoute() {
  const params = new URLSearchParams(location.hash.slice(1));
  return {
    role: params.get("view") === "student" ? "student" : "teacher",
    actorId: students.some((s) => s.id === Number(params.get("actor")))
      ? Number(params.get("actor"))
      : 1,
    page: pages.includes(params.get("page"))
      ? params.get("page")
      : "Visão geral",
    evaluation: params.get("evaluation"),
    student:
      params.get("view") === "student"
        ? null
        : students.find((s) => s.id === Number(params.get("student"))) || null,
  };
}
export function pushRoute(page, student = null, extra = {}) {
  const params = new URLSearchParams({ page });
  if (student) params.set("student", student.id);
  if (extra.view) params.set("view", extra.view);
  if (extra.actor) params.set("actor", extra.actor);
  if (extra.evaluation) params.set("evaluation", extra.evaluation);
  history.pushState(
    {},
    "",
    location.pathname + location.search + "#" + params.toString(),
  );
}
