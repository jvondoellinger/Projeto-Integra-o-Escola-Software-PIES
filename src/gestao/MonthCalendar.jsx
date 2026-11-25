import React, { useRef } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { nowDate } from "./ui.jsx";

const calendarDate = (day) => new Date(`${day}T12:00:00Z`);
const format = (options) =>
  new Intl.DateTimeFormat("pt-BR", { ...options, timeZone: "UTC" });
const monthLabel = format({ month: "long", year: "numeric" });
const dayLabel = format({
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const sentenceCase = (value) =>
  value[0].toLocaleUpperCase("pt-BR") + value.slice(1);
export function addDays(day, count) {
  const next = calendarDate(day);
  next.setUTCDate(next.getUTCDate() + count);
  return next.toISOString().slice(0, 10);
}
function startOfMonth(day, step = 0) {
  const next = calendarDate(day.slice(0, 7) + "-01");
  next.setUTCMonth(next.getUTCMonth() + step);
  return next.toISOString().slice(0, 10);
}

export default function MonthCalendar({
  selected,
  onSelect,
  entries,
  compact = false,
}) {
  const grid = useRef(null);
  const monthStart = startOfMonth(selected);
  const nextMonth = startOfMonth(selected, 1);
  const mondayOffset = (calendarDate(monthStart).getUTCDay() + 6) % 7;
  const length =
    Math.ceil((mondayOffset + Number(addDays(nextMonth, -1).slice(-2))) / 7) *
    7;
  const days = Array.from({ length }, (_, i) =>
    addDays(monthStart, i - mondayOffset),
  );
  const today = nowDate();
  const byDay = new Map();
  for (const entry of entries) {
    const items = byDay.get(entry.day) || [];
    items.push(entry);
    byDay.set(entry.day, items);
  }
  const changeDay = (day, focus) => {
    onSelect(day);
    if (focus)
      requestAnimationFrame(() =>
        grid.current?.querySelector(`[data-day="${day}"]`)?.focus(),
      );
  };
  function navigate(event, day) {
    const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const offset = offsets[event.key];
    if (offset === undefined) return;
    event.preventDefault();
    changeDay(addDays(day, offset), true);
  }
  return (
    <section
      className={`month-calendar${compact ? " month-calendar-compact" : ""}`}
      aria-label="Calendário mensal"
    >
      <div className="month-toolbar">
        <h3 aria-live="polite">
          <CalendarDays size={20} />
          {sentenceCase(monthLabel.format(calendarDate(monthStart)))}
        </h3>
        <div className="school-actions">
          <button
            type="button"
            aria-label="Mês anterior"
            onClick={() => changeDay(startOfMonth(selected, -1))}
          >
            <ChevronLeft size={19} />
          </button>
          <button type="button" onClick={() => changeDay(today)}>
            Hoje
          </button>
          <button
            type="button"
            aria-label="Próximo mês"
            onClick={() => changeDay(nextMonth)}
          >
            <ChevronRight size={19} />
          </button>
        </div>
      </div>
      <div className="month-grid" ref={grid}>
        {weekdays.map((day) => (
          <span className="month-weekday" key={day}>
            {day}
          </span>
        ))}
        {days.map((day) => {
          const events = byDay.get(day) || [];
          const current = day.startsWith(monthStart.slice(0, 7));
          return (
            <button
              key={day}
              type="button"
              data-day={day}
              role="button"
              tabIndex={day === selected ? 0 : -1}
              aria-pressed={day === selected}
              aria-current={day === today ? "date" : undefined}
              aria-label={`${dayLabel.format(calendarDate(day))}${events.length ? `, ${events.length} registro${events.length === 1 ? "" : "s"}` : ""}`}
              onClick={() => changeDay(day)}
              onKeyDown={(e) => navigate(e, day)}
              className={current ? "month-day" : "month-day outside"}
            >
              <span className="month-number">{Number(day.slice(-2))}</span>
              {events.length > 0 && (
                <>
                  <span aria-hidden="true" className="month-count">
                    {events.length}
                  </span>
                  {!compact && (
                    <span className="month-day-items" aria-hidden="true">
                      {events.slice(0, 2).map((e) => (
                        <span
                          className={"month-chip " + (e.color || "green")}
                          title={e.title}
                          key={e.id}
                        >
                          {e.time ? `${e.time} ` : ""}
                          {e.title}
                        </span>
                      ))}
                      {events.length > 2 && (
                        <span className="month-extra">
                          +{events.length - 2} registros
                        </span>
                      )}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function titleForDay(day) {
  return sentenceCase(dayLabel.format(calendarDate(day)));
}
