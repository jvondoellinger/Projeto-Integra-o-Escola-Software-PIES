import React, { useState } from "react";
import { Plus, BookOpen, CalendarDays, ClipboardList } from "lucide-react";
import { students, number } from "./data.js";
import { contents } from "./learning.js";
import {
  kinds,
  resources,
  dateTime,
  dateInput,
  fromInput,
  assignmentStatus,
  submissionFor,
  patchSubmission,
  gradeSubmission,
} from "./school.js";
export function Resource({ resource }) {
  return (
    <article className="resource">
      <span className="badge blue">{resource.content}</span>
      <h3>{resource.title}</h3>
      <p>{resource.explanation}</p>
      <div className="worked-example">
        <strong>Exemplo resolvido</strong>
        <p>{resource.example}</p>
      </div>
      <p>
        <strong>Agora é sua vez: </strong>
        {resource.exercise}
      </p>
      <details>
        <summary>Conferir resolução</summary>
        <p>{resource.answer}</p>
      </details>
    </article>
  );
}
export function AssignmentForm({
  assignment,
  onSave,
  onCancel,
  hasSubmissions,
}) {
  const [error, setError] = useState("");
  function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = Object.fromEntries(new FormData(form));
    const publishedAt = fromInput(d.publishedAt),
      dueAt = fromInput(d.dueAt);
    if (!d.title.trim() || !d.instructions.trim()) {
      setError("Preencha o título e as orientações.");
      return;
    }
    if (Date.parse(dueAt) <= Date.parse(publishedAt)) {
      setError("O prazo precisa ser posterior à publicação.");
      return;
    }
    onSave({
      ...assignment,
      id: assignment?.id || crypto.randomUUID(),
      title: d.title.trim(),
      instructions: d.instructions.trim(),
      kind: hasSubmissions ? assignment.kind : d.kind,
      classroom: hasSubmissions ? assignment.classroom : d.classroom,
      content: d.content,
      publishedAt,
      dueAt,
      reminderDays: Number(d.reminderDays),
      resourceIds: new FormData(form).getAll("resources"),
      archived: assignment?.archived || false,
    });
  }
  return (
    <form className="panel form-panel" onSubmit={submit}>
      <h2>{assignment ? "Editar avaliação" : "Planejar avaliação"}</h2>
      <p>
        Datas e horários de Brasília. A atividade fica visível ao aluno a partir
        da publicação.
      </p>
      <div className="form-grid">
        <label>
          Título
          <input
            name="title"
            required
            maxLength={120}
            defaultValue={assignment?.title}
          />
        </label>
        <label>
          Turma
          <select
            name="classroom"
            defaultValue={assignment?.classroom || "8º ano A"}
            disabled={hasSubmissions}
          >
            <option>8º ano A</option>
            <option>8º ano B</option>
          </select>
          {hasSubmissions && (
            <small>
              A turma, o formato e a publicação são preservados porque já há
              registros de alunos.
            </small>
          )}
        </label>
        <label>
          Formato
          <select
            name="kind"
            disabled={hasSubmissions}
            defaultValue={assignment?.kind || "Atividade de casa"}
          >
            {kinds.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <label>
          Conteúdo
          <select
            name="content"
            defaultValue={assignment?.content || "Álgebra"}
          >
            {contents.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Publicação
          <input
            type="datetime-local"
            name="publishedAt"
            readOnly={hasSubmissions}
            required
            defaultValue={dateInput(
              assignment?.publishedAt || Date.now() - 60000,
            )}
          />
        </label>
        <label>
          Prazo de entrega ou data da prova
          <input
            type="datetime-local"
            name="dueAt"
            required
            defaultValue={dateInput(
              assignment?.dueAt || Date.now() + 3 * 86400000,
            )}
          />
        </label>
        <label>
          Antecedência do lembrete
          <select
            name="reminderDays"
            defaultValue={assignment?.reminderDays || 3}
          >
            {[1, 3, 7, 14].map((n) => (
              <option value={n} key={n}>
                {n} dia(s) antes
              </option>
            ))}
          </select>
        </label>
        <label className="full">
          Orientações
          <textarea
            name="instructions"
            required
            rows={4}
            maxLength={3000}
            defaultValue={assignment?.instructions}
          />
        </label>
      </div>
      <fieldset className="resource-choices">
        <legend>Conteúdos de apoio disponíveis ao aluno</legend>
        {resources.map((r) => (
          <label key={r.id}>
            <input
              name="resources"
              type="checkbox"
              value={r.id}
              defaultChecked={assignment?.resourceIds?.includes(r.id)}
            />
            {r.title}
          </label>
        ))}
      </fieldset>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button type="button" className="button secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button className="button">Salvar avaliação</button>
      </div>
    </form>
  );
}
function ReviewRow({ a, student: s, school, update, toast }) {
  const submission = submissionFor(school, a.id, s.id);
  const [score, setScore] = useState(submission?.score ?? ""),
    [feedback, setFeedback] = useState(submission?.feedback ?? "");
  return (
    <article className="review-row">
      <div>
        <h3>{s.name}</h3>
        <span
          className={"badge " + (submission?.submittedAt ? "green" : "amber")}
        >
          {submission?.score !== null && submission?.score !== undefined
            ? "Avaliada"
            : submission?.submittedAt
              ? "Entregue"
              : a.kind === "Prova"
                ? "Prova presencial"
                : "Entrega pendente"}
        </span>
        {submission?.submittedAt && (
          <p>
            Recebida em {dateTime(submission.submittedAt)}
            {Date.parse(submission.submittedAt) > Date.parse(a.dueAt)
              ? " · após o prazo"
              : ""}
          </p>
        )}
      </div>
      {submission?.submittedAt && submission?.text && (
        <div className="submitted-text">
          <strong>Resposta do aluno</strong>
          <p>{submission.text}</p>
        </div>
      )}
      {!submission?.submittedAt && a.kind !== "Prova" && (
        <button
          className="button secondary"
          onClick={() => {
            update((current) =>
              patchSubmission(current, a.id, s.id, {
                submittedAt: new Date().toISOString(),
                text: "Entrega presencial registrada pela professora.",
              }),
            );
            toast("Entrega presencial registrada.");
          }}
        >
          Registrar entrega presencial
        </button>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (score === "") return;
          update((current) =>
            gradeSubmission(current, a, s.id, Number(score), feedback.trim()),
          );
          toast(
            "Nota e devolutiva registradas. O desempenho do aluno foi atualizado.",
          );
        }}
      >
        <div className="grading-fields">
          <label>
            Nota de {s.name}
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              required
              value={score}
              onChange={(e) => setScore(e.target.value)}
              disabled={!submission?.submittedAt && a.kind !== "Prova"}
            />
          </label>
          <label>
            Devolutiva para {s.name}
            <textarea
              rows={2}
              maxLength={1500}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={!submission?.submittedAt && a.kind !== "Prova"}
            />
          </label>
          <button
            className="button"
            disabled={!submission?.submittedAt && a.kind !== "Prova"}
          >
            Salvar correção
          </button>
        </div>
      </form>
    </article>
  );
}
export default function Assignments({
  school,
  update,
  classroom,
  toast,
  now = Date.now(),
  openId,
  onOpen,
}) {
  const [editing, setEditing] = useState(undefined),
    [kind, setKind] = useState("Todos os formatos"),
    [state, setState] = useState("Ativas");
  const active = school.assignments.find((a) => a.id === openId);
  const save = (a) => {
    update((current) => ({
      ...current,
      assignments: [...current.assignments.filter((x) => x.id !== a.id), a],
      grades: current.grades.map((g) =>
        g.id.startsWith(`assignment-${a.id}-`)
          ? { ...g, title: a.title, content: a.content }
          : g,
      ),
    }));
    setEditing(undefined);
    toast("Avaliação salva. Publicação, prazo e lembretes atualizados.");
  };
  const list = school.assignments
    .filter(
      (a) =>
        (classroom === "Todas as turmas" || a.classroom === classroom) &&
        (kind === "Todos os formatos" || a.kind === kind) &&
        (state === "Arquivadas" ? a.archived : !a.archived),
    )
    .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
  return (
    <>
      <div className="section-actions">
        <p>Provas, atividades em sala, tarefas de casa e projetos com prazo.</p>
        <button
          className="button"
          onClick={() => {
            setEditing(null);
            onOpen(null);
          }}
        >
          <Plus size={16} />
          Nova avaliação
        </button>
      </div>
      {editing !== undefined && (
        <AssignmentForm
          key={editing?.id || "new"}
          assignment={editing}
          hasSubmissions={school.submissions.some(
            (s) => s.assignmentId === editing?.id,
          )}
          onSave={save}
          onCancel={() => setEditing(undefined)}
        />
      )}
      {active ? (
        <>
          <button className="text-button" onClick={() => onOpen(null)}>
            Voltar às avaliações
          </button>
          <section className="panel assignment-detail">
            <div className="section-title">
              <span className="badge blue">
                {active.kind} · {active.classroom}
              </span>
              <span className="badge green">
                {assignmentStatus(active, now)}
              </span>
            </div>
            <h2>{active.title}</h2>
            <p className="due-date">
              Prazo: {dateTime(active.dueAt)} · horário de Brasília
            </p>
            <p className="instructions">{active.instructions}</p>
            <div className="form-actions">
              <button
                className="button secondary"
                onClick={() => setEditing(active)}
              >
                Editar avaliação
              </button>
              <button
                className="button secondary"
                onClick={() => {
                  if (
                    !window.confirm(
                      active.archived
                        ? "Reabrir esta avaliação?"
                        : "Arquivar esta avaliação? Ela sairá da lista do aluno e dos lembretes. As entregas serão preservadas.",
                    )
                  )
                    return;
                  save({ ...active, archived: !active.archived });
                }}
              >
                {active.archived ? "Reabrir avaliação" : "Arquivar avaliação"}
              </button>
            </div>
          </section>
          <section className="panel">
            <h2>Entregas e correções</h2>
            <p>
              Registrar uma nota atualiza o gráfico anual e o resultado na visão
              do aluno.
            </p>
            {students
              .filter((s) => s.classroom === active.classroom)
              .map((s) => (
                <ReviewRow
                  key={
                    active.id +
                    "-" +
                    s.id +
                    "-" +
                    (submissionFor(school, active.id, s.id)?.score ?? "")
                  }
                  a={active}
                  student={s}
                  school={school}
                  update={update}
                  toast={toast}
                />
              ))}
          </section>
          {active.resourceIds.length > 0 && (
            <section className="panel">
              <h2>Material compartilhado com a turma</h2>
              <div className="cards">
                {resources
                  .filter((r) => active.resourceIds.includes(r.id))
                  .map((r) => (
                    <Resource key={r.id} resource={r} />
                  ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <>
          <div className="assignment-filters">
            <label>
              Formato da avaliação
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                {["Todos os formatos", ...kinds].map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            <label>
              Situação das avaliações
              <select value={state} onChange={(e) => setState(e.target.value)}>
                <option>Ativas</option>
                <option>Arquivadas</option>
              </select>
            </label>
          </div>
          <div className="cards">
            {list.map((a) => {
              const roster = students.filter(
                (s) => s.classroom === a.classroom,
              );
              const delivered = school.submissions.filter(
                (s) => s.assignmentId === a.id && s.submittedAt,
              ).length;
              return (
                <article className="panel assessment" key={a.id}>
                  <ClipboardList />
                  <span className="badge blue">{a.kind}</span>
                  <h2>{a.title}</h2>
                  <p>
                    {a.classroom} · {a.content}
                  </p>
                  <p className="assessment-date">
                    <CalendarDays size={17} />
                    {dateTime(a.dueAt)}
                  </p>
                  <p>
                    {assignmentStatus(a, now)} ·{" "}
                    {a.kind === "Prova"
                      ? `${roster.length} alunos previstos`
                      : `${delivered}/${roster.length} entregas`}
                  </p>
                  <button
                    className="button secondary"
                    onClick={() => onOpen(a.id)}
                  >
                    Abrir avaliação
                  </button>
                </article>
              );
            })}
          </div>
          {!list.length && (
            <section className="panel empty">
              Nenhuma avaliação corresponde aos filtros. Crie uma avaliação ou
              altere a seleção.
            </section>
          )}
        </>
      )}
    </>
  );
}
