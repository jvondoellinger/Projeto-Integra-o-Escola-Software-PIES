import React, { useState, useEffect } from "react";
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
  ArrowUpRight,
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
function App() {
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
      setPage(route.page);
      setSelected(route.student);
      setMenu(false);
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  const selectStudent = (student) => {
    setSelected(student);
    pushRoute(page, student);
  };
  const clearSession = () => {
    if (
      !window.confirm(
        "Limpar os planos, avaliações e registros desta sessão e restaurar os dados iniciais?",
      )
    )
      return;
    try {
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith("pies-"))
        .forEach((k) => sessionStorage.removeItem(k));
    } catch {}
    updatePlans(initialPlans);
    go("Visão geral");
    toast("Dados de trabalho desta sessão removidos.");
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
  const periodStudents = students.map((s) => ({
    ...s,
    average: periodIndex === 3 ? s.average : s.scores[periodIndex],
    previous: s.scores[Math.max(0, periodIndex - 1)],
  }));
  const filtered = periodStudents.filter(
    (s) =>
      (classroom === "Todas as turmas" || s.classroom === classroom) &&
      s.name.toLowerCase().includes(query.toLowerCase()),
  );
  const go = (p) => {
    pushRoute(p === "Preferências de cookies" ? "Privacidade" : p);
    setPage(p);
    setSelected(null);
    setMenu(false);
    setQuery("");
    if (p === "Preferências de cookies") {
      setPage("Privacidade");
      setCookieOpen(true);
    }
  };
  const toast = (t) => {
    setNotice(t);
    setTimeout(() => setNotice(""), 4500);
  };
  function exportReport(onlySupport = false) {
    const report = selected
      ? [selected]
      : onlySupport === true
        ? filtered.filter((s) => status(s) === "Precisa de apoio")
        : filtered;
    const rows = [
      ["Aluno", "Turma", "Média", "Frequência", "Situação"],
      ...report.map((s) => [
        s.name,
        s.classroom,
        number(s.average),
        s.attendance + "%",
        status(s),
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
    ? filtered.reduce((a, s) => a + s.average, 0) / filtered.length
    : 0;
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
          pies<span className="brand-dot">.</span>
        </a>
        <div className="workspace">
          <span className="school-icon">
            <BookOpen size={19} />
          </span>
          <div>
            Colégio Horizonte<small>Espaço do professor</small>
          </div>
        </div>
        <p className="nav-label">ACOMPANHAMENTO</p>
        <nav>
          {nav.map(([label, Icon]) => (
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
            <span className="avatar teacher">MC</span>
            <div>
              <strong>Mariana Carvalho</strong>
              <small>Professora · Matemática</small>
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
            Espaço do professor <ChevronRight size={14} />
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
              <i />
            </button>
            <span className="avatar teacher small">MC</span>
          </div>
        </header>
        <main id="main" tabIndex="-1">
          <div className="page-heading">
            <div>
              <div className="eyebrow">PEDAGOGIA COM PROPÓSITO</div>
              <h1>
                {selected
                  ? selected.name
                  : page === "Visão geral"
                    ? "Um olhar para cada aluno."
                    : page}
              </h1>
              <p>
                {selected
                  ? "Aprendizagem, potencialidades e próximos passos."
                  : "Acompanhe trajetórias, reconheça conquistas e transforme o apoio em evolução."}
              </p>
            </div>
            <button className="button secondary" onClick={() => exportReport()}>
              <Download size={17} />
              Exportar relatório
            </button>
          </div>
          {!selected && (
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
              <span className="filter-context">
                {filtered.length} alunos · Matemática
              </span>
              <span className="updated">Referência: novembro de 2026</span>
            </div>
          )}
          {selected ? (
            <Profile
              key={selected.id}
              student={selected}
              back={() => go(page)}
              Chart={Chart}
              plans={plans}
              setPlans={setPlans}
              toast={toast}
            />
          ) : (
            <>
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
                    <section className="panel evolution">
                      <div className="section-title">
                        <div>
                          <h2>Aprendizagem em movimento</h2>
                          <p>Evolução da média · Matemática</p>
                        </div>
                        <span className="badge green">
                          <ArrowUpRight size={14} />
                          Progresso contínuo
                        </span>
                      </div>
                      <Chart
                        values={[0, 1, 2, 3, 4].map((i) =>
                          filtered.length
                            ? filtered.reduce((a, s) => a + s.scores[i], 0) /
                              filtered.length
                            : 0,
                        )}
                        id="class"
                      />
                      <div className="chart-legend">
                        <i />
                        Média das turmas <span>Histórico até novembro</span>
                      </div>
                    </section>
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
                          <th>Média atual</th>
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
                                  {s.average >= s.previous ? "↗" : "↘"}{" "}
                                  {number(Math.abs(s.average - s.previous))}
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
function Chart({ values, id }) {
  const points = values
    .map((v, i) => `${45 + i * 135},${190 - v * 16}`)
    .join(" ");
  return (
    <div className="chart">
      <svg
        role="img"
        aria-label={"Evolução das médias: " + values.map(number).join(", ")}
        viewBox="0 0 625 235"
      >
        <defs>
          <linearGradient id={"fill-" + id} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#3c927c" stopOpacity=".18" />
            <stop offset="1" stopColor="#3c927c" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[4, 6, 8, 10].map((n) => (
          <g key={n}>
            <line
              x1="38"
              x2="600"
              y1={190 - n * 16}
              y2={190 - n * 16}
              stroke="#e9eeeb"
              strokeDasharray="4 5"
            />
            <text x="8" y={195 - n * 16}>
              {n}
            </text>
          </g>
        ))}
        <polygon
          points={`45,195 ${points} 585,195`}
          fill={`url(#fill-${id})`}
        />
        <polyline
          points={points}
          fill="none"
          stroke="#297a65"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {values.map((v, i) => (
          <g key={i}>
            <circle
              cx={45 + i * 135}
              cy={190 - v * 16}
              r="4"
              fill="white"
              stroke="#297a65"
              strokeWidth="2"
            />
            <text x={45 + i * 135} y="225" textAnchor="middle">
              {["JUL", "AGO", "SET", "OUT", "NOV"][i]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
