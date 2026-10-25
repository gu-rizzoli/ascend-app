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
- **Alterar a conta (entrega 8, RF-GLO-11):** `/conta` tem um formulário para cada coisa: nome, e-mail e senha (`alterarNome()`, `alterarEmail()` e `alterarSenha()` em `src/server/conta.ts`). Trocar e-mail ou senha pede a senha atual. A nova senha é digitada duas vezes, porque o MVP não tem "esqueci minha senha". Trocar a senha apaga as sessões dos outros aparelhos, na mesma transação, e mantém a deste.

## Metas: lista do dia e materialização

Implementado na entrega 2, seguindo o [modelo de dados de Metas](../produto/modelo-dados-metas.md).

- **Tabelas:** `meta`, `meta_versao` e `ocorrencia`, com as restrições do modelo como `CHECK` no banco (unidade só em numérica, dias da semana só em semanal, intervalo de pelo menos 2 dias, origem `regra` ou `reagendada`). A coluna `projeto_id` da versão entra com a tabela `projeto`, na entrega 5.
- **Lista de uma data:** `listaDoDia()` busca as versões vigentes das metas ativas e as ocorrências gravadas com `data` ou `data_prevista` naquele dia. A regra pura `montarListaDoDia()` (em `src/domain/metas.ts`) calcula as vagas e ordena: com horário primeiro, depois as sem horário.
- **Gravar uma vaga:** só quando o usuário mexe nela. `garantirOcorrencia()` insere com `ON CONFLICT DO NOTHING` sobre a chave única `(meta_id, data_prevista) WHERE origem = 'regra'` e trava a linha até o fim da transação. Dois toques ao mesmo tempo não criam duas ocorrências.
- **Ocorrência única:** a versão nasce com `vigente_ate = vigente_de`.
- **Dias passados:** não se editam direto. Uma alteração que chega depois da meia-noite para o dia anterior é ignorada e a tela recarrega. Mudar um dia encerrado é correção retroativa (próxima seção).
- **"+ último incremento":** fica guardado só no aparelho (`localStorage`), porque o banco guarda só o valor atual (decisão 4 dos fluxos de Metas).

## Encerramento e correção

Implementado na entrega 3 (RF-MET-11, 12, RF-GLO-10).

- **Quando fecha:** o layout logado e a lista do dia chamam `usuarioComDiasFechados()`, memorizado por pedido. O Next.js renderiza layout e página em paralelo, então a página espera o fechamento antes de ler e nunca mostra um dia passado com pendentes. Se `fechado_ate` lido com a sessão já for ontem, nada é travado nem gravado.
- **O que faz:** `fecharDiasVencidos()` trava a linha do usuário (`FOR UPDATE`), grava como `nao_concluida` as vagas da regra entre `fechado_ate + 1` e ontem que ninguém abriu (em lotes de 500, com `ON CONFLICT DO NOTHING`), encerra as pendentes com data anterior a hoje preservando o valor parcial, preenche `encerrada_em` das concluídas e avança `fechado_ate`. Tudo numa transação. Dois pedidos ao mesmo tempo fecham uma vez só.
- **Quais vagas:** `vagasDoPeriodo()` (em `src/domain/fechamento.ts`) usa a vigência de cada versão, sem olhar o estado atual da meta. Assim uma meta pausada ou excluída depois continua com os dias em que estava ativa.
- **Virada da meia-noite:** com o app aberto, o próximo toque no dia anterior é ignorado, a tela recarrega já no dia novo e o aviso "Um novo dia começou" aparece por alguns segundos.
- **Correção:** `/dia/AAAA-MM-DD?corrigir=1`. As ações `corrigirConclusao()` e `corrigirValor()` recebem o id da ocorrência, conferem o dono e se a data é anterior a hoje, fecham os dias vencidos antes e marcam `corrigida_apos_encerramento`. Uma correção que não muda nada não marca a ocorrência.

## Recorrência completa

Implementado na entrega 4 (RF-MET-09, 10, 13), seguindo a seção "Recorrência" dos [fluxos de Metas](../produto/fluxos-metas.md).

- **Planos puros:** `src/domain/vigencia.ts` decide o que muda sem tocar no banco: `planoDeEdicao()` ("esta e as próximas"), `planoDeEncerramento()` (pausar e excluir), `planoDeReativacao()`, `ajusteSoEsta()`, `podeAdiar()` e `podeReagendar()`. Os testes cobrem cada regra dos fluxos.
- **Escritas:** `src/server/recorrencia.ts` aplica os planos numa transação, com a linha da meta travada (`FOR UPDATE`). As Server Actions ficam em `src/server/acoes-recorrencia.ts`, conferem o dono, fecham os dias vencidos antes e chamam `revalidatePath("/", "layout")`, porque mudam muitos dias de uma vez.
- **Versão vazia:** pausar uma regra que ainda não começou deixa a versão com `vigente_ate = vigente_de − 1` em vez de apagá-la, porque ocorrências podem apontar para ela. A restrição `meta_versao_vigencia` aceita esse caso (migração 0002).
- **Telas:** o título de cada linha abre `/metas/:id?dia=…&vaga=…` (ou `&ocorrencia=…` numa reagendada). A edição fica em `/metas/:id/editar`, com o mesmo contexto. `/metas` lista recorrentes, datas marcadas e pausadas.
- **Reagendadas:** não ocupam vaga da regra, então as ações de marcar e somar recebem uma referência (`RefOcorrencia`) que é a vaga ou o id da ocorrência.

## Projetos

Implementado na entrega 5 (RF-PRO-01 a 12), seguindo [Projetos](../produto/projetos.md).

- **Tabelas:** `projeto`, `projeto_atual_troca` e a coluna `meta_versao.projeto_id` (migração 0003). As duas chaves para `projeto` usam `ON DELETE SET NULL`, então excluir um projeto deixa as metas e as trocas sem ele.
- **Projeto atual:** `projetoAtualId()` lê a última troca do usuário. Toda escrita que grava troca trava a linha do usuário (`FOR UPDATE`) e grava o instante vindo do servidor, para a ordem das trocas do mesmo dia ser a real.
- **Regras puras:** `src/domain/projetos.ts` valida o formulário, agrupa a lista, decide a estrela (`trocaPelaEstrela()`), quando o destaque sai (`saiDoDestaque()`), o prazo vencido e quais metas pausar (`metasParaPausar()`).
- **Escritas:** as Server Actions ficam em `src/server/acoes-projetos.ts`. Concluir ou arquivar muda o status, grava a troca para nenhum se preciso e pausa as metas escolhidas com a mesma `pausar()` de Metas, tudo numa transação.
- **Metas:** o campo Projeto entra no formulário de criar e editar meta e só lista projetos abertos. O servidor confere o dono e o status (`projetoValidoParaMeta()`).
- **Telas:** `/projetos`, `/projetos/novo`, `/projetos/:id` e `/projetos/:id/editar`. O próximo passo se edita com um toque na lista, no detalhe e na linha do projeto atual em Hoje.
- **Projeto na lista do dia:** hoje e os próximos dias mostram o atual (`projetoAtual()`); um dia passado mostra o que estava em foco naquele dia (`projetoEmFoco()`, a última troca com `data` até ele), só com o nome.

## Treinos

Entrega 6. O desenho está em [Treinos](../produto/treinos.md).

- **Tabelas:** `exercicio`, `modelo_treino`, `modelo_exercicio`, `treino`, `treino_exercicio` e `serie` (migração 0004). As referências a `exercicio` usam `RESTRICT`; modelo e treino apagam os filhos em cascata; `treino.modelo_id` usa `SET NULL`.
- **Regras puras:** `src/domain/treinos.ts` normaliza nomes (`normalizarNome()`), busca no catálogo (`buscarExercicios()`), valida o treino descartando séries vazias (`validarTreino()`), monta o formulário a partir do modelo (`treinoDoModelo()`) e valida o modelo (`validarModelo()`).
- **Escritas:** `src/server/treinos.ts` grava treino e modelo inteiros numa transação, substituindo exercícios e séries ao editar, e confere que todo exercício é do usuário. As Server Actions ficam em `src/server/acoes-treinos.ts`; os formulários de treino e modelo mandam o conteúdo como JSON num campo só.
- **Catálogo inicial:** `EXERCICIOS_INICIAIS` entra no cadastro, na mesma transação da conta (`semearExercicios()`); as migrações 0005 e 0006 gravam a lista nas contas que já existiam. A 0006 também cria `exercicio.grupo` (enum `grupo_muscular`).
- **Criar exercício no registro:** `novoExercicio()` usa `ON CONFLICT DO NOTHING` sobre `(usuario_id, nome_normalizado)`. Se o nome já existe, devolve o existente (e o desarquiva).
- **Telas:** `/treinos`, `/treinos/novo` (escolha, depois `?livre=1` ou `?modelo=…`), `/treinos/:id`, `/treinos/:id/editar`, `/exercicios`, `/exercicios/:id`, `/modelos`, `/modelos/novo` e `/modelos/:id`. Exercícios e Modelos são abas de Treinos.

## Histórico

Implementado na entrega 7 (RF-HIS-01 a 15), seguindo [Histórico](../produto/historico.md). Sem migração.

- **Sem tabela própria:** `src/server/historico.ts` lê as ocorrências do período (`metasDoPeriodo()`, com o projeto da versão), os treinos (`treinosDoUsuario()` com período) e as trocas de projeto atual (`focosDosDias()`).
- **Regras puras:** `src/domain/historico.ts` conta a taxa por dia (`contagemPorDia()`, `percentual()`), as 4 estatísticas (`estatisticas()`), monta a grade do mês, lê os filtros do endereço, reconstrói o foco de cada dia (`focoPorDia()`) e agrupa a lista (`agruparPorData()`).
- **Fechamento:** as telas chamam `usuarioComDiasFechados()` antes de ler, então um dia passado nunca aparece com pendentes.
- **Correção:** a escrita saiu da Server Action para `corrigir()` em `src/server/correcao.ts`, que também tira a cópia pendente de uma original reagendada corrigida para concluída (decisão 21 dos fluxos de Metas) e avisa para revalidar os outros dias.
- **Telas:** `/historico`, `/historico/lista` e `/historico/AAAA-MM-DD`. A aba Histórico da barra passa a funcionar.
- **Abas instantâneas:** as 4 abas da barra usam prefetch completo, como as setas do dia, e o nome pulsa se o toque chegar antes. Qualquer outro link mostra o esqueleto de `src/app/(app)/loading.tsx` na hora. Por isso, toda escrita que muda outra área chama `revalidatePath("/", "layout")`, inclusive a correção retroativa, que muda o Histórico. Marcar uma meta de hoje ou do futuro continua com `refresh()`, porque o Histórico só mostra até ontem.

## Computador e testes de ponta a ponta

Entrega 8 (RNF-05), seguindo [Navegação](../produto/navegacao.md), "Celular e computador". Sem migração.

- **Layout:** a partir de 768 px (`md:` do Tailwind) a barra de baixo vira a barra lateral, com a Conta no fim, e o botão redondo vira um botão com nome no topo (`src/ui/botao-flutuante.tsx`). O conteúdo fica numa coluna de até 768 px, e os formulários em até 576 px.
- **Histórico:** o detalhe do dia lê o mês inteiro de uma vez e, no computador, mostra o calendário ao lado (`CalendarioDoMes` em `historico/calendario.tsx`). O celular continua igual.
- **Testes:** Playwright em `e2e/`, contra o build de produção (`pnpm build`, depois `pnpm test:e2e`) e o banco de `DATABASE_URL_TESTE`, que nunca pode ser o Neon. Cada teste cria a própria conta e roda duas vezes: celular (Pixel 7) e computador (1280 × 800). O CI roda depois do build.

## Região do banco

O Netlify grátis roda as funções em Ohio (`us-east-2`) e só os planos Pro e Enterprise escolhem outra região. Com o banco em São Paulo, cada consulta atravessava o continente (~120 ms). Em 25/10/2026 o banco passou para um projeto Neon novo em `aws-us-east-2`, ao lado das funções, com os dados copiados. O projeto de São Paulo ficou parado como cópia de segurança.

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
