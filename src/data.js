export const students = [
  {
    id: 1,
    name: "Ana Clara Martins",
    classroom: "8º ano A",
    average: 7.8,
    previous: 6.9,
    attendance: 96,
    skill: "Raciocínio lógico",
    focus: "Equações de primeiro grau",
    scores: [5.8, 6.5, 6.9, 7.2, 7.8],
    subjects: [8.2, 6.4, 8.8, 7.9],
    note: "Participa das atividades em grupo e explica suas estratégias com clareza.",
  },
  {
    id: 2,
    name: "Bruno Ferreira",
    classroom: "8º ano A",
    average: 5.6,
    previous: 6.1,
    attendance: 82,
    skill: "Expressão oral",
    focus: "Interpretação de problemas",
    scores: [6.8, 6.4, 6.1, 5.9, 5.6],
    subjects: [6.2, 4.8, 6.1, 5.3],
    note: "Apresenta boas ideias nas discussões. Beneficia-se de instruções divididas em etapas.",
  },
  {
    id: 3,
    name: "Camila Ribeiro",
    classroom: "8º ano B",
    average: 8.9,
    previous: 8.5,
    attendance: 98,
    skill: "Investigação científica",
    focus: "Argumentação escrita",
    scores: [7.7, 8.1, 8.5, 8.7, 8.9],
    subjects: [8.5, 9.2, 9.4, 8.5],
    note: "Demonstra curiosidade e autonomia em projetos de pesquisa.",
  },
  {
    id: 4,
    name: "Daniel Oliveira",
    classroom: "8º ano A",
    average: 6.3,
    previous: 5.8,
    attendance: 89,
    skill: "Criatividade visual",
    focus: "Leitura e compreensão",
    scores: [5.1, 5.4, 5.8, 6.0, 6.3],
    subjects: [5.7, 6.8, 6.4, 6.3],
    note: "Responde bem a mapas visuais e exemplos relacionados ao cotidiano.",
  },
  {
    id: 5,
    name: "Elisa Santos",
    classroom: "8º ano B",
    average: 8.2,
    previous: 7.6,
    attendance: 95,
    skill: "Colaboração",
    focus: "Resolução de desafios",
    scores: [7.1, 7.3, 7.6, 7.9, 8.2],
    subjects: [8.8, 7.7, 8.1, 8.2],
    note: "Contribui com o grupo e acolhe diferentes perspectivas.",
  },
  {
    id: 6,
    name: "Felipe Costa",
    classroom: "8º ano A",
    average: 4.9,
    previous: 5.3,
    attendance: 76,
    skill: "Aprendizagem prática",
    focus: "Operações com frações",
    scores: [5.9, 5.6, 5.3, 5.0, 4.9],
    subjects: [5.4, 4.1, 5.5, 4.6],
    note: "Envolve-se mais em atividades práticas. Priorizar uma conversa de acolhimento.",
  },
  {
    id: 7,
    name: "Gabriela Lima",
    classroom: "8º ano B",
    average: 7.4,
    previous: 7.1,
    attendance: 93,
    skill: "Organização",
    focus: "Produção textual",
    scores: [6.6, 6.9, 7.1, 7.2, 7.4],
    subjects: [7.1, 7.8, 7.4, 7.3],
    note: "Mantém seus registros organizados e procura esclarecer dúvidas.",
  },
  {
    id: 8,
    name: "Henrique Alves",
    classroom: "8º ano A",
    average: 7.1,
    previous: 6.6,
    attendance: 91,
    skill: "Pensamento espacial",
    focus: "Planejamento de estudos",
    scores: [6.1, 6.4, 6.6, 6.9, 7.1],
    subjects: [6.8, 7.6, 7.1, 6.9],
    note: "Demonstra facilidade com representações e construções geométricas.",
  },
];
export const status = (s) =>
  s.average < 6 || s.attendance < 85
    ? "Precisa de apoio"
    : s.average < 7
      ? "Em acompanhamento"
      : "Bom desenvolvimento";
export const initials = (name) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
export const number = (n) =>
  n.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
