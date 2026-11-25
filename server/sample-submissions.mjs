const responses = {
  "frações e proporcionalidade": [
    "Usei o denominador comum 8. Transformei 1/2 em 4/8 e somei com 3/8. Obtive 7/8, que é menor que 1.",
    "Se 3 cadernos custam R$ 18, cada um custa R$ 6. Multipliquei por 5 e obtive R$ 30.",
  ],
  "equações e padrões": [
    "Modelei o problema com 3x + 5 = 20. Subtraí 5 dos dois lados e dividi por 3. Encontrei x = 5 e conferi substituindo na equação.",
    "A sequência 4, 7, 10, 13 aumenta 3 a cada termo. Usei 3n + 1 para calcular o décimo termo, que é 31.",
  ],
  "geometria e medidas": [
    "Multipliquei os lados de 8 cm e 5 cm para obter a área de 40 cm². Somei os quatro lados e cheguei ao perímetro de 26 cm.",
    "Dividi a figura em dois retângulos. Somei 18 cm² e 12 cm² para chegar à área total de 30 cm².",
  ],
  "estatística e leitura de gráficos": [
    "Na segunda-feira foram registrados 12 empréstimos, na terça 18 e na quarta 15. A média foi 15 por dia.\nA barra de terça é a mais alta, com 6 empréstimos a mais do que a de segunda.",
    "Organizei os valores 4, 6, 6, 8 e 11. A mediana e a moda são 6. A média é 7, maior que a mediana porque o valor 11 aumenta a soma.",
  ],
  "leitura e inferência": [
    "A personagem parece nervosa. O texto não diz isso diretamente, mas ela aperta a mochila e ensaia a primeira frase duas vezes.",
    "Entendi que a cena acontece cedo pela padaria começando a abrir e pela sombra comprida das árvores.",
  ],
  "crônica e ponto de vista": [
    "O narrador conta o episódio em primeira pessoa. Se a vizinha narrasse a cena, veríamos a pressa dela em vez do atraso percebido pelo narrador.",
    "Escolhi a espera no ponto de ônibus. Uma conversa curta mudou a maneira como o narrador interpretou o silêncio das pessoas.",
  ],
  "argumentação e fontes": [
    "Defendi que a biblioteca abra no intervalo. Usei a contagem de visitas da escola como evidência e deixei minha opinião no último parágrafo.",
    "As duas fontes falam de desperdício, mas só a primeira explica o período e como a quantidade foi medida. Dei mais peso a ela.",
  ],
  "produção e revisão textual": [
    "Troquei palavras repetidas e acrescentei uma transição entre o exemplo e a conclusão. Dividi o parágrafo mais longo para separar duas ideias.",
    "Apresentei minha posição no início. Depois da leitura em dupla, retirei uma frase que repetia a conclusão.",
  ],
  "ecossistemas locais": [
    "Encontrei folhas decompostas sob as árvores. Minha hipótese é que a umidade ajuda a decomposição. Compararia folhas na sombra e ao sol para testar.",
    "Desenhei uma cadeia com planta, lagarta e ave. Se houver menos plantas, a lagarta terá menos alimento, afetando também a ave.",
  ],
  "matéria e transformações": [
    "Quando o gelo derrete, a água muda de estado. Já no ferro enferrujado aparece outra substância. Por isso classifiquei os exemplos de formas diferentes.",
    "O sal não ficou visível quando misturei com água, mas pode ser recuperado por evaporação. Isso indica uma dissolução.",
  ],
  "corpo humano e saúde": [
    "Depois de subir as escadas, contei mais batimentos por minuto. Para comparar melhor, eu repetiria a medida depois de um minuto de repouso.",
    "O respiratório troca gases com o ar e o circulatório transporta oxigênio. Usei o caminho do ar até os alvéolos para explicar a ligação entre eles.",
  ],
  "energia e sustentabilidade": [
    "Comparei lâmpadas de 9 W e 60 W ligadas pelo mesmo tempo. A de 9 W consome menos energia. Também verificaria se as duas iluminam de forma parecida.",
    "Minha proposta é medir o consumo da sala antes e depois de desligar os aparelhos no intervalo. Registraria os horários para comparar a mesma duração de uso.",
  ],
};

export function addSampleSubmissions(school, today) {
  const submissions = (school.submissions ??= []);
  const existing = new Set(
    submissions.map((item) => `${item.assessmentId}:${item.studentId}`),
  );
  const sampleNames = new Set([
    "Marina Almeida",
    "Ana Clara Martins",
    "Daniel Martins",
  ]);
  const knownStudents = new Set(
    school.students
      .filter((student) => sampleNames.has(student.name))
      .map((student) => student.id),
  );
  const enrollmentsByClass = new Map();
  for (const enrollment of school.enrollments) {
    if (!enrollmentsByClass.has(enrollment.classId))
      enrollmentsByClass.set(enrollment.classId, []);
    enrollmentsByClass.get(enrollment.classId).push(enrollment);
  }
  const initialCount = submissions.length;

  for (const assessment of school.assessments) {
    if (
      assessment.format === "Prova" ||
      assessment.published > today ||
      assessment.archived
    )
      continue;
    const topic =
      /^Use os métodos estudados em (.+) e justifique suas escolhas\.$/.exec(
        assessment.instructions,
      )?.[1] ??
      /^Explore (.+)\. Use o material de apoio e apresente sua estratégia com exemplos\.$/.exec(
        assessment.instructions,
      )?.[1];
    const replies =
      responses[
        assessment.title === "Equações no cotidiano"
          ? "equações e padrões"
          : topic
      ];
    if (!topic || !replies) continue;

    const roster = (enrollmentsByClass.get(assessment.classId) || []).filter(
      (enrollment) =>
        enrollment.start <= assessment.published &&
        (!enrollment.end || enrollment.end >= assessment.day),
    );
    roster.forEach(({ studentId }, index) => {
      if (index >= 5 && !knownStudents.has(studentId)) return;
      const key = `${assessment.id}:${studentId}`;
      if (existing.has(key)) return;
      existing.add(key);
      submissions.push({
        id: `sample-${assessment.id}-${studentId}`,
        assessmentId: assessment.id,
        studentId,
        text: replies[index % replies.length],
        completed: true,
        submitted: `${assessment.published}T03:00:00.000Z`,
      });
    });
  }
  return submissions.length > initialCount;
}
