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

Painel, turmas, busca, filtros por turma e bimestre, perfil individual, potencialidades observadas, evolução, planos com revisão e conclusão, registros pedagógicos, planejamento de avaliações e exportação CSV. O histórico mensal permanece completo; o filtro de bimestre altera a média e a comparação do período. Frequência e evidências por conteúdo são o consolidado atual, identificado na interface.

Planos, avaliações e registros são armazenados em sessionStorage e voltam aos valores iniciais quando a sessão termina. Preferências opcionais são persistidas somente após escolha afirmativa. A escolha de privacidade expira em 180 dias. Não há analytics, cookies HTTP ou chamadas de rede da aplicação para enviar registros. Fontes e ícones são empacotados localmente.

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

`npm run build` gera os arquivos de produção. `npx playwright install chromium` prepara o navegador e `npm test` executa oito testes: preferências e revogação, filtros, perfil e planos, avaliação e exportações, mobile, limpeza, histórico de navegação e varredura automatizada de acessibilidade WCAG A/AA em painel, perfil e privacidade. A varredura automatizada não substitui uma auditoria completa de acessibilidade.

O workflow `.github/workflows/frontend.yml` repete build e testes nas alterações do repositório.

## Entrega em PRs

1. `feat/painel-professor` → `main`: painel, navegação e estrutura.
2. `feat/perfil-e-planos` → `feat/painel-professor`: acompanhamento individual e fluxos.
3. `feat/privacidade-e-qualidade` → `feat/perfil-e-planos`: privacidade, acessibilidade e validação.

Revisar e integrar na ordem; retargetear cada PR para `main` após integrar seu predecessor. A última branch contém a aplicação completa. Nenhum PR é integrado automaticamente.
