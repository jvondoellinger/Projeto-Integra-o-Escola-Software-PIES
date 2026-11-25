import SchoolFeed from "./SchoolFeed.jsx";
import ContextRail from "./ContextRail.jsx";
import MobileNavigation from "./MobileNavigation.jsx";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
  ShieldCheck,
  ChevronRight,
  KeyRound,
  School,
} from "lucide-react";
import { Accounts, Enrollment, Classes, Reports, roles } from "./Office.jsx";
import { Diary, Evaluations, Closing, FollowUp } from "./Teaching.jsx";
import { Calendar, Notices, Family, Activities } from "./Community.jsx";
import { ActionFeedback, ActionForm, Field, Form, Panel } from "./ui.jsx";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/manrope/latin-800.css";
import "../academic.css";
import "./school.css";
import "./feed.css";

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
const isPagesPreview = import.meta.env.MODE === "pages";
async function request(path, body) {
  if (import.meta.env.MODE === "pages")
    return (await import("./pagesRequest.js")).pagesRequest(path, body);
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
        PIES<span>.</span>
      </strong>
    </div>
  );
}
function Login({ onLogin, error, profiles }) {
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
        {isPagesPreview ? (
          <div className="pages-welcome">
            <h2>Explore o PIES</h2>
            <p>
              Escolha um perfil para navegar pela escola de exemplo. Alterações
              ficam neste navegador.
            </p>
          </div>
        ) : (
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
              optional={profiles.length > 0}
            />
          </Form>
        )}
        {profiles.length > 0 && (
          <section
            aria-labelledby="quick-access"
            className="school-quick-access"
          >
            <h3 id="quick-access">Escolha um perfil</h3>
            <p className="school-caption">
              {isPagesPreview
                ? "Escolha a área escolar que deseja explorar."
                : "Entre direto ou use o e-mail do perfil com qualquer senha."}
            </p>
            <div className="school-actions">
              {profiles.map((profile) => (
                <button
                  key={profile.email}
                  type="button"
                  onClick={() =>
                    onLogin({ email: profile.email, password: "" })
                  }
                >
                  {profile.label}
                </button>
              ))}
            </div>
          </section>
        )}
        {error && (
          <p className="school-error" role="alert">
            {error}
          </p>
        )}
        <p className="school-caption">
          {!isPagesPreview && (
            <>
              {!profiles.length &&
                "Use a conta fornecida pela sua instituição. "}
              O PIES usa um cookie essencial para manter o acesso.
            </>
          )}
        </p>
      </main>
    </div>
  );
}
function schoolRoute() {
  const [page, query] = location.hash.slice(1).split("?");
  return {
    page: page || "inicio",
    detail: new URLSearchParams(query).get("detail"),
  };
}
function App() {
  const [session, setSession] = useState(null),
    [loading, setLoading] = useState(true),
    [profiles, setProfiles] = useState([]),
    [routeDetail, setRouteDetail] = useState(() => schoolRoute().detail),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [page, setPage] = useState(() => schoolRoute().page),
    [pending, setPending] = useState(0),
    [focusedStudent, setFocusedStudent] = useState(null);
  const syncLock = useRef(false);
  async function load() {
    try {
      const result = await request("workspace");
      setSession(result.user ? result : null);
      if (result.profiles) setProfiles(result.profiles);
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
    const route = () => {
      const next = schoolRoute();
      setPage(next.page);
      setRouteDetail(next.detail);
    };
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
  function open(id, detail = null) {
    setRouteDetail(detail);
    setPage(id);
    location.hash = detail ? `${id}?detail=${encodeURIComponent(detail)}` : id;
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
    try {
      await request("logout", {});
      writeQueue(user, []);
      setSession(null);
      open("inicio");
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }
  const clearError = useCallback(() => setError(""), []);
  if (loading)
    return <main className="school-loading">Carregando o PIES…</main>;
  if (!session)
    return <Login onLogin={enter} error={error} profiles={profiles} />;
  const staff = staffRoles.includes(user.role),
    office = adminRoles.includes(user.role);
  const allowed = navigation.filter((n) => !n[3] || n[3].includes(user.role));
  const current = allowed.find((n) => n[0] === page) || allowed[0];
  const [id, label] = current;
  const initials = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toLocaleUpperCase("pt-BR");
  function exitAction(label, className) {
    return pending ? (
      <ActionForm
        title="Sair com chamadas pendentes?"
        trigger={label}
        triggerClass={className}
        button="Descartar chamadas e sair"
        onSubmit={exit}
      >
        <p>
          As chamadas que aguardam envio neste dispositivo serão descartadas.
        </p>
      </ActionForm>
    ) : (
      <button className={className} onClick={exit}>
        {label === "Sair" && <LogOut size={18} />}
        {label}
      </button>
    );
  }
  const content = {
    inicio: <SchoolFeed state={state} user={user} open={open} />,
    matriculas: <Enrollment state={state} send={send} />,
    turmas: <Classes state={state} send={send} office={office} />,
    diario: <Diary state={state} send={send} initialId={routeDetail} />,
    avaliacoes: (
      <Evaluations state={state} send={send} initialId={routeDetail} />
    ),
    fechamento: <Closing state={state} send={send} office={office} />,
    apoio: <FollowUp state={state} send={send} initialId={routeDetail} />,
    familia: (
      <Family
        state={state}
        user={user}
        send={send}
        initialDay={routeDetail}
        onStudentFocus={setFocusedStudent}
      />
    ),
    atividades: (
      <Activities state={state} send={send} initialId={routeDetail} />
    ),
    agenda: (
      <Calendar
        state={state}
        send={send}
        staff={staff}
        office={office}
        open={open}
        student={user.role === "aluno"}
        initialDay={routeDetail}
      />
    ),
    comunicados: (
      <Notices
        state={state}
        send={send}
        staff={staff}
        office={office}
        initialId={routeDetail}
      />
    ),
    relatorios: <Reports state={state} />,
    contas: (
      <Accounts state={state} send={send} user={user} demo={isPagesPreview} />
    ),
    config: isPagesPreview ? (
      <Panel
        title="Perfil em demonstração"
        subtitle="As alterações feitas nesta escola de exemplo são guardadas neste navegador."
      >
        <p>Saia do perfil para explorar outra área.</p>
        {exitAction("Trocar de perfil", "school-secondary")}
      </Panel>
    ) : (
      <Panel title="Segurança da conta">
        <ActionForm
          title="Alterar senha"
          trigger="Alterar senha"
          button="Alterar senha"
          onSubmit={async (d) => {
            try {
              await request("password", d);
              writeQueue(user, []);
              setSession(null);
              setError("");
              open("inicio");
              return true;
            } catch (e) {
              setError(e.message);
              return false;
            }
          }}
        >
          <p>Depois da alteração, entre novamente com a nova senha.</p>
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
        </ActionForm>
        <h3>Dados pessoais</h3>
        <p>
          Procure a secretaria da sua escola para solicitar acesso ou correção
          de registros. Suas permissões são determinadas pela instituição.
        </p>
      </Panel>
    ),
  };
  return (
    <ActionFeedback.Provider value={{ error, clearError }}>
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
        <aside className="school-side">
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
          {exitAction("Sair", "school-exit")}
        </aside>
        <div className="school-body">
          <header className="school-top">
            <div className="school-mobile-brand">
              <Brand />
              <span>{state.name || "Gestão de rede"}</span>
            </div>
            <span>
              {roles[user.role]} <ChevronRight size={14} /> {label}
            </span>
            {isPagesPreview && (
              <span className="school-pill">Demonstração</span>
            )}
            <strong>{user.name}</strong>
            <button
              type="button"
              className="school-mobile-profile"
              aria-label={`Minha conta de ${user.name}`}
              aria-current={id === "config" ? "page" : undefined}
              onClick={() => open("config")}
            >
              {initials}
            </button>
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
                  <ActionForm
                    title="Descartar fila local"
                    trigger="Descartar fila local"
                    triggerClass="school-secondary"
                    button="Descartar chamadas"
                    onSubmit={() => {
                      try {
                        writeQueue(user, []);
                        setPending(0);
                        setError("");
                        return true;
                      } catch (error) {
                        setError(error.message);
                        return false;
                      }
                    }}
                  >
                    <p>
                      Esta ação remove as chamadas pendentes deste dispositivo.
                    </p>
                  </ActionForm>
                </div>
              </div>
            )}
            {error && (
              <div role="alert" className="school-error school-page-error">
                {error}
              </div>
            )}
            {message && (
              <div role="status" className="school-success">
                {message}
              </div>
            )}
            <div key={`${id}:${routeDetail || ""}`}>
              {id === "inicio" || id === "agenda" ? (
                content[id]
              ) : (
                <div className="workspace-feed">
                  <div className="workspace-main">{content[id]}</div>
                  <ContextRail
                    page={id}
                    state={state}
                    user={user}
                    studentId={focusedStudent}
                    open={open}
                  />
                </div>
              )}
            </div>
            <footer className="school-footer">PIES · Gestão escolar</footer>
          </main>
          <MobileNavigation
            areas={allowed}
            current={id}
            role={user.role}
            onNavigate={open}
            exit={exitAction("Sair", "school-secondary")}
          />
        </div>
      </div>
    </ActionFeedback.Provider>
  );
}
createRoot(document.getElementById("root")).render(<App />);
