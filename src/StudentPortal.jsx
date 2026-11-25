import React, { useState, useEffect } from "react";
import { BookOpen, ClipboardList, CheckCircle2, Clock3 } from "lucide-react";
import { number } from "./data.js";
import { studentMetrics, contents } from "./learning.js";
import {
  resources,
  dateTime,
  submissionFor,
  patchSubmission,
  kinds,
} from "./school.js";
import { deadlineLabel } from "./alerts.js";
import PerformanceChart from "./PerformanceChart.jsx";
import AlertsPanel from "./AlertsPanel.jsx";
import { Resource } from "./Assignments.jsx";
function StudentTask({
  assignment: a,
  student,
  school,
  update,
  now,
  onBack,
  toast,
}) {
  const sub = submissionFor(school, a.id, student.id);
  const [text, setText] = useState(sub?.text || ""),
    [material, setMaterial] = useState(false);
  const exam = a.kind === "Prova";
  const isGraded = sub?.score !== null && sub?.score !== undefined;
  const support = resources.filter((r) => a.resourceIds.includes(r.id));
  const learning = support.length
    ? support
    : resources.filter((r) => r.content === a.content);
  useEffect(() => {
    if (
      sub?.gradedAt &&
      (!sub.seenAt || Date.parse(sub.seenAt) < Date.parse(sub.gradedAt))
    )
      update((current) =>
        patchSubmission(current, a.id, student.id, {
          seenAt: new Date().toISOString(),
        }),
      );
  }, [a.id, student.id, sub?.gradedAt]);
  return (
    <>
      <button className="text-button" onClick={onBack}>
        Voltar às minhas atividades
      </button>
      <section className="panel assignment-detail">
        <div className="section-title">
          <span className="badge blue">
            {a.kind} · {a.content}
          </span>
          <span className={"badge " + (sub?.submittedAt ? "green" : "amber")}>
            {isGraded
              ? "Avaliada"
              : sub?.submittedAt
                ? "Entregue"
                : exam
                  ? "Preparação para prova"
                  : deadlineLabel(a, now)}
          </span>
        </div>
        <h2>{a.title}</h2>
        <p>
          Publicada: {dateTime(a.publishedAt)} · Prazo: {dateTime(a.dueAt)} ·
          horário de Brasília
        </p>
        <p className="instructions">{a.instructions}</p>
        <div className="task-actions">
          <button
            className="button secondary"
            onClick={() => {
              update((current) =>
                patchSubmission(current, a.id, student.id, {
                  completedAt: sub?.completedAt
                    ? null
                    : new Date().toISOString(),
                }),
              );
              toast(
                sub?.completedAt
                  ? "Conclusão desmarcada."
                  : "Atividade marcada como feita.",
              );
            }}
            disabled={!!sub?.submittedAt || isGraded}
          >
            <CheckCircle2 size={17} />
            {sub?.completedAt
              ? "Desmarcar como feita"
              : exam
                ? "Marcar preparação concluída"
                : "Marcar como feita"}
          </button>
          <button
            className="button secondary"
            onClick={() => setMaterial(!material)}
          >
            <BookOpen size={17} />
            {material ? "Ver entrega e orientações" : "Ver conteúdo de apoio"}
          </button>
        </div>
        {sub?.completedAt && !sub?.submittedAt && !exam && (
          <p className="important-note">
            Você marcou a atividade como feita. Para enviá-la à professora, use
            Entregar atividade.
          </p>
        )}
      </section>
      {material ? (
        <section className="panel">
          <h2>Conteúdo para ajudar neste desafio</h2>
          <p>
            Leia o exemplo, tente o exercício e confira sua estratégia antes de
            entregar.
          </p>
          <div className="cards">
            {learning.map((r) => (
              <Resource key={r.id} resource={r} />
            ))}
          </div>
        </section>
      ) : (
        <section className="panel task-submission">
          <h2>
            {exam
              ? "Sua preparação"
              : sub?.submittedAt
                ? "Sua entrega"
                : "Enviar sua atividade"}
          </h2>
          {exam ? (
            <p>
              A prova será realizada presencialmente em {dateTime(a.dueAt)}.
              Estude os materiais de apoio. A nota e a devolutiva aparecerão
              aqui após a correção.
            </p>
          ) : sub?.submittedAt ? (
            <>
              <p className="caption">
                Entregue em {dateTime(sub.submittedAt)}
                {Date.parse(sub.submittedAt) > Date.parse(a.dueAt)
                  ? " · entrega após o prazo"
                  : ""}
              </p>
              <p className="submitted-text">{sub.text}</p>
              {!isGraded && Date.parse(a.dueAt) > now && (
                <button
                  className="button secondary"
                  onClick={() => {
                    update((current) =>
                      patchSubmission(current, a.id, student.id, {
                        submittedAt: null,
                      }),
                    );
                    toast(
                      "Entrega retirada. Edite e envie novamente antes do prazo.",
                    );
                  }}
                >
                  Retirar entrega para editar
                </button>
              )}
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!text.trim()) {
                  toast("Escreva sua resolução antes de entregar.");
                  return;
                }
                update((current) =>
                  patchSubmission(current, a.id, student.id, {
                    text: text.trim(),
                    completedAt: sub?.completedAt || new Date().toISOString(),
                    submittedAt: new Date().toISOString(),
                  }),
                );
                toast(
                  "Atividade entregue. A professora já pode acompanhar e corrigir.",
                );
              }}
            >
              <label>
                Sua resolução
                <textarea
                  rows={7}
                  required
                  maxLength={5000}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Apresente sua resolução, explique o raciocínio e registre suas conclusões."
                />
              </label>
              <p className="caption">
                {text.length}/5000 caracteres.{" "}
                {Date.parse(a.dueAt) < now
                  ? "O prazo terminou. A entrega será identificada como atrasada."
                  : "Salvar rascunho não envia a atividade."}
              </p>
              <div className="form-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    update((current) =>
                      patchSubmission(current, a.id, student.id, { text }),
                    );
                    toast("Rascunho salvo neste navegador.");
                  }}
                >
                  Salvar rascunho
                </button>
                <button className="button">Entregar atividade</button>
              </div>
            </form>
          )}
          {isGraded && (
            <div className="grade-feedback">
              <h3>Devolutiva da professora</h3>
              <strong>
                {number(sub.score)} <small>/ 10</small>
              </strong>
              <p>
                {sub.feedback ||
                  "Nota registrada. Converse com a professora para orientar os próximos passos."}
              </p>
              <span className="caption">
                Corrigida em {dateTime(sub.gradedAt)}
              </span>
            </div>
          )}
        </section>
      )}
    </>
  );
}
export default function StudentPortal({
  student,
  school,
  update,
  page,
  now,
  alerts,
  onOpen,
  openId,
  toast,
}) {
  const [kind, setKind] = useState("Todos os formatos"),
    [filter, setFilter] = useState("Todas");
  const own = school.assignments
    .filter(
      (a) =>
        !a.archived &&
        a.classroom === student.classroom &&
        Date.parse(a.publishedAt) <= now,
    )
    .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
  const selected = own.find((a) => a.id === openId);
  const metric = studentMetrics(student, school.grades);
  const pending = own.filter(
    (a) =>
      a.kind !== "Prova" &&
      !submissionFor(school, a.id, student.id)?.submittedAt,
  );
  const done = own.filter(
    (a) => submissionFor(school, a.id, student.id)?.submittedAt,
  );
  const grades = school.grades
    .filter((g) => g.studentId === student.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (openId && page === "Minhas atividades")
    return selected ? (
      <StudentTask
        key={selected.id + "-" + student.id}
        assignment={selected}
        student={student}
        school={school}
        update={update}
        now={now}
        onBack={() => onOpen(null)}
        toast={toast}
      />
    ) : (
      <section className="panel empty">
        <h2>Avaliação indisponível</h2>
        <p>Ela pode estar agendada, arquivada ou pertencer a outra turma.</p>
        <button className="button secondary" onClick={() => onOpen(null)}>
          Voltar às minhas atividades
        </button>
      </section>
    );
  if (page === "Alertas")
    return <AlertsPanel alerts={alerts} onOpen={onOpen} />;
  if (page === "Meu desempenho")
    return (
      <>
        <PerformanceChart grades={school.grades} studentIds={[student.id]} />
        <section className="panel grade-records">
          <h2>Resultados e evidências de aprendizagem</h2>
          <p>
            As notas abaixo compõem seu gráfico anual. Resultados ainda não
            corrigidos não reduzem sua média.
          </p>
          <div
            className="table-wrap"
            role="region"
            aria-label="Notas do aluno"
            tabIndex="0"
          >
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Avaliação</th>
                  <th>Conteúdo</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((g) => (
                  <tr key={g.id}>
                    <td>
                      {new Date(g.date + "T12:00:00").toLocaleDateString(
                        "pt-BR",
                      )}
                    </td>
                    <td>{g.title}</td>
                    <td>{g.content}</td>
                    <td>{number(g.score)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </>
    );
  if (page === "Conteúdos de apoio")
    return (
      <section className="panel">
        <h2>Um conteúdo, um próximo passo</h2>
        <p>
          Recomendações a partir das suas avaliações e das atividades da turma.
        </p>
        <div className="cards">
          {resources.map((r) => {
            const index = contents.indexOf(r.content);
            return (
              <div key={r.id}>
                <p className="resource-reason">
                  {metric.subjects[index] !== null && metric.subjects[index] < 7
                    ? `Revisar ${r.content}: sua média neste conteúdo é ${number(metric.subjects[index])}.`
                    : own.some((a) => a.resourceIds.includes(r.id))
                      ? "Material de apoio de uma atividade da sua turma."
                      : "Pratique este conteúdo para ampliar suas estratégias."}
                </p>
                <Resource resource={r} />
              </div>
            );
          })}
        </div>
      </section>
    );
  const list = own.filter(
    (a) =>
      (kind === "Todos os formatos" || a.kind === kind) &&
      (filter === "Todas" ||
        (filter === "Pendentes" &&
          a.kind !== "Prova" &&
          !submissionFor(school, a.id, student.id)?.submittedAt) ||
        (filter === "Feitas, sem entrega" &&
          a.kind !== "Prova" &&
          submissionFor(school, a.id, student.id)?.completedAt &&
          !submissionFor(school, a.id, student.id)?.submittedAt) ||
        (filter === "Entregues" &&
          submissionFor(school, a.id, student.id)?.submittedAt) ||
        (filter === "Avaliadas" &&
          submissionFor(school, a.id, student.id)?.score !== null &&
          submissionFor(school, a.id, student.id)?.score !== undefined)),
  );
  return (
    <>
      {page === "Meu painel" && (
        <>
          <AlertsPanel alerts={alerts} onOpen={onOpen} compact />
          <section className="stats">
            <article className="stat">
              <div>Atividades para entregar</div>
              <strong>{pending.length}</strong>
              <small>Da sua turma</small>
            </article>
            <article className="stat">
              <div>Atividades entregues</div>
              <strong>{done.length}</strong>
              <small>Envios confirmados</small>
            </article>
            <article className="stat">
              <div>Média do bimestre</div>
              <strong>{number(metric.average)}</strong>
              <small>Somente notas registradas</small>
            </article>
            <article className="stat">
              <div>Sua turma</div>
              <strong>{student.classroom}</strong>
              <small>Matemática · 2026</small>
            </article>
          </section>
          <PerformanceChart grades={school.grades} studentIds={[student.id]} />
        </>
      )}
      <div className="section-actions">
        <div>
          <h2>Minha agenda de aprendizagem</h2>
          <p>Organize o que precisa fazer, estudar e entregar.</p>
        </div>
      </div>
      <div className="assignment-filters">
        <label>
          Formato da atividade
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            {["Todos os formatos", ...kinds].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <label>
          Situação da atividade
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            {[
              "Todas",
              "Pendentes",
              "Feitas, sem entrega",
              "Entregues",
              "Avaliadas",
            ].map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="cards">
        {list.map((a) => {
          const sub = submissionFor(school, a.id, student.id);
          return (
            <article className="panel assessment" key={a.id}>
              <ClipboardList />
              <span className="badge blue">{a.kind}</span>
              <h2>{a.title}</h2>
              <p>
                {a.content} · {student.classroom}
              </p>
              <p className="due-date">{dateTime(a.dueAt)}</p>
              <span
                className={"badge " + (sub?.submittedAt ? "green" : "amber")}
              >
                {sub?.score !== null && sub?.score !== undefined
                  ? `Nota: ${number(sub.score)}`
                  : sub?.submittedAt
                    ? "Entregue"
                    : sub?.completedAt
                      ? a.kind === "Prova"
                        ? "Preparação concluída"
                        : "Feita · falta entregar"
                      : deadlineLabel(a, now)}
              </span>
              <div>
                <button
                  className="button secondary"
                  onClick={() => onOpen(a.id)}
                >
                  Abrir atividade
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {!list.length && (
        <section className="panel empty">
          Nenhuma atividade corresponde aos filtros.
        </section>
      )}
    </>
  );
}
