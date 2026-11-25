import React, { useId, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpenCheck,
  CalendarCheck,
  ClipboardCheck,
  GraduationCap,
  Users,
} from "lucide-react";
import { br, grade, nowDate } from "./ui.jsx";

const dayOffset = (day, n) =>
  new Date(Date.parse(day) + n * 86400000).toISOString().slice(0, 10);
export function attendanceSeries(lessons, studentId) {
  const last = nowDate();
  const start = dayOffset(last, -27);
  const weeks = Array.from({ length: 4 }, (_, i) => ({
    day: dayOffset(start, i * 7),
    total: 0,
    present: 0,
  }));
  for (const lesson of lessons) {
    if (lesson.day < start || lesson.day > last) continue;
    const week =
      weeks[
        Math.floor((Date.parse(lesson.day) - Date.parse(start)) / 604800000)
      ];
    for (const record of lesson.attendance) {
      if (studentId && record.studentId !== studentId) continue;
      week.total += lesson.minutes;
      if (record.status === "Presente") week.present += lesson.minutes;
    }
  }
  return weeks.map((w) => ({
    label: br(w.day).slice(0, 5),
    value: w.total ? Math.round((w.present / w.total) * 100) : null,
  }));
}
export function Trend({
  points,
  max = 100,
  unit = "%",
  color = "#1a3e85",
  title = "Evolução",
  compact = false,
}) {
  const id = useId();
  const [active, setActive] = useState(null);
  const [curved, setCurved] = useState(true);
  const width = compact ? 330 : 560,
    left = 37,
    right = 16,
    top = 20,
    bottom = 142;
  const x = (i) =>
    left + (i * (width - left - right)) / Math.max(1, points.length - 1);
  const y = (v) => bottom - (v * (bottom - top)) / max;
  const segments = [];
  for (const [i, p] of points.entries()) {
    if (p.value == null) continue;
    if (i === 0 || points[i - 1].value == null) segments.push([]);
    segments.at(-1).push([x(i), y(p.value)]);
  }
  const path = (segment) =>
    segment.reduce((d, [a, b], i) => {
      if (!i) return `M${a},${b}`;
      if (!curved) return `${d} L${a},${b}`;
      const [px, py] = segment[i - 1];
      const mid = (px + a) / 2;
      return `${d} C${mid},${py} ${mid},${b} ${a},${b}`;
    }, "");
  const selected =
    points[active ?? points.findLastIndex((p) => p.value != null)];
  if (!segments.length)
    return (
      <p className="school-empty">Sem registros no período selecionado.</p>
    );
  return (
    <div className="insight-trend">
      <div
        className="insight-periods insight-style"
        aria-label="Traçado do gráfico"
      >
        <button
          type="button"
          aria-pressed={curved}
          onClick={() => setCurved(true)}
        >
          Curvo
        </button>
        <button
          type="button"
          aria-pressed={!curved}
          onClick={() => setCurved(false)}
        >
          Linear
        </button>
      </div>
      <svg
        viewBox={`0 0 ${width} 169`}
        role="img"
        aria-label={
          title +
          " · " +
          points
            .map(
              (p) =>
                `${p.label}: ${p.value == null ? "sem registros" : grade(p.value) + unit}`,
            )
            .join("; ")
        }
      >
        <defs>
          <linearGradient id={id} x2="0%" y2="100%">
            <stop stopColor={color} stopOpacity=".19" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <path
              d={`M${left} ${y(t * max)}H${width - right}`}
              stroke="#dbe0e9"
              strokeDasharray="3 5"
            />
            <text x="0" y={y(t * max) + 4}>
              {t * max}
              {unit}
            </text>
          </g>
        ))}
        {segments.map((s, i) => (
          <g key={i}>
            {s.length > 1 && (
              <path
                d={`${path(s)} L${s.at(-1)[0]},${bottom} L${s[0][0]},${bottom} Z`}
                fill={`url(#${id})`}
              />
            )}
            <path
              d={path(s)}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        ))}
        {points.map((p, i) => (
          <g key={p.label + i}>
            {p.value != null && (
              <circle
                cx={x(i)}
                cy={y(p.value)}
                r={active === i ? 6 : 3.7}
                fill="white"
                stroke={color}
                strokeWidth="2"
              />
            )}
            <text x={x(i)} y="163" textAnchor="middle">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="insight-periods" aria-label="Consultar pontos do gráfico">
        {points.map((p, i) => (
          <button
            type="button"
            key={p.label + i}
            aria-pressed={active === i}
            onClick={() => setActive(i)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="insight-value" aria-live="polite">
        {selected?.label}{" "}
        <strong>
          {selected?.value == null
            ? "Sem registros"
            : `${grade(selected.value)}${unit}`}
        </strong>
      </p>
    </div>
  );
}

export function Bars({ items, max, unit = "" }) {
  const ceiling = max || Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="insight-bars">
      {items.map((i, index) => (
        <li key={i.label}>
          <div>
            <span>{i.label}</span>
            <strong>
              {grade(i.value)}
              {unit}
            </strong>
          </div>
          <span className="insight-track">
            <span
              className={`fill-${index % 4}`}
              style={{ width: `${Math.min(100, (i.value / ceiling) * 100)}%` }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Ring({ values, label }) {
  const total = values.reduce((n, x) => n + x.value, 0);
  const radius = 42;
  const length = 2 * Math.PI * radius;
  let cumulative = 0;
  return (
    <div className="insight-ring">
      <svg
        viewBox="0 0 116 116"
        role="img"
        aria-label={`${label}: ${values.map((x) => `${x.label} ${x.value}`).join(", ")}`}
      >
        <circle
          cx="58"
          cy="58"
          r={radius}
          stroke="#edeef1"
          strokeWidth="13"
          fill="none"
        />
        {total > 0 &&
          values.map((x) => {
            const offset = cumulative;
            cumulative += x.value;
            return (
              <circle
                key={x.label}
                cx="58"
                cy="58"
                r={radius}
                transform="rotate(-90 58 58)"
                fill="none"
                stroke={x.color}
                strokeWidth="13"
                strokeDasharray={`${(x.value / total) * length} ${length}`}
                strokeDashoffset={(-offset / total) * length}
              />
            );
          })}
        <text x="58" y="57" textAnchor="middle" className="ring-number">
          {total.toLocaleString("pt-BR")}
        </text>
        <text x="58" y="75" textAnchor="middle">
          {label}
        </text>
      </svg>
      <ul>
        {values.map((i) => (
          <li key={i.label}>
            <span className="insight-dot" style={{ background: i.color }} />
            <span>{i.label}</span>
            <strong>{i.value.toLocaleString("pt-BR")}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Insights({ state, variant, student }) {
  const values = useMemo(() => {
    if (variant === "attendance")
      return attendanceSeries(state.lessons, student?.id);
    if (variant === "enrollment")
      return state.enrollments.reduce(
        (acc, e) => {
          acc[e.end ? 1 : 0].value++;
          return acc;
        },
        [
          { label: "Vínculos ativos", value: 0, color: "#1a3e85" },
          { label: "Histórico encerrado", value: 0, color: "#a87228" },
        ],
      );
    if (variant === "evaluations") {
      const counts = new Map();
      for (const a of state.assessments) {
        if (!a.archived) counts.set(a.format, (counts.get(a.format) || 0) + 1);
      }
      return [...counts]
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);
    }
    if (variant === "followup")
      return ["Aberto", "Em acompanhamento", "Concluído"].map((label, i) => ({
        label,
        value: state.cases.filter((c) => c.state === label).length,
        color: ["#a87228", "#37699a", "#1a3e85"][i],
      }));
    if (variant === "closing")
      return ["Publicado", "Fechado", "Reaberto"].map((label, i) => ({
        label,
        value: state.closures.filter((c) => c.state === label).length,
        color: ["#1a3e85", "#37699a", "#a87228"][i],
      }));
    return [];
  }, [state, variant, student?.id]);
  const details = {
    attendance: [
      Activity,
      "Frequência nas últimas quatro semanas",
      "Presenças em relação aos minutos de aula registrados.",
    ],
    enrollment: [
      Users,
      "Situação das matrículas",
      "Vínculos por turma e disciplina.",
    ],
    evaluations: [
      ClipboardCheck,
      "Avaliações por formato",
      "Distribuição das avaliações ativas.",
    ],
    followup: [
      BookOpenCheck,
      "Acompanhamentos por etapa",
      "Veja quantos casos avançaram para cada etapa.",
    ],
    closing: [
      GraduationCap,
      "Situação dos fechamentos",
      "Publicações e revisões por turma e período.",
    ],
  };
  const [Icon, title, copy] = details[variant];
  return (
    <section className={`insight-panel insight-${variant}`} aria-label={title}>
      <div className="insight-heading">
        <span>
          <Icon size={20} />
        </span>
        <div>
          <h2>{title}</h2>
          <p>{copy}</p>
        </div>
      </div>
      {variant === "attendance" ? (
        <Trend points={values} title={title} compact />
      ) : variant === "evaluations" ? (
        values.length ? (
          <Bars items={values} />
        ) : (
          <p className="school-empty">Nenhuma avaliação ativa.</p>
        )
      ) : (
        <Ring
          values={values}
          label={
            variant === "enrollment"
              ? "vínculos"
              : variant === "followup"
                ? "casos"
                : "períodos"
          }
        />
      )}
    </section>
  );
}

export const insightIcons = {
  agenda: CalendarCheck,
  avaliacoes: ClipboardCheck,
  atividades: BookOpenCheck,
  familia: GraduationCap,
  apoio: Activity,
  diario: BarChart3,
};
