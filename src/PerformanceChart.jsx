import React, { useState, useId } from "react";
import { months, schoolYear, monthlySeries, mean } from "./learning.js";
import { number, students } from "./data.js";
export default function PerformanceChart({
  grades,
  studentIds,
  title = "Desempenho ao longo do ano",
}) {
  const [active, setActive] = useState(10);
  const id = useId().replaceAll(":", "");
  const series = monthlySeries(grades, studentIds);
  const entries = grades.filter(
    (g) =>
      studentIds.includes(g.studentId) &&
      g.date.startsWith(`${schoolYear}-${String(active + 1).padStart(2, "0")}`),
  );
  const available = series
    .map((v, i) => (v === null ? null : i))
    .filter((i) => i !== null);
  const x = (i) => 45 + i * 57;
  const y = (v) => 215 - v * 18;
  const segments = [];
  series.forEach((v, i) => {
    if (v !== null) {
      if (i === 0 || series[i - 1] === null) segments.push([]);
      segments.at(-1).push(`${x(i)},${y(v)}`);
    }
  });
  const delta =
    available.length > 1
      ? series[available.at(-1)] - series[available[0]]
      : null;
  return (
    <section className="panel performance">
      <div className="section-title">
        <div>
          <h2>{title}</h2>
          <p>Matemática · {schoolYear} · médias das avaliações registradas</p>
        </div>
        <span className="badge blue">Meta: 7,0</span>
      </div>
      <div className="performance-summary">
        <div>
          <strong>
            {number(
              mean(
                grades
                  .filter(
                    (g) =>
                      studentIds.includes(g.studentId) &&
                      g.date.startsWith(String(schoolYear)),
                  )
                  .map((g) => g.score),
              ),
            )}
          </strong>
          <span>Média anual</span>
        </div>
        <div>
          <strong>
            {delta === null ? "—" : `${delta >= 0 ? "+" : ""}${number(delta)}`}
          </strong>
          <span>Primeiro ao último mês avaliado</span>
        </div>
      </div>
      <div
        className="annual-scroll"
        tabIndex="0"
        role="region"
        aria-label="Gráfico anual; role horizontalmente para consultar todos os meses"
      >
        <svg
          viewBox="0 0 720 260"
          role="img"
          aria-labelledby={"chart-title-" + id}
        >
          <title id={"chart-title-" + id}>
            {title}. Escala de zero a dez.{" "}
            {months
              .map(
                (m, i) =>
                  `${m}: ${series[i] === null ? "sem avaliação" : number(series[i])}`,
              )
              .join("; ")}
          </title>
          {[0, 2, 4, 6, 8, 10].map((n) => (
            <g key={n}>
              <line
                x1="40"
                x2="690"
                y1={y(n)}
                y2={y(n)}
                stroke="#dce5dc"
                strokeDasharray="4 4"
              />
              <text x="12" y={y(n) + 5}>
                {n}
              </text>
            </g>
          ))}
          <line
            x1="40"
            x2="690"
            y1={y(7)}
            y2={y(7)}
            stroke="#a57a27"
            strokeDasharray="6 4"
          />
          {segments.map((points, i) => (
            <polyline
              key={i}
              points={points.join(" ")}
              fill="none"
              stroke="#28765c"
              strokeWidth="3"
            />
          ))}
          {series.map((v, i) => (
            <g key={i}>
              <text x={x(i)} y="246" textAnchor="middle">
                {months[i]}
              </text>
              {v !== null && (
                <>
                  <circle
                    cx={x(i)}
                    cy={y(v)}
                    r={active === i ? 7 : 4}
                    fill={active === i ? "#225c49" : "white"}
                    stroke="#225c49"
                    strokeWidth="2"
                  />
                  <text x={x(i)} y={y(v) - 14} textAnchor="middle">
                    {number(v)}
                  </text>
                </>
              )}
            </g>
          ))}
        </svg>
      </div>
      <div
        className="month-controls"
        aria-label="Consultar resultados de um mês"
      >
        {months.map((m, i) => (
          <button
            key={m}
            className={active === i ? "active" : ""}
            aria-pressed={active === i}
            onClick={() => setActive(i)}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="month-detail" aria-live="polite">
        <strong>
          {months[active]} de {schoolYear}:{" "}
          {series[active] === null
            ? "sem avaliações registradas"
            : `média ${number(series[active])}`}
        </strong>
        <p>
          {entries.length
            ? `${entries.length} resultado(s) usado(s) na média. Selecione outro mês para comparar.`
            : "Meses sem avaliação não são contados como nota zero."}
        </p>
      </div>
      <details>
        <summary>Consultar avaliações que compõem o gráfico</summary>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                {studentIds.length > 1 && <th>Aluno</th>}
                <th>Avaliação</th>
                <th>Nota</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((g) => (
                <tr key={g.id}>
                  <td>
                    {new Date(g.date + "T12:00:00").toLocaleDateString("pt-BR")}
                  </td>
                  {studentIds.length > 1 && (
                    <td>{students.find((s) => s.id === g.studentId)?.name}</td>
                  )}
                  <td>{g.title}</td>
                  <td>{number(g.score)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!entries.length && (
            <p className="empty">Nenhuma avaliação neste mês.</p>
          )}
        </div>
      </details>
    </section>
  );
}
