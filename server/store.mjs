import { DatabaseSync } from "node:sqlite";
import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export const roles = [
  "secretaria",
  "professor",
  "coordenacao",
  "rede",
  "aluno",
  "responsavel",
];
const file = process.env.PIES_DB || resolve(".pies/escola.sqlite");
if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
export const db = new DatabaseSync(file);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS schools(id TEXT PRIMARY KEY, network TEXT NOT NULL, name TEXT NOT NULL, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS accounts(id TEXT PRIMARY KEY, school TEXT NOT NULL REFERENCES schools(id), email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL, password TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, account TEXT NOT NULL REFERENCES accounts(id), expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS operations(school TEXT NOT NULL, account TEXT NOT NULL, id TEXT NOT NULL, PRIMARY KEY(school,account,id));`);
export function atomic(fn) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
export function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}
export function insist(condition, message, status) {
  if (!condition) fail(message, status);
}
export const today = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
    new Date(),
  );
const hash = (token) => createHash("sha256").update(token).digest("hex");
function passwordHash(password, salt = randomBytes(16).toString("hex")) {
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function publicUser({ id, school, name, email, role, active }) {
  return { id, school, name, email, role, active: !!active };
}
export function createAccount(school, { email, name, role, password }) {
  email = String(email ?? "")
    .trim()
    .toLowerCase();
  name = String(name ?? "").trim();
  insist(
    typeof password === "string" &&
      password.length >= 12 &&
      password.length <= 128,
    "Use uma senha de 12 a 128 caracteres.",
  );
  insist(
    roles.includes(role) &&
      name.length > 0 &&
      name.length <= 120 &&
      email.length <= 254 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    "Informe nome, e-mail e perfil válidos.",
  );
  insist(
    !db.prepare("SELECT id FROM accounts WHERE email=?").get(email),
    "E-mail já cadastrado.",
    409,
  );
  const id = randomUUID();
  db.prepare(
    "INSERT INTO accounts(id,school,email,name,role,password) VALUES (?,?,?,?,?,?)",
  ).run(id, school, email, name, role, passwordHash(password));
  return id;
}
export function login(email, password, options = {}) {
  insist(
    typeof email === "string" &&
      typeof password === "string" &&
      email.length <= 254 &&
      password.length <= 128,
    "Credenciais inválidas.",
    401,
  );
  const account = db
    .prepare("SELECT * FROM accounts WHERE email=? AND active=1")
    .get(email.trim().toLowerCase());
  const reference =
    account?.password || `00000000000000000000000000000000:${"0".repeat(128)}`;
  const passwordAccepted =
    options.skipPassword === true && account
      ? true
      : timingSafeEqual(
          Buffer.from(passwordHash(password, reference.split(":")[0])),
          Buffer.from(reference),
        );
  insist(account && passwordAccepted, "Credenciais inválidas.", 401);
  const token = randomBytes(32).toString("base64url");
  db.prepare("DELETE FROM sessions WHERE expires<=?").run(Date.now());
  db.prepare("INSERT INTO sessions VALUES (?,?,?)").run(
    hash(token),
    account.id,
    Date.now() + 8 * 3600000,
  );
  return { token, user: publicUser(account) };
}
export function session(token) {
  return (
    token &&
    db
      .prepare(
        "SELECT a.* FROM accounts a JOIN sessions s ON a.id=s.account WHERE s.token=? AND s.expires>? AND a.active=1",
      )
      .get(hash(token), Date.now())
  );
}
export function logout(token) {
  if (token) db.prepare("DELETE FROM sessions WHERE token=?").run(hash(token));
}
export function changePassword(user, password, current) {
  const [salt] = user.password.split(":");
  insist(
    typeof current === "string" &&
      current.length <= 128 &&
      timingSafeEqual(
        Buffer.from(user.password),
        Buffer.from(passwordHash(current, salt)),
      ),
    "Senha atual inválida.",
    403,
  );
  insist(
    typeof password === "string" &&
      password.length >= 12 &&
      password.length <= 128,
    "Use uma senha de 12 a 128 caracteres.",
  );
  atomic(() => {
    db.prepare("UPDATE accounts SET password=? WHERE id=?").run(
      passwordHash(password),
      user.id,
    );
    db.prepare("DELETE FROM sessions WHERE account=?").run(user.id);
  });
}
export function loadSchool(id) {
  const row = db.prepare("SELECT * FROM schools WHERE id=?").get(id);
  insist(row, "Escola não encontrada.", 404);
  return {
    id: row.id,
    name: row.name,
    network: row.network,
    ...JSON.parse(row.data),
  };
}
export function saveSchool({ id, name, network, ...data }) {
  db.prepare("UPDATE schools SET name=?,data=? WHERE id=?").run(
    name,
    JSON.stringify(data),
    id,
  );
}
export function createSchool({
  name,
  network,
  email,
  password,
  year = Number(today().slice(0, 4)),
}) {
  return atomic(() => {
    const id = randomUUID();
    const data = {
      students: [],
      classes: [],
      enrollments: [],
      lessons: [],
      assessments: [],
      grades: [],
      periods: [],
      closures: [],
      events: [],
      cases: [],
      notices: [],
      receipts: [],
      justifications: [],
      audit: [],
      policy: {
        year,
        target: 7,
        attendance: 75,
        preschoolAttendance: 60,
        grading: "weighted",
      },
    };
    db.prepare("INSERT INTO schools VALUES (?,?,?,?)").run(
      id,
      network,
      name,
      JSON.stringify(data),
    );
    createAccount(id, {
      name: "Administração escolar",
      email,
      password,
      role: "secretaria",
    });
    return id;
  });
}
