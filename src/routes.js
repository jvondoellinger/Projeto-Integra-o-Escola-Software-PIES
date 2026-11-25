import { students } from "./data.js";
const pages = [
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
    page: pages.includes(params.get("page"))
      ? params.get("page")
      : "Visão geral",
    evaluation: params.get("evaluation"),
    student:
      students.find((s) => s.id === Number(params.get("student"))) || null,
  };
}
export function pushRoute(page, student = null, extra = {}) {
  const params = new URLSearchParams({ page });
  if (student) params.set("student", student.id);
  if (extra.evaluation) params.set("evaluation", extra.evaluation);
  history.pushState(
    {},
    "",
    location.pathname + location.search + "#" + params.toString(),
  );
}
