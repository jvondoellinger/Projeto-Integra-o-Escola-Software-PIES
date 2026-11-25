import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  HeartHandshake,
  Plus,
  Pencil,
} from "lucide-react";
import ReportDownload, { reportGroup } from "./ReportDownload.jsx";
import MonthCalendar, { titleForDay } from "./MonthCalendar.jsx";
import PerformanceChart from "../PerformanceChart.jsx";
import React, { useState, useRef } from "react";
import {
  ActionForm,
  Field,
  Panel,
  br,
  opts,
  nameOf,
  nowDate,
  grade,
  roster,
  RecordCard,
  RecordCards,
} from "./ui.jsx";

export function Diary({ state, send, initialId }) {
  const initialLesson = state.lessons.find((l) => l.id === initialId);
  const [classId, setClass] = useState(initialLesson?.classId || ""),
    [day, setDay] = useState(initialLesson?.day || nowDate()),
    [editing, setEditing] = useState(initialLesson || null);
  const [lessonDialog, setLessonDialog] = useState(Boolean(initialLesson));
  const [showCalendar, setShowCalendar] = useState(false);
  const registered = state.lessons.filter(
    (l) => !classId || l.classId === classId,
  );
  const dayLessons = registered
    .filter((l) => l.day === day)
    .sort((a, b) => a.slot.localeCompare(b.slot));
  const changeDay = (date) => {
    setDay(date);
    setEditing(null);
  };
  const pupils = roster(state, classId, day);
  return (
    <>
      <Panel
        title="Chamada e conteúdo da aula"
        subtitle="Selecione a turma e a data para carregar a lista de presença."
      >
        <div className="school-filters">
          <label>
            Turma da chamada
            <select
              value={classId}
              onChange={(e) => {
                setClass(e.target.value);
                setEditing(null);
              }}
            >
              <option value="">Selecione</option>
              {state.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Data da aula
            <input
              type="date"
              max={nowDate()}
              value={day}
              onChange={(e) => {
                setDay(e.target.value || nowDate());
                setEditing(null);
              }}
            />
          </label>
        </div>
        <button
          type="button"
          className="school-secondary"
          onClick={() => setShowCalendar(!showCalendar)}
        >
          {showCalendar
            ? "Fechar calendário do diário"
            : "Abrir calendário do diário"}
        </button>
        {showCalendar && (
          <MonthCalendar
            compact
            selected={day}
            onSelect={changeDay}
            entries={registered.map((l) => ({ ...l, title: l.topic }))}
          />
        )}
        {pupils.length > 0 ? (
          <>
            <button
              className="school-primary school-create-actions"
              aria-haspopup="dialog"
              onClick={() => setLessonDialog(true)}
            >
              Registrar aula
            </button>
            <ActionForm
              title={editing ? "Corrigir chamada" : "Registrar aula"}
              open={lessonDialog}
              onDismiss={() => {
                setLessonDialog(false);
                setEditing(null);
              }}
              key={`${classId}-${day}-${editing?.id}-${editing?.revision}`}
              button={editing ? "Salvar correção da chamada" : "Registrar aula"}
              onSubmit={(d) =>
                send(
                  "lesson",
                  {
                    classId,
                    day,
                    id: editing?.id,
                    revision: editing?.revision,
                    slot: d.slot,
                    minutes: d.minutes,
                    topic: d.topic,
                    attendance: pupils.map((s) => ({
                      studentId: s.id,
                      status: d[s.id],
                    })),
                  },
                  { offline: true },
                )
              }
            >
              <Field
                label="Horário da aula"
                name="slot"
                type="time"
                value={editing?.slot}
              />
              <Field
                label="Duração em minutos"
                name="minutes"
                type="number"
                min={1}
                max={720}
                value={editing?.minutes || 50}
              />
              <Field
                label="Conteúdo ministrado"
                name="topic"
                type="textarea"
                value={editing?.topic}
              />
              {pupils.map((s) => (
                <Field
                  key={s.id}
                  label={`Presença de ${s.name}`}
                  name={s.id}
                  options={["Presente", "Falta", "Justificada"]}
                  value={
                    editing?.attendance.find((a) => a.studentId === s.id)
                      ?.status || "Presente"
                  }
                />
              ))}
            </ActionForm>
          </>
        ) : (
          <p className="school-empty">
            {classId
              ? "Nenhum estudante matriculado nessa data."
              : "Escolha uma turma para começar."}
          </p>
        )}
      </Panel>
      <Panel title="Aulas registradas" subtitle={titleForDay(day)}>
        <RecordCards empty="Nenhuma aula registrada para este dia.">
          {dayLessons.map((l) => (
            <RecordCard
              key={l.id}
              title={l.topic}
              eyebrow={`${l.slot} · ${l.minutes} min`}
              detail={nameOf(state.classes, l.classId)}
              icon={BookOpen}
              action="Corrigir chamada"
              onOpen={() => {
                setClass(l.classId);
                setDay(l.day);
                setEditing(l);
                setLessonDialog(true);
              }}
            >
              <p className="record-detail">
                {l.attendance.filter((x) => x.status === "Presente").length} de{" "}
                {l.attendance.length} presentes
              </p>
            </RecordCard>
          ))}
        </RecordCards>
      </Panel>
      <Panel title="Solicitações de justificativa">
        <RecordCards limit={6} empty="Nenhuma justificativa recebida.">
          {state.justifications.map((j) => (
            <RecordCard
              key={j.id}
              title={nameOf(state.students, j.studentId)}
              eyebrow={`${br(j.day)} · ${j.state}`}
              detail={j.reason}
              tone={j.state === "Pendente" ? "gold" : "green"}
            >
              {j.state === "Pendente" ? (
                <ActionForm
                  title={`Revisar justificativa de ${nameOf(state.students, j.studentId)}`}
                  trigger="Registrar decisão"
                  triggerClass="school-secondary"
                  button="Registrar decisão"
                  onSubmit={(d) => send("decide", { ...d, id: j.id })}
                >
                  <Field
                    label="Decisão"
                    name="state"
                    options={["Aceita", "Recusada"]}
                  />
                  <Field label="Retorno" name="response" optional />
                </ActionForm>
              ) : (
                j.response && <p className="record-detail">{j.response}</p>
              )}
            </RecordCard>
          ))}
        </RecordCards>
      </Panel>
    </>
  );
}
export function Evaluations({ state, send, initialId }) {
  const [open, setOpen] = useState(initialId);
  const [assessmentDialog, setAssessmentDialog] = useState(false);
  const [editing, setEditing] = useState(null),
    [listClass, setListClass] = useState(""),
    [listState, setListState] = useState("ativas");
  const review = useRef(null);
  const assessments = state.assessments
    .filter(
      (a) =>
        (listState === "arquivadas" ? a.archived : !a.archived) &&
        (!listClass || a.classId === listClass),
    )
    .sort((a, b) => b.day.localeCompare(a.day));
  const selected = state.assessments.find((a) => a.id === open);
  const c = state.classes.find((x) => x.id === selected?.classId);
  const deliveries = state.submissions.filter((item) => item.submitted);
  return (
    <>
      <ActionForm
        title={editing ? "Editar avaliação" : "Planejar avaliação"}
        open={assessmentDialog}
        onDismiss={() => {
          setAssessmentDialog(false);
          setEditing(null);
        }}
        key={editing?.id || "new"}
        button={editing ? "Salvar alterações" : "Publicar ou agendar"}
        onSubmit={(d, f) =>
          send("assessment", {
            ...d,
            id: editing?.id,
            classId: editing?.classId || d.classId,
            recovery: f.has("recovery"),
          })
        }
      >
        <Field
          label="Turma da avaliação"
          name="classId"
          options={opts(state.classes)}
          value={editing?.classId}
          disabled={!!editing}
        />
        <Field
          label="Título da avaliação"
          name="title"
          value={editing?.title}
        />
        <Field
          label="Formato"
          name="format"
          value={editing?.format}
          options={[
            "Prova",
            "Atividade em sala",
            "Atividade de casa",
            "Trabalho de longo prazo",
          ]}
        />
        <Field
          label="Publicação"
          name="published"
          type="date"
          value={editing?.published || nowDate()}
        />
        <Field
          label="Prazo ou dia da prova"
          name="day"
          type="date"
          value={editing?.day}
        />
        <Field
          label="Antecedência do lembrete (dias)"
          name="reminderDays"
          type="number"
          min={1}
          max={30}
          value={editing?.reminderDays || 3}
        />
        <Field
          label="Peso"
          name="weight"
          type="number"
          min={0.1}
          max={100}
          step="0.1"
          value={editing?.weight || 1}
        />
        <Field
          label="Orientações"
          name="instructions"
          type="textarea"
          value={editing?.instructions}
        />
        <Field
          label="Material de apoio"
          name="material"
          value={editing?.material}
          type="textarea"
          optional
        />
        <label className="school-check">
          <input
            type="checkbox"
            name="recovery"
            defaultChecked={editing?.recovery}
          />{" "}
          Recuperação
        </label>
      </ActionForm>
      <Panel
        title="Avaliações planejadas"
        actions={
          <button
            className="school-primary"
            aria-haspopup="dialog"
            onClick={() => {
              setEditing(null);
              setAssessmentDialog(true);
            }}
          >
            <Plus size={16} aria-hidden="true" /> Planejar avaliação
          </button>
        }
      >
        <div className="school-filters">
          <label>
            Turma das avaliações
            <select
              value={listClass}
              onChange={(e) => setListClass(e.target.value)}
            >
              <option value="">Todas as turmas</option>
              {state.classes.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Situação das avaliações
            <select
              value={listState}
              onChange={(e) => setListState(e.target.value)}
            >
              <option value="ativas">Ativas</option>
              <option value="arquivadas">Arquivadas</option>
            </select>
          </label>
        </div>
        <RecordCards
          key={listClass + listState}
          limit={9}
          empty="Nenhuma avaliação corresponde à seleção."
        >
          {assessments.map((a) => {
            const submitted = deliveries.filter(
              (s) => s.assessmentId === a.id,
            ).length;
            const corrected = state.grades.filter(
              (g) => g.assessmentId === a.id,
            ).length;
            return (
              <RecordCard
                key={a.id}
                title={a.title}
                eyebrow={`${a.format} · ${br(a.day)}`}
                detail={nameOf(state.classes, a.classId)}
                icon={ClipboardCheck}
                tone={a.day >= nowDate() ? "blue" : "green"}
                action="Abrir correção"
                selected={open === a.id}
                onOpen={() => {
                  setOpen(a.id);
                  requestAnimationFrame(() => {
                    review.current?.focus();
                    review.current?.scrollIntoView({ block: "start" });
                  });
                }}
              >
                <p className="record-detail">
                  {a.format !== "Prova" && `${submitted} entrega(s) · `}
                  {corrected} correção(ões)
                </p>
                <div className="school-actions">
                  <button
                    onClick={() => {
                      setEditing(a);
                      setAssessmentDialog(true);
                    }}
                  >
                    <Pencil size={15} aria-hidden="true" /> Editar avaliação
                  </button>
                  <ActionForm
                    title={
                      a.archived ? "Reativar avaliação" : "Arquivar avaliação"
                    }
                    trigger={a.archived ? "Reativar" : "Arquivar"}
                    triggerClass="school-secondary"
                    button={
                      a.archived ? "Reativar avaliação" : "Arquivar avaliação"
                    }
                    onSubmit={() =>
                      send("archiveAssessment", {
                        id: a.id,
                        archived: !a.archived,
                      })
                    }
                  >
                    <p>
                      {a.archived ? "Reativar" : "Arquivar"} a avaliação{" "}
                      {a.title}?
                    </p>
                  </ActionForm>
                </div>
              </RecordCard>
            );
          })}
        </RecordCards>
      </Panel>
      {selected && (
        <div ref={review} tabIndex="-1">
          <Panel
            title={`Correção · ${selected.title}`}
            subtitle={selected.instructions}
          >
            {roster(state, c.id, selected.day).map((s) => {
              const g = state.grades.find(
                (x) => x.assessmentId === selected.id && x.studentId === s.id,
              );
              const submission = deliveries.find(
                (x) => x.assessmentId === selected.id && x.studentId === s.id,
              );
              const deliveryStatus = submission
                ? `Entregue em ${br(submission.submitted)}`
                : selected.format === "Prova"
                  ? "Prova sem entrega pelo portal"
                  : "Nenhuma resposta enviada pelo portal";
              return (
                <article
                  className="school-record"
                  key={`${selected.id}-${s.id}`}
                >
                  <h3>{s.name}</h3>
                  <p className="record-detail">{deliveryStatus}</p>
                  {g && (
                    <p className="record-detail school-pre">
                      {g.score == null
                        ? "Devolutiva"
                        : `Nota ${grade(g.score)}`}
                      {g.feedback && ` · ${g.feedback}`}
                    </p>
                  )}
                  <ActionForm
                    title={`Corrigir avaliação de ${s.name}`}
                    className="school-correction-form"
                    trigger="Lançar ou editar nota"
                    triggerClass="school-secondary"
                    button={`Salvar avaliação de ${s.name}`}
                    onSubmit={(d) =>
                      send("grade", {
                        ...d,
                        studentId: s.id,
                        assessmentId: selected.id,
                      })
                    }
                  >
                    <div className="school-correction-response">
                      <p className="school-caption">{selected.title}</p>
                      <h3>Resposta do aluno</h3>
                      <p className="school-caption">{deliveryStatus}</p>
                      {submission && (
                        <p className="school-pre">{submission.text}</p>
                      )}
                    </div>
                    <div className="school-correction-fields">
                      {c.stage !== "Educação Infantil" && (
                        <Field
                          label={`Nota de ${s.name}`}
                          name="score"
                          type="number"
                          min={0}
                          max={10}
                          step="0.01"
                          value={g?.score ?? ""}
                        />
                      )}
                      <Field
                        label={`Devolutiva de ${s.name}`}
                        name="feedback"
                        type="textarea"
                        value={g?.feedback}
                        optional={c.stage !== "Educação Infantil"}
                      />
                    </div>
                  </ActionForm>
                </article>
              );
            })}
          </Panel>
        </div>
      )}
    </>
  );
}
export function Closing({ state, send, office }) {
  const [classId, setClass] = useState(""),
    [periodId, setPeriod] = useState("");
  const c = state.classes.find((x) => x.id === classId);
  const p = state.periods.find((x) => x.id === periodId);
  const closure = state.closures.find(
    (x) => x.classId === classId && x.periodId === periodId,
  );
  const rows =
    (closure && closure.state !== "Reaberto"
      ? closure.rows
      : state.previews.find(
          (x) => x.classId === classId && x.periodId === periodId,
        )?.rows) || [];
  const closures = new Map(
    state.closures.map((item) => [`${item.classId}:${item.periodId}`, item]),
  );
  const periods = state.periods.filter(
    (period) => !c || period.year === c.year,
  );
  const classrooms = state.classes
    .filter((classroom) => !classId || classroom.id === classId)
    .map((classroom) => ({
      classroom,
      periods: periods.filter(
        (period) =>
          period.year === classroom.year &&
          (!periodId || period.id === periodId),
      ),
    }))
    .filter((entry) => entry.periods.length);

  return (
    <>
      <Panel
        title="Turmas e períodos"
        actions={office && <ClosingSettings state={state} send={send} />}
      >
        <div className="school-filters">
          <label>
            Turma do boletim
            <select
              value={classId}
              onChange={(event) => {
                const next = event.target.value;
                setClass(next);
                const selectedClass = state.classes.find(
                  (item) => item.id === next,
                );
                if (selectedClass && p?.year !== selectedClass.year)
                  setPeriod("");
              }}
            >
              <option value="">Todas as turmas</option>
              {state.classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Período do boletim
            <select
              value={periodId}
              onChange={(event) => setPeriod(event.target.value)}
            >
              <option value="">Todos os períodos</option>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.name}
                </option>
              ))}
            </select>
          </label>
          {(classId || periodId) && (
            <button
              type="button"
              className="school-secondary"
              onClick={() => {
                setClass("");
                setPeriod("");
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>
        {!(c && p) && (
          <RecordCards
            key={`${classId}:${periodId}`}
            limit={9}
            empty="Nenhuma turma neste período."
          >
            {classrooms.map(({ classroom, periods: classPeriods }) => (
              <RecordCard
                key={classroom.id}
                title={classroom.name}
                eyebrow={String(classroom.year)}
                icon={ClipboardCheck}
                tone="blue"
              >
                <div className="school-closing-periods">
                  {classPeriods.map((period) => {
                    const status =
                      closures.get(`${classroom.id}:${period.id}`)?.state ||
                      "Em lançamento";
                    return (
                      <button
                        type="button"
                        key={period.id}
                        aria-label={`${classroom.name}, ${period.name} · ${status}`}
                        onClick={() => {
                          setClass(classroom.id);
                          setPeriod(period.id);
                          requestAnimationFrame(() => {
                            document
                              .getElementById("detalhe-fechamento")
                              ?.focus();
                          });
                        }}
                      >
                        <span>{period.name}</span>
                        <small data-status={status}>{status}</small>
                      </button>
                    );
                  })}
                </div>
              </RecordCard>
            ))}
          </RecordCards>
        )}
      </Panel>
      {c && p && (
        <div id="detalhe-fechamento" tabIndex={-1}>
          <Panel
            title={`${c.name} · ${p.name}`}
            subtitle={`${br(p.start)} a ${br(p.end)} · ${closure?.state || "Em lançamento"}`}
            actions={
              office && (
                <>
                  {(!closure || closure.state === "Reaberto") && (
                    <ActionForm
                      title="Fechar período"
                      trigger="Fechar período"
                      button="Fechar período"
                      onSubmit={() =>
                        send("closure", { classId, periodId, state: "Fechado" })
                      }
                    >
                      <p>
                        Revise as notas e a frequência antes de fechar este
                        período.
                      </p>
                    </ActionForm>
                  )}
                  {closure?.state === "Fechado" && (
                    <ActionForm
                      title="Publicar boletins"
                      trigger="Publicar boletins"
                      button="Publicar boletins"
                      onSubmit={() =>
                        send("closure", {
                          classId,
                          periodId,
                          state: "Publicado",
                        })
                      }
                    >
                      <p>
                        Os boletins deste período ficarão disponíveis para os
                        estudantes e seus responsáveis.
                      </p>
                    </ActionForm>
                  )}
                  {closure && closure.state !== "Reaberto" && (
                    <ActionForm
                      title="Reabrir período"
                      trigger="Reabrir período"
                      triggerClass="school-secondary"
                      button="Reabrir período"
                      onSubmit={(d) =>
                        send("closure", {
                          ...d,
                          classId,
                          periodId,
                          state: "Reaberto",
                        })
                      }
                    >
                      <Field label="Motivo da reabertura" name="reason" />
                    </ActionForm>
                  )}
                  {closure?.publicRows && (
                    <ReportDownload
                      school={state.name}
                      reports={[reportGroup(state, closure)]}
                    />
                  )}
                </>
              )
            }
          >
            <RecordCards
              key={classId + periodId}
              limit={9}
              empty="Nenhum estudante neste período."
            >
              {rows.map((r) => {
                const notes = [
                  ...r.flags,
                  ...(r.missing
                    ? [`${r.missing} avaliação(ões) sem lançamento`]
                    : []),
                  ...(!r.marks.length ? ["Sem registro avaliativo"] : []),
                ];
                return (
                  <RecordCard
                    key={r.studentId}
                    title={r.name}
                    eyebrow={notes.length ? "Revisar" : "Conferido"}
                    tone={notes.length ? "gold" : "green"}
                  >
                    <dl className="record-metrics">
                      <div>
                        <dt>
                          {c.stage === "Educação Infantil"
                            ? "Registros"
                            : "Média"}
                        </dt>
                        <dd>
                          {c.stage === "Educação Infantil"
                            ? r.marks.length
                            : grade(r.average)}
                        </dd>
                      </div>
                      <div>
                        <dt>Frequência</dt>
                        <dd>
                          {r.attendance === null
                            ? "—"
                            : `${grade(r.attendance)}%`}
                        </dd>
                      </div>
                    </dl>
                    {notes.length > 0 && (
                      <p className="record-detail">{notes.join(" · ")}</p>
                    )}
                  </RecordCard>
                );
              })}
            </RecordCards>
          </Panel>
        </div>
      )}
    </>
  );
}

function ClosingSettings({ state, send }) {
  return (
    <>
      <ActionForm
        title="Criar período letivo"
        trigger={
          <>
            <Plus size={16} aria-hidden="true" /> Criar período
          </>
        }
        button="Criar período"
        onSubmit={(d) => send("period", d)}
      >
        <Field label="Nome do período" name="name" />
        <Field label="Início do período" name="start" type="date" />
        <Field label="Fim do período" name="end" type="date" />
      </ActionForm>

      <ActionForm
        title="Editar critérios escolares"
        trigger={
          <>
            <Pencil size={15} aria-hidden="true" /> Editar critérios
          </>
        }
        triggerClass="school-secondary"
        onSubmit={(d) => send("policy", d)}
      >
        <Field
          label="Ano padrão"
          name="year"
          type="number"
          value={state.policy.year}
        />
        <Field
          label="Média de referência"
          name="target"
          type="number"
          min={0}
          max={10}
          step="0.1"
          value={state.policy.target}
        />
        <Field
          label="Frequência de referência (%)"
          name="attendance"
          type="number"
          min={75}
          max={100}
          value={state.policy.attendance}
        />
        <Field
          label="Frequência pré-escolar (%)"
          name="preschoolAttendance"
          type="number"
          min={60}
          max={100}
          value={state.policy.preschoolAttendance}
        />
        <Field
          label="Cálculo da média"
          name="grading"
          options={[
            ["weighted", "Média ponderada"],
            ["simple", "Média simples"],
          ]}
          value={state.policy.grading}
        />
      </ActionForm>
    </>
  );
}

export function FollowUp({ state, send, initialId }) {
  const initialCase = state.cases.find((c) => c.id === initialId);
  const [classId, setClass] = useState(initialCase?.classId || ""),
    [editing, setEditing] = useState(initialCase || null);
  const [caseDialog, setCaseDialog] = useState(Boolean(initialCase));
  const [profileId, setProfileId] = useState("");
  const profile = state.students.find((student) => student.id === profileId);
  const profileGrades = profile
    ? state.grades.flatMap((g) => {
        const a = state.assessments.find((item) => item.id === g.assessmentId);
        return a && g.studentId === profile.id && g.score !== null
          ? [{ ...g, date: a.day, title: a.title }]
          : [];
      })
    : [];
  const suggestions = (state.previews || []).flatMap((p) =>
    p.rows
      .filter(
        (r) =>
          r.flags.length &&
          !state.cases.some(
            (c) =>
              c.studentId === r.studentId &&
              c.classId === p.classId &&
              c.state !== "Concluído",
          ),
      )
      .map((r) => ({ classId: p.classId, periodId: p.periodId, ...r })),
  );
  const pupils = state.students.filter((s) =>
    state.enrollments.some(
      (e) => e.studentId === s.id && e.classId === classId,
    ),
  );
  const selectedClass = state.classes.find((c) => c.id === classId);
  return (
    <>
      <Panel title="Trajetória do estudante">
        <label className="school-filter">
          Consultar estudante
          <select
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
          >
            <option value="">Selecione</option>
            {state.students.map((student) => (
              <option value={student.id} key={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </label>
        {profile && (
          <>
            <PerformanceChart
              grades={profileGrades}
              studentIds={[profile.id]}
              year={state.policy.year}
              target={state.policy.target}
              subject="Resultados escolares"
              title={`Desempenho anual de ${profile.name}`}
            />
            <RecordCards limit={6}>
              {state.previews.flatMap((p) =>
                p.rows
                  .filter((r) => r.studentId === profile.id)
                  .map((r) => (
                    <RecordCard
                      key={p.classId + p.periodId}
                      title={nameOf(state.classes, p.classId)}
                      eyebrow={nameOf(state.periods, p.periodId)}
                      detail={r.flags.join(" · ") || undefined}
                      tone={r.flags.length ? "gold" : "green"}
                    >
                      <dl className="record-metrics">
                        <div>
                          <dt>Média</dt>
                          <dd>{grade(r.average)}</dd>
                        </div>
                        <div>
                          <dt>Frequência</dt>
                          <dd>
                            {r.attendance === null
                              ? "—"
                              : `${grade(r.attendance)}%`}
                          </dd>
                        </div>
                      </dl>
                    </RecordCard>
                  )),
              )}
            </RecordCards>
          </>
        )}
      </Panel>
      <Panel title="Sinais para revisão pedagógica">
        <RecordCards limit={6} empty="Nenhum sinal para revisar.">
          {suggestions.map((s) => (
            <RecordCard
              key={s.classId + s.periodId + s.studentId}
              title={s.name}
              eyebrow={nameOf(state.periods, s.periodId)}
              detail={s.flags.join(" · ")}
              tone="gold"
              action="Planejar apoio"
              onOpen={() => {
                setClass(s.classId);
                setEditing({ ...s, title: s.flags.join(" · ") });
                setCaseDialog(true);
              }}
            />
          ))}
        </RecordCards>
      </Panel>
      <Panel title="Planos de acompanhamento">
        <RecordCards limit={9}>
          {state.cases.map((c) => (
            <RecordCard
              key={c.id}
              title={c.title}
              eyebrow={`${c.state} · revisão em ${br(c.due)}`}
              detail={`${nameOf(state.students, c.studentId)} · ${c.ownerName}`}
              icon={HeartHandshake}
              tone={c.state === "Concluído" ? "green" : "gold"}
              action="Abrir acompanhamento"
              onOpen={() => {
                setClass(c.classId);
                setEditing(c);
                setCaseDialog(true);
              }}
            >
              <p className="record-detail">{c.action}</p>
            </RecordCard>
          ))}
        </RecordCards>
      </Panel>
      <Panel
        title={
          editing?.id ? "Atualizar acompanhamento" : "Registrar ação pedagógica"
        }
      >
        <label className="school-filter">
          Turma do acompanhamento
          <select
            value={classId}
            onChange={(e) => {
              setClass(e.target.value);
              setEditing(null);
            }}
          >
            <option value="">Selecione</option>
            {state.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {classId && (
          <>
            <button
              className="school-primary school-create-actions"
              aria-haspopup="dialog"
              onClick={() => setCaseDialog(true)}
            >
              Criar plano de acompanhamento
            </button>
            <ActionForm
              title={
                editing?.id
                  ? "Editar acompanhamento"
                  : "Criar plano de acompanhamento"
              }
              open={caseDialog}
              onDismiss={() => {
                setCaseDialog(false);
                setEditing(null);
              }}
              key={JSON.stringify([classId, editing?.id, editing?.studentId])}
              onSubmit={(d) => send("case", { ...d, classId, id: editing?.id })}
            >
              <Field
                label="Estudante acompanhado"
                name="studentId"
                options={opts(pupils)}
                value={editing?.studentId}
              />
              <Field
                label="Motivo do apoio"
                name="title"
                value={editing?.title}
              />
              <Field
                label="Ação combinada"
                name="action"
                type="textarea"
                value={editing?.action}
              />
              <Field
                label="Responsável pela ação"
                name="owner"
                options={opts(
                  state.assignees.filter(
                    (a) =>
                      a.role !== "professor" ||
                      selectedClass?.teachers.includes(a.id),
                  ),
                )}
                value={editing?.owner}
              />
              <Field
                label="Data de revisão"
                name="due"
                type="date"
                value={editing?.due || nowDate()}
              />
              <Field
                label="Situação do acompanhamento"
                name="state"
                options={["Aberto", "Em acompanhamento", "Concluído"]}
                value={editing?.state || "Aberto"}
              />
              <Field
                label="Retorno e evidências"
                name="result"
                type="textarea"
                value={editing?.result}
                optional
              />
            </ActionForm>
          </>
        )}
      </Panel>
    </>
  );
}
