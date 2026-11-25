import React, { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  School,
  Sparkles,
} from "lucide-react";
import { Bars, Insights, insightIcons } from "./Insights.jsx";
import { br, nameOf, nowDate } from "./ui.jsx";

const categories = [
  ["all", "Tudo"],
  ["action", "Para fazer"],
  ["calendar", "Agenda"],
  ["notice", "Comunicados"],
];
const weekday = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const dayLabel = (day) => weekday.format(new Date(`${day}T12:00:00Z`));
const count = (number, singular, plural = singular + "s") =>
  `${number.toLocaleString("pt-BR")} ${number === 1 ? singular : plural}`;

export default function SchoolFeed({ state, user, open }) {
  const [filter, setFilter] = useState("all"),
    [limit, setLimit] = useState(10);
  const staff = ["secretaria", "professor", "coordenacao"].includes(user.role);
  const today = nowDate();
  const isNetwork = user.role === "rede";
  const next = useMemo(
    () =>
      [...(state.events || [])]
        .filter((event) => event.day >= today)
        .sort(
          (a, b) =>
            a.day.localeCompare(b.day) ||
            (a.time || "").localeCompare(b.time || ""),
        ),
    [state.events, today],
  );
  const feed = useMemo(() => {
    if (isNetwork)
      return state.schools.map((s) => ({
        key: s.id,
        category: "all",
        label: "Unidade escolar",
        title: s.name,
        detail: `${count(s.students, "estudante")} · ${count(s.classes, "turma e disciplina", "turmas e disciplinas")}`,
        Icon: School,
        tone: "green",
        note: `${count(s.openCases, "acompanhamento aberto", "acompanhamentos abertos")} · ${count(s.published, "período publicado", "períodos publicados")}`,
      }));
    const todo = (state.notifications || [])
      .filter(
        (n) => !n.id.startsWith("comunicado-") && !n.id.startsWith("boletim-"),
      )
      .sort(
        (a, b) =>
          Number(b.label === "Em atraso") - Number(a.label === "Em atraso"),
      );
    const actions = todo.map((n) => ({
      key: n.id,
      category: "action",
      label: n.label,
      title: n.title,
      detail: n.detail,
      Icon: insightIcons[n.page] || Bell,
      tone: n.label === "Em atraso" ? "gold" : "green",
      page: n.page,
      detailId: n.detailId,
      action: n.action,
    }));
    const calendar = next.map((e) => ({
      key: e.id,
      category: "calendar",
      label: br(e.day) + (e.time ? ` · ${e.time}` : ""),
      title: e.title,
      detail: e.classId ? nameOf(state.classes, e.classId) : "Toda a escola",
      Icon: CalendarDays,
      tone: "blue",
      page: "agenda",
      detailId: e.day,
      action: "Ver na agenda",
    }));
    const receipts = new Set((state.receipts || []).map((r) => r.noticeId));
    const notices = [...(state.notices || [])]
      .sort((a, b) => b.day.localeCompare(a.day))
      .map((n) => ({
        key: n.id,
        category: "notice",
        label: br(n.day),
        title: n.title,
        detail: n.body,
        Icon: Bell,
        tone: "violet",
        page: "comunicados",
        detailId: n.id,
        action: "Ler comunicado",
        note: !staff && !receipts.has(n.id) ? "Aguardando ciência" : undefined,
      }));
    const published = (state.closures || [])
      .filter((c) => c.state === "Publicado")
      .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
    const bulletin =
      published[0] && !staff
        ? [
            {
              key: published[0].id + "-boletim",
              category: "notice",
              label: "Boletim disponível",
              title: nameOf(state.periods, published[0].periodId),
              detail: "Consulte as médias, a frequência e as devolutivas.",
              Icon: GraduationCap,
              tone: "violet",
              page: "familia",
              action: "Abrir boletins",
            },
          ]
        : [];
    return Array.from(
      {
        length: Math.max(
          actions.length,
          calendar.length,
          notices.length,
          bulletin.length,
        ),
      },
      (_, i) =>
        [actions[i], calendar[i], notices[i], bulletin[i]].filter(Boolean),
    ).flat();
  }, [state, next, staff, isNetwork]);
  const visible =
    filter === "all" ? feed : feed.filter((item) => item.category === filter);
  const firstName =
    user.name === "Administração escolar"
      ? "Secretaria"
      : user.name.split(" ")[0];
  const stats = isNetwork
    ? [
        [state.schools.length, "unidades"],
        [state.schools.reduce((n, s) => n + s.students, 0), "estudantes"],
      ]
    : staff
      ? [
          [
            new Set(state.classes.map((c) => c.section || c.name)).size,
            "turmas",
            "turmas",
          ],
          [
            new Set(
              state.enrollments.filter((e) => !e.end).map((e) => e.studentId),
            ).size,
            "estudantes",
            user.role === "secretaria" ? "matriculas" : "turmas",
          ],
          [state.lessons.length, "aulas registradas", "diario"],
          [
            state.cases.filter((c) => c.state !== "Concluído").length,
            "acompanhamentos",
            "apoio",
          ],
        ]
      : [
          [state.students.length, "estudantes vinculados", "familia"],
          [
            state.closures.reduce((n, c) => n + c.rows.length, 0),
            "boletins disponíveis",
            "familia",
          ],
          [
            (state.notices || []).filter(
              (n) => !(state.receipts || []).some((r) => r.noticeId === n.id),
            ).length,
            "comunicados sem ciência",
            "comunicados",
          ],
        ];
  return (
    <div className="feed-layout">
      <header className="feed-hero">
        <div>
          <span className="feed-date">
            <CalendarDays size={15} />
            {dayLabel(today)}
          </span>
          <h2>Olá, {firstName}.</h2>
          <p>
            {isNetwork
              ? "Acompanhe suas unidades de ensino."
              : "Veja os próximos passos e as novidades da sua escola."}
          </p>
        </div>
        <div className="feed-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
          <Sparkles size={53} strokeWidth={1.1} />
        </div>
      </header>
      <div className="feed-stat-strip" aria-label="Resumo da escola">
        {stats.map(([value, label, page]) =>
          page ? (
            <button key={label} onClick={() => open(page)}>
              <strong>{value.toLocaleString("pt-BR")}</strong>
              <span>{label}</span>
              <ArrowUpRight size={15} />
            </button>
          ) : (
            <div key={label}>
              <strong>{value.toLocaleString("pt-BR")}</strong>
              <span>{label}</span>
            </div>
          ),
        )}
      </div>
      <div className="feed-columns">
        <section className="feed-main" aria-label="Feed escolar">
          <div className="feed-section-title">
            <div>
              <h2>{isNetwork ? "Unidades da rede" : "Seu feed"}</h2>
              <p>
                {isNetwork
                  ? "Veja os indicadores de cada escola."
                  : "Prioridades, datas e novidades em um só lugar."}
              </p>
            </div>
          </div>
          {!isNetwork && (
            <div className="feed-filters" aria-label="Filtrar feed">
              {categories.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => {
                    setFilter(value);
                    setLimit(10);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {visible.length ? (
            <ol className="feed-list">
              {visible
                .slice(0, limit)
                .map(
                  ({
                    key,
                    Icon,
                    tone,
                    title,
                    label,
                    detail,
                    detailId,
                    note,
                    action,
                    page,
                  }) => (
                    <li key={key}>
                      <span className={`feed-icon feed-tone-${tone}`}>
                        <Icon size={20} />
                      </span>
                      <article>
                        <div className="feed-item-meta">
                          <span>{label}</span>
                          {note && <span className="feed-note">{note}</span>}
                        </div>
                        <h3>{title}</h3>
                        <p>{detail}</p>
                        {page && (
                          <button
                            type="button"
                            className="feed-link"
                            onClick={() => open(page, detailId)}
                          >
                            {action}
                            <ChevronRight size={15} />
                          </button>
                        )}
                      </article>
                    </li>
                  ),
                )}
            </ol>
          ) : (
            <p className="feed-empty">Nenhum registro nesta seleção.</p>
          )}
          {visible.length > limit && (
            <button
              className="school-secondary"
              onClick={() => setLimit(limit + 10)}
            >
              Ver mais atualizações
            </button>
          )}
        </section>
        <aside
          className="feed-side"
          aria-label="Indicadores e próximos compromissos"
        >
          {isNetwork ? (
            <section className="insight-panel">
              <h2>Estudantes por unidade</h2>
              <Bars
                items={state.schools.map((s) => ({
                  label: s.name,
                  value: s.students,
                }))}
              />
            </section>
          ) : (
            <>
              <Insights state={state} variant="attendance" />
              <section className="insight-panel feed-agenda">
                <div className="feed-section-title">
                  <div>
                    <h2>Próximos compromissos</h2>
                    <p>Os próximos itens da sua agenda.</p>
                  </div>
                </div>
                {next.length ? (
                  next.slice(0, 3).map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => open("agenda", e.day)}
                    >
                      <span>{br(e.day).slice(0, 5)}</span>
                      <strong>{e.title}</strong>
                      <ChevronRight size={16} />
                    </button>
                  ))
                ) : (
                  <p className="school-empty">Nenhum compromisso agendado.</p>
                )}
                <button
                  type="button"
                  className="feed-link"
                  onClick={() => open("agenda")}
                >
                  Abrir calendário
                  <ChevronRight size={15} />
                </button>
              </section>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
