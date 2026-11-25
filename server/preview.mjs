import { randomBytes } from "node:crypto";
import { resolve } from "node:path";

process.env.PIES_DB = resolve(".pies/horizonte-previa-v3.sqlite");
process.env.PIES_HOST = "127.0.0.1";
process.env.PIES_SECURE_COOKIE = "0";

const { db } = await import("./store.mjs");
if (!db.prepare("SELECT id FROM schools LIMIT 1").get()) {
  const { seedSchoolNetwork } = await import("./sample.mjs");
  seedSchoolNetwork(randomBytes(24).toString("base64url"));
}
await import("./http.mjs");
