# PIES no Supabase

A versão pública carrega a interface no Cloudflare Pages. Perfis, turmas, alunos, avaliações e registros são lidos pela Edge Function do PIES. As alterações seguem pela mesma função até o PostgreSQL. O navegador guarda a sessão, e o build público inclui apenas os arquivos da interface.

O projeto PIES está na região de São Paulo. As migrations em supabase/migrations definem o esquema e a carga de 505 estudantes distribuídos em duas unidades. A carga usa generate_series, JOINs e funções de janela para gerar matrículas, chamadas, notas, atividades e boletins consistentes. O módulo SQLite continua disponível para os testes locais da aplicação.

A carga preserva os cinco nomes fornecidos para o projeto e combina 500 prenomes e 500 sobrenomes distintos a partir de tabelas agregadas do censo dos Estados Unidos. A atualização preserva as matrículas e os vínculos acadêmicos. [Dados de nomes do Censo de 2020](https://www.census.gov/topics/population/genealogy/data/2020_names.html)

## Conceitos no fluxo

| Conceito | Onde entra no PIES |
| --- | --- |
| Atomicidade | A RPC pies_commit grava os registros, a operação e a nova revisão na mesma transação. Uma violação de restrição reverte tudo. |
| Consistência | Chaves estrangeiras compostas vinculam registros à escola correta. CHECK valida notas de 0 a 10 e restringe formatos e estados. |
| Isolamento | FOR UPDATE serializa gravações por escola. Uma revisão alterada durante a edição exige nova leitura e validação. |
| Durabilidade | O PostgreSQL mantém os dados confirmados após COMMIT, inclusive quando a sessão ou o navegador é encerrado. |
| Chaves primárias e unicidade | UUIDs identificam os registros. Restrições UNIQUE impedem, por exemplo, duas notas da mesma avaliação para um aluno. |
| Relações N:N | Matrículas ligam alunos e turmas. As tabelas class_teachers e student_guardians representam os demais vínculos. |
| Normalização | Presença é registrada em attendance, com uma linha por aluno e aula. Campos complementares usam JSONB. |
| Índices | Índices compostos atendem buscas por escola, turma, avaliação e aluno. Um índice parcial cobre matrículas sem data de encerramento. |
| Views e agregações | A view pies.school_overview reúne os totais de alunos, turmas, boletins publicados e acompanhamentos. |
| Idempotência | A chave composta de operations impede que reenviar uma requisição repita sua gravação. |
| Auditoria | Uma alteração acadêmica registra ação, autor e instante. Fechamentos também registram a transição e o motivo, quando aplicável. |
| Escopo de acesso | O esquema acadêmico é privado. A Edge Function valida sessão e perfil antes de consultar ou alterar os registros. |

O [fluxograma em Mermaid](fluxograma-supabase.mmd) mostra as ramificações de consulta, validação, concorrência, transação e retorno à tela.

## Build público

    $env:VITE_PIES_API_URL = 'https://ffeyfemuxvumrospbjlt.supabase.co/functions/v1/pies'
    npm run build:pages

A saída em dist-pages aponta para a API por HTTPS. A chave de serviço fica no ambiente da Edge Function. Para executar a versão local com SQLite, use os passos de [gestão escolar](GESTAO.md).
