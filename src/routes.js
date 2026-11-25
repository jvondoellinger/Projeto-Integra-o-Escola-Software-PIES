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
    student:
      students.find((s) => s.id === Number(params.get("student"))) || null,
  };
}
export function pushRoute(page, student = null) {
  const params = new URLSearchParams({ page });
  if (student) params.set("student", student.id);
  history.pushState(
    {},
    "",
    location.pathname + location.search + "#" + params.toString(),
  );
}
