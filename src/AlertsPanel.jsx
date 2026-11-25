import React from "react";
import { Bell, Clock3, CheckCircle2 } from "lucide-react";
export default function AlertsPanel({ alerts, onOpen, compact = false }) {
  const shown = compact ? alerts.slice(0, 3) : alerts;
  return (
    <section className="panel alerts-panel" aria-label="Lembretes e pendências">
      <div className="section-title">
        <div>
          <h2>
            <Bell size={19} />
            Lembretes e pendências{" "}
            <span className="subcount">{alerts.length}</span>
          </h2>
          <p>
            Atualização automática a cada 30 segundos e ao retornar à página.
          </p>
        </div>
      </div>
      {!alerts.length ? (
        <div className="calm-state">
          <CheckCircle2 size={20} />
          <p>Nenhuma pendência de prazo ou correção agora.</p>
        </div>
      ) : (
        shown.map((alert) => (
          <article className={"deadline-alert " + alert.level} key={alert.id}>
            <Clock3 size={19} />
            <div>
              <h3>{alert.title}</h3>
              <p>{alert.text}</p>
            </div>
            <button
              className="button secondary"
              onClick={() => onOpen(alert.assignmentId)}
            >
              Ver avaliação
            </button>
          </article>
        ))
      )}
      {compact && alerts.length > shown.length && (
        <p className="caption">
          Mais {alerts.length - shown.length} pendência(s) na central de
          alertas.
        </p>
      )}
    </section>
  );
}
