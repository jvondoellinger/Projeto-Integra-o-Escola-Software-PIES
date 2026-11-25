import { useState, useEffect } from "react";
import { students } from "./data.js";
import { seedGrades } from "./learning.js";
export const SCHOOL_KEY = "pies-school-v1";
export const kinds = [
  "Prova",
  "Atividade em sala",
  "Atividade de casa",
  "Trabalho de longo prazo",
];
export const resources = [
  {
    id: "numbers",
    content: "Números e operações",
    title: "Frações, passo a passo",
    explanation:
      "Para somar frações com denominadores diferentes, encontre um denominador comum. Transforme as frações equivalentes e então some os numeradores.",
    example: "1/2 + 1/3 = 3/6 + 2/6 = 5/6.",
    exercise: "Calcule 3/4 + 1/8. Explique por que é necessário usar oitavos.",
    answer: "3/4 = 6/8; portanto, 6/8 + 1/8 = 7/8.",
  },
  {
    id: "algebra",
    content: "Álgebra",
    title: "Uma equação, uma estratégia",
    explanation:
      "Uma equação representa uma igualdade. Para encontrar a incógnita, faça a mesma operação nos dois lados e verifique a resposta na expressão original.",
    example: "2x + 6 = 14 → 2x = 8 → x = 4. Conferindo: 2 × 4 + 6 = 14.",
    exercise: "Resolva 3x + 9 = 24 e confira o resultado.",
    answer: "3x = 15; x = 5. Conferindo: 3 × 5 + 9 = 24.",
  },
  {
    id: "geometry",
    content: "Geometria",
    title: "Área e perímetro sem confundir",
    explanation:
      "Perímetro é a soma das medidas do contorno. Área mede a superfície. Em um retângulo, multiplique base e altura para encontrar a área.",
    example: "Retângulo de 5 cm por 3 cm: perímetro = 16 cm; área = 15 cm².",
    exercise:
      "Uma horta retangular mede 8 m por 4 m. Qual a área e quanto de cerca é necessário?",
    answer: "Área: 32 m². Cerca: perímetro de 24 m.",
  },
  {
    id: "measures",
    content: "Grandezas e medidas",
    title: "Organize as unidades",
    explanation:
      "Antes de comparar ou calcular, converta todas as medidas para a mesma unidade. Use 100 centímetros para cada metro e 1.000 metros para cada quilômetro.",
    example: "2,5 m = 250 cm. Uma fita de 2,5 m menos 80 cm fica com 170 cm.",
    exercise:
      "Quantos metros há em 1,2 km? E quantos centímetros há em 0,75 m?",
    answer: "1,2 km = 1.200 m; 0,75 m = 75 cm.",
  },
];
export function dateTime(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}
export function dateInput(value) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
  return parts.replace(" ", "T");
}
export const fromInput = (value) => new Date(value + "-03:00").toISOString();
export function seedSchool(now = Date.now()) {
  const at = (days) => new Date(now + days * 86400000).toISOString();
  return {
    version: 1,
    grades: seedGrades(students),
    assignments: [
      {
        id: "equations",
        title: "Equações em situações do cotidiano",
        kind: "Atividade de casa",
        classroom: "8º ano A",
        content: "Álgebra",
        instructions:
          "Resolva três situações do cotidiano usando equações de primeiro grau. Apresente a equação, explique cada etapa e confira a resposta. Registre sua resolução no campo de entrega.",
        publishedAt: at(-2),
        dueAt: at(2),
        reminderDays: 3,
        resourceIds: ["algebra"],
        archived: false,
      },
      {
        id: "geometry-project",
        title: "Projeto: a planta da nossa escola",
        kind: "Trabalho de longo prazo",
        classroom: "8º ano B",
        content: "Geometria",
        instructions:
          "Escolha um espaço da escola e desenhe uma planta com medidas. Calcule área e perímetro, descreva a escala utilizada e apresente uma proposta de melhoria. Entregue um relato com os cálculos e a justificativa.",
        publishedAt: at(-8),
        dueAt: at(12),
        reminderDays: 7,
        resourceIds: ["geometry", "measures"],
        archived: false,
      },
      {
        id: "fractions-test",
        title: "Prova de números e operações",
        kind: "Prova",
        classroom: "8º ano A",
        content: "Números e operações",
        instructions:
          "Prova presencial em sala. Revise frações equivalentes, operações e interpretação de problemas. Traga lápis e borracha. Não é necessário enviar uma resposta pela plataforma.",
        publishedAt: at(-1),
        dueAt: at(5),
        reminderDays: 3,
        resourceIds: ["numbers"],
        archived: false,
      },
    ],
    submissions: [],
  };
}
function readSchool(fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(SCHOOL_KEY));
    return v?.version === 1 &&
      Array.isArray(v.assignments) &&
      Array.isArray(v.submissions) &&
      Array.isArray(v.grades)
      ? v
      : fallback;
  } catch {
    return fallback;
  }
}
export function useSchool(onError) {
  const [school, setSchool] = useState(() => {
    const saved = readSchool(null);
    if (saved) return saved;
    const initial = seedSchool();
    try {
      localStorage.setItem(SCHOOL_KEY, JSON.stringify(initial));
    } catch {}
    return initial;
  });
  useEffect(() => {
    const sync = (e) => {
      if (e.key === SCHOOL_KEY || e.key === null)
        setSchool(readSchool(seedSchool()));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const update = (fn) => {
    let next;
    setSchool((current) => {
      next = fn(readSchool(current));
      try {
        localStorage.setItem(SCHOOL_KEY, JSON.stringify(next));
      } catch {
        queueMicrotask(() =>
          onError?.(
            "Não foi possível salvar neste navegador. As alterações permanecerão apenas enquanto esta página estiver aberta.",
          ),
        );
      }
      return next;
    });
  };
  return {
    school,
    update,
    reset: () => {
      try {
        localStorage.removeItem(SCHOOL_KEY);
      } catch {}
      setSchool(seedSchool());
    },
  };
}
export function submissionFor(school, assignmentId, studentId) {
  return school.submissions.find(
    (s) => s.assignmentId === assignmentId && s.studentId === studentId,
  );
}
export function patchSubmission(school, assignmentId, studentId, patch) {
  const previous = submissionFor(school, assignmentId, studentId) || {
    assignmentId,
    studentId,
    text: "",
    completedAt: null,
    submittedAt: null,
    score: null,
    feedback: "",
  };
  return {
    ...school,
    submissions: [
      ...school.submissions.filter((s) => s !== previous),
      { ...previous, ...patch },
    ],
  };
}
export function assignmentStatus(a, now) {
  return a.archived
    ? "Arquivada"
    : Date.parse(a.publishedAt) > now
      ? "Agendada"
      : Date.parse(a.dueAt) < now
        ? "Prazo encerrado"
        : "Em andamento";
}
export function gradeSubmission(
  school,
  a,
  studentId,
  score,
  feedback,
  now = Date.now(),
) {
  let next = patchSubmission(school, a.id, studentId, {
    score,
    feedback,
    gradedAt: new Date(now).toISOString(),
  });
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date(now));
  return {
    ...next,
    grades: [
      ...next.grades.filter((g) => g.id !== `assignment-${a.id}-${studentId}`),
      {
        id: `assignment-${a.id}-${studentId}`,
        studentId,
        score,
        date,
        content: a.content,
        title: a.title,
      },
    ],
  };
}
