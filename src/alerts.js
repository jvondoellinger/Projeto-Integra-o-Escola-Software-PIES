import { useEffect, useState } from "react";
import { students } from "./data.js";
import { submissionFor } from "./school.js";
export function useSchoolClock() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = setInterval(tick, 30000);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);
  return now;
}
export function deadlineLabel(a, now) {
  const remaining = Date.parse(a.dueAt) - now;
  if (remaining <= 0) return "Prazo encerrado";
  if (remaining < 3600000) return "Prazo em menos de 1 hora";
  if (remaining < 86400000)
    return `Prazo em ${Math.ceil(remaining / 3600000)} hora(s)`;
  return `Prazo em ${Math.ceil(remaining / 86400000)} dia(s)`;
}
export function buildAlerts(
  school,
  {
    role = "teacher",
    studentId = 1,
    classroom = "Todas as turmas",
    now = Date.now(),
  } = {},
) {
  const actor = students.find((s) => s.id === studentId);
  return school.assignments
    .flatMap((a) => {
      if (a.archived || Date.parse(a.publishedAt) > now) return [];
      if (role === "student" && a.classroom !== actor?.classroom) return [];
      if (
        role === "teacher" &&
        classroom !== "Todas as turmas" &&
        a.classroom !== classroom
      )
        return [];
      const due = Date.parse(a.dueAt);
      const near = due - now <= a.reminderDays * 86400000;
      const sub = submissionFor(school, a.id, studentId);
      const exam = a.kind === "Prova";
      const result = [];
      if (role === "student") {
        if (
          sub?.gradedAt &&
          (!sub.seenAt || Date.parse(sub.seenAt) < Date.parse(sub.gradedAt))
        )
          result.push({
            id: `grade-${a.id}`,
            assignmentId: a.id,
            title: "Sua avaliação foi corrigida",
            text: `${a.title}: consulte a nota e a devolutiva da professora.`,
            level: "info",
            at: due,
          });
        if (near && ((!sub?.submittedAt && !exam) || (exam && due > now)))
          result.push({
            id: `due-${a.id}`,
            assignmentId: a.id,
            title: exam ? "Prova se aproximando" : deadlineLabel(a, now),
            text: `${a.title}${sub?.completedAt && !exam ? " · feita, mas ainda não entregue." : exam ? " · revise o conteúdo de apoio." : " · sua entrega está pendente."}`,
            level: due <= now ? "late" : "due",
            at: due,
          });
      } else {
        const roster = students.filter((s) => s.classroom === a.classroom);
        const submissions = roster.map((s) =>
          submissionFor(school, a.id, s.id),
        );
        const pending = submissions.filter((s) => !s?.submittedAt).length;
        const review = submissions.filter(
          (s) => s?.submittedAt && s.score === null,
        ).length;
        const missingGrades = submissions.filter(
          (s) => s?.score === undefined || s?.score === null,
        ).length;
        if (near && (exam ? due > now : pending > 0))
          result.push({
            id: `due-${a.id}`,
            assignmentId: a.id,
            title: exam ? "Prova se aproximando" : deadlineLabel(a, now),
            text: `${a.title} · ${a.classroom} · ${exam ? `${roster.length} alunos previstos` : `${pending} entrega(s) pendente(s)`}.`,
            level: due <= now ? "late" : "due",
            at: due,
          });
        if (review > 0 || (exam && due <= now && missingGrades > 0))
          result.push({
            id: `review-${a.id}`,
            assignmentId: a.id,
            title: "Correções aguardando seu olhar",
            text: `${a.title} · ${exam ? missingGrades : review} avaliação(ões) para corrigir.`,
            level: "info",
            at: due,
          });
      }
      return result;
    })
    .sort(
      (a, b) =>
        (a.level === "late" ? -1 : 0) - (b.level === "late" ? -1 : 0) ||
        a.at - b.at,
    );
}
