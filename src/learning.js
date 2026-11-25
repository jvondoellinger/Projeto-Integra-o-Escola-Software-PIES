export const schoolYear = 2026;
export const months = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];
export const contents = [
  "Números e operações",
  "Álgebra",
  "Geometria",
  "Grandezas e medidas",
];
const firstSemester = [
  [5.2, 5.7, 6, 6.1, 6.3],
  [6.4, 6.3, 6.8, 6.6, 6.7],
  [7.3, 7.5, 7.8, 8, 8.2],
  [4.7, 5, 5.4, 5.2, 5.4],
  [6.7, 7, 7.2, 7.3, 7.1],
  [5.6, 5.8, 5.5, 5.7, 5.9],
  [6.1, 6.4, 6.7, 6.6, 6.8],
  [5.8, 6, 6.2, 6, 6.3],
];
export function seedGrades(students) {
  return students.flatMap((s, i) =>
    [...firstSemester[i], ...s.scores].map((score, j) => ({
      id: `history-${s.id}-${j}`,
      studentId: s.id,
      date: `2026-${String(j + 2).padStart(2, "0")}-20`,
      score,
      content: contents[j % 4],
      title: `${j % 2 ? "Atividade" : "Prova"} de ${contents[j % 4].toLowerCase()}`,
    })),
  );
}
export function mean(values) {
  return values.length
    ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) /
        100
    : null;
}
export function inPeriod(date, period) {
  const month = Number(date.slice(5, 7));
  return period === 0
    ? month <= 3
    : period === 1
      ? month >= 4 && month <= 5
      : period === 2
        ? month >= 6 && month <= 8
        : month >= 9;
}
export function studentMetrics(student, grades, period = 3) {
  const mine = grades.filter(
    (g) => g.studentId === student.id && g.date.startsWith(String(schoolYear)),
  );
  return {
    ...student,
    average: mean(
      mine.filter((g) => inPeriod(g.date, period)).map((g) => g.score),
    ),
    previous:
      period > 0
        ? mean(
            mine
              .filter((g) => inPeriod(g.date, period - 1))
              .map((g) => g.score),
          )
        : null,
    subjects: contents.map((c) =>
      mean(mine.filter((g) => g.content === c).map((g) => g.score)),
    ),
  };
}
export function monthlySeries(grades, studentIds, year = schoolYear) {
  return months.map((_, i) =>
    mean(
      grades
        .filter(
          (g) =>
            studentIds.includes(g.studentId) &&
            g.date.startsWith(`${year}-${String(i + 1).padStart(2, "0")}`),
        )
        .map((g) => g.score),
    ),
  );
}
