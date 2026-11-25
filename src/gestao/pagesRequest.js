import { db, initSchool, insist, persist, publicUser } from "./pagesStore.js";
import { perform, readWorkspace, scopedExtras } from "../../server/school.mjs";
import { notifications } from "../../server/notification-model.mjs";

let initialization;
let identity;
const sessionKey = "pies-pages-profile";
function currentEmail() {
  try {
    return sessionStorage.getItem(sessionKey) || identity;
  } catch {
    return identity;
  }
}
function setEmail(email) {
  identity = email;
  try {
    if (email) sessionStorage.setItem(sessionKey, email);
    else sessionStorage.removeItem(sessionKey);
  } catch {
    /* Session can still be used in memory. */
  }
}
function getUser() {
  const email = currentEmail();
  return email
    ? db.prepare("SELECT * FROM accounts WHERE email=? AND active=1").get(email)
    : null;
}
function workspace(user) {
  const state = scopedExtras(user, readWorkspace(user));
  return { ...state, notifications: notifications(user, state) };
}
export async function pagesRequest(path, body) {
  initialization ??= initSchool();
  const profiles = await initialization;
  if (path === "workspace") {
    const user = getUser();
    return {
      profiles,
      user: user ? publicUser(user) : null,
      state: user ? workspace(user) : null,
    };
  }
  if (path === "login") {
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    insist(
      profiles.some((profile) => profile.email === email),
      "Escolha um dos perfis da escola de exemplo.",
      401,
    );
    setEmail(email);
    const user = getUser();
    if (!user) setEmail(null);
    insist(user, "Perfil indisponível neste navegador.", 401);
    return { user: publicUser(user) };
  }
  if (path === "logout") {
    setEmail(null);
    return { ok: true };
  }
  const user = getUser();
  insist(user, "Entre com um perfil da escola de exemplo.", 401);
  if (path === "command") {
    perform(user, body.kind, body.data, body.id);
    await persist();
    return { state: workspace(user) };
  }
  insist(false, "Ação indisponível na versão de demonstração.", 404);
}
