import React from "react";
import { ArrowUpRight, CalendarDays, ChartNoAxesCombined } from "lucide-react";
import { Bars, Insights, Ring, Trend } from "./Insights.jsx";
import { br, nameOf, nowDate } from "./ui.jsx";

const variants = {
  matriculas: "enrollment",
  diario: "attendance",
  avaliacoes: "evaluations",
  fechamento: "closing",
  apoio: "followup",
  familia: "attendance",
  relatorios: "closing",
};
const nextLinks = {
  matriculas: ["turmas", "Abrir turmas"],
  turmas: ["diario", "Abrir diário"],
  diario: ["agenda", "Consultar calendário"],
  avaliacoes: ["fechamento", "Consultar fechamento"],
  fechamento: ["relatorios", "Abrir relatórios"],
  apoio: ["agenda", "Ver agenda"],
  familia: ["comunicados", "Ver comunicados"],
  atividades: ["agenda", "Acompanhar prazos"],
  comunicados: ["agenda", "Consultar calendário"],
  relatorios: ["fechamento", "Ver fechamentos"],
  contas: ["matriculas", "Vincular estudantes"],
};

function summary(page, s) {
  switch (page) {
    case "matriculas":
      return [
        ["Estudantes cadastrados", s.students.length],
        [
          "Turmas com matrícula",
          new Set(s.enrollments.filter((e) => !e.end).map((e) => e.classId))
            .size,
        ],
      ];
    case "turmas":
      return [
        ["Disciplinas", new Set(s.classes.map((c) => c.subject)).size],
        ["Turnos", new Set(s.classes.map((c) => c.shift)).size],
      ];
    case "diario":
      return [
        ["Aulas registradas", s.lessons.length],
        [
          "Justificativas a revisar",
          s.justifications.filter((j) => j.state === "Pendente").length,
        ],
      ];
    case "avaliacoes":
      return [
        ["Avaliações ativas", s.assessments.filter((a) => !a.archived).length],
        [
          "Entregas a corrigir",
          s.submissions.filter(
            (t) =>
              t.submitted &&
              !s.grades.some(
                (g) =>
                  g.assessmentId === t.assessmentId &&
                  g.studentId === t.studentId,
              ),
          ).length,
        ],
      ];
    case "fechamento":
    case "relatorios":
      return [
        ["Períodos cadastrados", s.periods.length],
        [
          "Boletins publicados",
          s.closures.reduce((n, c) => n + (c.publicRows?.length || 0), 0),
        ],
      ];
    case "apoio":
      return [
        [
          "Revisões em atraso",
          s.cases.filter((c) => c.state !== "Concluído" && c.due < nowDate())
            .length,
        ],
        [
          "Estudantes acompanhados",
          new Set(s.cases.map((c) => c.studentId)).size,
        ],
      ];
    case "familia":
      return [
        ["Estudantes vinculados", s.students.length],
        [
          "Boletins disponíveis",
          s.closures.reduce((n, c) => n + c.rows.length, 0),
        ],
      ];
    case "atividades":
      return [
        [
          "Para fazer",
          s.assessments.filter(
            (a) =>
              !s.submissions.some(
                (t) => t.assessmentId === a.id && t.submitted,
              ) && !s.results.some((g) => g.assessmentId === a.id),
          ).length,
        ],
        ["Corrigidas", s.results.length],
      ];
    case "comunicados":
      return [
        ["Comunicados", s.notices.length],
        ["Ciências registradas", s.receipts?.length || 0],
      ];
    case "contas":
      return [
        ["Contas ativas", s.accounts.filter((a) => a.active).length],
        ["Contas suspensas", s.accounts.filter((a) => !a.active).length],
      ];
    default:
      return [];
  }
}

export default function ContextRail({ page, state, user, studentId, open }) {
  const metrics = summary(page, state);
  const variant = variants[page];
  const related = nextLinks[page];
  const events = (state.events || [])
    .filter((e) => e.day >= nowDate())
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(0, 2);
  const chart =
    page === "turmas"
      ? Object.entries(
          state.classes.reduce(
            (acc, c) => ({ ...acc, [c.shift]: (acc[c.shift] || 0) + 1 }),
            {},
          ),
        ).map(([label, value]) => ({ label, value }))
      : null;
  const accountChart =
    page === "contas"
      ? [
          { label: "Ativas", value: metrics[0][1], color: "#2664b9" },
          { label: "Suspensas", value: metrics[1][1], color: "#8bb1db" },
        ]
      : null;
  const activityChart =
    page === "atividades"
      ? [
          { label: "Para fazer", value: metrics[0][1], color: "#82a9d7" },
          { label: "Corrigidas", value: metrics[1][1], color: "#2358aa" },
          {
            label: "Entregues sem correção",
            value: state.assessments.filter(
              (a) =>
                state.submissions.some(
                  (t) => t.assessmentId === a.id && t.submitted,
                ) && !state.results.some((g) => g.assessmentId === a.id),
            ).length,
            color: "#4977c2",
          },
        ]
      : null;
  const gradeTrend =
    page === "familia" && studentId
      ? state.periods
          .slice()
          .sort((a, b) => a.start.localeCompare(b.start))
          .map((p) => {
            const scores = state.closures
              .filter((c) => c.periodId === p.id)
              .flatMap((c) =>
                c.rows
                  .filter((r) => r.studentId === studentId && r.average != null)
                  .map((r) => r.average),
              );
            return {
              label: p.name.replace("bimestre", "bim."),
              value: scores.length
                ? scores.reduce((a, b) => a + b, 0) / scores.length
                : null,
            };
          })
      : null;
  return (
    <aside
      className="context-rail"
      aria-label="Indicadores e informações auxiliares"
    >
      {metrics.length > 0 && (
        <section className="insight-panel context-summary">
          <div className="insight-heading">
            <span>
              <ChartNoAxesCombined size={19} />
            </span>
            <div>
              <h2>Nesta área</h2>
            </div>
          </div>
          <dl>
            {metrics.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value.toLocaleString("pt-BR")}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {variant && (
        <Insights
          state={state}
          variant={variant}
          student={studentId ? { id: studentId } : null}
        />
      )}
      {!!chart?.length && (
        <section className="insight-panel">
          <h2>Distribuição por turno</h2>
          <Bars items={chart} />
        </section>
      )}
      {accountChart && (
        <section className="insight-panel">
          <h2>Acessos da escola</h2>
          <Ring values={accountChart} label="contas" />
        </section>
      )}
      {activityChart && (
        <section className="insight-panel">
          <h2>Progresso nas atividades</h2>
          <Ring values={activityChart} label="atividades" />
        </section>
      )}
      {!!gradeTrend?.some((p) => p.value != null) && (
        <section className="insight-panel">
          <h2>Médias por período</h2>
          <Trend
            points={gradeTrend}
            unit=""
            max={10}
            color="#245bb0"
            title="Médias por período"
            compact
          />
        </section>
      )}
      {page === "config" && (
        <section className="insight-panel">
          <h2>Seu perfil</h2>
          <p className="context-copy">{user.name}</p>
          <p className="context-copy">{state.name || "Gestão de rede"}</p>
        </section>
      )}
      {!!events.length && (
        <section className="insight-panel feed-agenda">
          <div className="insight-heading">
            <span>
              <CalendarDays size={19} />
            </span>
            <div>
              <h2>Na agenda</h2>
            </div>
          </div>
          {events.map((e) => (
            <button
              type="button"
              onClick={() => open("agenda", e.day)}
              key={e.id}
            >
              <span>{br(e.day).slice(0, 5)}</span>
              <strong>
                {e.title}
                {e.classId && <small>{nameOf(state.classes, e.classId)}</small>}
              </strong>
            </button>
          ))}
        </section>
      )}
      {related && (
        <button
          className="context-jump"
          type="button"
          onClick={() => open(related[0])}
        >
          {related[1]}
          <ArrowUpRight size={17} />
        </button>
      )}
    </aside>
  );
}
