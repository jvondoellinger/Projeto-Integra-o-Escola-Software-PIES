import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  CalendarDays,
  ClipboardList,
  BookOpen,
  FolderCheck,
  HeartHandshake,
  Bell,
  ChartNoAxesCombined,
  LogOut,
  Menu,
  ShieldCheck,
  ChevronRight,
  KeyRound,
  School,
} from "lucide-react";
import { Accounts, Enrollment, Classes, Reports, roles } from "./Office.jsx";
import { Diary, Evaluations, Closing, FollowUp } from "./Teaching.jsx";
import { Calendar, Notices, Family, Activities } from "./Community.jsx";
import { Field, Form, Panel, Table, br, nameOf, nowDate } from "./ui.jsx";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/manrope/latin-800.css";
import "../academic.css";
import "./school.css";

const staffRoles = ["secretaria", "coordenacao", "professor"];
const adminRoles = ["secretaria", "coordenacao"];
const familyRoles = ["aluno", "responsavel"];
const navigation = [
  ["inicio", "Visão geral", LayoutDashboard],
  ["matriculas", "Secretaria", Users, ["secretaria"]],
  ["turmas", "Turmas e horários", School, staffRoles],
  ["diario", "Diário de classe", BookOpen, staffRoles],
  ["avaliacoes", "Avaliações", ClipboardList, staffRoles],
  ["fechamento", "Fechamento e boletins", FolderCheck, staffRoles],
  ["apoio", "Acompanhamento", HeartHandshake, staffRoles],
  ["familia", "Boletins e frequência", ChartNoAxesCombined, familyRoles],
  ["atividades", "Minhas atividades", ClipboardList, ["aluno"]],
  ["agenda", "Calendário", CalendarDays, [...staffRoles, ...familyRoles]],
  ["comunicados", "Comunicados", Bell, [...staffRoles, ...familyRoles]],
  ["relatorios", "Relatórios e Censo", ChartNoAxesCombined, adminRoles],
  ["contas", "Contas e permissões", ShieldCheck, ["secretaria"]],
  ["config", "Minha conta", KeyRound],
];
const headings = {
  inicio: "Operação escolar",
  matriculas: "Secretaria e matrículas",
  diario: "Diário de classe",
  fechamento: "Fechamento e boletins",
  familia: "Boletins e frequência",
};
async function request(path, body) {
  const response = await fetch(
    "/api/" + path,
    body
      ? {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }
      : {},
  );
  const data = await response.json();
  if (!response.ok)
    throw Object.assign(new Error(data.error), { status: response.status });
  return data;
}
const queueKey = (user) => `pies-diario-pendente-${user.id}`;
function queued(user) {
  try {
    return JSON.parse(localStorage.getItem(queueKey(user))) || [];
  } catch {
    return [];
  }
}
function writeQueue(user, items) {
  if (items.length) localStorage.setItem(queueKey(user), JSON.stringify(items));
  else localStorage.removeItem(queueKey(user));
}
function Brand() {
  return (
    <div className="school-brand">
      <span>
        <GraduationCap size={27} />
      </span>
      <strong>
        pies<span>.</span>
      </strong>
    </div>
  );
}
function Login({ onLogin, error }) {
  return (
    <div className="school-login">
      <section className="school-login-brand">
        <Brand />
        <h1>
          Gestão escolar
          <br />
          em um só lugar.
        </h1>
        <p>Da matrícula à chamada, da avaliação ao boletim.</p>
      </section>
      <main className="school-login-form">
        <Form title="Acesse sua escola" button="Entrar" onSubmit={onLogin}>
          <Field
            label="E-mail escolar"
            name="email"
            type="email"
            autoComplete="username"
          />
          <Field
            label="Senha"
            name="password"
            type="password"
            autoComplete="current-password"
          />
        </Form>
        {error && (
          <p className="school-error" role="alert">
            {error}
          </p>
        )}
        <p className="school-caption">
          Use a conta fornecida pela sua instituição. O PIES usa um cookie
          essencial para manter o acesso.
        </p>
      </main>
    </div>
  );
}
function Overview({ state, user, open }) {
  const office = adminRoles.includes(user.role);
  const staff = staffRoles.includes(user.role);
  const today = nowDate();
  if (user.role === "rede")
    return (
      <Panel title="Unidades da rede">
        <Table
          columns={[
            "Unidade",
            "Turmas",
            "Estudantes ativos",
            "Períodos publicados",
            "Acompanhamentos abertos",
          ]}
          rows={state.schools.map((s) => [
            s.id,
            s.name,
            s.classes,
            s.students,
            s.published,
            s.openCases,
          ])}
        />
      </Panel>
    );
  const notifications = state.notifications || [];
  const stats = staff
    ? [
        ["Turmas", state.classes.length, "turmas"],
        [
          "Estudantes ativos",
          new Set(
            state.enrollments.filter((e) => !e.end).map((e) => e.studentId),
          ).size,
          office && user.role === "secretaria" ? "matriculas" : "turmas",
        ],
        ["Aulas registradas", state.lessons.length, "diario"],
        [
          "Acompanhamentos abertos",
          state.cases.filter((c) => c.state !== "Concluído").length,
          "apoio",
        ],
      ]
    : [
        ["Estudantes vinculados", state.students.length, "familia"],
        [
          "Boletins disponíveis",
          state.closures.reduce((n, c) => n + c.rows.length, 0),
          "familia",
        ],
        [
          "Comunicados sem ciência",
          state.notices.filter(
            (n) => !state.receipts.some((r) => r.noticeId === n.id),
          ).length,
          "comunicados",
        ],
      ];
  return (
    <>
      <div className="school-metrics">
        {stats.map(([title, value, id]) => (
          <button key={title} onClick={() => open(id)}>
            <span>{title}</span>
            <strong>{value}</strong>
            <ChevronRight size={18} />
          </button>
        ))}
      </div>
      <Panel
        title="Prazos e ações"
        subtitle="Agenda, entregas, correções e comunicados priorizados para o seu perfil."
      >
        {notifications.length ? (
          <div className="school-notifications">
            {notifications.map((n) => (
              <article key={n.id}>
                <span className="school-pill">{n.label}</span>
                <h3>{n.title}</h3>
                <p>{n.detail}</p>
                <button
                  className="school-secondary"
                  onClick={() => open(n.page)}
                >
                  {n.action}
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="school-empty">Nenhuma ação com prazo próximo.</p>
        )}
      </Panel>
      <Panel title="Próximos compromissos">
        <Table
          columns={["Data", "Compromisso", "Turma"]}
          rows={state.events
            .filter((e) => e.day >= today)
            .sort((a, b) => a.day.localeCompare(b.day))
            .slice(0, 6)
            .map((e) => [
              e.id,
              br(e.day),
              e.title,
              e.classId ? nameOf(state.classes, e.classId) : "Toda a escola",
            ])}
        />
        <button className="school-secondary" onClick={() => open("agenda")}>
          Abrir calendário
        </button>
      </Panel>
    </>
  );
}
function App() {
  const [session, setSession] = useState(null),
    [loading, setLoading] = useState(true),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [page, setPage] = useState(() => location.hash.slice(1) || "inicio"),
    [mobile, setMobile] = useState(false),
    [pending, setPending] = useState(0);
  const syncLock = useRef(false);
  async function load() {
    try {
      const result = await request("workspace");
      setSession(result.user ? result : null);
      setPending(result.user ? queued(result.user).length : 0);
    } catch (e) {
      if (e.status === 401) setSession(null);
      else setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    const route = () => setPage(location.hash.slice(1) || "inicio");
    window.addEventListener("hashchange", route);
    return () => window.removeEventListener("hashchange", route);
  }, []);
  const user = session?.user;
  const state = session?.state;
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      if (navigator.onLine && !syncLock.current) load();
    }, 45000);
    return () => clearInterval(interval);
  }, [user?.id]);
  function open(id) {
    setPage(id);
    location.hash = id;
    setMobile(false);
    setError("");
    setMessage("");
    window.scrollTo(0, 0);
  }
  async function sync() {
    if (!user || syncLock.current || !navigator.onLine) return;
    syncLock.current = true;
    let items = queued(user);
    try {
      while (items.length) {
        const response = await request("command", items[0]);
        setSession((prior) =>
          prior?.user.id === user.id
            ? { ...prior, state: response.state }
            : prior,
        );
        items = items.slice(1);
        writeQueue(user, items);
        setPending(items.length);
      }
    } catch (e) {
      if (e.status) setError(`Chamada aguardando revisão. ${e.message}`);
    } finally {
      syncLock.current = false;
    }
  }
  useEffect(() => {
    if (!user) return;
    window.addEventListener("online", sync);
    sync();
    return () => window.removeEventListener("online", sync);
  }, [user?.id]);
  async function send(kind, data, { offline = false } = {}) {
    setError("");
    setMessage("");
    const command = { kind, data, id: crypto.randomUUID() };
    try {
      let response;
      if (offline && queued(user).length) throw new TypeError("Fila local");
      response = await request("command", command);
      setSession((prior) =>
        prior?.user.id === user.id
          ? { ...prior, state: response.state }
          : prior,
      );
      setMessage("Registro atualizado.");
      return true;
    } catch (e) {
      if (offline && !e.status) {
        try {
          const items = [...queued(user), command];
          writeQueue(user, items);
          setPending(items.length);
          setMessage(
            "Chamada salva neste dispositivo. O envio será retomado ao conectar.",
          );
          return true;
        } catch {
          setError(
            "Armazenamento indisponível. Mantenha a chamada aberta até recuperar a conexão.",
          );
          return false;
        }
      }
      if (e.status === 401) setSession(null);
      setError(e.message);
      return false;
    }
  }
  async function enter(data) {
    setError("");
    try {
      await request("login", data);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }
  async function exit() {
    if (
      pending &&
      !window.confirm(
        "Há chamadas no dispositivo. Sair descarta as chamadas ainda não enviadas. Confirmar?",
      )
    )
      return;
    try {
      await request("logout", {});
      writeQueue(user, []);
      setSession(null);
      open("inicio");
    } catch (e) {
      setError(e.message);
    }
  }
  if (loading)
    return <main className="school-loading">Carregando o PIES…</main>;
  if (!session) return <Login onLogin={enter} error={error} />;
  const staff = staffRoles.includes(user.role),
    office = adminRoles.includes(user.role);
  const allowed = navigation.filter((n) => !n[3] || n[3].includes(user.role));
  const current = allowed.find((n) => n[0] === page) || allowed[0];
  const [id, label] = current;
  const content = {
    inicio: <Overview state={state} user={user} open={open} />,
    matriculas: <Enrollment state={state} send={send} />,
    turmas: <Classes state={state} send={send} office={office} />,
    diario: <Diary state={state} send={send} />,
    avaliacoes: <Evaluations state={state} send={send} />,
    fechamento: <Closing state={state} send={send} office={office} />,
    apoio: <FollowUp state={state} send={send} />,
    familia: <Family state={state} user={user} send={send} />,
    atividades: <Activities state={state} user={user} send={send} />,
    agenda: (
      <Calendar state={state} send={send} staff={staff} office={office} />
    ),
    comunicados: (
      <Notices state={state} send={send} staff={staff} office={office} />
    ),
    relatorios: <Reports state={state} />,
    contas: <Accounts state={state} send={send} user={user} />,
    config: (
      <Panel
        title="Alterar senha"
        subtitle="Depois da alteração, entre novamente com a nova senha."
      >
        <Form
          button="Alterar senha"
          onSubmit={async (d) => {
            try {
              await request("password", d);
              writeQueue(user, []);
              setSession(null);
              setError("");
              open("inicio");
            } catch (e) {
              setError(e.message);
            }
          }}
        >
          <Field
            label="Senha atual"
            name="current"
            type="password"
            autoComplete="current-password"
          />
          <Field
            label="Nova senha"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
          />
        </Form>
        <h3>Dados pessoais</h3>
        <p>
          Procure a secretaria da sua escola para solicitar acesso ou correção
          de registros. Suas permissões são determinadas pela instituição.
        </p>
      </Panel>
    ),
  };
  return (
    <div className="school-shell">
      <a
        className="school-skip"
        href="#conteudo"
        onClick={(e) => {
          e.preventDefault();
          document.querySelector("main").focus();
        }}
      >
        Pular para o conteúdo
      </a>
      <aside className={mobile ? "school-side is-open" : "school-side"}>
        <Brand />
        <p className="school-unit">{state.name || "Gestão de rede"}</p>
        <nav aria-label="Áreas do PIES">
          {allowed.map(([key, name, Icon]) => (
            <button
              className={key === id ? "active" : ""}
              aria-current={key === id ? "page" : undefined}
              key={key}
              onClick={() => open(key)}
            >
              <Icon size={19} />
              {name}
            </button>
          ))}
        </nav>
        <button className="school-exit" onClick={exit}>
          <LogOut size={18} />
          Sair
        </button>
      </aside>
      <div className="school-body">
        <header className="school-top">
          <button
            className="school-menu"
            onClick={() => setMobile(!mobile)}
            aria-expanded={mobile}
            aria-label={mobile ? "Fechar menu" : "Abrir menu"}
          >
            <Menu size={22} />
          </button>
          <span>
            {roles[user.role]} <ChevronRight size={14} /> {label}
          </span>
          <strong>{user.name}</strong>
        </header>
        <main id="conteudo" tabIndex="-1" className="school-main">
          <header className="school-heading">
            <span>{state.name || "PIES · REDE DE ENSINO"}</span>
            <h1>{headings[id] || label}</h1>
          </header>
          {pending > 0 && (
            <div className="school-callout">
              <strong>{pending} chamada(s) aguardando envio</strong>
              <div className="school-actions">
                <button onClick={sync}>Sincronizar chamadas</button>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Descartar as chamadas pendentes neste dispositivo?",
                      )
                    ) {
                      writeQueue(user, []);
                      setPending(0);
                      setError("");
                    }
                  }}
                >
                  Descartar fila local
                </button>
              </div>
            </div>
          )}
          {error && (
            <div role="alert" className="school-error">
              {error}
            </div>
          )}
          {message && (
            <div role="status" className="school-success">
              {message}
            </div>
          )}
          <div key={id}>{content[id]}</div>
          <footer className="school-footer">PIES · Gestão escolar</footer>
        </main>
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
