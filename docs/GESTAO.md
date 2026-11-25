# PIES Gestão escolar

A versão autenticada usa Node.js 22 ou superior e SQLite. A raiz servida por `npm start` abre a gestão escolar. `npm run dev` continua disponível para o frontend anterior e disponibiliza a gestão em `/gestao.html` com o servidor da API ativo na porta 4173.

```sh
npm ci
npm run build
npm start
```

Para explorar as duas unidades do Colégio Horizonte, use `npm run build` e `npm run start:preview`. O comando usa um banco separado, atende apenas neste dispositivo e abre seis perfis predefinidos pelo botão de acesso ou pelo e-mail com qualquer senha. `npm start` usa a autenticação normal. Os registros da prévia ficam em `.pies/horizonte-previa-v3.sqlite`.

Para criar a primeira escola, defina `PIES_INITIAL_PASSWORD` no ambiente do comando `npm run provision` e passe na entrada padrão um JSON com `name`, `network` e `email`. A conta inicial usa o perfil de secretaria. Para provisionar a gestão de rede, passe `school`, `name`, `email` e `role` com o valor `rede`. A secretaria cria e suspende as outras contas, vincula alunos e responsáveis, matricula e registra movimentações. Use um banco separado e `npm run sample` para carregar o Colégio Horizonte com os seis perfis de avaliação.

`PIES_DB` aponta para o arquivo SQLite, que deve ficar em armazenamento persistente e com acesso restrito. O padrão é `.pies/escola.sqlite`. `PIES_HOST` e `PIES_PORT` configuram o servidor. Atrás de um proxy HTTPS, use `PIES_SECURE_COOKIE=1` e preserve o cabeçalho Host. Para e-mail, configure `PIES_SMTP_URL`, `PIES_MAIL_FROM` e `PIES_PUBLIC_URL` com HTTPS. Os e-mails incluem apenas o link e o nome da escola. A fila roda no servidor e tem tentativas de reenvio. Os alertas do painel funcionam sem SMTP.

O fechamento valida frequência e lançamentos por turma e componente. Uma reabertura registra o motivo e mantém o último boletim disponível até uma nova publicação. Na Educação Infantil, a devolutiva descritiva substitui a nota. A escola configura períodos, cálculo e referências de média e frequência.

O diário permite enfileirar chamadas durante perda de conexão após carregar a turma. A fila guarda identificadores e presenças no dispositivo, é separada por conta e permite revisão se o servidor detectar uma edição concorrente. A publicação de boletins e outras operações requerem conexão.

Os arquivos de matrícula inicial e situação do aluno são CSVs de conferência. A escola utiliza o leiaute oficial e as credenciais institucionais ao transmitir ao Educacenso. O servidor usa SQLite para uma instalação, e o comportamento sob carga nacional não foi medido.

Para executar os testes da gestão, rode `npm run build` antes de `npm test`. O teste de operação usa um banco efêmero e valida chamada sem conexão, sincronização, correção, publicação e consulta por responsável. O teste de API verifica isolamento entre escolas e bloqueio de lançamentos após o fechamento.
