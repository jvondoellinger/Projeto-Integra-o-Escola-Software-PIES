# Frontend PIES

## Executar

Requer Node.js 20.19+ ou 22.12+.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

## Escopo

React e Vite, com dados de exemplo definidos em `src/data.js`. Não utilizar os registros incluídos como evidência de pessoas ou resultados reais. Nenhuma mensagem de demonstração é exibida na interface, conforme o briefing.

Painel do professor, turmas, busca e filtros, perfil individual, potencialidades observadas, planos e registros pedagógicos. O gráfico anual cobre janeiro a dezembro, tem escala 0–10 e permite consultar as notas de cada mês. Médias bimestrais, mensais e por conteúdo são calculadas sobre os mesmos registros, com peso igual por nota. Ausência de avaliação não significa zero.

O professor cria provas, atividades em sala, tarefas de casa e trabalhos de longo prazo. Define publicação, prazo no horário de Brasília, antecedência do lembrete, orientações e materiais. Edita e arquiva avaliações, acompanha entregas, registra entregas presenciais e corrige com nota e devolutiva. A nota é atualizada no histórico sem duplicação.

O aluno tem painel, agenda de atividades, gráfico anual, histórico de notas e conteúdos de apoio com explicação, exemplo e exercício resolvido. Pode marcar como feita, salvar rascunho, enviar a resolução, retirar uma entrega ainda não corrigida antes do prazo e consultar a correção. Marcar como feita não equivale a entregar. Provas presenciais têm preparação e resultado, sem formulário de envio textual.

Avaliações, entregas e notas persistem em `localStorage` (`pies-school-v1`) até a limpeza manual; alterações sincronizam entre abas do mesmo navegador. Planos e observações permanecem na sessão. Preferências de visualização só são persistidas após escolha afirmativa. A escolha de privacidade expira em 180 dias. Não há analytics, cookies HTTP nem envio dos registros a servidores. Fontes e ícones são locais.

### Alertas operacionais

Os alertas são derivados de prazos, publicação, turma, entregas e correções. São recalculados a cada 30 segundos e ao retomar a janela. Entram na antecedência configurada, tornam-se atraso após o prazo, somem para o aluno após entrega e avisam o professor sobre correções pendentes. Uma correção gera um aviso para o aluno até que ele abra o resultado. Avaliações arquivadas ou ainda não publicadas não geram lembretes. Atividades feitas sem envio continuam com entrega pendente.

Estes são alertas dentro da aplicação aberta. Não há e-mail, push em segundo plano ou execução no servidor com o navegador fechado. Uma operação institucional precisa de serviço autenticado, banco e agendador de notificações. O seletor de áreas/estudantes organiza a navegação e não autentica nem autoriza usuários.

## Privacidade e produção

O frontend inclui aviso de privacidade fiel ao armazenamento implementado, termos, recusa equivalente à aceitação de preferências, personalização, revogação, limpeza da sessão e geração local de solicitação. Não há envio de pedido nem falso protocolo. Não se afirma conformidade integral com a LGPD.

Antes de inserir dados reais, implementar e revisar:

- autenticação, autorização por turma/escola e proteção das APIs no servidor;
- identificação do controlador/operador e encarregado, contato oficial, bases legais por finalidade e política de retenção;
- atendimento autenticado a titulares, correção/exclusão e auditoria;
- segurança de transporte e armazenamento, backups, monitoramento e resposta a incidentes;
- avaliação de riscos para dados de crianças e adolescentes e melhor interesse;
- revisão jurídica dos avisos e contratos para a operação concreta;
- infraestrutura de hospedagem, cabeçalhos de segurança e política de acesso.

As observações não são diagnósticos. Não se atribuem probabilidades de sucesso ou escores de capacidade; o educador revisa e decide o apoio. O sistema não concede acesso com base em uma seleção visual de perfil.

## Validação

`npm run build` gera os arquivos de produção. `npx playwright install chromium` prepara o navegador e `npm test` executa quinze testes de fluxos, sincronização entre abas, relógio controlado para lembretes/publicação/atraso, correção e atualização de notas, mobile e acessibilidade WCAG A/AA em professor, aluno e privacidade. A varredura automatizada não substitui uma auditoria completa de acessibilidade.

O workflow `.github/workflows/frontend.yml` repete build e testes nas alterações do repositório.

## Entrega em PRs

1. `feat/painel-professor` → `main`: painel, navegação e estrutura.
2. `feat/perfil-e-planos` → `feat/painel-professor`: acompanhamento individual e fluxos.
3. `feat/privacidade-e-qualidade` → `feat/perfil-e-planos`: privacidade, acessibilidade e validação.
4. `feat/desempenho-anual` → `feat/privacidade-e-qualidade`: histórico anual e médias rastreáveis.
5. `feat/avaliacoes-e-entregas` → `feat/desempenho-anual`: avaliações, publicação, prazos, persistência e correção.
6. `feat/portal-aluno-e-alertas` → `feat/avaliacoes-e-entregas`: portal do aluno, conteúdos e alertas automáticos.

Revisar e integrar na ordem; retargetear cada PR para `main` após integrar seu predecessor. A última branch contém a aplicação completa. Nenhum PR é integrado automaticamente.
