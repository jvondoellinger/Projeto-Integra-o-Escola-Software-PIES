const today = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
    new Date(),
  );
const staffRoles = ["secretaria", "coordenacao", "professor"];
const delta = (a, b) => Math.round((Date.parse(a) - Date.parse(b)) / 86400000);
export function notifications(user, state, day = today()) {
  if (user.role === "rede") return [];
  const staff = staffRoles.includes(user.role);
  const output = [];
  for (const a of state.assessments) {
    if (a.published > day || a.archived) continue;
    const days = delta(a.day, day);
    const ids = state.enrollments
      .filter(
        (e) =>
          e.classId === a.classId &&
          e.start <= a.day &&
          (!e.end || e.end > a.day),
      )
      .map((e) => e.studentId);
    if (!ids.length) continue;
    const done = new Set(
      state.submissions
        .filter((s) => s.assessmentId === a.id && s.submitted)
        .map((s) => s.studentId),
    );
    const corrected = new Set(
      (state.grades || state.results || [])
        .filter((g) => g.assessmentId === a.id)
        .map((g) => g.studentId),
    );
    const exam = a.format === "Prova";
    const missing = ids.filter(
      (id) => !done.has(id) && !corrected.has(id),
    ).length;
    if (
      user.role !== "responsavel" &&
      days <= (a.reminderDays || 3) &&
      (exam ? days >= 0 : missing > 0)
    ) {
      const label =
        days < 0
          ? "Em atraso"
          : days === 0
            ? "Prazo hoje"
            : `Em ${days} dia${days === 1 ? "" : "s"}`;
      output.push({
        id: `prazo-${a.id}-${a.day}-${days < 0 ? "atraso" : "proximo"}`,
        title: a.title,
        label,
        detail: exam
          ? "Confira o dia da prova."
          : staff
            ? `${missing} entrega(s) aguardada(s).`
            : "Confira as orientações e o prazo de entrega.",
        page: staff ? "avaliacoes" : "atividades",
        action: "Consultar avaliações",
        external: true,
        detailId: a.id,
      });
    }
    const pending = ids.filter(
      (id) => !corrected.has(id) && (done.has(id) || (exam && days < 0)),
    ).length;
    if (staff && pending)
      output.push({
        id: `corrigir-${a.id}`,
        title: a.title,
        label: "Correção",
        detail: `${pending} avaliação(ões) para corrigir.`,
        page: "avaliacoes",
        action: "Acompanhar correções",
        detailId: a.id,
      });
  }
  if (staff) {
    for (const c of state.cases.filter(
      (c) => c.state !== "Concluído" && delta(c.due, day) <= 3,
    ))
      output.push({
        id: "caso-" + c.id + "-" + c.due,
        title: c.title,
        label: "Revisão pedagógica",
        detail: `Revisão com ${c.ownerName}.`,
        page: "apoio",
        action: "Revisar acompanhamento",
        detailId: c.id,
        external: c.owner === user.id,
      });
    for (const j of state.justifications.filter((j) => j.state === "Pendente"))
      output.push({
        id: "falta-" + j.id,
        title: "Justificativa de falta",
        label: "Frequência",
        detail: "Uma justificativa aguarda análise.",
        page: "diario",
        action: "Analisar solicitação",
      });
  } else {
    for (const c of state.closures)
      output.push({
        id: "boletim-" + c.id + "-" + c.publishedAt,
        title: "Boletim disponível",
        label: "Resultados",
        detail: "Consulte os resultados publicados pela escola.",
        page: "familia",
        action: "Consultar boletins",
        external: true,
      });
    for (const n of state.notices.filter(
      (n) => !state.receipts.some((r) => r.noticeId === n.id),
    ))
      output.push({
        id: "comunicado-" + n.id,
        title: n.title,
        label: "Comunicado",
        detail: "A escola aguarda sua confirmação de ciência.",
        page: "comunicados",
        action: "Ler comunicado",
        external: true,
      });
  }
  return output;
}
