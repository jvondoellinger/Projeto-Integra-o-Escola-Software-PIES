import React, { useState, useEffect } from "react";
import StudentPortal from "./StudentPortal.jsx";
import AlertsPanel from "./AlertsPanel.jsx";
import { buildAlerts, useSchoolClock } from "./alerts.js";
import Assignments from "./Assignments.jsx";
import { useSchool } from "./school.js";
import PerformanceChart from "./PerformanceChart.jsx";
import { studentMetrics, mean as gradeMean } from "./learning.js";
import { readRoute, pushRoute } from "./routes.js";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  ChartNoAxesCombined,
  Bell,
  Settings,
  Search,
  ChevronRight,
  GraduationCap,
  CalendarDays,
  Download,
  Menu,
  X,
  ShieldCheck,
  Check,
  Lightbulb,
  HeartHandshake,
} from "lucide-react";
import { students, status, initials, number } from "./data.js";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/manrope/latin-800.css";
import "./style.css";
import "./academic.css";
import {
  CookieNotice,
  CookieDialog,
  PrivacyPage,
  readConsent,
  saveConsent,
} from "./privacy.jsx";
import {
  Profile,
  Pages,
  initialPlans,
  readSession,
  writeSession,
} from "./workflows.jsx";

const nav = [
  ["Visão geral", LayoutDashboard],
  ["Meus alunos", Users],
  ["Turmas", BookOpen],
  ["Avaliações", ClipboardList],
  ["Planos de apoio", HeartHandshake],
  ["Relatórios", ChartNoAxesCombined],
];
const studentNav = [
  ["Meu painel", LayoutDashboard],
  ["Minhas atividades", ClipboardList],
  ["Meu desempenho", ChartNoAxesCombined],
  ["Conteúdos de apoio", BookOpen],
  ["Alertas", Bell],
];
function App() {
  const [role, setRole] = useState(() => readRoute().role),
    [actorId, setActorId] = useState(() => readRoute().actorId);
  const actor = students.find((s) => s.id === actorId) || students[0];
  const now = useSchoolClock();
  const navigate = (
    p,
    student = null,
    evaluation = null,
    view = role,
    actorValue = actorId,
  ) => pushRoute(p, student, { evaluation, view, actor: actorValue });

  const {
    school,
    update: updateSchool,
    reset: resetSchool,
  } = useSchool((message) => toast(message));
  const grades = school.grades;
  const [openId, setOpenId] = useState(() => readRoute().evaluation);
  const [page, setPage] = useState(() => readRoute().page),
    [query, setQuery] = useState(""),
    [classroom, setClassroom] = useState("Todas as turmas"),
    [period, setPeriod] = useState("4º bimestre"),
    [selected, setSelected] = useState(() => readRoute().student),
    [menu, setMenu] = useState(false),
    [notice, setNotice] = useState("");
  const [consent, setConsent] = useState(readConsent),
    [cookieOpen, setCookieOpen] = useState(false);
  const [preferences, updatePreferences] = useState(() => {
    try {
      return readConsent()?.functional
        ? JSON.parse(localStorage.getItem("pies-preferences")) || {
            compact: false,
            reducedMotion: false,
          }
        : { compact: false, reducedMotion: false };
    } catch {
      return { compact: false, reducedMotion: false };
    }
  });
  const setPreferences = (value) => {
    updatePreferences(value);
    if (consent?.functional) {
      try {
        localStorage.setItem("pies-preferences", JSON.stringify(value));
      } catch {
        toast("Préférences aplicadas somente nesta sessão.");
      }
    }
  };
  const chooseConsent = (functional) => {
    setConsent(saveConsent(functional));
    setCookieOpen(false);
    if (functional) {
      try {
        localStorage.setItem("pies-preferences", JSON.stringify(preferences));
      } catch {}
    }
  };
  useEffect(() => {
    document.body.classList.toggle("compact", preferences.compact);
    document.body.classList.toggle("reduced-motion", preferences.reducedMotion);
  }, [preferences]);
  useEffect(() => {
    document.title = (selected ? selected.name : page) + " · PIES";
    document.getElementById("main")?.focus();
    window.scrollTo(0, 0);
  }, [page, selected]);
  useEffect(() => {
    const restore = () => {
      const route = readRoute();
      setRole(route.role);
      setActorId(route.actorId);
      setPage(route.page);
      setSelected(route.student);
      setOpenId(route.evaluation);
      setMenu(false);
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  const selectStudent = (student) => {
    setSelected(student);
    navigate(page, student);
  };
  const clearSession = () => {
    if (
      !window.confirm(
        "Limpar os dados escolares deste navegador e restaurar os registros iniciais?",
      )
    )
      return;
    try {
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith("pies-"))
        .forEach((k) => sessionStorage.removeItem(k));
    } catch {}
    updatePlans(initialPlans);
    resetSchool();
    go("Visão geral");
    toast("Dados escolares deste navegador removidos.");
  };
  const [plans, updatePlans] = useState(() =>
    readSession("pies-plans", initialPlans),
  );
  const setPlans = (value) => {
    updatePlans(value);
    writeSession("pies-plans", value);
  };
  const periodIndex = [
    "1º bimestre",
    "2º bimestre",
    "3º bimestre",
    "4º bimestre",
  ].indexOf(period);
  const periodStudents = students.map((s) =>
    studentMetrics(s, grades, periodIndex),
  );
  const filtered = periodStudents.filter(
    (s) =>
      (classroom === "Todas as turmas" || s.classroom === classroom) &&
      s.name.toLowerCase().includes(query.toLowerCase()),
  );
  const go = (p) => {
    navigate(p === "Preferências de cookies" ? "Privacidade" : p);
    setPage(p);
    setSelected(null);
    setOpenId(null);
    setMenu(false);
    setQuery("");
    if (p === "Preferências de cookies") {
      setPage("Privacidade");
      setCookieOpen(true);
    }
  };
  const openAssignment = (id) => {
    const destination = role === "student" ? "Minhas atividades" : "Avaliações";
    setPage(destination);
    setSelected(null);
    setOpenId(id);
    navigate(destination, null, id);
  };
  const changeView = (view, studentId = actorId) => {
    setRole(view);
    setActorId(studentId);
    setSelected(null);
    setOpenId(null);
    setMenu(false);
    const destination = view === "student" ? "Meu painel" : "Visão geral";
    setPage(destination);
    navigate(destination, null, null, view, studentId);
  };
  const alerts = buildAlerts(school, {
    role,
    studentId: actor.id,
    classroom,
    now,
  });
  const toast = (t) => {
    setNotice(t);
    setTimeout(() => setNotice(""), 4500);
  };
  function exportReport(onlySupport = false) {
    const report = selected
      ? [studentMetrics(selected, grades, periodIndex)]
      : onlySupport === true
        ? filtered.filter((s) => status(s) === "Precisa de apoio")
        : filtered;
    const rows = [
      ["Aluno", "Turma", "Média", "Frequência", "Situação", "Período", "Ano"],
      ...report.map((s) => [
        s.name,
        s.classroom,
        number(s.average),
        s.attendance + "%",
        status(s),
        period,
        "2026",
      ]),
    ];
    const blob = new Blob(
      ["\uFEFF" + rows.map((r) => r.join(";")).join("\r\n")],
      { type: "text/csv;charset=utf-8" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "pies-desempenho.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Relatório exportado. Guarde o arquivo em local seguro.");
  }
  const mean = filtered.length
    ? gradeMean(filtered.map((s) => s.average).filter((v) => v !== null))
    : null;
  return (
    <>
      <a className="skip" href="#main">
        Pular para o conteúdo
      </a>
      <aside className={"sidebar " + (menu ? "open" : "")}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("Visão geral");
          }}
        >
          <span className="brand-icon">
            <GraduationCap />
          </span>
          PIES<span className="brand-dot">.</span>
        </a>
        <div className="workspace">
          <span className="school-icon">
            <BookOpen size={19} />
          </span>
          <div>
            Colégio Horizonte
            <small>
              {role === "teacher" ? "Espaço do professor" : "Espaço do aluno"}
            </small>
          </div>
        </div>
        <p className="nav-label">ACOMPANHAMENTO</p>
        <nav>
          {(role === "teacher" ? nav : studentNav).map(([label, Icon]) => (
            <button
              key={label}
              onClick={() => go(label)}
              className={page === label ? "active" : ""}
            >
              <Icon size={20} />
              {label}
              {label === "Planos de apoio" && (
                <span className="count">
                  {plans.filter((p) => p.state !== "Concluído").length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <button
          className="icon-button close-menu"
          aria-label="Fechar menu"
          onClick={() => setMenu(false)}
        >
          <X size={20} />
        </button>
        <div className="sidebar-bottom">
          <div className="support-card">
            <span className="tiny-icon">
              <Lightbulb size={19} />
            </span>
            <strong>Cada trajetória importa.</strong>
            <p>Um olhar atento hoje abre novas possibilidades amanhã.</p>
          </div>
          <button className="nav-bottom" onClick={() => go("Privacidade")}>
            <ShieldCheck size={19} />
            Privacidade e dados
          </button>
          <button className="nav-bottom" onClick={() => go("Configurações")}>
            <Settings size={19} />
            Configurações
          </button>
          <div className="user">
            <span className="avatar teacher">
              {role === "teacher" ? "MC" : initials(actor.name)}
            </span>
            <div>
              <strong>
                {role === "teacher" ? "Mariana Carvalho" : actor.name}
              </strong>
              <small>
                {role === "teacher"
                  ? "Professora · Matemática"
                  : actor.classroom + " · Matemática"}
              </small>
            </div>
          </div>
        </div>
      </aside>
      <div className="shell">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Abrir menu"
            onClick={() => setMenu(!menu)}
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            {role === "teacher" ? "Espaço do professor" : "Espaço do aluno"}{" "}
            <ChevronRight size={14} />
            <strong>{selected ? "Perfil do aluno" : page}</strong>
          </div>
          <div className="top-actions">
            <span className="term">
              <CalendarDays size={16} />
              Ano letivo 2026
            </span>
            <button
              className="icon-button notification"
              aria-label="Ver alertas"
              onClick={() => go("Alertas")}
            >
              <Bell size={20} />
              {alerts.length > 0 && (
                <span className="bell-count">{alerts.length}</span>
              )}
            </button>
            <span className="avatar teacher small">
              {role === "teacher" ? "MC" : initials(actor.name)}
            </span>
          </div>
        </header>
        <main id="main" tabIndex="-1">
          <div className="identity-controls">
            <label>
              Área
              <select
                aria-label="Área"
                value={role}
                onChange={(e) => changeView(e.target.value)}
              >
                <option value="teacher">Professor</option>
                <option value="student">Aluno</option>
              </select>
            </label>
            {role === "student" && (
              <label>
                Aluno
                <select
                  aria-label="Aluno"
                  value={actor.id}
                  onChange={(e) =>
                    changeView("student", Number(e.target.value))
                  }
                >
                  {students.map((s) => (
                    <option value={s.id} key={s.id}>
                      {s.name} · {s.classroom}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <span>
              {role === "teacher"
                ? "Acompanhamento pedagógico e gestão de entregas."
                : actor.name +
                  " · sua agenda, seus resultados e seus próximos passos."}
            </span>
          </div>

          <div className="page-heading">
            <div>
              <div className="eyebrow">PEDAGOGIA COM PROPÓSITO</div>
              <h1>
                {selected
                  ? selected.name
                  : page === "Meu painel"
                    ? "Seu próximo passo começa aqui."
                    : page === "Visão geral"
                      ? "Um olhar para cada aluno."
                      : page}
              </h1>
              <p>
                {role === "student"
                  ? "Organize suas atividades e acompanhe o que você já aprendeu."
                  : selected
                    ? "Aprendizagem, potencialidades e próximos passos."
                    : "Acompanhe trajetórias, reconheça conquistas e transforme o apoio em evolução."}
              </p>
            </div>
            {role === "teacher" &&
            (["Visão geral", "Meus alunos", "Relatórios"].includes(page) ||
              selected) ? (
              <button
                className="button secondary"
                onClick={() => exportReport()}
              >
                <Download size={17} />
                Exportar relatório
              </button>
            ) : null}
          </div>
          {role === "teacher" &&
            !selected &&
            [
              "Visão geral",
              "Meus alunos",
              "Turmas",
              "Avaliações",
              "Planos de apoio",
              "Relatórios",
              "Alertas",
            ].includes(page) && (
              <div className="filters">
                <div className="filter-select">
                  <BookOpen size={17} />
                  <select
                    aria-label="Filtrar turma"
                    value={classroom}
                    onChange={(e) => setClassroom(e.target.value)}
                  >
                    {["Todas as turmas", "8º ano A", "8º ano B"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </div>
                {[
                  "Visão geral",
                  "Meus alunos",
                  "Turmas",
                  "Relatórios",
                ].includes(page) && (
                  <div className="filter-select">
                    <CalendarDays size={17} />
                    <select
                      aria-label="Período"
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                    >
                      {[
                        "4º bimestre",
                        "3º bimestre",
                        "2º bimestre",
                        "1º bimestre",
                      ].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </div>
                )}
                <span className="filter-context">
                  {filtered.length} alunos · Matemática
                </span>
                {[
                  "Visão geral",
                  "Meus alunos",
                  "Turmas",
                  "Relatórios",
                ].includes(page) && (
                  <span className="updated">
                    Resultados de 2026 · Matemática
                  </span>
                )}
              </div>
            )}
          {role === "student" &&
          !["Privacidade", "Termos de uso", "Configurações"].includes(page) ? (
            <StudentPortal
              key={actor.id}
              student={actor}
              school={school}
              update={updateSchool}
              page={page}
              now={now}
              alerts={alerts}
              onOpen={openAssignment}
              openId={openId}
              toast={toast}
            />
          ) : selected ? (
            <Profile
              key={selected.id}
              student={studentMetrics(selected, grades, periodIndex)}
              back={() => go(page)}
              grades={grades}
              plans={plans}
              setPlans={setPlans}
              toast={toast}
            />
          ) : (
            <>
              {["Visão geral", "Alertas"].includes(page) && (
                <AlertsPanel
                  alerts={alerts}
                  onOpen={openAssignment}
                  compact={page === "Visão geral"}
                />
              )}
              {page === "Visão geral" && (
                <>
                  <section className="stats" aria-label="Indicadores da turma">
                    {[
                      [
                        "Alunos acompanhados",
                        filtered.length,
                        Users,
                        `Em ${new Set(filtered.map((s) => s.classroom)).size} turma(s) no período`,
                      ],
                      [
                        "Média da turma",
                        number(mean),
                        ChartNoAxesCombined,
                        "Escala de 0 a 10",
                      ],
                      [
                        "Precisam de apoio",
                        filtered.filter((s) => status(s) === "Precisa de apoio")
                          .length,
                        HeartHandshake,
                        "Uma oportunidade de acolher",
                      ],
                      [
                        "Frequência média",
                        (filtered.length
                          ? Math.round(
                              filtered.reduce((a, s) => a + s.attendance, 0) /
                                filtered.length,
                            )
                          : 0) + "%",
                        CalendarDays,
                        "Consolidado até novembro",
                      ],
                    ].map(([label, value, Icon, sub]) => (
                      <article className="stat" key={label}>
                        <div>
                          {label}
                          <Icon size={19} />
                        </div>
                        <strong>{value}</strong>
                        <small>{sub}</small>
                      </article>
                    ))}
                  </section>
                  <div className="overview-grid">
                    <PerformanceChart
                      grades={grades}
                      studentIds={filtered.map((s) => s.id)}
                      title="Aprendizagem ao longo do ano"
                    />
                    <section className="focus-card">
                      <div className="eyebrow">SEU OLHAR FAZ A DIFERENÇA</div>
                      <span className="focus-art">
                        <HeartHandshake size={58} strokeWidth={1.2} />
                      </span>
                      <h2>
                        Pequenos passos.
                        <br />
                        Novas possibilidades.
                      </h2>
                      <p>
                        {filtered.some((s) => status(s) === "Precisa de apoio")
                          ? "Há alunos que precisam de um acompanhamento mais próximo. Vamos construir o próximo passo?"
                          : "Reconheça os avanços da turma e combine novos desafios de aprendizagem."}
                      </p>
                      <button className="button" onClick={() => go("Alertas")}>
                        Revisar acompanhamento
                        <ChevronRight size={17} />
                      </button>
                    </section>
                  </div>
                </>
              )}
              {["Visão geral", "Meus alunos", "Alertas"].includes(page) ? (
                <section className="panel student-list">
                  <div className="section-title">
                    <div>
                      <h2>
                        {page === "Alertas"
                          ? "Alunos que precisam de atenção"
                          : "Trajetórias da turma"}{" "}
                        <span className="subcount">
                          {
                            filtered.filter(
                              (s) =>
                                page !== "Alertas" ||
                                status(s) === "Precisa de apoio",
                            ).length
                          }
                        </span>
                      </h2>
                      <p>Além da nota, um mundo de possibilidades.</p>
                    </div>
                    <label className="search">
                      <Search size={18} />
                      <input
                        aria-label="Buscar aluno"
                        placeholder="Buscar aluno..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                  </div>
                  <div
                    className="table-wrap"
                    tabIndex="0"
                    role="region"
                    aria-label="Indicadores dos alunos; role horizontalmente para ver todas as colunas"
                  >
                    <table>
                      <thead>
                        <tr>
                          <th>Aluno</th>
                          <th>Turma</th>
                          <th>Média do bimestre</th>
                          <th>Evolução</th>
                          <th>Frequência atual</th>
                          <th>Acompanhamento</th>
                          <th>
                            <span className="sr-only">Ação</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered
                          .filter(
                            (s) =>
                              page !== "Alertas" ||
                              status(s) === "Precisa de apoio",
                          )
                          .map((s) => (
                            <tr key={s.id}>
                              <td>
                                <button
                                  className="student-link"
                                  onClick={() => selectStudent(s)}
                                >
                                  <span className={"avatar color-" + s.id}>
                                    {initials(s.name)}
                                  </span>
                                  <span>
                                    <strong>{s.name}</strong>
                                    <small>
                                      Mat. 2026{String(s.id).padStart(3, "0")}
                                    </small>
                                  </span>
                                </button>
                              </td>
                              <td>{s.classroom}</td>
                              <td>
                                <strong>{number(s.average)}</strong>
                                <span className="muted"> / 10</span>
                              </td>
                              <td>
                                <span
                                  className={
                                    s.average >= s.previous
                                      ? "trend up"
                                      : "trend down"
                                  }
                                >
                                  {s.previous === null || s.average === null
                                    ? "Sem comparação"
                                    : `${s.average >= s.previous ? "↗" : "↘"} ${number(Math.abs(s.average - s.previous))}`}
                                </span>
                              </td>
                              <td>{s.attendance}%</td>
                              <td>
                                <span
                                  className={
                                    "badge " +
                                    (status(s) === "Precisa de apoio"
                                      ? "amber"
                                      : status(s) === "Em acompanhamento"
                                        ? "blue"
                                        : "green")
                                  }
                                >
                                  {status(s)}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="icon-button"
                                  aria-label={"Ver perfil de " + s.name}
                                  onClick={() => selectStudent(s)}
                                >
                                  <ChevronRight size={18} />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {filtered.filter(
                      (s) =>
                        page !== "Alertas" || status(s) === "Precisa de apoio",
                    ).length === 0 && (
                      <div className="empty">
                        Nenhum aluno encontrado. Tente outro nome ou turma.
                      </div>
                    )}
                  </div>
                  <div className="table-footer">
                    Acompanhamento individual, com responsabilidade e cuidado.
                    <span>{filtered.length} alunos</span>
                  </div>
                </section>
              ) : page === "Avaliações" ? (
                <Assignments
                  school={school}
                  update={updateSchool}
                  classroom={classroom}
                  toast={toast}
                  openId={openId}
                  onOpen={openAssignment}
                  now={now}
                />
              ) : ["Privacidade", "Termos de uso", "Configurações"].includes(
                  page,
                ) ? (
                <PrivacyPage
                  key={page}
                  page={page}
                  consent={consent}
                  openPreferences={() => setCookieOpen(true)}
                  toast={toast}
                  preferences={preferences}
                  setPreferences={setPreferences}
                  clearSession={clearSession}
                />
              ) : (
                <Pages
                  page={page}
                  filtered={filtered}
                  onSelect={selectStudent}
                  plans={plans}
                  setPlans={setPlans}
                  toast={toast}
                  exportReport={exportReport}
                  onClassroom={setClassroom}
                  go={go}
                />
              )}
            </>
          )}
          <footer>
            <span>
              <GraduationCap size={16} />
              PIES · Integração que transforma.
            </span>
            <div>
              <button onClick={() => go("Privacidade")}>Privacidade</button>
              <button onClick={() => go("Termos de uso")}>Termos de uso</button>
              <button onClick={() => go("Preferências de cookies")}>
                Cookies
              </button>
            </div>
          </footer>
        </main>
      </div>
      <CookieNotice
        consent={consent}
        onSave={chooseConsent}
        openPreferences={() => setCookieOpen(true)}
        go={go}
      />
      <CookieDialog
        open={cookieOpen}
        onClose={() => setCookieOpen(false)}
        consent={consent}
        onSave={chooseConsent}
      />
      {notice && (
        <div role="status" className="toast">
          <Check size={18} />
          {notice}
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
