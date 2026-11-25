import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createAccount,
  createSchool,
  db,
  loadSchool,
  saveSchool,
  today,
} from "./store.mjs";
import { report } from "./school.mjs";
import { addSampleSubmissions } from "./sample-submissions.mjs";

const terms = [
  ["1º bimestre", "02-01", "04-24"],
  ["2º bimestre", "04-25", "07-10"],
  ["3º bimestre", "07-27", "09-30"],
  ["4º bimestre", "10-01", "12-22"],
];
const subjects = [
  {
    name: "Matemática",
    teachers: [
      ["Mariana Carvalho", "professora"],
      ["Rafael Pires", "rafael"],
    ],
    themes: [
      "Frações e proporcionalidade",
      "Equações e padrões",
      "Geometria e medidas",
      "Estatística e leitura de gráficos",
    ],
    support:
      "Compare as estratégias de resolução. Explique o cálculo, confira o resultado e escreva uma frase sobre o que ele significa.",
  },
  {
    name: "Língua Portuguesa",
    teachers: [
      ["Larissa Nogueira", "larissa"],
      ["Pedro Moraes", "pedro"],
    ],
    themes: [
      "Leitura e inferência",
      "Crônica e ponto de vista",
      "Argumentação e fontes",
      "Produção e revisão textual",
    ],
    support:
      "Leia o texto duas vezes, marque a ideia principal e selecione dois trechos que sustentem sua interpretação.",
  },
  {
    name: "Ciências",
    teachers: [
      ["Fernanda Lima", "fernanda"],
      ["Renato Guimarães", "renato"],
    ],
    themes: [
      "Ecossistemas locais",
      "Matéria e transformações",
      "Corpo humano e saúde",
      "Energia e sustentabilidade",
    ],
    support:
      "Organize o trabalho em pergunta, hipótese, observação e conclusão. Registre o que pode ser verificado.",
  },
];
const names = [
  "Miguel",
  "Helena",
  "Arthur",
  "Alice",
  "Davi",
  "Laura",
  "Heitor",
  "Manuela",
  "Samuel",
  "Bárbara",
  "Bernardo",
  "Cecília",
  "Theo",
  "Valentina",
  "Nicolas",
  "Heloísa",
  "Guilherme",
  "Lívia",
  "Matheus",
  "Isadora",
  "Rafael",
  "Ester",
  "André",
  "Yasmin",
  "Lucas",
  "Lara",
  "Breno",
  "Letícia",
  "Enzo",
  "Beatriz",
  "Mateus",
  "Marina",
  "Henrique",
  "Melissa",
  "Caio",
  "Clara",
  "João Pedro",
  "Sofia",
  "Gabriel",
  "Vitória",
];
const surnames = [
  "Ribeiro",
  "Ferreira",
  "Mendes",
  "Silva",
  "Almeida",
  "Costa",
  "Lima",
  "Oliveira",
  "Santos",
  "Barbosa",
  "Monteiro",
  "Rocha",
  "Nunes",
  "Gomes",
  "Dias",
  "Souza",
  "Moura",
  "Carvalho",
  "Martins",
  "Alves",
  "Azevedo",
  "Lopes",
  "Campos",
  "Teixeira",
  "Batista",
  "Pereira",
  "Rezende",
  "Ramos",
  "Borges",
  "Fonseca",
  "Cardoso",
  "Farias",
  "Andrade",
  "Vieira",
  "Melo",
  "Moraes",
  "Pinto",
  "Peixoto",
  "Marques",
  "Sales",
];
const add = (items, fields) => {
  const record = { id: randomUUID(), ...fields };
  items.push(record);
  return record;
};
const shiftDay = (day, n) =>
  new Date(Date.parse(day) + n * 86400000).toISOString().slice(0, 10);
function availableDays(start, end) {
  const days = [];
  for (let day = start; day <= end; day = shiftDay(day, 1)) {
    const weekday = new Date(day).getUTCDay();
    if (weekday && weekday !== 6) days.push(day);
  }
  return days;
}
const formats = [
  "Atividade em sala",
  "Prova",
  "Atividade de casa",
  "Trabalho de longo prazo",
];
const feedback = [
  "Você identificou o conceito central. Confira a justificativa no último item.",
  "Boa organização do raciocínio. Use um exemplo adicional para sustentar a resposta.",
  "Retome o roteiro da aula e refaça o segundo item antes da próxima revisão.",
  "O resultado está bem explicado. Registre também como você verificou a resposta.",
];

function seedCampus({ name, domain, groups, password, primary }) {
  const day = today();
  const year = Number(day.slice(0, 4));
  const campusOffset = primary ? 0 : 31;
  const email = (login) => `${login}@${domain}`;
  const school = createSchool({
    name,
    network: "Rede Horizonte",
    email: email("secretaria"),
    password,
    year,
  });
  const office = db
    .prepare("SELECT * FROM accounts WHERE school=?")
    .get(school);
  const account = (name, login, role) =>
    createAccount(school, { name, email: email(login), role, password });
  const teachers = subjects.map((subject) =>
    subject.teachers.map(([name, login]) => account(name, login, "professor")),
  );
  const coordinator = account(
    primary ? "Camila Antunes" : "Aline Freitas",
    "coordenacao",
    "coordenacao",
  );
  if (primary) account("Juliano Campos", "rede", "rede");
  const parent = account("Patrícia Martins", "responsavel", "responsavel");
  const pupil = account("Ana Clara Martins", "aluna", "aluno");
  const sibling = account("Daniel Martins", "daniel", "aluno");
  const schoolData = loadSchool(school);
  schoolData.submissions = [];
  for (const [name, start, end] of terms)
    add(schoolData.periods, {
      name,
      year,
      start: `${year}-${start}`,
      end: `${year}-${end}`,
    });
  const closed = [];
  let enrollmentNumber = 0;
  groups.forEach(([section, size, turno], groupIndex) => {
    const primaryGroup = primary && section === "8º ano A";
    const siblingGroup = primary && section === "6º ano A";
    const roster = Array.from({ length: size }, (_, index) => {
      const n = enrollmentNumber++ + campusOffset;
      const known = index === 0 && (primaryGroup || siblingGroup);
      return add(schoolData.students, {
        name: known
          ? primaryGroup
            ? "Ana Clara Martins"
            : "Daniel Martins"
          : `${names[n % names.length]} ${surnames[(n * 7 + Math.floor(n / 40) * 9) % surnames.length]}`,
        registration: `${year}-${String(enrollmentNumber).padStart(4, "0")}`,
        inep: "",
        account: known ? (primaryGroup ? pupil : sibling) : null,
        guardians: known ? [parent] : [],
      });
    });
    subjects.forEach((subject, subjectIndex) => {
      const teacher = teachers[subjectIndex][groupIndex % 2];
      const classItem = add(schoolData.classes, {
        name: `${section} · ${subject.name}`,
        section,
        stage: "Ensino Fundamental",
        subject: subject.name,
        year,
        shift: turno,
        teachers: [teacher],
        timetable: [
          ["Segunda e quarta", "08:00–08:50", "13:00–13:50"],
          ["Terça e quinta", "08:50–09:40", "13:50–14:40"],
          ["Quarta e sexta", "10:00–10:50", "15:00–15:50"],
        ].map(([label, am, pm]) => `${label}, ${turno === "Manhã" ? am : pm}`)[
          subjectIndex
        ],
      });
      const transfer = groupIndex === 1 && day >= `${year}-09-01`;
      roster.forEach((s, index) =>
        add(schoolData.enrollments, {
          studentId: s.id,
          classId: classItem.id,
          start: `${year}-02-01`,
          end: transfer && index === size - 1 ? `${year}-08-21` : null,
          result: transfer && index === size - 1 ? "Transferido" : "",
        }),
      );
      schoolData.periods.forEach((period, termIndex) => {
        const days = availableDays(
          period.start,
          period.end < day ? period.end : day,
        );
        if (!days.length) return;
        const theme = subject.themes[termIndex];
        const lessonDays = days.filter((_, i) => i % 4 === 0);
        const rosterOn = (date) =>
          roster.filter(
            (_, index) =>
              !(transfer && index === size - 1 && date >= `${year}-08-21`),
          );
        lessonDays.forEach((date, lessonIndex) =>
          add(schoolData.lessons, {
            classId: classItem.id,
            day: date,
            slot:
              turno === "Manhã"
                ? ["08:00", "08:50", "10:00"][subjectIndex]
                : ["13:00", "13:50", "15:00"][subjectIndex],
            minutes: 50,
            topic: `${theme} · ${["introdução e exemplos", "prática guiada", "resolução em grupos", "revisão e exercícios"][lessonIndex % 4]}`,
            revision: 1,
            attendance: rosterOn(date).map((s, i) => ({
              studentId: s.id,
              status:
                (i * 11 +
                  lessonIndex * 3 +
                  termIndex +
                  subjectIndex +
                  groupIndex) %
                  23 ===
                0
                  ? "Falta"
                  : (i + lessonIndex * 2 + groupIndex) % 37 === 0
                    ? "Justificada"
                    : "Presente",
            })),
          }),
        );
        const examDays = [
          ...new Set([days[Math.floor(days.length / 3)], days.at(-1)]),
        ];
        examDays.forEach((date, index) => {
          const a = add(schoolData.assessments, {
            classId: classItem.id,
            day: date,
            published: date,
            title: `${index ? "Prova" : "Atividade"} · ${theme}`,
            format: index ? "Prova" : "Atividade em sala",
            instructions: `Use os métodos estudados em ${theme.toLowerCase()} e justifique suas escolhas.`,
            material: subject.support,
            weight: index ? 2 : 1,
            reminderDays: 3,
            recovery: false,
          });
          rosterOn(date).forEach((s, i) => {
            const shift =
              ((i * 7 + groupIndex * 3 + subjectIndex * 2) % 35) / 10;
            const score =
              primaryGroup && i === 0
                ? Math.min(
                    10,
                    6 + termIndex * 0.75 + subjectIndex * 0.25 + index * 0.5,
                  )
                : Math.min(9.9, 5.4 + shift + termIndex * 0.32 + index * 0.25);
            add(schoolData.grades, {
              assessmentId: a.id,
              studentId: s.id,
              score: Number(score.toFixed(1)),
              feedback: feedback[(i + index + termIndex) % feedback.length],
            });
          });
        });
        if (period.end < day) closed.push([classItem.id, period.id]);
      });
      const deadline = shiftDay(day, 1 + ((groupIndex + subjectIndex) % 7));
      if (deadline <= `${year}-12-22`) {
        const theme = subject.themes.at(-1);
        const kind = formats[(groupIndex + subjectIndex + 2) % formats.length];
        const a = add(schoolData.assessments, {
          classId: classItem.id,
          day: deadline,
          published: shiftDay(day, -2),
          title:
            primaryGroup && subjectIndex === 0
              ? "Equações no cotidiano"
              : `${kind} · ${theme}`,
          format: kind,
          instructions: `Explore ${theme.toLowerCase()}. Use o material de apoio e apresente sua estratégia com exemplos.`,
          material: subject.support,
          weight: 1,
          reminderDays: 3 + (subjectIndex % 2) * 3,
          recovery: false,
        });
        if (kind !== "Prova")
          roster.slice(2, 6).forEach((s, i) =>
            add(schoolData.submissions, {
              assessmentId: a.id,
              studentId: s.id,
              text: `Apresentei minha estratégia para ${theme.toLowerCase()} e revisei os exemplos do roteiro.`,
              completed: true,
              submitted:
                i < 2
                  ? new Date(
                      `${shiftDay(day, -1)}T15:30:00-03:00`,
                    ).toISOString()
                  : null,
            }),
          );
      }
      if (subjectIndex === 0) {
        add(schoolData.cases, {
          classId: classItem.id,
          studentId: roster[1].id,
          title: [
            "Revisar proporções",
            "Acompanhar frequência",
            "Organizar rotina de estudos",
          ][groupIndex % 3],
          action:
            "Realizar uma atividade curta com revisão em dupla e registrar o retorno na próxima aula.",
          owner: teacher,
          ownerName: subjects[0].teachers[groupIndex % 2][0],
          due: shiftDay(day, groupIndex + 1),
          state: groupIndex % 3 === 0 ? "Em acompanhamento" : "Aberto",
          result: "",
        });
        add(schoolData.events, {
          day: shiftDay(day, groupIndex + 2),
          title: `Conversa pedagógica com as famílias · ${section}`,
          kind: "Reunião",
          time: turno === "Manhã" ? "11:15" : "16:30",
          classId: classItem.id,
        });
        if (primaryGroup) {
          const missed = schoolData.lessons.find(
            (l) =>
              l.classId === classItem.id &&
              l.attendance.some(
                (x) => x.studentId === roster[0].id && x.status === "Falta",
              ),
          );
          if (missed)
            add(schoolData.justifications, {
              studentId: roster[0].id,
              lessonId: missed.id,
              classId: classItem.id,
              day: missed.day,
              reason: "A família solicitou revisão do registro de frequência.",
              state: "Pendente",
            });
        }
      }
    });
  });
  for (const [offset, title, kind, time] of [
    [1, "Plantão de dúvidas na biblioteca", "Evento escolar", "12:30"],
    [4, "Mostra de Ciências e Tecnologia", "Evento escolar", "14:00"],
    [8, "Conselho de classe", "Reunião", "17:15"],
    [10, "Oficina de produção textual", "Evento escolar", "09:00"],
  ])
    add(schoolData.events, {
      day: shiftDay(day, offset),
      title,
      kind,
      time,
      classId: null,
    });
  for (const [offset, title, body] of [
    [
      0,
      "Semana de avaliações",
      "Confira as datas no calendário. As orientações e materiais aparecem em Minhas atividades.",
    ],
    [
      -2,
      "Plantão de dúvidas",
      "A biblioteca recebe estudantes para revisão orientada. Leve o caderno e as dúvidas que quer discutir.",
    ],
    [
      -5,
      "Mostra de Ciências e Tecnologia",
      "As turmas apresentarão investigações e protótipos. A visita das famílias está no calendário.",
    ],
    [
      -9,
      "Atendimento da secretaria",
      "Use a secretaria para atualizar contatos e vínculos de responsáveis.",
    ],
    [
      -12,
      "Reunião de acompanhamento",
      "Consulte o calendário da turma para a data do encontro com as famílias.",
    ],
  ])
    add(schoolData.notices, {
      title,
      body,
      day: shiftDay(day, offset),
      classId: null,
    });
  add(schoolData.receipts, {
    noticeId: schoolData.notices.at(-1).id,
    accountId: parent,
    at: new Date().toISOString(),
  });
  add(schoolData.audit, {
    kind: "class",
    target: school,
    account: "Administração escolar",
    at: new Date().toISOString(),
  });
  for (const [classId, periodId] of closed) {
    const rows = report(
      schoolData,
      schoolData.classes.find((c) => c.id === classId),
      schoolData.periods.find((p) => p.id === periodId),
    );
    if (
      !rows.length ||
      rows.some((row) => !row.minutes || !row.marks.length || row.missing)
    )
      throw Error("Boletim inicial sem dados suficientes.");
    const publishedAt = new Date().toISOString();
    const closure = add(schoolData.closures, {
      classId,
      periodId,
      rows,
      publicRows: rows,
      publishedAt,
      state: "Publicado",
    });
    add(schoolData.audit, {
      kind: "closure",
      target: closure.id,
      account: office.name,
      at: publishedAt,
      action: "Publicado",
    });
  }
  addSampleSubmissions(schoolData, day);
  saveSchool(schoolData);
  return {
    students: schoolData.students.length,
    classes: schoolData.classes.length,
    lessons: schoolData.lessons.length,
    assessments: schoolData.assessments.length,
    grades: schoolData.grades.length,
    coordinator,
  };
}

export function seedSchoolNetwork(password) {
  if (db.prepare("SELECT id FROM schools LIMIT 1").get())
    throw Error("Use um banco vazio separado para preparar este ambiente.");
  const main = seedCampus({
    name: "Colégio Horizonte",
    domain: "horizonte.example",
    primary: true,
    password,
    groups: [
      ["6º ano A", 22, "Manhã"],
      ["6º ano B", 20, "Tarde"],
      ["7º ano A", 23, "Manhã"],
      ["7º ano B", 20, "Tarde"],
      ["8º ano A", 24, "Manhã"],
      ["8º ano B", 21, "Tarde"],
      ["9º ano A", 22, "Manhã"],
      ["9º ano B", 20, "Tarde"],
    ],
  });
  const second = seedCampus({
    name: "Colégio Horizonte · Unidade Parque",
    domain: "parque.horizonte.example",
    primary: false,
    password,
    groups: [
      ["6º ano A", 18, "Manhã"],
      ["7º ano A", 19, "Manhã"],
      ["8º ano A", 18, "Tarde"],
    ],
  });
  return [main, second];
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const password = process.env.PIES_INITIAL_PASSWORD;
  if (!password)
    throw Error(
      "Defina PIES_INITIAL_PASSWORD antes de preparar o ambiente de avaliação.",
    );
  console.log(seedSchoolNetwork(password));
}
