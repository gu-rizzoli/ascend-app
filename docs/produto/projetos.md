# Ascend – Projetos: fluxos e modelo

24/10/2026 · gustavo

Projetos é o módulo mais simples do MVP: um projeto é um contexto de foco com status e próximo passo, sem tarefas (D-016, D-019). Este documento define os fluxos e a tabela `projeto`, reaproveitando o modelo de [Metas](modelo-dados-metas.md). As decisões que o [MVP v0.4](Ascend_Documentacao_Produto_MVP_v0.4.md) deixava em aberto foram tomadas em 24/10/2026 e estão no fim.

## Fluxos

**Lista de projetos:** o projeto atual aparece no topo, em destaque. Abaixo vêm grupos por status: Em andamento, Planejados e Pausados. Concluídos e Arquivados ficam recolhidos no fim (RNF-13). Cada linha mostra o nome, o próximo passo e, se houver, o selo "prazo vencido".

**Criar projeto (RF-PRO-01, 05, 06):**

1. "Novo projeto".
2. Nome, o único campo obrigatório.
3. Status, que vem como **Em andamento**.
4. Opcionais: descrição, próximo passo e prazo. A data de início vem como hoje e pode ser trocada.
5. Uma caixa "Tornar projeto atual", já marcada se não houver nenhum projeto atual.

**Projeto atual (RF-PRO-03, 04):** uma estrela em cada projeto. Tocar na estrela de outro projeto transfere o destaque e não muda o status de nenhum dos dois (D-018). Tocar na estrela do atual remove o destaque, e o usuário fica sem projeto atual. Cada toque grava uma troca, para o Histórico saber qual era o foco em cada data (D-053).

**Próximo passo:** é editável direto na lista e na tela Hoje, com um toque no texto. Não tem estado nem histórico (D-019).

**Mudar status (RF-PRO-02):**

| Novo status | Destaque de atual | Metas recorrentes associadas |
| --- | --- | --- |
| Planejado, Em andamento | Não muda | Não muda |
| Pausado | Não muda | Não muda |
| Concluído | Sai (RF-PRO-08) | O sistema pergunta (RF-PRO-09) |
| Arquivado | Sai | O sistema pergunta (RF-PRO-09) |

**A pergunta ao concluir ou arquivar** só aparece se houver metas recorrentes ativas associadas: "Este projeto tem 3 metas recorrentes. O que fazer com elas?", com as opções **Manter ativas**, **Pausar todas** e **Escolher uma a uma**. A terceira abre uma lista com um seletor por meta. Em qualquer caso, a associação com o projeto continua, porque ela é histórica.

**Reabrir:** um projeto concluído ou arquivado pode voltar para qualquer status. Reabrir não reativa metas que foram pausadas.

**Excluir (RF-PRO-11, 12):**

- **Sem metas associadas** em nenhuma versão, nem do passado: o projeto é excluído depois de uma confirmação simples.
- **Com metas associadas,** inclusive só no passado: o diálogo sugere arquivar como ação principal. "Excluir mesmo assim" continua disponível e exige digitar o nome do projeto. As metas ficam, mas sem associação. Isso responde à questão 15.4 sobre associações só históricas.
- Se o projeto excluído era o atual, o usuário fica sem projeto atual.

**Prazo vencido (15.4):** quando o prazo é anterior a hoje e o projeto não está concluído nem arquivado, aparece um selo "prazo vencido" na lista e na linha do projeto atual em Hoje. Não gera lembrete.

**Associar uma meta:** pelo campo "Projeto" no formulário da meta, que lista só projetos não concluídos nem arquivados. A tela do projeto mostra as metas ativas associadas, só para leitura, com link para cada uma.

## Modelo de dados

Basta uma tabela nova. As ligações com Metas e com o projeto atual já existem no modelo de Metas (`meta_versao.projeto_id` e `projeto_atual_troca`).

### projeto

| Coluna | Tipo | Regra |
| --- | --- | --- |
| id | uuid | PK |
| usuario_id | uuid | FK usuario, obrigatório |
| nome | text | Obrigatório |
| descricao | text | Opcional |
| status | enum `planejado`, `em_andamento`, `pausado`, `concluido`, `arquivado` | |
| proximo_passo | text | Opcional, texto livre |
| data_inicio | date | Obrigatória, data civil |
| prazo | date | Opcional, maior ou igual a `data_inicio` |
| criado_em, atualizado_em | timestamptz | |

**O projeto atual não é uma coluna.** Ele é a última linha de `projeto_atual_troca` do usuário. Assim, existe uma única fonte de verdade, e "no máximo um projeto atual" vale por construção. A mesma tabela responde "qual era o foco em tal data" para o Histórico.

**Operações:**

| Fluxo | O que grava |
| --- | --- |
| Criar | 1 `projeto`, mais 1 `projeto_atual_troca` se "Tornar atual" estiver marcado |
| Trocar ou remover o atual | 1 `projeto_atual_troca` com a data de hoje, com `projeto_id` nulo para remover |
| Concluir ou arquivar | Atualiza `status`. Se era o atual, grava uma troca para nenhum. Se o usuário escolher pausar metas, aplica a pausa de Metas em cada uma. Tudo numa transação |
| Excluir | Apaga o `projeto`. O `ON DELETE SET NULL` limpa `meta_versao.projeto_id` e `projeto_atual_troca.projeto_id`. Se era o atual, a última troca vira "nenhum" pelo próprio `SET NULL`, sem gravar outra |
| Prazo vencido | Nada é gravado. É calculado na leitura: `prazo < hoje AND status NOT IN ('concluido', 'arquivado')` |

Com o `SET NULL` em `projeto_atual_troca`, o Histórico mostra "sem projeto em foco" nas datas em que um projeto excluído era o atual. Isso segue a regra 10.8, "referência histórica ao projeto, enquanto ele existir".

## Decisões de 24/10/2026

| # | Pergunta | Decisão |
| --- | --- | --- |
| 1 | Status padrão ao criar | Em andamento |
| 2 | O primeiro projeto vira o atual? | Sim, com a opção de desmarcar |
| 3 | Pausar o projeto atual tira o destaque? | Não |
| 4 | Arquivar o projeto atual tira o destaque? | Sim, como ao concluir |
| 5 | Metas recorrentes ao concluir ou arquivar | Manter ativas, Pausar todas ou Escolher uma a uma |
| 6 | Excluir projeto com metas | Sugere arquivar; excluir mesmo assim exige digitar o nome |
| 7 | Reabrir projeto | Não reativa metas pausadas |

## Detalhes da implementação (entrega 5, 25/10/2026)

Pontos que a especificação deixava em aberto e foram resolvidos ao construir, sem mudar o escopo:

| # | Situação | Como ficou |
| --- | --- | --- |
| 8 | Status no formulário de criar e editar | Só Planejado, Em andamento e Pausado. Concluir e Arquivar têm botão próprio no detalhe, porque perguntam o que fazer com as metas |
| 9 | Projeto concluído pode ser arquivado? | Sim, com a mesma pergunta sobre metas. Um arquivado volta por Reabrir |
| 10 | Reabrir | Botão Reabrir no detalhe, ou trocar o status no formulário de edição |
| 11 | Estrela em projeto concluído ou arquivado | Não aparece: só um projeto aberto vira o atual |
| 12 | Onde o projeto atual aparece em Hoje | Só na lista do dia atual (`/hoje`). Em outras datas, o foco é assunto do Histórico |
| 13 | Projeto de uma meta recorrente | É parte da regra, como a descrição: muda só em "esta e as próximas" e as datas que passaram mantêm o projeto de antes |
| 14 | Ao concluir ou arquivar sem metas recorrentes ativas | Não há pergunta; o status muda com um toque |
| 15 | Confirmação por nome ao excluir | Ignora maiúsculas e espaços nas pontas |
