import nodemailer from "nodemailer";
import { db, loadSchool, publicUser, today } from "./store.mjs";
import { readWorkspace, scopedExtras } from "./school.mjs";

const staffRoles = ["secretaria", "coordenacao", "professor"];
const delta = (a, b) => Math.round((Date.parse(a) - Date.parse(b)) / 86400000);
export function notifications(user, state, day = today()) {
  if (user.role === "rede") return [];
  const staff = staffRoles.includes(user.role);
  const output = [];
  for (const a of state.assessments) {
    if (a.published > day || a.archived) continue;
    const days = delta(a.day, day);
    const ids = state.enrollments
      .filter(
        (e) =>
          e.classId === a.classId &&
          e.start <= a.day &&
          (!e.end || e.end > a.day),
      )
      .map((e) => e.studentId);
    if (!ids.length) continue;
    const done = new Set(
      state.submissions
        .filter((s) => s.assessmentId === a.id && s.submitted)
        .map((s) => s.studentId),
    );
    const corrected = new Set(
      (state.grades || state.results || [])
        .filter((g) => g.assessmentId === a.id)
        .map((g) => g.studentId),
    );
    const exam = a.format === "Prova";
    const missing = ids.filter(
      (id) => !done.has(id) && !corrected.has(id),
    ).length;
    if (
      user.role !== "responsavel" &&
      days <= (a.reminderDays || 3) &&
      (exam ? days >= 0 : missing > 0)
    ) {
      const label =
        days < 0
          ? "Em atraso"
          : days === 0
            ? "Prazo hoje"
            : `Em ${days} dia${days === 1 ? "" : "s"}`;
      output.push({
        id: `prazo-${a.id}-${a.day}-${days < 0 ? "atraso" : "proximo"}`,
        title: a.title,
        label,
        detail: exam
          ? "Confira o dia da prova."
          : staff
            ? `${missing} entrega(s) aguardada(s).`
            : "Confira as orientações e o prazo de entrega.",
        page: staff ? "avaliacoes" : "atividades",
        action: "Consultar avaliações",
        external: true,
      });
    }
    const pending = ids.filter(
      (id) => !corrected.has(id) && (done.has(id) || (exam && days < 0)),
    ).length;
    if (staff && pending)
      output.push({
        id: `corrigir-${a.id}`,
        title: a.title,
        label: "Correção",
        detail: `${pending} avaliação(ões) para corrigir.`,
        page: "avaliacoes",
        action: "Acompanhar correções",
      });
  }
  if (staff) {
    for (const c of state.cases.filter(
      (c) => c.state !== "Concluído" && delta(c.due, day) <= 3,
    ))
      output.push({
        id: "caso-" + c.id + "-" + c.due,
        title: c.title,
        label: "Revisão pedagógica",
        detail: `Revisão com ${c.ownerName}.`,
        page: "apoio",
        action: "Revisar acompanhamento",
        external: c.owner === user.id,
      });
    for (const j of state.justifications.filter((j) => j.state === "Pendente"))
      output.push({
        id: "falta-" + j.id,
        title: "Justificativa de falta",
        label: "Frequência",
        detail: "Uma justificativa aguarda análise.",
        page: "diario",
        action: "Analisar solicitação",
      });
  } else {
    for (const c of state.closures)
      output.push({
        id: "boletim-" + c.id + "-" + c.publishedAt,
        title: "Boletim disponível",
        label: "Resultados",
        detail: "Consulte os resultados publicados pela escola.",
        page: "familia",
        action: "Consultar boletins",
        external: true,
      });
    for (const n of state.notices.filter(
      (n) => !state.receipts.some((r) => r.noticeId === n.id),
    ))
      output.push({
        id: "comunicado-" + n.id,
        title: n.title,
        label: "Comunicado",
        detail: "A escola aguarda sua confirmação de ciência.",
        page: "comunicados",
        action: "Ler comunicado",
        external: true,
      });
  }
  return output;
}

db.exec(
  `CREATE TABLE IF NOT EXISTS mail_outbox(id TEXT PRIMARY KEY, account TEXT NOT NULL REFERENCES accounts(id), state TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0, retry INTEGER NOT NULL DEFAULT 0);`,
);
export function startMailWorker() {
  if (
    !process.env.PIES_SMTP_URL ||
    !process.env.PIES_MAIL_FROM ||
    !process.env.PIES_PUBLIC_URL
  )
    return;
  const transport = nodemailer.createTransport(process.env.PIES_SMTP_URL, {
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  const link = new URL(process.env.PIES_PUBLIC_URL);
  if (link.protocol !== "https:")
    throw Error("PIES_PUBLIC_URL deve usar HTTPS para notificar por e-mail.");
  let running = false;
  async function run() {
    if (running) return;
    running = true;
    try {
      const day = today();
      const accounts = db
        .prepare("SELECT * FROM accounts WHERE active=1")
        .all();
      for (const raw of accounts) {
        const user = publicUser(raw);
        if (user.role === "rede") continue;
        const school = loadSchool(user.school);
        const state = scopedExtras(user, readWorkspace(user));
        const active = notifications(user, state, day).filter(
          (x) => x.external,
        );
        const keyPrefix = `${user.id}:`;
        const keys = new Set(active.map((n) => keyPrefix + n.id));
        for (const n of active)
          db.prepare(
            "INSERT OR IGNORE INTO mail_outbox(id,account) VALUES (?,?)",
          ).run(keyPrefix + n.id, user.id);
        for (const record of db
          .prepare(
            "SELECT * FROM mail_outbox WHERE account=? AND state='pending' AND retry<=? LIMIT 10",
          )
          .all(user.id, Date.now())) {
          if (!keys.has(record.id)) {
            db.prepare(
              "DELETE FROM mail_outbox WHERE id=? AND state='pending'",
            ).run(record.id);
            continue;
          }
          const claimed = db
            .prepare(
              "UPDATE mail_outbox SET retry=?,attempts=attempts+1 WHERE id=? AND state='pending' AND retry<=?",
            )
            .run(Date.now() + 300000, record.id, Date.now());
          if (!claimed.changes) continue;
          try {
            await transport.sendMail({
              from: process.env.PIES_MAIL_FROM,
              to: user.email,
              subject: "PIES | Atualização na sua área escolar",
              text: `Acesse o PIES com sua conta escolar para consultar uma atualização de ${school.name}: ${link.href}`,
              disableFileAccess: true,
              disableUrlAccess: true,
            });
            db.prepare("UPDATE mail_outbox SET state='sent' WHERE id=?").run(
              record.id,
            );
          } catch {
            db.prepare("UPDATE mail_outbox SET retry=? WHERE id=?").run(
              Date.now() +
                Math.min(3600000, 60000 * 2 ** Math.min(record.attempts, 6)),
              record.id,
            );
          }
        }
      }
    } catch (e) {
      console.error("Falha ao processar fila de notificações.", e.message);
    } finally {
      running = false;
    }
  }
  const timer = setInterval(run, 60000);
  timer.unref();
  void run();
}
