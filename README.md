# Sistema Inteligente de Análise de Desempenho Escolar

## 1. Introdução

A transformação digital no ambiente educacional vem modificando significativamente a forma como escolas acompanham o desenvolvimento acadêmico dos alunos. Entretanto, muitas instituições ainda enfrentam dificuldades relacionadas à interpretação e utilização eficiente dos dados pedagógicos, limitando a capacidade de identificar problemas de aprendizagem de maneira precoce e estratégica.

Grande parte das escolas realiza o acompanhamento do desempenho estudantil apenas por meio de médias gerais, boletins e frequência escolar. Apesar de importantes, esses indicadores apresentam uma visão superficial do processo de aprendizagem, dificultando a identificação de dificuldades específicas dos alunos e atrasando intervenções pedagógicas mais assertivas.

Nesse contexto, a integração de softwares educacionais com ferramentas analíticas surge como uma alternativa relevante para modernizar a gestão pedagógica.

---

## 2. Problemática

O principal problema identificado na análise de desempenho escolar está relacionado à ausência de mecanismos inteligentes capazes de diagnosticar dificuldades específicas dos alunos em tempo hábil.

Atualmente, em muitos ambientes escolares:

- As notas são analisadas apenas de forma geral;
- Professores possuem dificuldade em acompanhar individualmente todos os alunos;
- Há excesso de processos manuais e pouca integração tecnológica;
- A identificação de defasagens ocorre tardiamente;
- Os responsáveis recebem informações limitadas sobre o aprendizado.

### Como consequência:

- O rendimento escolar diminui;
- O aluno não recebe suporte direcionado;
- A escola perde capacidade estratégica de intervenção.

Outro fator crítico é que os sistemas tradicionais normalmente apresentam apenas indicadores quantitativos simples, sem aprofundamento analítico. Assim, um aluno pode possuir média razoável, mas apresentar deficiência grave em conteúdos específicos que futuramente comprometerão seu desenvolvimento acadêmico.

---

# Fluxograma do Sistema

<p align="center">
  <img src="./fluxo.jpeg" width="800"/>
  <img src="./fluxo3.jpeg" width="800"/>
</p>

# 👨‍🏫 Fluxograma — Professor

```mermaid
flowchart TD

    A([👨‍🏫 PROFESSOR])

    B["🔐 <b>1. LOGIN</b><br/><br/>Usuário + Senha"]

    C{"Credenciais válidas?"}

    D["❌ <b>ERRO DE LOGIN</b><br/><br/>Usuário ou senha inválidos"]

    E["📚 <b>2. PAINEL - CURSOS</b><br/><br/>Visualização dos cursos associados ao professor"]

    F["📅 <b>3. PAINEL - SEMESTRES</b><br/><br/>Visualização dos semestres disponíveis"]

    G["📊 <b>4. PAINEL - DESEMPENHO</b><br/><br/>Desempenho dos alunos por curso"]

    H([🚪 LOGOUT])

    A --> B
    B --> C

    C -- NÃO --> D
    D --> B

    C -- SIM --> E

    E --> F
    E --> G

    F --> G

    F --> H
    G --> H

    %% CORES

    style A fill:#061739,color:#fff,stroke:#061739,stroke-width:3px
    style B fill:#0D6EFD,color:#fff,stroke:#0D6EFD,stroke-width:2px
    style C fill:#ffffff,color:#111,stroke:#0D6EFD,stroke-width:3px
    style D fill:#FFEBEE,color:#C62828,stroke:#E53935,stroke-width:3px
    style E fill:#E8F5E9,color:#1B5E20,stroke:#00C853,stroke-width:3px
    style F fill:#F3E5F5,color:#6A1B9A,stroke:#8E24AA,stroke-width:3px
    style G fill:#FFF3E0,color:#E65100,stroke:#FB8C00,stroke-width:3px
    style H fill:#ECEFF1,color:#111,stroke:#90A4AE,stroke-width:3px
```

---

# 👨‍🎓 Fluxograma — Aluno

```mermaid
flowchart TD

    A([👨‍🎓 ALUNO])

    B["🔐 <b>1. LOGIN</b><br/><br/>Usuário + Senha"]

    C{"Credenciais válidas?"}

    D["❌ <b>ERRO DE LOGIN</b><br/><br/>Usuário ou senha inválidos"]

    E["📅 <b>2. PAINEL - SEMESTRES</b><br/><br/>Semestres disponíveis do curso"]

    F["📈 <b>3. PAINEL - DESEMPENHO</b><br/><br/>Desempenho acadêmico do aluno"]

    G([🚪 LOGOUT])

    A --> B
    B --> C

    C -- NÃO --> D
    D --> B

    C -- SIM --> E

    E --> F

    E --> G
    F --> G

    %% CORES

    style A fill:#061739,color:#fff,stroke:#061739,stroke-width:3px
    style B fill:#0D6EFD,color:#fff,stroke:#0D6EFD,stroke-width:2px
    style C fill:#ffffff,color:#111,stroke:#0D6EFD,stroke-width:3px
    style D fill:#FFEBEE,color:#C62828,stroke:#E53935,stroke-width:3px
    style E fill:#E8F5E9,color:#1B5E20,stroke:#00C853,stroke-width:3px
    style F fill:#FFF3E0,color:#E65100,stroke:#FB8C00,stroke-width:3px
    style G fill:#ECEFF1,color:#111,stroke:#90A4AE,stroke-width:3px
```
