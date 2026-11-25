import React, { useState } from "react";
import {
  Form,
  Field,
  Panel,
  Table,
  Print,
  br,
  opts,
  nameOf,
  nowDate,
  grade,
} from "./ui.jsx";
import PerformanceChart from "../PerformanceChart.jsx";

export function Calendar({ state, send, staff, office }) {
  const [month, setMonth] = useState(() => nowDate().slice(0, 7));
  const events = [
    ...state.events.map((e) => ({ ...e, label: e.kind })),
    ...state.assessments.flatMap((a) =>
      staff || a.published <= nowDate() ? [{ ...a, label: a.format }] : [],
    ),
  ]
    .filter((e) => e.day.startsWith(month))
    .sort(
      (a, b) =>
        a.day.localeCompare(b.day) ||
        String(a.time || "").localeCompare(String(b.time || "")),
    );
  return (
    <>
      <Panel title="Agenda da escola">
        <label className="school-filter">
          Mês da agenda
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
        <Table
          columns={["Data", "Horário", "Compromisso", "Tipo", "Turma"]}
          rows={events.map((e) => [
            e.id,
            br(e.day),
            e.time || "—",
            e.title,
            e.label,
            e.classId ? nameOf(state.classes, e.classId) : "Toda a escola",
          ])}
        />
      </Panel>
      {staff && (
        <Panel title="Adicionar compromisso">
          <Form onSubmit={(d) => send("event", d)}>
            <Field label="Compromisso" name="title" />
            <Field
              label="Data do compromisso"
              name="day"
              type="date"
              value={nowDate()}
            />
            <Field
              label="Horário do compromisso"
              name="time"
              type="time"
              optional
            />
            <Field
              label="Tipo de compromisso"
              name="kind"
              options={[
                "Aula",
                "Feriado",
                "Reposição",
                "Reunião",
                "Evento escolar",
              ]}
            />
            <Field
              label="Turma do compromisso"
              name="classId"
              options={opts(state.classes)}
              optional={office}
            />
          </Form>
        </Panel>
      )}
    </>
  );
}
export function Notices({ state, send, staff, office }) {
  return (
    <>
      <Panel title="Comunicados da escola">
        {state.notices.length === 0 && (
          <p className="school-empty">Ainda não há comunicados.</p>
        )}
        {[...state.notices].reverse().map((n) => (
          <article className="school-record" key={n.id}>
            <small>
              {br(n.day)} ·{" "}
              {n.classId ? nameOf(state.classes, n.classId) : "Toda a escola"}
            </small>
            <h3>{n.title}</h3>
            <p className="school-pre">{n.body}</p>
            {!staff &&
              ((state.receipts || []).some((r) => r.noticeId === n.id) ? (
                <span className="school-pill">Ciência confirmada</span>
              ) : (
                <button
                  className="school-secondary"
                  onClick={() => send("receipt", { id: n.id })}
                >
                  Confirmar ciência
                </button>
              ))}
            {office && (
              <p className="school-caption">
                {
                  (state.receipts || []).filter((r) => r.noticeId === n.id)
                    .length
                }{" "}
                confirmação(ões)
              </p>
            )}
          </article>
        ))}
      </Panel>
      {staff && (
        <Panel title="Publicar comunicado">
          <Form
            button="Publicar comunicado"
            onSubmit={(d) => send("notice", d)}
          >
            <Field label="Título do comunicado" name="title" />
            <Field label="Mensagem" name="body" type="textarea" />
            <Field
              label="Turma do comunicado"
              name="classId"
              options={opts(state.classes)}
              optional={office}
            />
          </Form>
        </Panel>
      )}
    </>
  );
}
export function Family({ state, send, user }) {
  const [choice, setChoice] = useState(""),
    [document, setDocument] = useState(null);
  const pupil =
    state.students.find((x) => x.id === choice) || state.students[0];
  if (!pupil)
    return (
      <Panel title="Nenhum vínculo escolar associado">
        <p>
          Entre em contato com a secretaria para vincular a conta ao estudante.
        </p>
      </Panel>
    );
  const marks = state.closures.flatMap((c) =>
    c.rows
      .filter((r) => r.studentId === pupil.id)
      .map((r) => ({ ...r, closure: c })),
  );
  const selected = marks.find((r) => r.closure.id === document);
  const lessons = state.lessons.filter((l) =>
    l.attendance.some((a) => a.studentId === pupil.id),
  );
  const chart = marks.flatMap((r) =>
    r.marks
      .filter((g) => g.score !== null && g.day)
      .map((g) => ({
        id: g.id,
        studentId: pupil.id,
        score: g.score,
        date: g.day,
        title: g.title,
      })),
  );

  return (
    <>
      <Panel title="Acompanhamento escolar">
        <label className="school-filter">
          Estudante vinculado
          <select
            value={pupil.id}
            onChange={(e) => {
              setChoice(e.target.value);
              setDocument(null);
            }}
          >
            {state.students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <Table
          columns={["Turma", "Período", "Média", "Frequência", "Ação"]}
          rows={marks.map((r) => [
            r.closure.id,
            nameOf(state.classes, r.closure.classId),
            nameOf(state.periods, r.closure.periodId),
            grade(r.average),
            r.attendance == null ? "—" : `${grade(r.attendance)}%`,
            <button
              className="school-secondary"
              onClick={() => setDocument(r.closure.id)}
            >
              Abrir boletim
            </button>,
          ])}
        />
      </Panel>
      {selected && (
        <Panel
          className="print-target"
          title="Boletim escolar"
          subtitle={`${state.name} · ${pupil.name} · ${nameOf(state.classes, selected.closure.classId)}`}
        >
          <p>
            {nameOf(state.periods, selected.closure.periodId)} · Publicado em{" "}
            {br(selected.closure.publishedAt)}
          </p>
          <Table
            columns={["Avaliação", "Nota", "Devolutiva"]}
            rows={selected.marks.map((g) => [
              g.id,
              g.title,
              grade(g.score),
              g.feedback || "—",
            ])}
          />
          <p>
            Média {grade(selected.average)} · Frequência{" "}
            {selected.attendance === null
              ? "—"
              : `${grade(selected.attendance)}%`}
          </p>
          <Print label="Imprimir boletim" />
          <button
            className="school-secondary school-no-print"
            onClick={() => setDocument(null)}
          >
            Fechar boletim
          </button>
        </Panel>
      )}
      {chart.length > 0 && (
        <PerformanceChart
          grades={chart}
          studentIds={[pupil.id]}
          title="Desempenho publicado no ano"
          year={state.policy.year}
          target={state.policy.target}
          subject="Resultados escolares"
        />
      )}
      <Panel title="Frequência por aula">
        <Table
          columns={["Data", "Turma", "Aula", "Situação", "Justificativa"]}
          rows={[...lessons].reverse().map((l) => {
            const a = l.attendance.find((x) => x.studentId === pupil.id);
            const j = state.justifications.find(
              (x) =>
                x.lessonId === l.id &&
                x.studentId === pupil.id &&
                x.state !== "Recusada",
            );
            return [
              l.id,
              br(l.day),
              nameOf(state.classes, l.classId),
              l.topic,
              a.status,
              j ? (
                j.state
              ) : user.role === "responsavel" && a.status === "Falta" ? (
                <Form
                  button="Enviar justificativa"
                  onSubmit={(d) =>
                    send("justify", {
                      ...d,
                      lessonId: l.id,
                      studentId: pupil.id,
                    })
                  }
                >
                  <Field
                    label={`Justificativa de ${br(l.day)}`}
                    name="reason"
                  />
                </Form>
              ) : (
                "—"
              ),
            ];
          })}
        />
      </Panel>
    </>
  );
}
export function Activities({ state, user, send }) {
  const student = state.students[0];
  const today = nowDate();
  const list = student
    ? state.assessments.filter((a) =>
        state.enrollments.some(
          (e) =>
            e.studentId === student.id &&
            e.classId === a.classId &&
            e.start <= a.day &&
            (!e.end || a.day < e.end),
        ),
      )
    : [];
  return (
    <Panel title="Atividades e provas">
      {!list.length && (
        <p className="school-empty">
          Nenhuma atividade publicada para a sua turma.
        </p>
      )}
      {list.map((a) => {
        const sub = state.submissions.find(
          (x) => x.assessmentId === a.id && x.studentId === student.id,
        );
        const isExam = a.format === "Prova";
        const locked = state.closures.some(
          (c) =>
            c.classId === a.classId &&
            c.state !== "Reaberto" &&
            state.periods.some(
              (p) => p.id === c.periodId && p.start <= a.day && p.end >= a.day,
            ),
        );
        const result = state.results?.find(
          (x) => x.assessmentId === a.id && x.studentId === student.id,
        );
        return (
          <article className="school-record" key={a.id}>
            <div className="school-actions">
              <span className="school-pill">{a.format}</span>
              <span className="school-pill">
                {result
                  ? "Avaliada"
                  : sub?.submitted
                    ? "Entregue"
                    : a.day < today
                      ? "Prazo encerrado"
                      : sub?.completed
                        ? "Feita"
                        : "Prazo " + br(a.day)}
              </span>
            </div>
            <h3>{a.title}</h3>
            <p className="school-pre">{a.instructions}</p>
            {a.material && (
              <details>
                <summary>Material de apoio</summary>
                <p className="school-pre">{a.material}</p>
              </details>
            )}
            {result && (
              <p className="school-callout">
                {result.score === null
                  ? "Devolutiva"
                  : `Nota ${grade(result.score)}`}{" "}
                · {result.feedback || "Correção registrada"}
              </p>
            )}
            {sub?.submitted && (
              <p className="school-callout">
                Entregue em {br(sub.submitted)}. {sub.text}
              </p>
            )}
            {!sub?.submitted && !result && !locked && (
              <>
                <button
                  className="school-secondary"
                  onClick={() =>
                    send("submission", {
                      assessmentId: a.id,
                      studentId: student.id,
                      action: "feito",
                    })
                  }
                >
                  {sub?.completed
                    ? "Desmarcar como feita"
                    : isExam
                      ? "Marcar preparação concluída"
                      : "Marcar como feita"}
                </button>
                {!isExam && (
                  <form
                    className="school-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const text = new FormData(e.currentTarget).get("text");
                      const action = e.nativeEvent.submitter.value;
                      send("submission", {
                        assessmentId: a.id,
                        studentId: student.id,
                        text,
                        action,
                      });
                    }}
                  >
                    <Field
                      label={`Resolução · ${a.title}`}
                      name="text"
                      type="textarea"
                      value={sub?.text}
                      optional
                      maxLength={5000}
                    />
                    <div className="school-actions">
                      <button className="school-secondary" value="rascunho">
                        Salvar rascunho
                      </button>
                      <button className="school-primary" value="entregar">
                        Entregar atividade
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </article>
        );
      })}
    </Panel>
  );
}
