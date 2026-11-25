import initSqlJs from "sql.js";
import wasmURL from "sql.js/dist/sql-wasm.wasm?url";
import { schoolSchema } from "../../server/schema.mjs";

let sql;
export const db = {
  exec: (statement) => sql.run(statement),
  prepare(statement) {
    const read = (args, first) => {
      const query = sql.prepare(statement);
      try {
        query.bind(args);
        if (first) return query.step() ? query.getAsObject() : undefined;
        const rows = [];
        while (query.step()) rows.push(query.getAsObject());
        return rows;
      } finally {
        query.free();
      }
    };
    return {
      run: (...args) => sql.run(statement, args),
      get: (...args) => read(args, true),
      all: (...args) => read(args, false),
    };
  },
};
const roles = [
  "secretaria",
  "professor",
  "coordenacao",
  "rede",
  "aluno",
  "responsavel",
];
export const today = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
    new Date(),
  );
export function insist(condition, message, status = 400) {
  if (!condition) throw Object.assign(new Error(message), { status });
}
export function atomic(task) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const data = task();
    db.exec("COMMIT");
    return data;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
export function publicUser({ id, school, name, email, role, active }) {
  return { id, school, name, email, role, active: !!active };
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
export function createAccount(school, { email, name, role }) {
  const address = typeof email === "string" ? email.trim().toLowerCase() : "";
  const displayName = typeof name === "string" ? name.trim() : "";
  insist(
    roles.includes(role) &&
      displayName.length > 0 &&
      displayName.length <= 120 &&
      address.length <= 254 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address),
    "Informe nome, e-mail e perfil válidos.",
  );
  insist(
    !db.prepare("SELECT id FROM accounts WHERE email=?").get(address),
    "E-mail já cadastrado.",
    409,
  );
  const id = crypto.randomUUID();
  db.prepare(
    "INSERT INTO accounts(id,school,email,name,role,password) VALUES (?,?,?,?,?,?)",
  ).run(id, school, address, displayName, role, "");
  return id;
}
function openLocalDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("pies-pages-escola", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("snapshots");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
let localDb;
async function localSnapshot() {
  localDb = await openLocalDb();
  return new Promise((resolve, reject) => {
    const tx = localDb.transaction("snapshots");
    const get = tx.objectStore("snapshots").get("sqlite-v1");
    get.onsuccess = () => resolve(get.result);
    get.onerror = () => reject(get.error);
  });
}
export async function persist() {
  if (!localDb) return;
  await new Promise((resolve, reject) => {
    const tx = localDb.transaction("snapshots", "readwrite");
    tx.objectStore("snapshots").put(sql.export(), "sqlite-v1");
    tx.oncomplete = resolve;
    tx.onabort = () =>
      reject(tx.error || Error("Não foi possível salvar neste navegador."));
  });
}
export async function initSchool() {
  const [engine, seed, snapshot] = await Promise.all([
    initSqlJs({ locateFile: () => wasmURL }),
    fetch("/escola-exemplo.bin").then((response) => {
      if (!response.ok)
        throw Error("A escola de exemplo não pôde ser carregada.");
      return new Response(
        response.body.pipeThrough(new DecompressionStream("gzip")),
      ).json();
    }),
    localSnapshot().catch(() => null),
  ]);
  sql = new engine.Database(snapshot || undefined);
  db.exec(schoolSchema);
  if (!snapshot)
    atomic(() => {
      for (const { id, network, name, data } of seed.schools)
        db.prepare("INSERT INTO schools VALUES (?,?,?,?)").run(
          id,
          network,
          name,
          data,
        );
      for (const { id, school, email, name, role, active } of seed.accounts)
        db.prepare(
          "INSERT INTO accounts(id,school,email,name,role,password,active) VALUES (?,?,?,?,?,?,?)",
        ).run(id, school, email, name, role, "", active);
    });
  return seed.profiles;
}
