import PerformanceChart from "./PerformanceChart.jsx";
import React, { useState } from "react";
import {
  Target,
  Lightbulb,
  HeartHandshake,
  Plus,
  Check,
  BookOpen,
  CalendarDays,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";
import { students, initials, number, status } from "./data.js";
export const initialPlans = [
  {
    id: 1,
    studentId: 2,
    title: "Interpretar antes de calcular",
    action:
      "Trabalhar dois problemas por encontro, destacando informações e explicando o raciocínio em voz alta.",
    owner: "Mariana Carvalho",
    date: "2026-12-02",
    state: "Em andamento",
  },
  {
    id: 2,
    studentId: 6,
    title: "Frações com materiais concretos",
    action:
      "Dois encontros semanais com representações visuais e situações do cotidiano.",
    owner: "Mariana Carvalho",
    date: "2026-12-04",
    state: "Em andamento",
  },
  {
    id: 3,
    studentId: 4,
    title: "Leitura guiada de enunciados",
    action:
      "Organizar um roteiro de leitura com palavras-chave e verificar a compreensão.",
    owner: "Mariana Carvalho",
    date: "2026-12-03",
    state: "Planejado",
  },
];
export function readSession(key, fallback) {
  try {
    return JSON.parse(sessionStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
export function writeSession(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function Profile({ student: s, back, grades, plans, setPlans, toast }) {
  const [tab, setTab] = useState("Visão do aluno"),
    [form, setForm] = useState(false),
    [notes, setNotes] = useState(() =>
      readSession("pies-note-" + s.id, s.note),
    );
  const mine = plans.filter((p) => p.studentId === s.id);
  function savePlan(e) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    if (
      !d.get("title").trim() ||
      !d.get("action").trim() ||
      !d.get("owner").trim()
    ) {
      toast("Preencha o objetivo, a ação e o responsável.");
      return;
    }
    setPlans([
      ...plans,
      {
        id: Date.now(),
        studentId: s.id,
        title: d.get("title").trim(),
        action: d.get("action").trim(),
        owner: d.get("owner").trim(),
        date: d.get("date"),
        state: "Planejado",
      },
    ]);
    setForm(false);
    setTab("Plano de apoio");
    toast("Plano adicionado ao acompanhamento desta sessão.");
  }
  return (
    <>
      <button className="text-button" onClick={back}>
        Voltar para a turma
      </button>
      <section className="profile-banner">
        <span className="avatar big">{initials(s.name)}</span>
        <div>
          <h2>{s.name}</h2>
          <p>
            {s.classroom} · Matemática · Mat. 2026
            {String(s.id).padStart(3, "0")}
          </p>
        </div>
        <span
          className={
            "badge " + (status(s) === "Precisa de apoio" ? "amber" : "green")
          }
        >
          {status(s)}
        </span>
        <button className="button" onClick={() => setForm(!form)}>
          <Plus size={17} />
          Novo plano de apoio
        </button>
      </section>
      <div className="tabs" role="tablist" aria-label="Acompanhamento do aluno">
        {["Visão do aluno", "Plano de apoio", "Registros pedagógicos"].map(
          (t) => (
            <button
              role="tab"
              id={"tab-" + t.replaceAll(" ", "-")}
              aria-controls="student-panel"
              tabIndex={tab === t ? 0 : -1}
              onKeyDown={(e) => {
                const tabs = [
                  "Visão do aluno",
                  "Plano de apoio",
                  "Registros pedagógicos",
                ];
                let i = tabs.indexOf(tab);
                if (e.key === "ArrowRight") i = (i + 1) % 3;
                else if (e.key === "ArrowLeft") i = (i + 2) % 3;
                else if (e.key === "Home") i = 0;
                else if (e.key === "End") i = 2;
                else return;
                e.preventDefault();
                setTab(tabs[i]);
                document
                  .getElementById("tab-" + tabs[i].replaceAll(" ", "-"))
                  ?.focus();
              }}
              aria-selected={tab === t}
              key={t}
              onClick={() => setTab(t)}
            >
              {t}
              {t === "Plano de apoio" && ` (${mine.length})`}
            </button>
          ),
        )}
      </div>
      <div
        role="tabpanel"
        id="student-panel"
        aria-labelledby={"tab-" + tab.replaceAll(" ", "-")}
      >
        {form && (
          <section className="panel form-panel">
            <h2>Construir um próximo passo</h2>
            <p>
              Defina uma ação observável e uma data para reavaliar com o aluno.
            </p>
            <form onSubmit={savePlan}>
              <div className="form-grid">
                <label>
                  Objetivo
                  <input
                    name="title"
                    required
                    maxLength={100}
                    placeholder="Ex.: resolver equações com autonomia"
                    pattern=".*\S.*"
                  />
                </label>
                <label>
                  Responsável
                  <input
                    name="owner"
                    required
                    defaultValue="Mariana Carvalho"
                    maxLength={80}
                    pattern=".*\S.*"
                  />
                </label>
                <label className="full">
                  Ação pedagógica
                  <textarea
                    name="action"
                    required
                    maxLength={800}
                    rows={3}
                    placeholder="Descreva o apoio, a frequência e como acompanhar os resultados."
                  />
                </label>
                <label>
                  Data de revisão
                  <input
                    type="date"
                    name="date"
                    required
                    min={new Date().toLocaleDateString("en-CA", {
                      timeZone: "America/Sao_Paulo",
                    })}
                  />
                </label>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setForm(false)}
                >
                  Cancelar
                </button>
                <button className="button">Salvar plano</button>
              </div>
            </form>
          </section>
        )}
        {tab === "Visão do aluno" && (
          <>
            <section className="stats">
              <article className="stat">
                <div>Média atual</div>
                <strong>{number(s.average)}</strong>
                <small>Anterior: {number(s.previous)}</small>
              </article>
              <article className="stat">
                <div>Frequência atual</div>
                <strong>{s.attendance}%</strong>
                <small>Consolidado até novembro</small>
              </article>
              <article className="stat">
                <div>Planos ativos</div>
                <strong>
                  {mine.filter((p) => p.state !== "Concluído").length}
                </strong>
                <small>Apoio com revisão humana</small>
              </article>
              <article className="stat">
                <div>Evolução da média</div>
                <strong>
                  {s.previous === null || s.average === null
                    ? "—"
                    : `${s.average >= s.previous ? "+" : ""}${number(s.average - s.previous)}`}
                </strong>
                <small>Pontos em relação ao período anterior</small>
              </article>
            </section>
            <div className="overview-grid">
              <PerformanceChart grades={grades} studentIds={[s.id]} />
              <section className="panel">
                <h2>Aprendizagem por conteúdo</h2>
                <p className="caption">
                  Consolidado atual das atividades · escala 0 a 10
                </p>
                {[
                  "Números e operações",
                  "Álgebra",
                  "Geometria",
                  "Grandezas e medidas",
                ].map((n, i) => (
                  <div className="skill" key={n}>
                    <div>
                      {n}
                      <strong>{number(s.subjects[i])}</strong>
                    </div>
                    <meter
                      min="0"
                      max="10"
                      value={s.subjects[i]}
                      aria-label={n}
                    />
                  </div>
                ))}
              </section>
            </div>
            <div className="insight-grid">
              <article className="panel insight">
                <Lightbulb />
                <h2>Potencialidades observadas</h2>
                <h3>{s.skill}</h3>
                <p>{s.note}</p>
                <small>
                  Observação pedagógica revisável. A nota não define o potencial
                  do aluno.
                </small>
              </article>
              <article className="panel insight">
                <Target />
                <h2>Onde podemos apoiar</h2>
                <h3>{s.focus}</h3>
                <p>
                  Retomar conceitos com exemplos concretos, oferecer tempo para
                  elaboração e verificar a compreensão durante as atividades.
                </p>
                <small>Confirmar a necessidade em conversa com o aluno.</small>
              </article>
              <article className="panel insight">
                <HeartHandshake />
                <h2>Uma ação possível</h2>
                <h3>Aprender com apoio</h3>
                <p>
                  Combinar um objetivo de curto prazo, realizar encontros de
                  acompanhamento e reconhecer os avanços a cada revisão.
                </p>
                <button className="text-button" onClick={() => setForm(true)}>
                  Criar um plano individual
                </button>
              </article>
            </div>
          </>
        )}
        {tab === "Plano de apoio" && (
          <PlanList
            plans={mine}
            setPlans={setPlans}
            allPlans={plans}
            onSelect={null}
            toast={toast}
          />
        )}
        {tab === "Registros pedagógicos" && (
          <section className="panel form-panel">
            <h2>O que você observou?</h2>
            <p>
              Registre evidências de aprendizagem. Evite dados de saúde,
              informações familiares e outros dados sensíveis.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                toast(
                  writeSession("pies-note-" + s.id, notes)
                    ? "Registro salvo neste navegador durante esta sessão."
                    : "Armazenamento indisponível. Mantenha esta página aberta.",
                );
              }}
            >
              <label>
                Observações pedagógicas
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={1200}
                  required
                  rows={6}
                />
              </label>
              <div className="form-actions">
                <small>
                  {notes.length}/1200 caracteres · armazenamento da sessão
                </small>
                <button className="button">Salvar registro</button>
              </div>
            </form>
          </section>
        )}
      </div>
      <div className="privacy-inline">
        <ShieldCheck size={17} />
        Informações para uso pedagógico. Compartilhe somente o necessário com
        pessoas autorizadas.
      </div>
    </>
  );
}
export function PlanList({
  plans,
  setPlans,
  allPlans = plans,
  onSelect,
  toast,
}) {
  return (
    <div className="plan-list">
      {plans.length === 0 ? (
        <section className="panel empty">
          Nenhum plano registrado. Crie um plano no perfil do aluno.
        </section>
      ) : (
        plans.map((p) => (
          <article className="panel plan" key={p.id}>
            <div className="section-title">
              <span
                className={
                  "badge " + (p.state === "Concluído" ? "green" : "blue")
                }
              >
                {p.state}
              </span>
              <span className="caption">
                Revisão:{" "}
                {new Date(p.date + "T12:00:00").toLocaleDateString("pt-BR")}
              </span>
            </div>
            <h2>{p.title}</h2>
            {onSelect ? (
              <button
                className="text-button"
                onClick={() =>
                  onSelect(students.find((s) => s.id === p.studentId))
                }
              >
                {students.find((s) => s.id === p.studentId)?.name}
              </button>
            ) : (
              <p className="plan-student">
                {students.find((s) => s.id === p.studentId)?.name}
              </p>
            )}
            <p>{p.action}</p>
            <div className="plan-bottom">
              <span>Responsável: {p.owner}</span>
              <button
                className="button secondary"
                onClick={() => {
                  setPlans(
                    allPlans.map((x) =>
                      x.id === p.id
                        ? {
                            ...x,
                            state:
                              x.state === "Concluído"
                                ? "Em andamento"
                                : "Concluído",
                          }
                        : x,
                    ),
                  );
                  toast(
                    p.state === "Concluído"
                      ? "Plano reaberto."
                      : "Plano concluído. Registre os resultados com o aluno.",
                  );
                }}
              >
                <Check size={16} />
                {p.state === "Concluído" ? "Reabrir plano" : "Concluir plano"}
              </button>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
export function Pages({
  page,
  filtered,
  onSelect,
  plans,
  setPlans,
  toast,
  exportReport,
  onClassroom,
  go,
}) {
  const [assessment, setAssessment] = useState(false),
    [assessments, setAssessments] = useState(() =>
      readSession("pies-assessments", [
        {
          title: "Resolução de problemas",
          classroom: "8º ano A",
          date: "2026-11-27",
          content: "Álgebra",
          type: "Atividade formativa",
        },
        {
          title: "Geometria no cotidiano",
          classroom: "8º ano B",
          date: "2026-11-30",
          content: "Geometria",
          type: "Projeto em grupo",
        },
      ]),
    );
  if (page === "Planos de apoio")
    return (
      <PlanList
        plans={plans.filter((p) => filtered.some((s) => s.id === p.studentId))}
        setPlans={setPlans}
        allPlans={plans}
        onSelect={onSelect}
        toast={toast}
      />
    );
  if (page === "Turmas")
    return (
      <section className="cards">
        {["8º ano A", "8º ano B"].map((c) => (
          <article className="panel class-card" key={c}>
            <span className="class-icon">
              <BookOpen />
            </span>
            <span className="badge green">Em acompanhamento</span>
            <h2>{c}</h2>
            <p>Matemática · Ensino Fundamental II</p>
            <div className="class-metrics">
              <div>
                <strong>
                  {students.filter((s) => s.classroom === c).length}
                </strong>
                <small>Alunos</small>
              </div>
              <div>
                <strong>
                  {number(
                    students
                      .filter((s) => s.classroom === c)
                      .reduce((a, s) => a + s.average, 0) /
                      students.filter((s) => s.classroom === c).length,
                  )}
                </strong>
                <small>Média</small>
              </div>
            </div>
            <button
              className="button secondary"
              onClick={() => {
                go("Meus alunos");
                onClassroom(c);
              }}
            >
              Acompanhar turma
            </button>
          </article>
        ))}
      </section>
    );
  if (page === "Avaliações")
    return (
      <>
        <div className="section-actions">
          <p>Planeje atividades que revelem como cada aluno aprende.</p>
          <button className="button" onClick={() => setAssessment(!assessment)}>
            <Plus size={16} />
            Nova avaliação
          </button>
        </div>
        {assessment && (
          <form
            className="panel form-panel"
            onSubmit={(e) => {
              e.preventDefault();
              const d = Object.fromEntries(new FormData(e.currentTarget));
              const next = [...assessments, d];
              setAssessments(next);
              writeSession("pies-assessments", next);
              setAssessment(false);
              toast("Avaliação incluída no planejamento desta sessão.");
            }}
          >
            <h2>Planejar avaliação</h2>
            <div className="form-grid">
              <label>
                Título
                <input name="title" required maxLength={100} />
              </label>
              <label>
                Turma
                <select name="classroom">
                  <option>8º ano A</option>
                  <option>8º ano B</option>
                </select>
              </label>
              <label>
                Data
                <input name="date" type="date" required />
              </label>
              <label>
                Conteúdo
                <input name="content" required maxLength={80} />
              </label>
              <label>
                Formato
                <select name="type">
                  <option>Atividade formativa</option>
                  <option>Projeto em grupo</option>
                  <option>Avaliação individual</option>
                </select>
              </label>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setAssessment(false)}
              >
                Cancelar
              </button>
              <button className="button">Salvar avaliação</button>
            </div>
          </form>
        )}
        <div className="cards">
          {assessments
            .filter((a) => filtered.some((s) => s.classroom === a.classroom))
            .map((a, i) => (
              <article className="panel assessment" key={i}>
                <ClipboardList />
                <span className="badge blue">{a.type}</span>
                <h2>{a.title}</h2>
                <p>
                  {a.classroom} · {a.content}
                </p>
                <div className="assessment-date">
                  <CalendarDays size={17} />
                  {new Date(a.date + "T12:00:00").toLocaleDateString("pt-BR")}
                </div>
              </article>
            ))}
        </div>
      </>
    );
  if (page === "Relatórios")
    return (
      <section className="panel">
        <h2>Informação para orientar o próximo passo</h2>
        <p>
          Exporte os indicadores dos alunos e da turma selecionada. O arquivo
          contém dados educacionais e deve ter acesso restrito.
        </p>
        <div className="cards">
          {["Desempenho da turma", "Alunos que precisam de apoio"].map(
            (t, i) => (
              <article className="mini-card" key={t}>
                <h3>{t}</h3>
                <p>
                  {i
                    ? filtered.filter((s) => status(s) === "Precisa de apoio")
                        .length
                    : filtered.length}{" "}
                  alunos · CSV
                </p>
                <button
                  className="button secondary"
                  onClick={() => exportReport(i === 1)}
                >
                  Exportar CSV
                </button>
              </article>
            ),
          )}
        </div>
      </section>
    );
  return null;
}
