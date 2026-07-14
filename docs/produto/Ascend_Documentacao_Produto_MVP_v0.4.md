# Ascend - Documentação de Produto e MVP

**Versão:** 0.4  
**Data:** 14 de julho de 2026  
**Status:** Escopo funcional do MVP fechado  
**Marco desta versão:** Histórico e regras globais fechados; Lembretes removidos do MVP; plataforma inicial definida

> Este documento registra somente decisões confirmadas. Sugestões ainda não validadas aparecem como hipóteses, itens futuros ou questões em aberto, nunca como requisitos obrigatórios.

## 1. Propósito da documentação

Este documento é a fonte central das decisões do Ascend. Ele existe para:

- registrar o problema que o produto pretende resolver;
- separar decisões confirmadas de ideias futuras;
- controlar o escopo do MVP;
- manter consistência durante o desenvolvimento com auxílio de IA;
- evitar que sugestões antigas sejam tratadas como requisitos atuais;
- registrar mudanças de direção e seus motivos;
- servir como base para casos de uso, fluxos, modelagem de dados e implementação.

**Regra de manutenção:** atualizar o documento ao concluir um módulo funcional, alterar uma regra importante, remover uma funcionalidade do MVP ou fechar uma decisão técnica que afete o comportamento do produto.

## 2. Resumo executivo

O Ascend será um sistema pessoal para planejar e acompanhar metas, manter um projeto em foco e registrar treinos de musculação. O produto nasce para uso individual, mas deve evitar decisões que impossibilitem uma evolução futura.

O MVP não pretende ser um gerenciador completo de tarefas, um software de gestão de projetos, um aplicativo avançado de academia ou um assistente de inteligência artificial. Ele deve entregar um conjunto pequeno de funções que tenham utilidade real quando usadas em conjunto.

### 2.1 Estado atual do escopo

| Área | Estado | Observação |
|---|---|---|
| Metas e planejamento | Fechada funcionalmente | Tipos, recorrência, encerramento, correção e reagendamento definidos |
| Projetos | Fechada funcionalmente | Projeto como contexto de foco, sem tarefas internas |
| Treinos | Fechada funcionalmente | Musculação com modelos, treino livre e registro série por série |
| Histórico | Fechada funcionalmente | Calendário, lista, detalhe diário, filtros e métricas mínimas definidos |
| Lembretes e notificações | Fora do MVP | Adiados por custo técnico e baixa necessidade para validar o núcleo |
| Autenticação e primeiro acesso | Fechados funcionalmente | E-mail e senha; estado vazio no primeiro acesso |
| Plataforma e fuso horário | Fechados para o MVP | Web responsiva mobile-first; `America/Sao_Paulo` como fuso fixo |
| Fluxos, navegação e arquitetura | Próxima etapa | Serão definidos a partir deste escopo fechado |

### 2.2 Princípio de escopo

Uma funcionalidade não entra no MVP apenas por ser útil ou interessante. Ela precisa ser necessária para validar o uso real do produto e justificar o custo de implementação e manutenção.

## 3. Problema central

Atualmente, o usuário controla mentalmente metas e informações da rotina. Isso dificulta visualizar o que precisa ser feito, registrar progresso de forma consistente e consultar a evolução ao longo do tempo.

### 3.1 Problema escolhido

O Ascend deve permitir acompanhar produtividade e evolução física em um único sistema, sem obrigar o usuário a distribuir metas, projetos e treinos entre diversas ferramentas.

### 3.2 Hipótese de valor

Se o usuário puder planejar o dia, atualizar metas, consultar próximas atividades, manter um projeto em foco e registrar treinos em um único lugar, ele dependerá menos da memória e terá maior clareza sobre execução e evolução.

### 3.3 Risco principal

Centralizar funcionalidades demais pode tornar o produto confuso. Os módulos devem coexistir sem serem misturados indevidamente e sem obrigar todas as informações a aparecerem na mesma tela.

O risco secundário é o crescimento prematuro do escopo: adicionar relatórios, IA, gamificação ou recursos avançados antes que o fluxo básico esteja sendo usado de forma consistente.

## 4. Contexto de uso

- Frequência esperada: aproximadamente cinco acessos por dia.
- Ações principais: atualizar metas, verificar próximas atividades, registrar treino e outros dados.
- O sistema deve permitir tanto planejar quanto acompanhar a execução do dia.
- O registro de treino não precisa ser otimizado para uso durante o treino no MVP.
- A entrada de dados deve priorizar cliques e seleções, mantendo digitação quando necessária.
- Um rastreador de metas isolado não seria suficiente para o uso pretendido.
- As funcionalidades da primeira versão não precisam aparecer juntas na tela inicial.

## 5. Princípios do produto

1. **Utilidade antes de abrangência:** uma funcionalidade só entra no MVP quando contribui diretamente para o uso real.
2. **Módulos independentes:** metas, projetos e treinos não precisam ocupar a mesma tela nem compartilhar regras sem necessidade.
3. **Histórico confiável:** reagendamentos, edições e exclusões não devem apagar silenciosamente o que ocorreu.
4. **Baixo atrito:** ações recorrentes devem exigir poucos passos e poucos campos obrigatórios.
5. **Complexidade adiada:** recursos interessantes, mas não essenciais, permanecem no backlog.
6. **Decisões explícitas:** recomendações não se tornam requisitos até serem avaliadas e confirmadas.
7. **Simplicidade estrutural:** não criar um segundo produto dentro de um módulo.
8. **Acoplamento mínimo:** integrações entre módulos devem existir somente quando gerarem valor claro.
9. **Preservação histórica:** modelos e cadastros editáveis não devem alterar registros antigos retroativamente.
10. **Correção sem ocultação:** o usuário pode corrigir dados antigos, mas o sistema deve indicar que houve alteração posterior.

## 6. Escopo confirmado do MVP

O MVP é composto por quatro módulos funcionais e uma fundação transversal:

1. Metas e planejamento diário.
2. Projetos.
3. Treinos.
4. Histórico e estatísticas básicas.
5. Autenticação simples, regras de usuário, plataforma responsiva e tratamento consistente de datas.

Os quatro módulos funcionais e as regras globais estão fechados nesta versão. A partir deste marco, novas funcionalidades não devem ser adicionadas ao MVP sem reabrir formalmente o escopo e justificar o impacto.

Lembretes e notificações foram removidos do MVP. Horários continuam pertencendo às metas, mas não haverá entrega automática de avisos nesta versão.

---

## 7. Módulo de Metas e Planejamento Diário

### 7.1 Objetivo

Permitir que o usuário planeje datas, acompanhe o dia atual, atualize metas e mantenha um histórico fiel do que foi ou não realizado.

### 7.2 Dados de uma meta

Cada meta deve possuir:

- título;
- descrição opcional;
- tipo;
- frequência;
- horário opcional;
- data de início;
- valor-alvo e unidade, quando for numérica.

Ficam fora do MVP:

- categoria;
- prioridade;
- etiquetas;
- cor personalizada;
- ordenação manual por arrastar.

### 7.3 Tipos de meta

#### Meta binária

Representa uma ação que pode ser marcada como concluída ou não concluída.

Exemplos:

- ir à academia;
- estudar Java;
- dormir antes de determinado horário.

#### Meta numérica

Possui valor atual, valor-alvo e unidade.

Exemplos:

- água: 1,5 de 3 litros;
- estudo: 1 de 2 horas;
- proteína: 80 de 120 gramas.

O valor atual pode ser atualizado gradualmente ao longo do dia.

### 7.4 Frequências suportadas

O MVP deve permitir:

- uma única ocorrência;
- repetição diária;
- repetição em dias selecionados da semana;
- repetição a cada X dias.

Regras mensais complexas, como "toda segunda terça-feira do mês", ficam fora do MVP.

### 7.5 Organização das metas do dia

As metas devem ser exibidas nesta ordem:

1. metas com horário, ordenadas cronologicamente;
2. metas sem horário.

O usuário não precisa reorganizar manualmente a lista no MVP.

### 7.6 Planejamento de datas futuras

O usuário pode abrir uma data futura e adicionar metas específicas, mesmo que elas não sejam recorrentes.

O Ascend deve servir tanto para planejamento quanto para acompanhamento da execução.

### 7.7 Edição de metas recorrentes

Ao editar uma ocorrência pertencente a uma recorrência, o sistema deve perguntar se a alteração vale para:

- apenas aquela ocorrência;
- aquela ocorrência e as futuras.

Ocorrências anteriores não devem ser alteradas.

### 7.8 Pausa e reativação

Uma meta recorrente pode ser pausada sem ser excluída.

Durante a pausa:

- novas ocorrências não devem ser geradas;
- o histórico anterior deve permanecer intacto.

A meta pode ser reativada posteriormente.

### 7.9 Regras para metas numéricas

- O usuário pode atualizar o valor aos poucos.
- O sistema deve permitir ultrapassar o valor-alvo.
- O indicador visual pode parar em 100%, mas o valor real deve ser preservado.
- Se o dia terminar abaixo do alvo, a meta é registrada como não concluída.
- Mesmo quando não concluída, o valor atingido permanece salvo no histórico.

### 7.10 Encerramento do dia

O dia deve ser encerrado automaticamente.

Ao encerrar:

- metas pendentes tornam-se não concluídas;
- valores parciais de metas numéricas são preservados;
- o usuário não precisa pressionar um botão de encerramento.

No MVP, o dia é interpretado no fuso fixo `America/Sao_Paulo`. O encerramento lógico ocorre à meia-noite desse fuso. Não é obrigatório executar um processo exatamente à meia-noite: o backend pode identificar e finalizar ocorrências vencidas no próximo acesso ou operação relevante.

### 7.11 Correção retroativa

O usuário pode corrigir registros anteriores pelo histórico.

O MVP não precisa de auditoria completa, mas cada ocorrência corrigida deve guardar:

- data e hora da última alteração;
- indicação de que foi modificada depois do encerramento do dia.

O sistema não deve alterar histórico silenciosamente.

### 7.12 Reagendamento

Uma meta não concluída pode ser reagendada manualmente.

Regras:

- a ocorrência original permanece registrada como não concluída;
- uma nova ocorrência é criada na data escolhida;
- a nova ocorrência fica vinculada à ocorrência original;
- o reagendamento não transforma a falha anterior em conclusão.

### 7.13 Requisitos funcionais do módulo de Metas

- **RF-MET-01:** criar meta binária.
- **RF-MET-02:** criar meta numérica com valor-alvo e unidade.
- **RF-MET-03:** definir descrição, data de início e horário opcional.
- **RF-MET-04:** configurar ocorrência única, diária, semanal por dias selecionados ou a cada X dias.
- **RF-MET-05:** planejar uma meta para uma data futura.
- **RF-MET-06:** gerar e consultar ocorrências sem sobrescrever o histórico.
- **RF-MET-07:** atualizar gradualmente o valor de uma meta numérica.
- **RF-MET-08:** permitir que o valor realizado ultrapasse o alvo.
- **RF-MET-09:** editar apenas uma ocorrência ou aquela ocorrência e as futuras.
- **RF-MET-10:** pausar e reativar uma recorrência.
- **RF-MET-11:** encerrar automaticamente ocorrências pendentes como não concluídas.
- **RF-MET-12:** corrigir registros anteriores e identificar alteração retroativa.
- **RF-MET-13:** reagendar uma ocorrência mantendo vínculo com a original.
- **RF-MET-14:** ordenar metas com horário antes das metas sem horário.

### 7.14 Itens adiados no módulo de Metas

- categorias;
- prioridades;
- drag and drop;
- regras mensais avançadas;
- dependência entre metas;
- pontuação ou gamificação;
- sequência de dias;
- análises por inteligência artificial;
- lembretes e notificações.

---

## 8. Módulo de Projetos

### 8.1 Objetivo

Oferecer contexto de foco para o usuário sem transformar o Ascend em um gerenciador de projetos completo.

No MVP, um projeto representa uma iniciativa como um todo. Ele não possui tarefas internas.

### 8.2 Dados de um projeto

Cada projeto deve possuir:

- nome;
- descrição opcional;
- status;
- próximo passo em texto livre;
- data de início;
- prazo opcional;
- indicação de projeto atual.

O campo de link externo fica fora do MVP.

### 8.3 Status suportados

- planejado;
- em andamento;
- pausado;
- concluído;
- arquivado.

### 8.4 Projeto atual

O usuário pode ter vários projetos cadastrados ou em andamento, mas somente um pode estar marcado como projeto atual.

Ao marcar outro projeto como atual:

- o anterior perde apenas o destaque;
- o status do projeto anterior não é alterado automaticamente.

### 8.5 Próximo passo

O campo de próximo passo é um texto livre.

Exemplo:

> Implementar a recorrência das metas.

Ele não é uma tarefa, não possui estado próprio e não deve gerar uma estrutura paralela de gerenciamento de tarefas.

### 8.6 Associação entre metas e projetos

Uma meta pode ser associada opcionalmente a um projeto.

Exemplo:

- meta: trabalhar uma hora no backend;
- projeto associado: Ascend.

A meta continua pertencendo ao módulo de Metas. O projeto funciona apenas como contexto.

### 8.7 Conclusão e arquivamento de projeto

Ao marcar um projeto como concluído:

- ele deixa automaticamente de ser o projeto atual;
- o sistema pergunta o que fazer com metas recorrentes associadas.

Ao arquivar um projeto com metas recorrentes associadas, o sistema também deve perguntar o que fazer com essas metas.

O usuário pode decidir manter ou pausar as metas. O tratamento individual pode ser oferecido caso a interface permaneça simples.

### 8.8 Exclusão

Regras confirmadas:

- projetos sem registros associados podem ser excluídos definitivamente;
- projetos com metas associadas devem priorizar o arquivamento;
- a exclusão definitiva permanece disponível mediante confirmação clara;
- metas existentes não são apagadas ao excluir o projeto;
- as metas apenas perdem a associação com o projeto.

O sistema não deve excluir metas em cascata ao apagar um projeto.

### 8.9 Requisitos funcionais do módulo de Projetos

- **RF-PRO-01:** criar, visualizar e editar projeto.
- **RF-PRO-02:** definir um dos cinco status suportados.
- **RF-PRO-03:** permitir vários projetos cadastrados e somente um projeto atual.
- **RF-PRO-04:** trocar o projeto atual sem alterar automaticamente o status do anterior.
- **RF-PRO-05:** registrar próximo passo como texto livre.
- **RF-PRO-06:** definir data de início e prazo opcional.
- **RF-PRO-07:** associar uma meta opcionalmente a um projeto.
- **RF-PRO-08:** remover automaticamente a marcação de projeto atual ao concluir o projeto.
- **RF-PRO-09:** perguntar o que fazer com metas recorrentes ao concluir ou arquivar o projeto.
- **RF-PRO-10:** arquivar projeto sem destruir histórico.
- **RF-PRO-11:** excluir definitivamente mediante confirmação.
- **RF-PRO-12:** remover a associação das metas sem excluí-las quando um projeto for apagado.

### 8.10 Itens adiados no módulo de Projetos

- tarefas e subtarefas;
- Kanban;
- dependências;
- controle de horas;
- percentual manual de progresso;
- anexos;
- links externos;
- diário de progresso;
- colaboração entre usuários.

O diário de progresso foi considerado uma funcionalidade de valor, mas foi removido do MVP porque exigiria entidade, endpoints e interface próprios sem ser necessário para validar o núcleo do módulo.

---

## 9. Módulo de Treinos

### 9.1 Objetivo

Permitir que o usuário registre sessões de musculação de forma consistente e consulte posteriormente o histórico de sessões e de cada exercício.

O módulo deve registrar o que foi realizado. Ele não deve prescrever treinos, sugerir progressão ou substituir acompanhamento profissional.

### 9.2 Limite funcional do MVP

O MVP aceitará apenas musculação baseada em:

- exercícios;
- séries;
- repetições;
- carga em quilogramas;
- observações opcionais.

Ficam fora do MVP registros baseados em tempo, distância, ritmo, calorias, frequência cardíaca ou outros formatos esportivos.

### 9.3 Cadastro reutilizável de exercícios

Os exercícios devem ser cadastrados uma vez e reutilizados em modelos e sessões.

O usuário também deve poder criar um exercício rapidamente durante o registro de um treino, sem abandonar o fluxo atual.

Essa regra reduz duplicações acidentais como:

- Supino;
- Supino reto;
- supino reto;
- Supino com barra.

A interface deve ajudar a localizar exercícios existentes antes de criar um novo, mas não deve impedir variações legítimas de exercício.

### 9.4 Exclusão e arquivamento de exercícios

- Um exercício nunca utilizado pode ser excluído definitivamente.
- Um exercício já utilizado em modelo ou sessão deve ser arquivado, não apagado.
- Exercícios arquivados deixam de aparecer como opção padrão para novos registros.
- Sessões antigas continuam exibindo o exercício arquivado normalmente.

Essa regra preserva o histórico e evita referências quebradas.

### 9.5 Registro série por série

Cada exercício realizado deve possuir uma ou mais séries registradas individualmente.

Exemplo:

```text
Supino reto
Série 1: 40 kg x 10
Série 2: 40 kg x 9
Série 3: 38 kg x 8
```

Regras:

- repetições são obrigatórias em cada série;
- carga é opcional;
- carga, quando informada, é registrada em quilogramas;
- observação por série é opcional;
- a ordem das séries deve ser preservada.

A carga é opcional para permitir exercícios com peso corporal, como flexão, barra fixa, paralelas e abdominais, sem exigir o preenchimento artificial de `0 kg`.

### 9.6 Modelos predefinidos

O usuário pode criar modelos reutilizáveis de treino.

Cada modelo deve possuir:

- nome;
- observação opcional;
- lista ordenada de exercícios;
- quantidade sugerida de séries por exercício;
- faixa sugerida de repetições por exercício.

A carga não pertence ao modelo e não deve ser armazenada como sugestão no MVP.

### 9.7 Modelo como ponto de partida

Ao iniciar uma sessão usando um modelo, o sistema deve copiar a estrutura do modelo para a nova sessão.

Depois da cópia:

- a sessão passa a ser um registro independente;
- o usuário pode adicionar ou remover exercícios;
- o usuário pode realizar quantidade diferente de séries;
- o usuário pode registrar repetições fora da faixa sugerida;
- alterações futuras no modelo não modificam sessões antigas.

O modelo é uma orientação e um atalho de preenchimento, não uma restrição.

### 9.8 Treino livre

O usuário pode registrar uma sessão sem utilizar modelo.

O treino livre deve permitir:

- nome opcional para a sessão;
- data do treino;
- inclusão de exercícios;
- inclusão, remoção e ordenação de séries;
- registro de repetições e carga por série;
- observação geral opcional.

A duração do treino fica fora do MVP.

### 9.9 Registro posterior ao treino

O MVP não precisa ser otimizado para registro em tempo real durante a sessão.

Consequências desta decisão:

- não há cronômetro de descanso;
- não há navegação automática entre séries;
- não há exigência de salvamento a cada interação;
- a interface pode priorizar um formulário simples e confiável.

Isso não impede uma futura experiência de uso durante o treino, mas evita que o MVP assuma essa complexidade.

### 9.10 Histórico mínimo

O MVP deve oferecer duas formas de consulta.

#### Histórico de sessões

Exemplo:

```text
10/07 - Peito e tríceps
08/07 - Costas e bíceps
```

Cada item deve permitir abrir os detalhes completos da sessão.

#### Histórico por exercício

Exemplo:

```text
Supino reto
10/07 - 40 x 10, 40 x 9, 38 x 8
03/07 - 38 x 10, 38 x 10, 38 x 8
```

O histórico por exercício deve reunir todas as séries registradas daquele exercício em ordem cronológica.

Ficam fora do MVP:

- gráficos;
- recordes automáticos;
- cálculo de volume;
- estimativa de uma repetição máxima;
- comparação automática entre sessões;
- recomendações de progressão.

### 9.11 Edição e exclusão de sessões

O usuário pode editar ou excluir treinos anteriores.

Regras mínimas:

- a edição deve refletir no histórico da sessão e do exercício;
- a exclusão deve exigir confirmação;
- a exclusão não deve apagar o exercício reutilizável do catálogo;
- o MVP não exige auditoria completa de alterações de treino.

### 9.12 Integração com metas

Registrar um treino não conclui automaticamente uma meta como "Treinar".

No MVP, o usuário deve atualizar a meta manualmente.

A automação foi adiada porque exigiria associação explícita entre a meta e o módulo de Treinos, além de regras para múltiplas metas, sessões incompletas e datas divergentes. O ganho de conveniência não justifica esse acoplamento neste estágio.

### 9.13 Requisitos funcionais do módulo de Treinos

- **RF-TRE-01:** criar e editar exercício reutilizável.
- **RF-TRE-02:** localizar exercício existente durante o registro.
- **RF-TRE-03:** criar exercício rapidamente sem abandonar o registro atual.
- **RF-TRE-04:** excluir exercício nunca utilizado.
- **RF-TRE-05:** arquivar exercício já utilizado sem alterar sessões antigas.
- **RF-TRE-06:** criar, editar e excluir modelo de treino.
- **RF-TRE-07:** definir nome, observação, exercícios ordenados, séries sugeridas e faixa de repetições no modelo.
- **RF-TRE-08:** iniciar sessão a partir de uma cópia independente do modelo.
- **RF-TRE-09:** registrar treino livre sem modelo.
- **RF-TRE-10:** adicionar e remover exercícios em uma sessão.
- **RF-TRE-11:** registrar séries individualmente e preservar sua ordem.
- **RF-TRE-12:** registrar repetições obrigatórias e carga opcional em quilogramas.
- **RF-TRE-13:** registrar observação opcional por série e por sessão.
- **RF-TRE-14:** permitir que a execução divirja das sugestões do modelo.
- **RF-TRE-15:** consultar histórico de sessões.
- **RF-TRE-16:** consultar histórico por exercício.
- **RF-TRE-17:** editar sessão antiga e atualizar as consultas históricas.
- **RF-TRE-18:** excluir sessão antiga mediante confirmação.

### 9.14 Critérios de aceitação do módulo de Treinos

O módulo pode ser considerado funcionalmente válido quando:

1. o usuário consegue registrar um treino livre completo sem cadastrar previamente um modelo;
2. o usuário consegue reutilizar exercícios existentes sem criar duplicatas desnecessárias;
3. o usuário consegue criar um exercício durante o registro e continuar a sessão;
4. o usuário consegue criar um modelo e iniciar uma sessão com os exercícios já preenchidos;
5. editar um modelo não altera uma sessão criada anteriormente;
6. a sessão permite alterar exercícios, séries e repetições independentemente do modelo;
7. exercícios com peso corporal podem ser registrados sem carga;
8. o histórico de sessões apresenta os dados registrados;
9. o histórico de um exercício reúne corretamente suas aparições em diferentes sessões;
10. arquivar um exercício não remove seus registros antigos;
11. editar ou excluir uma sessão atualiza o histórico de forma coerente.

### 9.15 Itens adiados no módulo de Treinos

- registro durante o treino;
- cronômetro e descanso entre séries;
- exercícios por tempo ou distância;
- duração da sessão;
- séries de aquecimento diferenciadas;
- supersets e técnicas avançadas;
- carga sugerida;
- progressão automática;
- cálculo de volume;
- recordes e estimativa de 1RM;
- gráficos e comparações automáticas;
- integração automática com metas;
- peso corporal;
- medidas corporais;
- fotos de evolução;
- prescrição de treino.

---

## 10. Módulo de Histórico

### 10.1 Objetivo

Permitir que o usuário consulte o que foi planejado e realizado em datas anteriores sem criar uma cópia paralela dos dados dos demais módulos.

O Histórico é uma camada de consulta sobre ocorrências de metas, associações com projetos e sessões de treino. Ele não deve manter uma tabela genérica duplicando cada registro do sistema.

### 10.2 Visões principais

O MVP deve oferecer três formas complementares de consulta:

1. **Calendário:** visão rápida do desempenho de cada dia.
2. **Lista cronológica:** registros agrupados por data.
3. **Detalhe do dia:** visão consolidada de uma data específica.

Não haverá uma linha do tempo de cada microalteração realizada no sistema. Esse nível de auditoria produziria ruído e não é necessário para o uso pessoal do MVP.

### 10.3 Calendário

Cada dia que possua metas planejadas deve exibir a taxa de conclusão daquele dia.

Exemplo:

```text
15 de julho - 75%
```

Regras:

- o percentual considera as metas planejadas para a data;
- uma meta binária concluída conta como concluída;
- uma meta numérica conta como concluída somente quando atinge ou ultrapassa o valor-alvo;
- o valor parcial continua disponível no detalhe do dia;
- um dia sem metas planejadas aparece de forma neutra;
- um dia neutro não conta como 0%, falha ou ausência de disciplina.

A interface pode utilizar intensidade visual para facilitar leitura, mas não deve classificar dias como moralmente "bons" ou "ruins".

### 10.4 Lista cronológica

A lista deve agrupar registros por data e permitir percorrer períodos anteriores sem misturar cada alteração individual.

Cada grupo diário pode apresentar um resumo contendo:

- metas concluídas e não concluídas;
- valores parciais de metas numéricas;
- treino registrado, quando houver;
- projeto associado às metas, quando houver;
- projeto que estava em foco naquela data, quando essa informação estiver registrada.

A lista é uma forma de navegação e não uma segunda fonte de dados.

### 10.5 Detalhe do dia

Ao abrir uma data, o usuário deve poder consultar:

- metas planejadas naquele dia;
- estado final de cada meta;
- valor alcançado em metas numéricas;
- indicação de reagendamento, quando existir;
- projeto associado a cada meta;
- projeto que estava marcado como atual naquela data;
- sessão de treino registrada naquela data;
- indicação de correção retroativa em metas alteradas após o encerramento.

O projeto exibido como foco histórico deve representar o projeto em foco naquela data, e não o projeto atual no momento da consulta.

Para viabilizar isso sem criar uma linha do tempo completa de projetos, o sistema deve guardar as mudanças de marcação de projeto atual. Não é necessário registrar todas as mudanças de status do projeto no MVP.

### 10.6 Correções retroativas

O usuário pode alterar registros anteriores sem informar justificativa.

Para metas corrigidas depois do encerramento do dia, o sistema deve preservar:

- data e hora de criação;
- data e hora da última alteração;
- indicação de alteração posterior ao encerramento.

O MVP não exige histórico completo de versões, autor da edição ou comparação entre valores antigos e novos.

Treinos antigos também podem ser editados ou excluídos conforme as regras do módulo de Treinos.

### 10.7 Filtros mínimos

O Histórico deve permitir filtros por:

- intervalo de datas;
- tipo de registro: metas ou treinos;
- projeto associado, quando aplicável.

Ficam fora do MVP:

- busca textual;
- filtros por categorias ou etiquetas;
- filtros avançados por exercício, carga, status ou unidade;
- combinações salvas de filtros.

### 10.8 Histórico de projetos

O MVP não manterá uma linha do tempo completa de alterações de status dos projetos.

A área de Projetos mostra o estado atual. No Histórico, serão preservadas apenas as informações necessárias para contexto:

- associações históricas entre metas e projetos;
- momentos em que um projeto passou a ser o projeto atual;
- referência histórica ao projeto, enquanto ele existir.

Não será possível calcular com precisão quanto tempo um projeto permaneceu pausado ou reconstruir todas as mudanças de status. Esse recurso fica para uma versão futura.

### 10.9 Exclusões e preservação

- Um treino excluído deixa de aparecer no Histórico.
- Excluir uma sessão não exclui o exercício reutilizável.
- Excluir um projeto não apaga metas antigas.
- Metas antigas associadas a um projeto excluído permanecem, mas perdem a associação ativa.
- Excluir uma meta recorrente impede novas ocorrências futuras.
- Ocorrências passadas da meta recorrente permanecem preservadas.
- Arquivar exercícios ou projetos não remove seus registros históricos.

### 10.10 Estatísticas básicas

O MVP deve apresentar somente:

- quantidade de metas concluídas no período;
- quantidade de metas não concluídas no período;
- taxa de conclusão das metas no período;
- quantidade de treinos registrados no período.

Ficam fora:

- tendências;
- comparações automáticas entre períodos;
- melhores e piores dias;
- recordes;
- gráficos avançados;
- correlações;
- análises por inteligência artificial.

### 10.11 Exportação

Exportação para PDF, CSV, planilhas ou outros formatos fica fora do MVP.

Essa função pode ser útil futuramente, mas não melhora o ciclo principal de planejar, registrar e consultar dados durante a validação inicial.

### 10.12 Requisitos funcionais do módulo de Histórico

- **RF-HIS-01:** exibir calendário com taxa de conclusão nos dias que possuem metas planejadas.
- **RF-HIS-02:** exibir dias sem metas de forma neutra.
- **RF-HIS-03:** exibir lista cronológica agrupada por data.
- **RF-HIS-04:** abrir o detalhe completo de uma data.
- **RF-HIS-05:** mostrar metas concluídas, não concluídas e valores parciais.
- **RF-HIS-06:** identificar ocorrências reagendadas e sua origem.
- **RF-HIS-07:** mostrar treino registrado em uma data e permitir abrir seus detalhes.
- **RF-HIS-08:** mostrar associações históricas entre metas e projetos.
- **RF-HIS-09:** reconstruir qual projeto estava marcado como atual em determinada data.
- **RF-HIS-10:** permitir correção retroativa de metas sem exigir justificativa.
- **RF-HIS-11:** identificar metas corrigidas depois do encerramento do dia.
- **RF-HIS-12:** filtrar por período, tipo de registro e projeto associado.
- **RF-HIS-13:** calcular quantidades de metas concluídas e não concluídas.
- **RF-HIS-14:** calcular taxa de conclusão e quantidade de treinos no período.
- **RF-HIS-15:** preservar ocorrências passadas quando uma recorrência for excluída.

### 10.13 Critérios de aceitação do módulo de Histórico

O módulo pode ser considerado funcionalmente válido quando:

1. o usuário consegue localizar uma data anterior pelo calendário;
2. dias com metas apresentam um percentual coerente;
3. dias sem metas não aparecem como falha;
4. o detalhe diário apresenta metas, valores, projetos e treino daquele dia;
5. uma correção retroativa é refletida nas métricas e identificada como posterior;
6. um reagendamento não apaga a ocorrência original;
7. os filtros mínimos reduzem corretamente o conjunto exibido;
8. excluir uma recorrência não remove suas ocorrências passadas;
9. arquivar um exercício ou projeto não apaga registros históricos;
10. as quatro estatísticas básicas correspondem aos registros filtrados.

### 10.14 Itens adiados no módulo de Histórico

- busca textual;
- exportação;
- gráficos avançados;
- comparação entre períodos;
- histórico completo de alterações de projetos;
- auditoria e versionamento completo;
- filtros avançados;
- correlações entre hábitos e resultados;
- relatórios automáticos;
- IA.

---

## 11. Fundação e Regras Globais do MVP

### 11.1 Autenticação simples

O MVP terá autenticação com:

- nome;
- e-mail;
- senha;
- cadastro;
- login;
- encerramento de sessão.

A senha deve ser armazenada somente como hash seguro. O sistema nunca deve salvar ou registrar a senha em texto puro.

Todos os dados funcionais devem pertencer a um usuário, mesmo que apenas uma pessoa utilize o MVP. Essa decisão evita retrabalho estrutural caso o Ascend passe a aceitar outros usuários no futuro.

Ficam fora do MVP:

- login com Google ou outros provedores;
- verificação de e-mail;
- recuperação de senha;
- autenticação em dois fatores;
- gestão avançada de dispositivos e sessões;
- convites e colaboração.

A tecnologia exata de sessão, como cookie seguro ou token, será decidida na arquitetura técnica.

### 11.2 Primeiro acesso

Após o primeiro login, o usuário deve ser levado para um estado vazio com uma ação clara para criar a primeira meta.

Não haverá:

- onboarding em várias etapas;
- metas de exemplo criadas automaticamente;
- dados fictícios;
- tutorial obrigatório.

A interface deve explicar o próximo passo por meio do próprio estado vazio.

### 11.3 Plataforma inicial

O Ascend será desenvolvido como aplicação web responsiva com prioridade mobile-first.

O MVP deve funcionar em:

- navegadores modernos de computador;
- navegadores modernos de celular.

Ficam fora do MVP:

- aplicativo nativo;
- instalação como PWA;
- funcionamento offline;
- sincronização em segundo plano;
- notificações push.

Mobile-first significa priorizar fluxos e componentes adequados a telas pequenas, sem impedir uma experiência organizada em desktop.

### 11.4 Estratégia de fuso horário

O MVP utilizará um único fuso fixo:

```text
America/Sao_Paulo
```

Esse valor será uma configuração do sistema e não uma preferência visível ao usuário no MVP.

A modelagem deve distinguir três tipos de informação:

1. **Data de planejamento:** uma data civil como `2026-07-20`, armazenada sem conversão para UTC.
2. **Horário planejado:** um horário local como `19:00`, interpretado em `America/Sao_Paulo`.
3. **Instante técnico:** criação, alteração, conclusão e login, armazenados como timestamps em UTC.

Essa separação evita que uma meta planejada para um dia seja deslocada para a data anterior ou posterior por conversões automáticas.

### 11.5 Encerramento lógico do dia

O dia termina à meia-noite em `America/Sao_Paulo`.

O MVP não precisa executar uma tarefa agendada exatamente à meia-noite. O backend pode finalizar ocorrências vencidas de forma preguiçosa, por exemplo:

- no próximo login;
- ao consultar o dia atual;
- ao abrir o Histórico;
- antes de alterar uma ocorrência vencida.

O comportamento percebido deve ser o mesmo: metas pendentes de um dia já encerrado são consideradas não concluídas, preservando valores parciais.

### 11.6 Configurações mínimas

O MVP deve permitir alterar:

- nome;
- e-mail;
- senha.

Ficam fora:

- avatar;
- biografia;
- idioma;
- preferências de notificação;
- configuração de fuso horário;
- preferências avançadas.

A opção de tema só deve existir caso mais de um tema seja realmente implementado. Não deve haver uma configuração sem efeito.

### 11.7 Exclusão de conta

A exclusão de conta fica fora do MVP.

Ainda assim, a estrutura de dados deve garantir que todos os registros tenham um proprietário e possam ser removidos de forma consistente numa futura implementação.

Não é necessário construir agora:

- fluxo de confirmação;
- período de arrependimento;
- exportação prévia;
- rotina pública de eliminação de conta.

### 11.8 Lembretes e notificações

Lembretes e notificações ficam fora do MVP.

Os horários das metas continuam no produto e ajudam a ordenar e planejar o dia, mas o sistema não precisa enviar avisos automáticos.

A decisão reduz complexidade relacionada a:

- permissões de navegador;
- diferenças entre Android, iOS e desktop;
- execução com o sistema fechado;
- agendamento e cancelamento de notificações;
- PWA ou infraestrutura push.

Uma versão futura pode avaliar lembretes somente após o núcleo do Ascend demonstrar uso recorrente.

### 11.9 Requisitos funcionais globais

- **RF-GLO-01:** cadastrar usuário com nome, e-mail e senha.
- **RF-GLO-02:** autenticar usuário com e-mail e senha.
- **RF-GLO-03:** encerrar sessão autenticada.
- **RF-GLO-04:** impedir acesso aos dados sem autenticação.
- **RF-GLO-05:** associar todos os registros funcionais ao usuário proprietário.
- **RF-GLO-06:** exibir estado vazio no primeiro acesso com ação para criar a primeira meta.
- **RF-GLO-07:** funcionar em navegadores modernos de celular e computador.
- **RF-GLO-08:** interpretar datas de planejamento e horários no fuso `America/Sao_Paulo`.
- **RF-GLO-09:** armazenar instantes técnicos em UTC.
- **RF-GLO-10:** encerrar logicamente dias vencidos sem depender de um agendador contínuo.
- **RF-GLO-11:** permitir alteração de nome, e-mail e senha.

---

## 12. Itens fora do MVP geral

- lembretes e notificações;
- PWA, funcionamento offline e aplicativo nativo;
- sequência de dias;
- inteligência artificial;
- gamificação;
- nutrição detalhada;
- peso corporal, medidas corporais e fotos;
- relatórios e gráficos avançados;
- tarefas dentro de projetos;
- diário de progresso de projetos;
- treino em tempo real;
- cronômetro e descanso entre séries;
- supersets, periodização e prescrição de treino;
- exportação de dados;
- recuperação e verificação de e-mail;
- login social e autenticação em dois fatores;
- exclusão de conta pela interface;
- múltiplos usuários colaborando entre si;
- recursos premium.

## 13. Regras transversais de integridade

### 13.1 Histórico não é cadastro atual

Editar um cadastro reutilizável, como um modelo ou exercício, não deve reescrever registros antigos.

### 13.2 Exclusão deve ser explícita

Exclusões que removem registros precisam de confirmação. Quando houver alternativa de arquivamento sem perda de histórico, ela deve ser priorizada.

### 13.3 Associações não devem gerar exclusão em cascata

Excluir um projeto não apaga metas. Excluir uma sessão não apaga exercícios. O sistema deve remover ou preservar associações de modo previsível.

### 13.4 Dados realizados prevalecem sobre sugestões

Valores sugeridos por recorrências, modelos ou planejamentos servem como referência. O histórico deve guardar o que efetivamente foi realizado.

### 13.5 Correções devem manter rastreabilidade mínima

No módulo de Metas, correções após o encerramento do dia devem ser identificadas. Auditoria avançada fica fora do MVP.

### 13.6 Propriedade dos dados

Todos os dados de metas, projetos, treinos e histórico devem possuir um usuário proprietário. Nenhuma consulta ou alteração pode retornar dados de outro usuário.

### 13.7 Datas civis não são timestamps

Datas de planejamento e horários locais não devem ser convertidos cegamente para UTC. Instantes técnicos devem ser armazenados em UTC e apresentados no fuso do sistema.

### 13.8 Fechamento tardio deve ser idempotente

A rotina que identifica metas vencidas pode ser executada diversas vezes sem duplicar ocorrências, alterar registros já finalizados ou produzir resultados diferentes.

### 13.9 O Histórico consulta fontes reais

Calendário, lista, detalhe e estatísticas devem ser derivados das ocorrências de metas e sessões de treino, evitando duplicação de uma segunda base genérica de eventos.

## 14. Registro de decisões

| ID | Tema | Decisão | Status |
|---|---|---|---|
| D-001 | Problema principal | Centralizar produtividade e evolução física | Confirmada |
| D-002 | Escopo inicial | Metas, projetos e base de treinos | Confirmada |
| D-003 | Tipos de meta | Binária e numérica | Confirmada |
| D-004 | Recorrência | Uma vez, diária, dias da semana e a cada X dias | Confirmada |
| D-005 | Metas numéricas | Atualização gradual e preservação do valor parcial | Confirmada |
| D-006 | Categorias | Fora do MVP | Confirmada |
| D-007 | Prioridades | Fora do MVP | Confirmada |
| D-008 | Ordenação das metas | Horário primeiro; sem horário depois | Confirmada |
| D-009 | Edição recorrente | Apenas ocorrência ou ocorrência e futuras | Confirmada |
| D-010 | Pausa de recorrência | Permitida sem apagar histórico | Confirmada |
| D-011 | Valor acima do alvo | Permitido e preservado | Confirmada |
| D-012 | Encerramento do dia | Automático | Confirmada |
| D-013 | Correção retroativa | Permitida com indicação de alteração posterior | Confirmada |
| D-014 | Reagendamento | Nova ocorrência vinculada à original | Confirmada |
| D-015 | Planejamento futuro | Permitido | Confirmada |
| D-016 | Projetos | Vários cadastrados, um atual e sem tarefas internas | Confirmada |
| D-017 | Status de projeto | Planejado, em andamento, pausado, concluído e arquivado | Confirmada |
| D-018 | Troca de projeto atual | Não altera o status do anterior | Confirmada |
| D-019 | Próximo passo | Texto livre, sem entidade de tarefa | Confirmada |
| D-020 | Diário de progresso | Removido do MVP | Confirmada |
| D-021 | Associação meta-projeto | Opcional | Confirmada |
| D-022 | Projeto concluído | Deixa de ser atual e pergunta sobre metas recorrentes | Confirmada |
| D-023 | Exclusão de projeto | Confirmação clara, sem excluir metas associadas | Confirmada |
| D-024 | Formas de treino | Modelo predefinido e treino livre com registro comum | Confirmada |
| D-025 | Uso durante treino | Não é requisito inicial | Confirmada |
| D-026 | Meta não cumprida | Registrar falha e permitir reagendamento manual | Confirmada |
| D-027 | Sequência de dias | Removida do MVP | Confirmada |
| D-028 | IA | Adiada até haver dados e necessidade concreta | Confirmada |
| D-029 | Exercícios | Cadastro reutilizável com criação rápida | Confirmada |
| D-030 | Séries | Registro individual por série | Confirmada |
| D-031 | Modelo de treino | Nome, observação, exercícios, séries e faixa de repetições | Confirmada |
| D-032 | Carga no modelo | Fora do MVP | Confirmada |
| D-033 | Comportamento do modelo | Copiado como ponto de partida da sessão | Confirmada |
| D-034 | Liberdade da execução | Sessão pode divergir das sugestões do modelo | Confirmada |
| D-035 | Treino livre | Nome opcional, data, exercícios, séries, carga e observação | Confirmada |
| D-036 | Duração do treino | Fora do MVP | Confirmada |
| D-037 | Histórico de treino | Sessões e histórico por exercício | Confirmada |
| D-038 | Edição de treino | Permitida, incluindo exclusão mediante confirmação | Confirmada |
| D-039 | Integração treino-meta | Manual no MVP | Confirmada |
| D-040 | Peso e medidas | Fora do MVP | Confirmada |
| D-041 | Tipos de atividade | Apenas musculação com séries, repetições e carga | Confirmada |
| D-042 | Unidade de carga | Quilogramas | Confirmada |
| D-043 | Carga por série | Opcional para exercícios com peso corporal | Confirmada |
| D-044 | Exercício utilizado | Arquivado em vez de excluído | Confirmada |
| D-045 | Modelo e histórico | Editar modelo não altera sessões antigas | Confirmada |
| D-046 | Métricas avançadas | Gráficos, volume e recordes fora do MVP | Confirmada |
| D-047 | Visões do Histórico | Calendário, lista cronológica e detalhe diário | Confirmada |
| D-048 | Indicador do calendário | Taxa de conclusão por dia | Confirmada |
| D-049 | Dia sem metas | Exibido como neutro, não como 0% | Confirmada |
| D-050 | Correção histórica | Permitida sem justificativa, com rastreabilidade mínima | Confirmada |
| D-051 | Filtros do Histórico | Período, tipo de registro e projeto | Confirmada |
| D-052 | Projetos no Histórico | Sem linha do tempo completa de status | Confirmada |
| D-053 | Foco histórico | Guardar mudanças de projeto atual para reconstruir contexto | Confirmada |
| D-054 | Exclusão de recorrência | Preserva ocorrências passadas | Confirmada |
| D-055 | Estatísticas básicas | Concluídas, não concluídas, taxa e treinos | Confirmada |
| D-056 | Exportação | Fora do MVP | Confirmada |
| D-057 | Lembretes | Removidos do MVP | Confirmada |
| D-058 | Autenticação | Cadastro e login simples com e-mail e senha | Confirmada |
| D-059 | Primeiro acesso | Estado vazio com ação para criar a primeira meta | Confirmada |
| D-060 | Plataforma | Aplicação web responsiva mobile-first | Confirmada |
| D-061 | PWA e offline | Fora do MVP | Confirmada |
| D-062 | Fuso do MVP | `America/Sao_Paulo` fixo no sistema | Confirmada |
| D-063 | Datas de planejamento | Armazenadas como datas civis sem conversão UTC | Confirmada |
| D-064 | Instantes técnicos | Armazenados em UTC | Confirmada |
| D-065 | Encerramento técnico | Pode ser executado de forma preguiçosa e idempotente | Confirmada |
| D-066 | Configurações | Nome, e-mail e senha | Confirmada |
| D-067 | Exclusão de conta | Fora do MVP, mas dados devem ter proprietário | Confirmada |
| D-068 | Escopo funcional | Fechado na versão 0.4 | Confirmada |

## 15. Questões ainda abertas

As questões abaixo não alteram o escopo funcional. Elas serão resolvidas nas etapas de fluxo, design e arquitetura.

### 15.1 Fluxos e navegação

- estrutura de navegação entre Hoje, planejamento, projetos, treinos e histórico;
- ações rápidas disponíveis em cada contexto;
- fluxo de criação e edição de recorrências;
- fluxo de registro de treino livre e por modelo;
- apresentação mobile e desktop.

### 15.2 Arquitetura de informação e interface

- identidade visual definitiva nesta nova rodada;
- hierarquia da tela Hoje;
- organização das telas vazias, estados de erro e confirmação;
- apresentação do calendário e da lista cronológica;
- comportamento responsivo de formulários extensos.

### 15.3 Modelagem e regras técnicas

- estratégia de materialização das ocorrências recorrentes;
- comportamento quando uma recorrência é editada em uma data futura já materializada;
- forma exata de guardar mudanças de projeto atual;
- política de normalização e sugestão de exercícios semelhantes;
- método de sessão autenticada;
- regras de unicidade e alteração de e-mail;
- tratamento de transações em exclusões e reagendamentos.

### 15.4 Projetos

- opções exatas da interface ao concluir ou arquivar projeto com metas recorrentes;
- tratamento de exclusão quando existirem somente associações históricas;
- indicação visual de prazo vencido, sem gerar lembrete.

## 16. Requisitos não funcionais preliminares

- **RNF-01:** ações recorrentes devem exigir poucos passos.
- **RNF-02:** módulos devem evitar telas sobrecarregadas.
- **RNF-03:** o histórico não pode ser alterado silenciosamente.
- **RNF-04:** a aplicação deve funcionar em navegadores modernos de computador e celular.
- **RNF-05:** a interface deve ser projetada com prioridade para telas móveis.
- **RNF-06:** a estrutura deve permitir evolução sem implementar recursos futuros agora.
- **RNF-07:** regras de negócio não devem depender da interface.
- **RNF-08:** associações entre módulos devem ser opcionais e fracamente acopladas.
- **RNF-09:** exclusões devem evitar perda acidental de histórico.
- **RNF-10:** datas civis, horários locais e timestamps devem ser tratados de forma distinta.
- **RNF-11:** modelos e catálogos reutilizáveis não devem alterar registros históricos.
- **RNF-12:** formulários devem permitir correção de erros sem exigir recriação completa do registro.
- **RNF-13:** o sistema deve diferenciar claramente itens ativos, pausados, concluídos e arquivados.
- **RNF-14:** o desempenho não deve depender de IA ou serviços externos no MVP.
- **RNF-15:** senhas devem ser protegidas por algoritmo de hash apropriado.
- **RNF-16:** consultas e alterações devem respeitar o proprietário autenticado dos dados.
- **RNF-17:** operações de fechamento tardio e geração de ocorrências devem ser idempotentes.
- **RNF-18:** o sistema deve manter comportamento coerente no fuso `America/Sao_Paulo`.
- **RNF-19:** estados vazios devem orientar a ação seguinte sem tutorial obrigatório.
- **RNF-20:** o Histórico deve ser calculado sobre os dados funcionais, sem duplicação desnecessária.

## 17. Critérios de sucesso do MVP

O MVP deve permitir que o usuário:

- crie uma conta e acesse somente os próprios dados;
- compreenda o primeiro passo sem tutorial obrigatório;
- planeje e consulte o dia sem depender apenas da memória;
- atualize metas com pouco atrito;
- registre valores parciais sem perder informação;
- reagende sem adulterar o histórico;
- mantenha um projeto atual contextualizado;
- associe metas a projetos sem criar um gerenciador de tarefas;
- registre treinos livres ou baseados em modelos;
- consulte sessões anteriores e o histórico de exercícios;
- preserve registros antigos ao editar modelos ou arquivar exercícios;
- consulte datas por calendário, lista e detalhe diário;
- visualize estatísticas básicas coerentes com os filtros;
- use a aplicação adequadamente no celular e no computador;
- continue usando o sistema depois do período inicial de novidade.

**Validação sugerida:** usar o MVP por pelo menos duas semanas antes de expandir o escopo.

### 17.1 Sinais de falha do MVP

O MVP deve ser revisto antes de receber novas funcionalidades se:

- o registro diário exigir passos demais;
- o usuário continuar preferindo controlar as informações mentalmente;
- a tela Hoje não deixar clara a próxima ação;
- os modelos de treino não reduzirem o esforço de registro;
- o módulo de Projetos não gerar contexto útil;
- o Histórico não ajudar a recuperar informação;
- a experiência mobile for significativamente pior do que no computador;
- o usuário abandonar o sistema antes de duas semanas de uso.

## 18. Próximos passos

1. Arquivar a versão 0.3 e publicar esta versão como `docs/produto/mvp.md`.
2. Mapear os fluxos principais do usuário.
3. Definir a arquitetura de informação e a navegação.
4. Criar wireframes de baixa fidelidade para mobile e desktop.
5. Revisar os fluxos contra a regra de baixo atrito.
6. Modelar o banco de dados a partir dos comportamentos confirmados.
7. Definir a arquitetura técnica e escolher a stack definitiva.
8. Criar casos de uso, critérios de aceitação executáveis e backlog.
9. Implementar o produto em entregas verticais pequenas.

A descoberta de funcionalidades do MVP está encerrada. Novas ideias devem ser registradas no backlog futuro, não incorporadas automaticamente.

## 19. Instrução-base para uma IA

> Use esta documentação como fonte de verdade do projeto Ascend. O escopo funcional do MVP está fechado na versão 0.4. Não transforme itens futuros, questões abertas ou preferências ainda não decididas em requisitos. Antes de propor implementação, identifique conflitos, riscos de perda de histórico, problemas de propriedade dos dados, falhas de tratamento de datas e complexidade desnecessária. Prefira a solução mais simples que preserve as regras confirmadas. Não adicione lembretes, IA, PWA, tarefas de projeto, métricas avançadas ou outras funções adiadas sem uma decisão explícita de reabertura do escopo. Modelos, recorrências e cadastros reutilizáveis nunca devem reescrever registros históricos já realizados.

## 20. Histórico de versões

### 0.4 - 14/07/2026

- fechamento funcional do módulo de Histórico;
- definição de calendário, lista cronológica e detalhe diário;
- definição da taxa de conclusão e tratamento neutro de dias sem metas;
- definição de filtros e estatísticas mínimas;
- definição das regras de correção e exclusão no Histórico;
- retirada oficial de lembretes e notificações do MVP;
- definição de autenticação simples com e-mail e senha;
- definição do estado vazio no primeiro acesso;
- definição da aplicação web responsiva mobile-first;
- definição de `America/Sao_Paulo` como fuso fixo do MVP;
- separação entre datas civis, horários locais e timestamps UTC;
- definição de encerramento tardio e idempotente do dia;
- definição das configurações mínimas;
- fechamento oficial do escopo funcional do MVP;
- atualização de requisitos, critérios de sucesso, questões abertas e próximos passos.

### 0.3 - 14/07/2026

- fechamento funcional do módulo de Treinos;
- definição do cadastro reutilizável e arquivamento de exercícios;
- definição do registro individual de séries, repetições e carga opcional;
- definição de quilogramas como unidade do MVP;
- definição de modelos como cópias independentes para novas sessões;
- definição de treino livre e limites do registro posterior;
- definição do histórico mínimo por sessões e por exercício;
- definição das regras de edição e exclusão de sessões;
- retirada de peso, medidas, duração e métricas avançadas do MVP;
- criação de critérios de aceitação do módulo de Treinos;
- inclusão de regras transversais de integridade de dados;
- atualização do registro de decisões e das questões abertas.

### 0.2 - 10/07/2026

- detalhamento completo das regras do módulo de Metas;
- definição de recorrência, pausa, edição, encerramento e reagendamento;
- definição de correção retroativa com rastreamento mínimo;
- detalhamento completo do módulo de Projetos para o MVP;
- retirada do diário de progresso do MVP;
- definição da associação opcional entre metas e projetos;
- definição das regras de conclusão, arquivamento e exclusão de projetos;
- separação clara entre módulos fechados e módulos pendentes.

### 0.1 - 10/07/2026

- primeira consolidação do problema, contexto, escopo, regras iniciais, itens adiados e questões abertas.

> Nome, identidade visual, stack e arquitetura técnica ainda não são decisões definitivas nesta nova rodada do projeto.
