import nodemailer from "nodemailer";
import { db, loadSchool, publicUser, today } from "./store.mjs";
import { readWorkspace, scopedExtras } from "./school.mjs";

import { notifications } from "./notification-model.mjs";
export { notifications };

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
