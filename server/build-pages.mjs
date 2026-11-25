import { copyFile, writeFile } from "node:fs/promises";

const endpoint = process.env.VITE_PIES_API_URL;
if (!endpoint)
  throw new Error("Defina VITE_PIES_API_URL para publicar o PIES.");
const { origin, protocol } = new URL(endpoint);
if (protocol !== "https:") throw new Error("A API publicada deve usar HTTPS.");

await copyFile("dist-pages/gestao.html", "dist-pages/index.html");
await writeFile(
  "dist-pages/_headers",
  `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: same-origin
  X-Frame-Options: DENY
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' ${origin}; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'
/
  Cache-Control: no-cache
/gestao.html
  Cache-Control: no-cache
`,
);
