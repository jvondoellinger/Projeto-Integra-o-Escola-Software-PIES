import PerformanceChart from "../PerformanceChart.jsx";
import React, { useState } from "react";
import {
  Form,
  Field,
  Panel,
  Table,
  br,
  opts,
  nameOf,
  nowDate,
  grade,
  roster,
} from "./ui.jsx";

export function Diary({ state, send }) {
  const [classId, setClass] = useState(""),
    [day, setDay] = useState(nowDate),
    [editing, setEditing] = useState(null);
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
                setDay(e.target.value);
                setEditing(null);
              }}
            />
          </label>
        </div>
        {pupils.length > 0 ? (
          <Form
            key={`${classId}-${day}-${editing?.id}-${editing?.revision}`}
            button={editing ? "Salvar correção da chamada" : "Registrar aula"}
            onSubmit={async (d) => {
              if (
                await send(
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
              )
                setEditing(null);
            }}
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
          </Form>
        ) : (
          <p className="school-empty">
            {classId
              ? "Nenhum estudante matriculado nessa data."
              : "Escolha uma turma para começar."}
          </p>
        )}
      </Panel>
      <Panel title="Aulas registradas">
        <Table
          columns={[
            "Data",
            "Turma",
            "Horário",
            "Conteúdo",
            "Presentes",
            "Ação",
          ]}
          rows={[...state.lessons]
            .filter((l) => !classId || l.classId === classId)
            .sort((a, b) => b.day.localeCompare(a.day))
            .map((l) => [
              l.id,
              br(l.day),
              nameOf(state.classes, l.classId),
              l.slot,
              l.topic,
              `${l.attendance.filter((x) => x.status === "Presente").length}/${l.attendance.length}`,
              <button
                className="school-secondary"
                onClick={() => {
                  setClass(l.classId);
                  setDay(l.day);
                  setEditing(l);
                  window.scrollTo(0, 0);
                }}
              >
                Corrigir chamada
              </button>,
            ])}
        />
      </Panel>
      <Panel title="Solicitações de justificativa">
        <Table
          columns={["Data", "Estudante", "Justificativa", "Situação"]}
          rows={state.justifications.map((j) => [
            j.id,
            br(j.day),
            nameOf(state.students, j.studentId),
            j.reason,
            j.state === "Pendente" ? (
              <Form
                button="Registrar decisão"
                onSubmit={(d) => send("decide", { ...d, id: j.id })}
              >
                <Field
                  label="Decisão"
                  name="state"
                  options={["Aceita", "Recusada"]}
                />
                <Field label="Retorno" name="response" optional />
              </Form>
            ) : (
              `${j.state}${j.response ? " · " + j.response : ""}`
            ),
          ])}
        />
      </Panel>
    </>
  );
}
export function Evaluations({ state, send }) {
  const [open, setOpen] = useState(null);
  const [editing, setEditing] = useState(null);
  const selected = state.assessments.find((a) => a.id === open);
  const c = state.classes.find((x) => x.id === selected?.classId);
  return (
    <>
      <Panel
        title={editing ? "Editar avaliação" : "Planejar avaliação"}
        subtitle="Atividades publicadas entram no calendário e aparecem no portal da turma."
      >
        <Form
          key={editing?.id || "new"}
          button={editing ? "Salvar alterações" : "Publicar ou agendar"}
          onSubmit={async (d, f) => {
            if (
              await send("assessment", {
                ...d,
                id: editing?.id,
                classId: editing?.classId || d.classId,
                recovery: f.has("recovery"),
              })
            )
              setEditing(null);
          }}
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
        </Form>
        {editing && (
          <button className="school-secondary" onClick={() => setEditing(null)}>
            Cancelar edição
          </button>
        )}
      </Panel>
      <Panel title="Avaliações planejadas">
        <Table
          columns={["Avaliação", "Turma", "Prazo", "Entregas", "Ação"]}
          rows={state.assessments.map((a) => [
            a.id,
            a.title,
            nameOf(state.classes, a.classId),
            br(a.day),
            state.submissions.filter((x) => x.assessmentId === a.id).length,
            <div className="school-actions">
              <button onClick={() => setOpen(a.id)}>Abrir correção</button>
              <button
                onClick={() => {
                  setEditing(a);
                  window.scrollTo(0, 0);
                }}
              >
                Editar avaliação
              </button>
              <button
                onClick={() =>
                  send("archiveAssessment", { id: a.id, archived: !a.archived })
                }
              >
                {a.archived ? "Reativar" : "Arquivar"}
              </button>
            </div>,
          ])}
        />
      </Panel>
      {selected && (
        <Panel
          title={`Correção · ${selected.title}`}
          subtitle={selected.instructions}
        >
          {roster(state, c.id, selected.day).map((s) => {
            const g = state.grades.find(
              (x) => x.assessmentId === selected.id && x.studentId === s.id,
            );
            const sub = state.submissions.find(
              (x) => x.assessmentId === selected.id && x.studentId === s.id,
            );
            return (
              <article className="school-record" key={`${selected.id}-${s.id}`}>
                <h3>{s.name}</h3>
                {sub && <p className="school-pre school-callout">{sub.text}</p>}
                <Form
                  button={`Salvar avaliação de ${s.name}`}
                  onSubmit={(d) =>
                    send("grade", {
                      ...d,
                      studentId: s.id,
                      assessmentId: selected.id,
                    })
                  }
                >
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
                </Form>
              </article>
            );
          })}
        </Panel>
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
  return (
    <>
      <Panel title="Revisar e fechar período">
        <div className="school-filters">
          <label>
            Turma do boletim
            <select
              value={classId}
              onChange={(e) => {
                setClass(e.target.value);
                setPeriod("");
              }}
            >
              <option value="">Selecione</option>
              {state.classes.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Período do boletim
            <select
              value={periodId}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="">Selecione</option>
              {state.periods
                .filter((p) => p.year === c?.year)
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
            </select>
          </label>
        </div>
        {c && p && (
          <>
            <p className="school-caption">
              {br(p.start)} a {br(p.end)} · {closure?.state || "Em lançamento"}
            </p>
            <Table
              columns={[
                "Estudante",
                c.stage === "Educação Infantil" ? "Registros" : "Média",
                "Frequência",
                "Conferência",
              ]}
              rows={rows.map((r) => [
                r.studentId,
                r.name,
                c.stage === "Educação Infantil"
                  ? r.marks.length
                  : grade(r.average),
                r.attendance == null
                  ? "Sem chamada"
                  : `${grade(r.attendance)}%`,
                [
                  ...r.flags,
                  ...(r.missing
                    ? [`${r.missing} avaliação(ões) sem lançamento`]
                    : []),
                  ...(!r.marks.length ? ["Sem registro avaliativo"] : []),
                ].join(" · ") || "Conferido",
              ])}
            />
            {office && (
              <div className="school-actions">
                {(!closure || closure.state === "Reaberto") && (
                  <button
                    onClick={() =>
                      send("closure", { classId, periodId, state: "Fechado" })
                    }
                  >
                    Fechar período
                  </button>
                )}
                {closure?.state === "Fechado" && (
                  <button
                    onClick={() =>
                      send("closure", { classId, periodId, state: "Publicado" })
                    }
                  >
                    Publicar boletins
                  </button>
                )}
              </div>
            )}
            {office && closure && closure.state !== "Reaberto" && (
              <Form
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
              </Form>
            )}
          </>
        )}
      </Panel>
      {office && (
        <div className="school-grid">
          <Panel title="Criar período letivo">
            <Form onSubmit={(d) => send("period", d)}>
              <Field label="Nome do período" name="name" />
              <Field label="Início do período" name="start" type="date" />
              <Field label="Fim do período" name="end" type="date" />
            </Form>
          </Panel>
          <Panel title="Critérios escolares">
            <Form onSubmit={(d) => send("policy", d)}>
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
            </Form>
          </Panel>
        </div>
      )}
    </>
  );
}
export function FollowUp({ state, send }) {
  const [classId, setClass] = useState(""),
    [editing, setEditing] = useState(null);
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
            <Table
              columns={["Período", "Turma", "Média", "Frequência", "Sinais"]}
              rows={state.previews.flatMap((p) =>
                p.rows
                  .filter((r) => r.studentId === profile.id)
                  .map((r) => [
                    p.classId + p.periodId,
                    nameOf(state.periods, p.periodId),
                    nameOf(state.classes, p.classId),
                    grade(r.average),
                    r.attendance === null ? "—" : `${grade(r.attendance)}%`,
                    r.flags.join(" · ") || "—",
                  ]),
              )}
            />
          </>
        )}
      </Panel>
      <Panel title="Sinais para revisão pedagógica">
        <Table
          columns={["Estudante", "Período", "Sinais", "Ação"]}
          rows={suggestions.map((s) => [
            s.classId + s.periodId + s.studentId,
            s.name,
            nameOf(state.periods, s.periodId),
            s.flags.join(" · "),
            <button
              className="school-secondary"
              onClick={() => {
                setClass(s.classId);
                setEditing({ ...s, title: s.flags.join(" · ") });
              }}
            >
              Planejar apoio
            </button>,
          ])}
        />
      </Panel>
      <Panel title="Planos de acompanhamento">
        <Table
          columns={["Estudante", "Ação", "Responsável", "Revisão", "Estado"]}
          rows={state.cases.map((c) => [
            c.id,
            nameOf(state.students, c.studentId),
            c.action,
            c.ownerName,
            br(c.due),
            <button
              className="school-secondary"
              onClick={() => {
                setClass(c.classId);
                setEditing(c);
              }}
            >
              {c.state}
            </button>,
          ])}
        />
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
          <Form
            key={JSON.stringify([classId, editing?.id, editing?.studentId])}
            onSubmit={async (d) => {
              if (await send("case", { ...d, classId, id: editing?.id }))
                setEditing(null);
            }}
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
          </Form>
        )}
      </Panel>
    </>
  );
}
