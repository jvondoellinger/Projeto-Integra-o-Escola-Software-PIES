import React, { useState, useRef, useEffect } from "react";
import {
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  BookOpen,
  Bell,
} from "lucide-react";
import MonthCalendar, { titleForDay } from "./MonthCalendar.jsx";
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
  RecordCards,
  RecordCard,
} from "./ui.jsx";
import PerformanceChart from "../PerformanceChart.jsx";

export function Calendar({
  state,
  send,
  staff,
  office,
  open,
  student,
  initialDay,
}) {
  const [selected, setSelected] = useState(() =>
      initialDay &&
      /^\d{4}-\d{2}-\d{2}$/.test(initialDay) &&
      Number.isFinite(Date.parse(initialDay))
        ? initialDay
        : nowDate(),
    ),
    [type, setType] = useState(""),
    [classId, setClass] = useState(""),
    [editing, setEditing] = useState(false);
  const events = [
    ...state.events.map((e) => ({
      ...e,
      label: e.kind,
      color: e.kind === "Feriado" ? "gold" : "green",
    })),
    ...state.lessons.map((lesson) => ({
      id: lesson.id,
      day: lesson.day,
      classId: lesson.classId,
      title: lesson.topic,
      time: lesson.slot,
      label: "Aula registrada",
      color: "green",
      source: "lesson",
    })),
    ...state.assessments
      .filter((a) => !a.archived && (staff || a.published <= nowDate()))
      .map((a) => ({
        ...a,
        label: a.format,
        color: "blue",
        source: "assessment",
      })),
    ...state.periods.flatMap((p) => [
      {
        id: `${p.id}-start`,
        day: p.start,
        title: `Início do ${p.name}`,
        label: "Período letivo",
        color: "gold",
      },
      {
        id: `${p.id}-end`,
        day: p.end,
        title: `Fim do ${p.name}`,
        label: "Período letivo",
        color: "gold",
      },
    ]),
    ...(staff
      ? state.cases.flatMap((c) =>
          c.state === "Concluído"
            ? []
            : [
                {
                  id: c.id,
                  day: c.due,
                  classId: c.classId,
                  title: "Revisão do acompanhamento",
                  label: "Acompanhamento",
                  color: "gold",
                  source: "case",
                },
              ],
        )
      : []),
  ];
  const types = [...new Set(events.map((e) => e.label))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
  const visible = events.filter(
    (e) =>
      (!type || e.label === type) &&
      (!classId || !e.classId || e.classId === classId),
  );
  const dayEvents = visible
    .filter((e) => e.day === selected)
    .sort(
      (a, b) =>
        (a.time || "99").localeCompare(b.time || "99") ||
        a.title.localeCompare(b.title, "pt-BR"),
    );
  const pickDay = (day) => {
    setSelected(day);
    history.replaceState(
      history.state,
      "",
      `#agenda?detail=${encodeURIComponent(day)}`,
    );
  };
  return (
    <div className="calendar-layout">
      <Panel title="Agenda da escola">
        <div className="calendar-filters school-filters">
          <label>
            Tipo de compromisso
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Todos os tipos</option>
              {types.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Turma da agenda
            <select value={classId} onChange={(e) => setClass(e.target.value)}>
              <option value="">Todas as turmas</option>
              {state.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <MonthCalendar
          selected={selected}
          onSelect={pickDay}
          entries={visible}
        />
      </Panel>
      <Panel title={titleForDay(selected)} className="day-agenda">
        {staff && (
          <button
            className="school-primary"
            onClick={() => setEditing(!editing)}
          >
            {editing ? "Fechar formulário" : "Adicionar compromisso"}
          </button>
        )}
        {editing && staff && (
          <Form
            key={selected}
            title="Novo compromisso"
            button="Salvar compromisso"
            onSubmit={async (d) => {
              if (await send("event", d)) {
                setEditing(false);
                pickDay(d.day);
                setType("");
                setClass("");
              }
            }}
          >
            <Field label="Compromisso" name="title" />
            <Field
              label="Data do compromisso"
              name="day"
              type="date"
              value={selected}
            />
            <Field
              label="Horário do compromisso"
              name="time"
              type="time"
              optional
            />
            <Field
              label="Tipo do novo compromisso"
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
              value={classId}
              optional={office}
            />
          </Form>
        )}
        <RecordCards empty="Nenhum compromisso para este dia.">
          {dayEvents.map((e) => (
            <RecordCard
              key={e.id}
              title={e.title}
              eyebrow={`${e.time || "Dia inteiro"} · ${e.label}`}
              detail={
                e.classId ? nameOf(state.classes, e.classId) : "Toda a escola"
              }
              icon={e.source === "assessment" ? ClipboardCheck : CalendarDays}
              tone={e.color}
              action={
                e.source === "assessment" && (staff || student)
                  ? "Abrir avaliações"
                  : e.source === "case"
                    ? "Abrir acompanhamento"
                    : e.source === "lesson"
                      ? staff
                        ? "Abrir diário"
                        : "Ver frequência"
                      : undefined
              }
              onOpen={() =>
                open(
                  e.source === "case"
                    ? "apoio"
                    : e.source === "lesson"
                      ? staff
                        ? "diario"
                        : "familia"
                      : staff
                        ? "avaliacoes"
                        : "atividades",
                  e.source === "lesson" && !staff ? e.day : e.id,
                )
              }
            />
          ))}
        </RecordCards>
      </Panel>
    </div>
  );
}
export function Notices({ state, send, staff, office, initialId }) {
  const focused = useRef(null);
  useEffect(() => {
    if (initialId) {
      focused.current?.focus();
      focused.current?.scrollIntoView({ block: "start" });
    }
  }, [initialId]);
  return (
    <>
      <Panel title="Comunicados da escola">
        {state.notices.length === 0 && (
          <p className="school-empty">Ainda não há comunicados.</p>
        )}
        {[...state.notices].reverse().map((n) => (
          <article
            className={`school-record${n.id === initialId ? " is-featured" : ""}`}
            key={n.id}
            ref={n.id === initialId ? focused : undefined}
            tabIndex={n.id === initialId ? -1 : undefined}
          >
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
export function Family({ state, send, user, initialDay, onStudentFocus }) {
  const [choice, setChoice] = useState(""),
    [document, setDocument] = useState(null),
    [periodFilter, setPeriodFilter] = useState(""),
    [attendanceDay, setAttendanceDay] = useState(
      () =>
        (initialDay &&
        /^\d{4}-\d{2}-\d{2}$/.test(initialDay) &&
        Number.isFinite(Date.parse(initialDay))
          ? initialDay
          : null) ||
        [...state.lessons].sort((a, b) => b.day.localeCompare(a.day))[0]?.day ||
        nowDate(),
    );
  const documentRef = useRef(null);

  const pupil =
    state.students.find((x) => x.id === choice) || state.students[0];
  useEffect(() => {
    onStudentFocus?.(pupil?.id || null);
  }, [pupil?.id, onStudentFocus]);
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
  const publishedPeriods = state.periods
    .filter((p) => marks.some((r) => r.closure.periodId === p.id))
    .sort((a, b) => b.start.localeCompare(a.start));
  const activePeriod = periodFilter || publishedPeriods[0]?.id;
  const filteredMarks = marks.filter(
    (m) => m.closure.periodId === activePeriod,
  );
  const showDocument = (id) => {
    setDocument(id);
    requestAnimationFrame(() => {
      documentRef.current?.focus();
      documentRef.current?.scrollIntoView({ block: "start" });
    });
  };
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
      <Panel title="Estudantes vinculados">
        <RecordCards>
          {state.students.map((s) => (
            <RecordCard
              key={s.id}
              title={s.name}
              eyebrow={`Matrícula ${s.registration}`}
              icon={GraduationCap}
              action={
                pupil.id === s.id ? "Selecionado" : "Ver boletins e frequência"
              }
              selected={pupil.id === s.id}
              onOpen={() => {
                setChoice(s.id);
                setDocument(null);
                setPeriodFilter("");
              }}
            />
          ))}
        </RecordCards>
      </Panel>
      <Panel title={`Boletins de ${pupil.name}`}>
        <div
          className="school-actions period-tabs"
          aria-label="Período dos boletins"
        >
          {publishedPeriods.map((p) => (
            <button
              className={activePeriod === p.id ? "is-active" : ""}
              key={p.id}
              onClick={() => {
                setPeriodFilter(p.id);
                setDocument(null);
              }}
              aria-pressed={activePeriod === p.id}
            >
              {p.name} · {p.year}
            </button>
          ))}
        </div>
        <RecordCards empty="A escola ainda não publicou boletins deste estudante.">
          {filteredMarks.map((r) => {
            const classroom = state.classes.find(
              (c) => c.id === r.closure.classId,
            );
            return (
              <RecordCard
                key={r.closure.id}
                title={classroom?.subject || "Boletim escolar"}
                eyebrow={classroom?.section || classroom?.name}
                detail={`Publicado em ${br(r.closure.publishedAt)}`}
                icon={BookOpen}
                tone="blue"
                action="Abrir boletim"
                selected={r.closure.id === document}
                onOpen={() => showDocument(r.closure.id)}
              >
                <dl className="record-metrics">
                  <div>
                    <dt>Média</dt>
                    <dd>{grade(r.average)}</dd>
                  </div>
                  <div>
                    <dt>Frequência</dt>
                    <dd>
                      {r.attendance === null ? "—" : `${grade(r.attendance)}%`}
                    </dd>
                  </div>
                </dl>
              </RecordCard>
            );
          })}
        </RecordCards>
      </Panel>
      {selected && (
        <div ref={documentRef} tabIndex="-1">
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
        </div>
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
      <Panel
        title="Frequência por aula"
        subtitle="Escolha um dia para consultar aulas e justificativas."
      >
        <div className="calendar-split">
          <MonthCalendar
            compact
            selected={attendanceDay}
            onSelect={setAttendanceDay}
            entries={lessons.map((l) => ({ ...l, title: l.topic }))}
          />
          <div className="calendar-side">
            <h3>{titleForDay(attendanceDay)}</h3>
            <RecordCards empty="Nenhuma aula registrada nesta data.">
              {lessons
                .filter((l) => l.day === attendanceDay)
                .map((l) => {
                  const presence = l.attendance.find(
                    (a) => a.studentId === pupil.id,
                  );
                  const justification = state.justifications.find(
                    (x) =>
                      x.lessonId === l.id &&
                      x.studentId === pupil.id &&
                      x.state !== "Recusada",
                  );
                  return (
                    <RecordCard
                      key={l.id}
                      title={l.topic}
                      eyebrow={`${l.slot} · ${presence.status}`}
                      detail={nameOf(state.classes, l.classId)}
                      tone={presence.status === "Presente" ? "green" : "gold"}
                    >
                      {justification ? (
                        <p className="school-caption">
                          Justificativa: {justification.state}
                        </p>
                      ) : user.role === "responsavel" &&
                        presence.status === "Falta" ? (
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
                      ) : null}
                    </RecordCard>
                  );
                })}
            </RecordCards>
          </div>
        </div>
      </Panel>
    </>
  );
}
export function Activities({ state, send, initialId }) {
  const [openId, setOpenId] = useState(initialId),
    [filter, setFilter] = useState("pendentes");
  const detailRef = useRef(null);
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
  const visible = list
    .filter((a) => {
      const complete =
        state.results?.some((x) => x.assessmentId === a.id) ||
        state.submissions.some((x) => x.assessmentId === a.id && x.submitted);
      return (
        filter === "todas" || (filter === "concluidas" ? complete : !complete)
      );
    })
    .sort((a, b) => a.day.localeCompare(b.day));
  const a = list.find((item) => item.id === openId);
  const openActivity = (id) => {
    setOpenId(id);
    requestAnimationFrame(() => {
      detailRef.current?.focus();
      detailRef.current?.scrollIntoView({ block: "start" });
    });
  };
  return (
    <>
      <Panel title="Atividades e provas">
        <div
          className="school-actions period-tabs"
          aria-label="Situação das atividades"
        >
          {[
            ["pendentes", "A fazer"],
            ["concluidas", "Entregues ou corrigidas"],
            ["todas", "Todas"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={filter === value ? "is-active" : ""}
              aria-pressed={filter === value}
              onClick={() => {
                setFilter(value);
                setOpenId(null);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <RecordCards
          key={filter}
          limit={9}
          empty="Nenhuma atividade nesta seleção."
        >
          {visible.map((item) => {
            const sub = state.submissions.find(
              (x) => x.assessmentId === item.id && x.studentId === student.id,
            );
            const result = state.results?.find(
              (x) => x.assessmentId === item.id,
            );
            return (
              <RecordCard
                key={item.id}
                title={item.title}
                eyebrow={`${item.format} · ${br(item.day)}`}
                detail={nameOf(state.classes, item.classId)}
                icon={ClipboardCheck}
                tone={
                  result || sub?.submitted
                    ? "green"
                    : item.day < today
                      ? "gold"
                      : "blue"
                }
                action="Abrir atividade"
                onOpen={() => openActivity(item.id)}
                selected={openId === item.id}
              >
                <span className="school-pill">
                  {result
                    ? "Corrigida"
                    : sub?.submitted
                      ? "Entregue"
                      : sub?.completed
                        ? "Marcada como feita"
                        : item.day < today
                          ? "Prazo encerrado"
                          : "A fazer"}
                </span>
              </RecordCard>
            );
          })}
        </RecordCards>
      </Panel>
      {a && (
        <div ref={detailRef} tabIndex="-1">
          <Panel title="Detalhes da atividade">
            {(() => {
              const sub = state.submissions.find(
                (x) => x.assessmentId === a.id && x.studentId === student.id,
              );
              const isExam = a.format === "Prova";
              const locked = state.closures.some(
                (c) =>
                  c.classId === a.classId &&
                  c.state !== "Reaberto" &&
                  state.periods.some(
                    (p) =>
                      p.id === c.periodId && p.start <= a.day && p.end >= a.day,
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
                            const text = new FormData(e.currentTarget).get(
                              "text",
                            );
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
                            <button
                              className="school-secondary"
                              value="rascunho"
                            >
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
            })()}
          </Panel>
        </div>
      )}
    </>
  );
}
