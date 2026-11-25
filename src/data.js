export const students = [
  {
    id: 1,
    name: "Ana Clara Martins",
    classroom: "8º ano A",
    attendance: 96,
    skill: "Raciocínio lógico",
    focus: "Equações de primeiro grau",
    scores: [5.8, 6.5, 6.9, 7.2, 7.8],
    note: "Participa das atividades em grupo e explica suas estratégias com clareza.",
  },
  {
    id: 2,
    name: "Bruno Ferreira",
    classroom: "8º ano A",
    attendance: 82,
    skill: "Expressão oral",
    focus: "Interpretação de problemas",
    scores: [6.8, 6.4, 6.1, 5.9, 5.6],
    note: "Apresenta boas ideias nas discussões. Beneficia-se de instruções divididas em etapas.",
  },
  {
    id: 3,
    name: "Camila Ribeiro",
    classroom: "8º ano B",
    attendance: 98,
    skill: "Investigação científica",
    focus: "Argumentação escrita",
    scores: [7.7, 8.1, 8.5, 8.7, 8.9],
    note: "Demonstra curiosidade e autonomia em projetos de pesquisa.",
  },
  {
    id: 4,
    name: "Daniel Oliveira",
    classroom: "8º ano A",
    attendance: 89,
    skill: "Criatividade visual",
    focus: "Leitura e compreensão",
    scores: [5.1, 5.4, 5.8, 6.0, 6.3],
    note: "Responde bem a mapas visuais e exemplos relacionados ao cotidiano.",
  },
  {
    id: 5,
    name: "Elisa Santos",
    classroom: "8º ano B",
    attendance: 95,
    skill: "Colaboração",
    focus: "Resolução de desafios",
    scores: [7.1, 7.3, 7.6, 7.9, 8.2],
    note: "Contribui com o grupo e acolhe diferentes perspectivas.",
  },
  {
    id: 6,
    name: "Felipe Costa",
    classroom: "8º ano A",
    attendance: 76,
    skill: "Aprendizagem prática",
    focus: "Operações com frações",
    scores: [5.9, 5.6, 5.3, 5.0, 4.9],
    note: "Envolve-se mais em atividades práticas. Priorizar uma conversa de acolhimento.",
  },
  {
    id: 7,
    name: "Gabriela Lima",
    classroom: "8º ano B",
    attendance: 93,
    skill: "Organização",
    focus: "Produção textual",
    scores: [6.6, 6.9, 7.1, 7.2, 7.4],
    note: "Mantém seus registros organizados e procura esclarecer dúvidas.",
  },
  {
    id: 8,
    name: "Henrique Alves",
    classroom: "8º ano A",
    attendance: 91,
    skill: "Pensamento espacial",
    focus: "Planejamento de estudos",
    scores: [6.1, 6.4, 6.6, 6.9, 7.1],
    note: "Demonstra facilidade com representações e construções geométricas.",
  },
];
export const status = (s) =>
  s.average === null
    ? "Sem avaliação"
    : s.average < 6 || s.attendance < 85
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
  n === null || n === undefined
    ? "—"
    : n.toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
