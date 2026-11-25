import { randomBytes } from "node:crypto";
import { copyFile, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";

// Always start with newly generated sample data. Never open the working database.
process.env.PIES_DB = ":memory:";
const { db } = await import("./store.mjs");
const { seedSchoolNetwork } = await import("./sample.mjs");
const { previewProfiles } = await import("./preview-mode.mjs");
seedSchoolNetwork(randomBytes(24).toString("hex"));
const schools = db.prepare("SELECT id,network,name,data FROM schools").all();
const accounts = db
  .prepare("SELECT id,school,email,name,role,active FROM accounts")
  .all();
await writeFile(
  "dist-pages/escola-exemplo.bin",
  gzipSync(JSON.stringify({ schools, accounts, profiles: previewProfiles })),
);
await copyFile("dist-pages/gestao.html", "dist-pages/index.html");
await writeFile(
  "dist-pages/_headers",
  `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: same-origin
  X-Frame-Options: DENY
  Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'
/escola-exemplo.bin
  Cache-Control: no-cache
`,
);
