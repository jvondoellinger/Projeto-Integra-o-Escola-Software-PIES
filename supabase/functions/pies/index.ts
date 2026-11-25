import {
  insist,
  perform,
  publicUser,
  readWorkspace,
  scopedExtras,
} from "../../../server/school-core.mjs";
import { notifications } from "../../../server/notification-model.mjs";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const apiKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Object.values<string>(
    JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}"),
  )[0];
if (!supabaseUrl || !apiKey) throw new Error("API do Supabase indisponível.");
const encoder = new TextEncoder();

async function rpc(name: string, args: Record<string, unknown> = {}) {
  const headers = new Headers({
    "Content-Type": "application/json",
    apikey: apiKey,
  });
  if (apiKey.startsWith("eyJ"))
    headers.set("Authorization", `Bearer ${apiKey}`);
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/pies_${name}`, {
    method: "POST",
    headers,
    body: JSON.stringify(args),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (error.code === "23505")
      throw Object.assign(new Error("Já existe um registro com esses dados."), {
        status: 409,
      });
    if (error.code === "23503" || error.code === "23514")
      throw Object.assign(
        new Error("Confira os vínculos e valores informados."),
        { status: 409 },
      );
    console.error("PIES RPC", name, response.status, error.code);
    throw new Error("Banco de dados indisponível.");
  }
  return response.status === 204 ? null : response.json();
}

async function tokenHash(token: string) {
  const bytes = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

const allowedRoles = new Set([
  "secretaria",
  "professor",
  "coordenacao",
  "aluno",
  "responsavel",
]);
const changesByCommand: Record<string, string[]> = {
  student: ["students"],
  import: ["students", "enrollments"],
  class: ["classes"],
  enroll: ["enrollments"],
  move: ["enrollments"],
  result: ["enrollments"],
  period: ["periods"],
  lesson: ["lessons"],
  assessment: ["assessments"],
  archiveAssessment: ["assessments"],
  grade: ["grades"],
  submission: ["submissions"],
  closure: ["closures"],
  event: ["events"],
  case: ["cases"],
  notice: ["notices"],
  receipt: ["receipts"],
  justify: ["justifications"],
  decide: ["justifications", "lessons"],
};
async function loadSnapshot(school: string) {
  const snapshot = await rpc("snapshot_v2", { school_key: school });
  for (const closure of snapshot.closures) {
    if (closure.state === "Publicado") closure.publicRows = closure.rows;
  }
  return snapshot;
}

function storeFor(snapshot: any, command: string) {
  const entities = [
    ...(Object.hasOwn(changesByCommand, command) ? changesByCommand[command] : []),
    "audit",
  ];
  const { accounts, version, ...data } = snapshot;
  const baseline = new Map(
    entities.map((entity) => [
      entity,
      new Map(data[entity].map((row: any) => [row.id, JSON.stringify(row)])),
    ]),
  );
  const accountChanges = new Map();
  const store = {
    atomic(task: () => void) {
      task();
    },
    loadSchool(school: string) {
      insist(school === data.id, "Escola não encontrada.", 404);
      return data;
    },
    saveSchool() {
      /* The mutation is committed against the snapshot version in PostgreSQL. */
    },
    listAccounts(school: string, active = false) {
      return accounts.filter(
        (account: any) =>
          account.school === school && (!active || account.active),
      );
    },
    getAccount(school: string, id: string, active = false) {
      return accounts.find(
        (account: any) =>
          account.school === school &&
          account.id === id &&
          (!active || account.active),
      );
    },
    createAccount(school: string, input: any) {
      const email = String(input.email ?? "")
        .trim()
        .toLowerCase();
      const name = String(input.name ?? "").trim();
      insist(
        allowedRoles.has(input.role) &&
          name.length > 0 &&
          name.length <= 120 &&
          email.length <= 254 &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        "Informe nome, e-mail e perfil válidos.",
      );
      insist(
        !accounts.some((account: any) => account.email === email),
        "E-mail já cadastrado.",
        409,
      );
      const account = {
        id: crypto.randomUUID(),
        school,
        email,
        name,
        role: input.role,
        active: true,
      };
      accounts.push(account);
      accounts.sort((a: any, b: any) => a.name.localeCompare(b.name, "pt-BR"));
      accountChanges.set(account.id, account);
      return account.id;
    },
    setAccountActive(id: string, active: boolean) {
      const account = accounts.find((item: any) => item.id === id);
      account.active = active;
      accountChanges.set(id, account);
    },
    operationExists() {
      return false;
    },
    recordOperation() {
      /* The database records the operation together with the data. */
    },
  };
  function delta() {
    return Object.fromEntries(
      entities
        .map((entity) => [
          entity,
          data[entity].filter(
            (row: any) =>
              baseline.get(entity)?.get(row.id) !== JSON.stringify(row),
          ),
        ])
        .filter(([, rows]) => rows.length),
    );
  }
  return { store, version, delta, accountChanges, data };
}

function browserState(snapshot: any, user: any) {
  const { accounts, version, ...data } = snapshot;
  const store = {
    loadSchool: () => data,
    listAccounts: (_school: string, active = false) =>
      active ? accounts.filter((a: any) => a.active) : accounts,
  };
  const state = scopedExtras(store, user, readWorkspace(store, user));
  return { ...state, notifications: notifications(user, state) };
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("Origin");
  const allowOrigin =
    origin &&
    (/^https:\/\/(?:[a-z0-9-]+\.)?pies-escolar\.pages\.dev$/.test(origin) ||
      /^http:\/\/(?:localhost|127\.0\.0\.1):\d+$/.test(origin));
  const headers = {
    ...(allowOrigin ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, authorization",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin",
  };
  const reply = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers });
  if (origin && !allowOrigin)
    return reply({ message: "Origem indisponível." }, 403);
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return reply({ message: "Use POST." }, 405);

  try {
    const { path, data } = await request.json().catch(() => ({}));
    if (path === "login") {
      const token = Array.from(
        crypto.getRandomValues(new Uint8Array(32)),
        (byte) => byte.toString(16).padStart(2, "0"),
      ).join("");
      const user = await rpc("login", {
        profile_email: String(data?.email ?? "")
          .trim()
          .toLowerCase(),
        hashed_token: await tokenHash(token),
      });
      insist(user, "Escolha um dos perfis da escola.", 401);
      return reply({ token, user: publicUser(user) });
    }
    const token = request.headers
      .get("Authorization")
      ?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
    const hashed = token ? await tokenHash(token) : null;
    if (path === "logout") {
      if (hashed) await rpc("logout", { hashed_token: hashed });
      return reply({ ok: true });
    }
    const user = hashed
      ? await rpc("identity", { hashed_token: hashed })
      : null;
    if (path === "workspace") {
      if (!user)
        return reply({
          profiles: await rpc("profiles"),
          user: null,
          state: null,
        });
      const state =
        user.role === "rede"
          ? { schools: await rpc("network", { network_name: user.network }) }
          : browserState(await loadSnapshot(user.school), user);
      return reply({
        user: publicUser(user),
        state,
        profiles: await rpc("profiles"),
      });
    }
    insist(user, "Entre com um perfil da escola.", 401);
    insist(path === "command", "Operação indisponível.", 404);
    insist(data && typeof data.kind === "string", "Operação inválida.");
    for (let attempt = 0; attempt < 3; attempt++) {
      const snapshot = await loadSnapshot(user.school);
      const {
        store,
        version,
        delta,
        accountChanges,
        data: changed,
      } = storeFor(snapshot, data.kind);
      try {
        perform(store, user, data.kind, data.data, data.id);
      } catch (error) {
        // A retry after a lost response must be recognized even if the new
        // state would reject the original operation (for example, closing twice).
        if (
          typeof data.id === "string" &&
          (await rpc("operation_exists", {
            school_key: user.school,
            actor: user.id,
            operation_key: data.id,
          }))
        ) {
          const current = await loadSnapshot(user.school);
          return reply({ state: browserState(current, user) });
        }
        throw error;
      }
      const result = await rpc("commit", {
        school_key: user.school,
        actor: user.id,
        expected_version: version,
        operation_key: data.id,
        changes: delta(),
        next_policy: changed.policy,
        account_changes: [...accountChanges.values()],
        hashed_token: hashed,
      });
      if (result === "conflict") continue;
      insist(result !== "unauthorized", "Sessão expirada.", 401);
      const current =
        result === "duplicate"
          ? await loadSnapshot(user.school)
          : { ...changed, accounts: snapshot.accounts };
      return reply({ state: browserState(current, user) });
    }
    return reply(
      { message: "Outro registro foi atualizado. Tente novamente." },
      409,
    );
  } catch (error: any) {
    if (!error.status) console.error("PIES", error.message);
    return reply(
      {
        message: error.status
          ? error.message
          : "Não foi possível concluir a operação.",
      },
      error.status || 500,
    );
  }
});
