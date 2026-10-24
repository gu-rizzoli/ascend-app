# Ascend – Arquitetura técnica e backlog

24/10/2026 · gustavo.

O Ascend será um único app **Next.js em TypeScript**, com **PostgreSQL** acessado pelo **Drizzle**. As regras de negócio ficam num módulo separado da interface (RNF-07). A construção segue em 9 entregas, cada uma utilizável, começando por login e Metas.

## Stack

| Peça | Escolha | Por quê |
| --- | --- | --- |
| Linguagem | TypeScript, modo `strict` | Uma linguagem só, e os tipos pegam erros de regra cedo |
| Framework | Next.js (App Router) com Server Components e Server Actions | Telas e servidor no mesmo projeto, sem uma API separada para manter |
| Banco | PostgreSQL | Decidido no modelo de dados: enum, índice único parcial e `ON CONFLICT` |
| Acesso ao banco | Drizzle ORM e drizzle-kit para as migrações | O schema fica em TypeScript, perto do SQL, e as migrações são versionadas |
| Login | Implementação própria: tabela `sessao`, cookie `HttpOnly` e hash Argon2id | O v0.4 pede só e-mail e senha. Uma biblioteca grande traria mais do que o necessário |
| Validação | Zod | O mesmo esquema valida o formulário e a Server Action |
| Datas | `date-fns` com `@date-fns/tz` e datas civis como texto `AAAA-MM-DD` | Separa data civil, horário local e instante UTC (13.7) |
| Estilo | Tailwind CSS | Rápido para mobile-first e fácil de manter consistente |
| Testes | Vitest para as regras e Playwright para os fluxos principais | As regras de recorrência e fechamento precisam de testes, e o resto vem aos poucos |
| Qualidade | ESLint, Prettier e CI no GitHub Actions (tipos, lint e testes) | Cada mudança é verificada antes de entrar na `main` |
| Hospedagem | Netlify para o app e Neon para o banco, nos planos grátis | Custo zero para um usuário. Consigo publicar no Netlify daqui |
| Ferramentas | Node.js 22 LTS e pnpm | Versões estáveis e instalação rápida |

## Organização do código

O código tem três camadas: a interface chama serviços, e os serviços usam regras puras e o banco. As regras difíceis, como recorrência, fechamento e taxa do dia, ficam em funções sem banco e sem tela. Assim elas são testadas isoladamente.

```text
src/
  app/            rotas do Next.js, uma pasta por endereço da Navegação
    (auth)/       /entrar, /cadastro
    (app)/        áreas logadas: hoje, dia, metas, projetos, treinos, ...
  domain/         regras puras: recorrencia.ts, fechamento.ts, taxa.ts, datas.ts
  server/         serviços e Server Actions: transações e checagem de dono
  db/             schema.ts (Drizzle), migrações e conexão
  ui/             componentes visuais reaproveitáveis
tests/            testes do domain (Vitest) e fluxos (Playwright)
```

**Regras que valem em todo o código:**

- **Dono dos dados (13.6):** toda consulta passa pelo usuário da sessão. Nenhum serviço recebe `usuario_id` vindo do navegador.
- **Datas (13.7):** `hoje()` é calculado sempre em `America/Sao_Paulo`, num único lugar (`domain/datas.ts`). Datas civis trafegam como texto `AAAA-MM-DD` e nunca viram `Date` com fuso.
- **Fechamento preguiçoso (11.5):** o layout das áreas logadas chama `fecharDiasVencidos()` antes de renderizar. A função é idempotente e só trabalha se `fechado_ate` estiver atrasado.
- **Transações:** cada Server Action que grava mais de uma linha roda numa transação do Drizzle.
- **Nada de apagar histórico:** a exclusão física só existe nos casos que os documentos permitem. As chaves estrangeiras usam `RESTRICT` ou `SET NULL` conforme os modelos de dados.

## Conta e sessão

Implementado na entrega 1. Responde aos itens "método de sessão autenticada" e "regras de unicidade de e-mail" da seção 15.3 do v0.4.

- **Senha:** só o hash Argon2id é guardado (`usuario.senha_hash`), com os parâmetros mínimos da OWASP (19 MiB, 2 passagens). Mínimo de 8 caracteres.
- **E-mail:** guardado em minúsculas e sem espaços; único sem diferenciar maiúsculas (índice em `lower(email)`).
- **Sessão:** um token aleatório fica num cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção. O banco guarda só o hash SHA-256 do token (tabela `sessao`). A sessão vale 30 dias e é estendida quando passa da metade, então quem usa o app com frequência não precisa entrar de novo. Sair apaga a sessão do banco.
- **Erro ao entrar:** a mensagem é sempre "E-mail ou senha incorretos", sem dizer qual dos dois.
- **`fechado_ate`:** nasce como a véspera do cadastro, porque não há dias a fechar antes de a conta existir.

## Migrações em produção

O deploy de produção no Netlify roda `pnpm db:migrate` antes do build (`netlify.toml`). Assim o banco é atualizado no momento do merge na `main`. Se a migração falhar, o build para e a versão anterior continua no ar.

## Backlog

Cada entrega termina com algo que você consegue usar no celular, publicado no endereço do app. A ordem segue o uso: a partir da entrega 3 você já pode usar o Ascend para as metas do dia, enquanto o resto é construído.

| # | Entrega | Ao final, você consegue | Requisitos |
| --- | --- | --- | --- |
| 0 | Fundação | Abrir o app publicado (uma página simples), com o banco criado e o CI rodando | RNF-04, RNF-06 |
| 1 | Conta | Criar conta, entrar, sair e ver o estado vazio de Hoje | RF-GLO-01 a 06 |
| 2 | Hoje e metas simples | Criar metas binárias e numéricas com as 4 frequências, marcar, somar valor e navegar entre datas | RF-MET-01 a 08, 14 |
| 3 | Encerramento e correção | Ver dias passados encerrados sozinhos e corrigir um dia | RF-MET-11, 12, RF-GLO-10 |
| 4 | Recorrência completa | Editar "só esta" ou "esta e as próximas", adiar, pausar, reativar, excluir, reagendar e ver Todas as metas | RF-MET-09, 10, 13 |
| 5 | Projetos | Criar projetos, escolher o atual, ver o próximo passo em Hoje, concluir, arquivar e associar metas | RF-PRO-01 a 12 |
| 6 | Treinos | Montar o catálogo, registrar treino livre ou por modelo e ver o histórico de um exercício | RF-TRE-01 a 18 |
| 7 | Histórico | Ver o calendário com a taxa por dia, a lista, o detalhe do dia, os filtros e as 4 estatísticas | RF-HIS-01 a 15 |
| 8 | Ajustes finais | Alterar nome, e-mail e senha, ter o layout de computador e os testes de ponta a ponta | RF-GLO-11, RNF-05 |

Depois da entrega 8 vem a **validação**: usar o Ascend por 2 semanas antes de pensar em qualquer coisa nova (17).

## Decisões

Todas as quatro recomendações foram aprovadas em 24/10/2026 e valem como decisão.

| # | Pergunta | O que significa na prática | Recomendação |
| --- | --- | --- | --- |
| 1 | Onde hospedar? | Onde o app e o banco ficam no ar | Netlify (app) e Neon (banco), grátis. Você vai precisar criar uma conta no Neon na entrega 0, e eu te guio |
| 2 | Login próprio ou biblioteca pronta? | Auth.js e similares trazem login social, e-mail mágico e outras coisas fora do MVP | Próprio: cerca de 200 linhas, sob controle e seguindo o modelo já decidido |
| 3 | Como o código entra no repositório? | Direto na `main` ou por pull request | Uma pull request por entrega. Você olha o resultado, eu corrijo o que o CI apontar e você aprova o merge |
| 4 | Nomes no código em português ou inglês? | Ex.: `ocorrencia` ou `occurrence` | Português para o domínio (tabelas, regras, telas), igual aos documentos. Inglês só onde o framework exige |

A entrega 0 começou em 24/10/2026.
