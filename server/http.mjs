import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, join, extname, sep } from "node:path";
import {
  login,
  session,
  logout,
  publicUser,
  changePassword,
  insist,
} from "./store.mjs";
import { perform, readWorkspace, scopedExtras } from "./school.mjs";
import { notifications, startMailWorker } from "./notifications.mjs";
const workspace = (user, id) => {
  const state = scopedExtras(user, readWorkspace(user, id || user.school));
  return { ...state, notifications: notifications(user, state) };
};
const dist = resolve("dist");
const secure = process.env.PIES_SECURE_COOKIE === "1";
const cookie = (value, seconds = 28800) =>
  `pies_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${seconds}${secure ? "; Secure" : ""}`;
const token = (req) =>
  /(?:^|;\s*)pies_session=([\w-]+)/.exec(req.headers.cookie || "")?.[1];
const mime = {
  ".html": "text/html;charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".webmanifest": "application/manifest+json",
};
const attempts = new Map();
async function body(req) {
  insist(
    req.headers["content-type"]?.split(";")[0] === "application/json",
    "Use JSON.",
    415,
  );
  let size = 0;
  const parts = [];
  for await (const part of req) {
    size += part.length;
    insist(size <= 750_000, "Dados acima do limite.", 413);
    parts.push(part);
  }
  try {
    return JSON.parse(Buffer.concat(parts));
  } catch {
    insist(false, "JSON invÃ¡lido.");
  }
}
function json(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json;charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}
function origin(req) {
  const sent = req.headers.origin;
  if (!sent) return;
  const site = new URL(sent);
  insist(
    site.host === req.headers.host &&
      ["https:", "http:"].includes(site.protocol),
    "Origem invÃ¡lida.",
    403,
  );
}
export const server = createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; img-src 'self' data:; style-src 'self'; form-action 'self'",
  );
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/api/")) {
      if (req.method === "POST") origin(req);
      if (url.pathname === "/api/login" && req.method === "POST") {
        const { email, password } = await body(req);
        const address = req.socket.remoteAddress || "";
        const now = Date.now();
        if (attempts.size > 1000)
          for (const [key, value] of attempts)
            if (value.until <= now) attempts.delete(key);
        const key = address;
        const prior = attempts.get(key);
        const limit =
          prior && prior.until > now ? prior : { count: 0, until: now + 60000 };
        insist(limit.count < 15, "Muitas tentativas. Aguarde um minuto.", 429);
        limit.count++;
        attempts.set(key, limit);
        const access = login(email, password);
        attempts.delete(key);
        res.setHeader("Set-Cookie", cookie(access.token));
        return json(res, 200, { user: access.user });
      }
      const user = session(token(req));
      if (!user && url.pathname === "/api/workspace" && req.method === "GET")
        return json(res, 200, { user: null, state: null });
      insist(user, "Entre com sua conta escolar.", 401);
      if (url.pathname === "/api/logout" && req.method === "POST") {
        logout(token(req));
        res.setHeader("Set-Cookie", cookie("", 0));
        return json(res, 200, { ok: true });
      }
      if (url.pathname === "/api/password" && req.method === "POST") {
        const d = await body(req);
        changePassword(user, d.password, d.current);
        res.setHeader("Set-Cookie", cookie("", 0));
        return json(res, 200, { ok: true });
      }
      if (url.pathname === "/api/workspace" && req.method === "GET")
        return json(res, 200, {
          user: publicUser(user),
          state: workspace(user, url.searchParams.get("school")),
        });
      if (url.pathname === "/api/command" && req.method === "POST") {
        const d = await body(req);
        insist(
          d &&
            typeof d.kind === "string" &&
            d.data &&
            typeof d.data === "object",
          "OperaÃ§Ã£o invÃ¡lida.",
        );
        perform(user, d.kind, d.data, d.id);
        return json(res, 200, { state: workspace(user) });
      }
      return json(res, 404, { error: "Rota indisponÃ­vel." });
    }
    insist(
      req.method === "GET" || req.method === "HEAD",
      "MÃ©todo indisponÃ­vel.",
      405,
    );
    const pathname =
      url.pathname === "/" ||
      url.pathname === "/gestao" ||
      url.pathname === "/gestao/"
        ? "/gestao.html"
        : decodeURIComponent(url.pathname);
    insist(pathname !== "/index.html", "PÃ¡gina nÃ£o encontrada.", 404);
    const file = join(dist, pathname);
    insist(file.startsWith(dist + sep), "PÃ¡gina nÃ£o encontrada.", 404);
    const type = mime[extname(file)];
    insist(
      type && (await stat(file).catch(() => null))?.isFile(),
      "PÃ¡gina nÃ£o encontrada.",
      404,
    );
    res.writeHead(200, {
      "Content-Type": type,
      "Cache-Control": pathname.startsWith("/assets/")
        ? "public,max-age=31536000,immutable"
        : "no-cache",
    });
    res.end(req.method === "HEAD" ? undefined : await readFile(file));
  } catch (e) {
    if (!e.status) console.error(e);
    if (!res.headersSent)
      json(res, e.status || 500, {
        error: e.status ? e.message : "Erro interno. Tente novamente.",
      });
    else res.end();
  }
});
startMailWorker();
server.listen(
  Number(process.env.PIES_PORT || 4173),
  process.env.PIES_HOST || "127.0.0.1",
  () =>
    console.log(
      `PIES disponÃ­vel em http://${process.env.PIES_HOST || "127.0.0.1"}:${server.address().port}`,
    ),
);
