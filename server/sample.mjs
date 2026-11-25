import { createAccount, createSchool, db, today } from "./store.mjs";
import { perform } from "./school.mjs";
const password = process.env.PIES_INITIAL_PASSWORD;
if (!password)
  throw Error(
    "Defina PIES_INITIAL_PASSWORD antes de preparar o ambiente de avaliação.",
  );
if (db.prepare("SELECT id FROM schools LIMIT 1").get())
  throw Error("Use um banco vazio separado para preparar este ambiente.");
const year = Number(today().slice(0, 4));
const school = createSchool({
  name: "Colégio Horizonte",
  network: "Rede Horizonte",
  email: "secretaria@horizonte.example",
  password,
  year,
});
const account = (name, email, role) =>
  createAccount(school, {
    name,
    email: `${email}@horizonte.example`,
    password,
    role,
  });
const teacher = account("Mariana Carvalho", "professora", "professor");
account("Camila Antunes", "coordenacao", "coordenacao");
account("Juliano Campos", "rede", "rede");
const guardian = account("Patrícia Martins", "responsavel", "responsavel");
const pupil = account("Ana Clara Martins", "aluna", "aluno");
const office = {
  id: db
    .prepare("SELECT id FROM accounts WHERE email=?")
    .get("secretaria@horizonte.example").id,
  name: "Administração escolar",
  school,
  role: "secretaria",
};
let counter = 0;
const apply = (kind, data) =>
  perform(office, kind, data, `sample-${++counter}`);
const info = () =>
  JSON.parse(
    db.prepare("SELECT data FROM schools WHERE id=?").get(school).data,
  );
apply("class", {
  name: "8º ano A",
  stage: "Ensino Fundamental",
  subject: "Matemática",
  teachers: [teacher],
  year,
  shift: "Manhã",
  timetable: "Segunda e quarta, 08:00–08:50\nSexta, 09:00–09:50",
});
const classId = info().classes[0].id;
for (const [index, name] of [
  "Ana Clara Martins",
  "Bruno Ferreira",
  "Elisa Santos",
  "Gabriel Sousa",
].entries()) {
  apply("student", {
    name,
    registration: `${year}00${index + 1}`,
    ...(index === 0 ? { account: pupil, guardians: [guardian] } : {}),
  });
  apply("enroll", {
    studentId: info().students.at(-1).id,
    classId,
    start: `${year}-01-01`,
  });
}
const ranges = [
  ["1º bimestre", "01-01", "04-30"],
  ["2º bimestre", "05-01", "07-31"],
  ["3º bimestre", "08-01", "09-30"],
  ["4º bimestre", "10-01", "12-31"],
];
for (const [name, start, end] of ranges)
  apply("period", { name, start: `${year}-${start}`, end: `${year}-${end}` });
const ideas = [
  "Operações com frações",
  "Equações e problemas",
  "Área e perímetro",
  "Grandezas e medidas",
];
const marks = [6.4, 7.2, 7.8, 8.4];
const pupils = info().students;
for (const [i, [, start, end]] of ranges.entries()) {
  const day = `${year}-${start}`;
  if (day > today()) continue;
  apply("lesson", {
    classId,
    day,
    slot: "08:00",
    minutes: 50,
    topic: ideas[i],
    attendance: pupils.map((s, j) => ({
      studentId: s.id,
      status: j === 1 && i % 2 === 0 ? "Falta" : "Presente",
    })),
  });
  apply("assessment", {
    classId,
    day,
    published: day,
    title: ideas[i],
    format: "Prova",
    instructions: "Resolva os problemas e descreva o raciocínio.",
    weight: 1,
  });
  const assessmentId = info().assessments.at(-1).id;
  pupils.forEach((s, j) =>
    apply("grade", {
      assessmentId,
      studentId: s.id,
      score: marks[i] - (j % 2) * 1.2,
      feedback: "Revise as etapas da resolução e confira o resultado.",
    }),
  );
  if (`${year}-${end}` < today()) {
    const periodId = info().periods[i].id;
    apply("closure", { classId, periodId, state: "Fechado" });
    apply("closure", { classId, periodId, state: "Publicado" });
  }
}
const future = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
if (future.startsWith(String(year)))
  apply("assessment", {
    classId,
    day: future,
    published: today(),
    title: "Equações no cotidiano",
    format: "Atividade de casa",
    instructions:
      "Modele e resolva três situações usando equações de primeiro grau.",
    material:
      "Exemplo: 2x + 6 = 14. Subtraia 6 dos dois lados e divida por 2. Confira substituindo x = 4.",
    weight: 1,
  });
apply("case", {
  classId,
  studentId: pupils[1].id,
  title: "Retomar leitura de enunciados",
  action:
    "Resolver dois problemas por encontro e revisar a estratégia com o estudante.",
  owner: teacher,
  due: future,
  state: "Em acompanhamento",
});
apply("event", {
  day: future,
  title: "Reunião de acompanhamento pedagógico",
  kind: "Reunião",
  time: "16:30",
  classId,
});
apply("notice", {
  title: "Organização da semana de avaliações",
  body: "Consulte as datas no calendário da turma. A equipe pedagógica está disponível para orientar os estudos.",
  classId,
});
console.log(
  "Colégio Horizonte preparado. Contas: secretaria, professora, coordenacao, rede, aluna e responsavel em @horizonte.example.",
);
