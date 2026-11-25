import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const previewMode =
  !!process.argv[1] &&
  resolve(process.argv[1]) ===
    fileURLToPath(new URL("./preview.mjs", import.meta.url));

export const previewProfiles = [
  ["secretaria", "Secretaria"],
  ["professora", "Professora"],
  ["coordenacao", "Coordenação"],
  ["aluna", "Aluna"],
  ["responsavel", "Responsável"],
  ["rede", "Gestão de rede"],
].map(([login, label]) => ({ email: `${login}@horizonte.example`, label }));
