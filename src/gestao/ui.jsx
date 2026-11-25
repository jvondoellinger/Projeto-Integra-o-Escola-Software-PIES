import React from "react";

export const nowDate = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
    new Date(),
  );
export const br = (day) =>
  day ? day.slice(0, 10).split("-").reverse().join("/") : "—";
export const grade = (value) =>
  value == null
    ? "—"
    : Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
export const opts = (items, label = "name") =>
  items.map((item) => [item.id, item[label]]);
export const nameOf = (items, id) =>
  items.find((x) => x.id === id)?.name || "—";
export function Field({
  label,
  name,
  options,
  value = "",
  type = "text",
  optional = false,
  ...props
}) {
  const shared = { name, required: !optional, defaultValue: value, ...props };
  return (
    <label>
      {label}
      {options ? (
        <select {...shared}>
          {!props.multiple && <option value="">Selecione</option>}
          {options.map((option) => {
            const [id, text] = Array.isArray(option)
              ? option
              : [option, option];
            return (
              <option value={id} key={id}>
                {text}
              </option>
            );
          })}
        </select>
      ) : type === "textarea" ? (
        <textarea rows="3" {...shared} />
      ) : (
        <input type={type} {...shared} />
      )}
    </label>
  );
}
export function Form({
  title,
  onSubmit,
  children,
  button = "Salvar",
  className = "",
}) {
  return (
    <form
      className={"school-form " + className}
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        onSubmit(Object.fromEntries(form), form);
      }}
    >
      {title && <h2>{title}</h2>}
      <div className="school-fields">{children}</div>
      <button className="school-primary">{button}</button>
    </form>
  );
}
export function Panel({ title, subtitle, children, className = "" }) {
  return (
    <section className={"school-panel " + className}>
      {title && <h2>{title}</h2>}
      {subtitle && <p className="school-caption">{subtitle}</p>}
      {children}
    </section>
  );
}
export function Table({
  columns,
  rows,
  empty = "Nenhum registro encontrado.",
}) {
  return rows.length ? (
    <div
      className="school-table"
      tabIndex="0"
      role="region"
      aria-label="Tabela de registros"
    >
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th scope="col" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([key, ...cells]) => (
            <tr key={key}>
              {cells.map((cell, i) => (
                <td key={i}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <p className="school-empty">{empty}</p>
  );
}
export function Print({ label = "Imprimir documento" }) {
  return (
    <button
      className="school-secondary school-no-print"
      onClick={() => window.print()}
    >
      {label}
    </button>
  );
}
export function download(name, columns, rows) {
  const escape = (value) => {
    const s = String(value ?? "");
    return `"${(/^[=+\-@\t\r]/.test(s) ? "'" + s : s).replaceAll('"', '""')}"`;
  };
  const csv = [columns, ...rows]
    .map((r) => r.map(escape).join(";"))
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function parseCsv(text) {
  const rows = [];
  let row = [],
    field = "",
    quoted = false,
    closed = false;
  const input = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else field += char;
      continue;
    }
    if (char === ";" || char === "\n" || char === "\r") {
      row.push(field.trim());
      field = "";
      closed = false;
      if (char !== ";") {
        if (row.some(Boolean)) rows.push(row);
        row = [];
        if (char === "\r" && input[i + 1] === "\n") i++;
      }
      continue;
    }
    if (closed && !/\s/.test(char))
      throw Error("Há caracteres após um campo entre aspas.");
    if (char === '"' && !field.trim()) {
      field = "";
      quoted = true;
    } else field += char;
  }
  if (quoted) throw Error("Há um campo com aspas abertas.");
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  if (rows.shift()?.join(";") !== "nome;matricula;inep")
    throw Error("Use as colunas nome;matricula;inep, nessa ordem.");
  if (
    !rows.length ||
    rows.some((row) => row.length !== 3 || !row[0] || !row[1])
  )
    throw Error("Cada linha precisa ter três colunas, nome e matrícula.");
  return rows.map(([name, registration, inep]) => ({
    name,
    registration,
    inep,
  }));
}
export const roster = (state, classId, day) =>
  state.students.filter((s) =>
    state.enrollments.some(
      (e) =>
        e.studentId === s.id &&
        e.classId === classId &&
        e.start <= day &&
        (!e.end || day < e.end),
    ),
  );
