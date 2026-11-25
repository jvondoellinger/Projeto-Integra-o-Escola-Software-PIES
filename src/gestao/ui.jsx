import React, {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { X } from "lucide-react";

export const ActionFeedback = createContext(null);
const ActionSubmission = createContext(null);

export function ActionDialog({
  title,
  trigger,
  triggerClass = "school-primary",
  open,
  onDismiss,
  className = "",
  children,
}) {
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const ref = useRef(null);
  const heading = useRef(null);
  const errorRegion = useRef(null);
  const id = useId();
  const feedback = useContext(ActionFeedback);
  const active = open ?? visible;
  const clearError = feedback?.clearError;

  useEffect(() => {
    const dialog = ref.current;
    if (!active || !dialog) return;
    clearError?.();
    const opener = document.activeElement;
    dialog.showModal();
    heading.current.focus();
    return () => {
      dialog.close();
      if (opener instanceof HTMLElement && opener.isConnected)
        opener.focus({ preventScroll: true });
    };
  }, [active, clearError]);

  useEffect(() => {
    if (active && feedback?.error && !pending) errorRegion.current?.focus();
  }, [active, feedback?.error, pending]);

  function dismiss() {
    clearError?.();
    setVisible(false);
    onDismiss?.();
  }

  async function submit(action) {
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    try {
      if ((await action()) === true) dismiss();
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <>
      {trigger && (
        <button
          type="button"
          className={triggerClass}
          aria-haspopup="dialog"
          onClick={() => setVisible(true)}
        >
          {trigger}
        </button>
      )}
      <dialog
        ref={ref}
        className={`school-dialog school-no-print ${className}`}
        aria-labelledby={id}
        aria-busy={pending || undefined}
        onCancel={(event) => {
          event.preventDefault();
          if (!submitting.current) dismiss();
        }}
      >
        {active && (
          <>
            <header className="school-dialog-header">
              <h2 id={id} tabIndex={-1} ref={heading}>
                {title}
              </h2>
              <button
                type="button"
                className="school-dialog-close"
                aria-label="Fechar diálogo"
                onClick={dismiss}
                disabled={pending}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>
            <div className="school-dialog-body">
              {feedback?.error && (
                <div
                  ref={errorRegion}
                  role="alert"
                  tabIndex={-1}
                  className="school-error"
                >
                  {feedback.error}
                </div>
              )}
              <ActionSubmission.Provider value={{ submit, pending, dismiss }}>
                {children}
              </ActionSubmission.Provider>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}

export function ActionForm({
  title,
  trigger,
  triggerClass,
  open,
  onDismiss,
  ...form
}) {
  return (
    <ActionDialog
      title={title}
      trigger={trigger}
      triggerClass={triggerClass}
      open={open}
      onDismiss={onDismiss}
    >
      <Form {...form} />
    </ActionDialog>
  );
}

export const nowDate = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
    new Date(),
  );
const brDate = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Sao_Paulo",
});
export function br(day) {
  if (!day) return "—";
  return day.includes("T")
    ? brDate.format(new Date(day))
    : day.split("-").reverse().join("/");
}
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
  submitActions,
}) {
  const action = useContext(ActionSubmission);
  return (
    <form
      className={"school-form " + className}
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget, e.nativeEvent.submitter);
        const submit = () => onSubmit(Object.fromEntries(form), form);
        if (action) action.submit(submit);
        else submit();
      }}
    >
      {title && <h2>{title}</h2>}
      {action ? (
        <>
          <fieldset className="school-fields" disabled={action.pending}>
            {children}
          </fieldset>
          <div className="school-dialog-actions">
            <button
              type="button"
              className="school-secondary"
              onClick={action.dismiss}
              disabled={action.pending}
            >
              Cancelar
            </button>
            {(submitActions || [{ label: button }]).map(
              ({ label, value, secondary }) => (
                <button
                  key={label}
                  className={secondary ? "school-secondary" : "school-primary"}
                  name={value === undefined ? undefined : "action"}
                  value={value}
                  disabled={action.pending}
                >
                  {label}
                </button>
              ),
            )}
          </div>
        </>
      ) : (
        <>
          <div className="school-fields">{children}</div>
          <button className="school-primary">{button}</button>
        </>
      )}
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

export function RecordCards({
  children,
  empty = "Nenhum registro encontrado.",
  limit = 0,
}) {
  const [page, setPage] = React.useState(0);
  const cards = React.Children.toArray(children);
  const last = limit ? Math.max(0, Math.ceil(cards.length / limit) - 1) : 0;
  const shown = Math.min(page, last);
  if (!cards.length) return <p className="school-empty">{empty}</p>;
  return (
    <>
      <div className="record-grid">
        {limit ? cards.slice(shown * limit, (shown + 1) * limit) : cards}
      </div>
      {last > 0 && (
        <div
          className="school-actions record-pagination"
          aria-label="Páginas de registros"
        >
          <button disabled={shown === 0} onClick={() => setPage(shown - 1)}>
            Anterior
          </button>
          <span aria-live="polite">
            {shown * limit + 1}–{Math.min((shown + 1) * limit, cards.length)} de{" "}
            {cards.length}
          </span>
          <button disabled={shown >= last} onClick={() => setPage(shown + 1)}>
            Próxima
          </button>
        </div>
      )}
    </>
  );
}

export function RecordCard({
  title,
  eyebrow,
  detail,
  icon: Icon,
  tone = "green",
  action,
  onOpen,
  selected = false,
  children,
}) {
  return (
    <article
      className={`record-card tone-${tone}${selected ? " is-selected" : ""}`}
    >
      {Icon && (
        <span className="record-icon">
          <Icon size={21} aria-hidden="true" />
        </span>
      )}
      {eyebrow && <span className="record-eyebrow">{eyebrow}</span>}
      <h3>{title}</h3>
      {detail && <p className="record-detail">{detail}</p>}
      {children}
      {action && (
        <button
          type="button"
          className="record-open"
          onClick={onOpen}
          aria-pressed={selected || undefined}
        >
          {action}
        </button>
      )}
    </article>
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
