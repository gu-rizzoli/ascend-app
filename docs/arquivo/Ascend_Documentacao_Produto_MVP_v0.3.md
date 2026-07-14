# Ascend - Documentação de Produto e MVP

**Versão:** 0.3  
**Data:** 14 de julho de 2026  
**Status:** Documento vivo - descoberta e definição funcional  
**Marco desta versão:** módulos de Metas, Projetos e Treinos funcionalmente fechados

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
| Metas e planejamento | Fechada funcionalmente | Regras de tipos, recorrência, encerramento e reagendamento definidas |
| Projetos | Fechada funcionalmente | Projeto como contexto de foco, sem tarefas internas |
| Treinos | Fechada funcionalmente | Musculação com modelos, treino livre e registro série por série |
| Histórico | Parcialmente definido | Conteúdo mínimo conhecido; formato de navegação ainda aberto |
| Lembretes | Parcialmente definido | Necessidade confirmada; canal técnico ainda aberto |
| Plataforma e arquitetura | Não definida | Deve ser decidida após os fluxos e requisitos restantes |

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

O MVP é composto por quatro áreas funcionais:

1. Metas e planejamento diário.
2. Projetos.
3. Treinos.
4. Histórico e lembretes.

Os módulos de Metas, Projetos e Treinos estão funcionalmente fechados nesta versão. Histórico e Lembretes ainda precisam de detalhamento antes da modelagem final e da definição da plataforma.

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
- lembrete ativado ou desativado;
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

O horário técnico e o tratamento de fuso serão definidos na arquitetura, mas o comportamento de produto está confirmado.

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
- análises por inteligência artificial.

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

## 10. Histórico e Lembretes - Escopo Parcial

### 10.1 Histórico

O MVP deve permitir:

- consultar metas concluídas e não concluídas;
- visualizar valores parciais de metas numéricas;
- identificar reagendamentos;
- corrigir registros anteriores;
- consultar sessões de treino;
- consultar o histórico de um exercício.

Ainda precisam ser definidos:

- formato principal de navegação: calendário, lista ou combinação;
- filtros mínimos;
- agrupamento por data e módulo;
- comportamento de busca;
- limites de edição no histórico.

### 10.2 Lembretes

O sistema deve permitir lembretes para metas com horário.

O canal técnico ainda não foi definido. As possibilidades dependem da plataforma escolhida e podem incluir:

- notificação interna;
- notificação do navegador;
- PWA;
- e-mail;
- notificação mobile futura.

A linguagem das notificações deve ser útil e humanizada, sem pressão excessiva. A definição do texto e da frequência será realizada depois que o canal técnico for escolhido.

## 11. Itens fora do MVP geral

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
- múltiplos usuários;
- colaboração;
- recursos premium.

## 12. Regras transversais de integridade

### 12.1 Histórico não é cadastro atual

Editar um cadastro reutilizável, como um modelo ou exercício, não deve reescrever registros antigos.

### 12.2 Exclusão deve ser explícita

Exclusões que removem registros precisam de confirmação. Quando houver alternativa de arquivamento sem perda de histórico, ela deve ser priorizada.

### 12.3 Associações não devem gerar exclusão em cascata

Excluir um projeto não apaga metas. Excluir uma sessão não apaga exercícios. O sistema deve remover ou preservar associações de modo previsível.

### 12.4 Dados realizados prevalecem sobre sugestões

Valores sugeridos por recorrências, modelos ou planejamentos servem como referência. O histórico deve guardar o que efetivamente foi realizado.

### 12.5 Correções devem manter rastreabilidade mínima

No módulo de Metas, correções após o encerramento do dia devem ser identificadas. Auditoria avançada fica fora do MVP.

## 13. Registro de decisões

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

## 14. Questões ainda abertas

### 14.1 Produto e plataforma

- plataforma inicial: site responsivo, PWA ou aplicativo;
- autenticação no primeiro ciclo de uso pessoal;
- canal técnico dos lembretes;
- forma de navegação entre módulos;
- identidade visual definitiva.

### 14.2 Metas

- comportamento exato quando uma recorrência é editada em uma data futura já materializada;
- momento técnico de encerramento do dia e tratamento de fuso horário;
- opções exatas ao concluir ou arquivar projeto com metas recorrentes associadas.

### 14.3 Projetos

- comportamento de exclusão quando existirem apenas associações históricas;
- se o prazo vencido gera apenas indicação visual ou também lembrete.

### 14.4 Treinos - detalhes de implementação, não de escopo

- estratégia para sugerir exercícios semelhantes e reduzir duplicatas;
- política de normalização de nomes sem impedir variações legítimas;
- apresentação de exercícios arquivados nos filtros históricos;
- tratamento de exclusão quando uma sessão já foi utilizada em futuros relatórios.

### 14.5 Histórico e lembretes

- formato de calendário ou lista;
- filtros mínimos;
- agrupamento de eventos de módulos diferentes;
- canal, frequência e permissão de notificações.

## 15. Requisitos não funcionais preliminares

- **RNF-01:** ações recorrentes devem exigir poucos passos.
- **RNF-02:** módulos devem evitar telas sobrecarregadas.
- **RNF-03:** o histórico não pode ser alterado silenciosamente.
- **RNF-04:** caso seja web, deve funcionar em computador e celular.
- **RNF-05:** a estrutura deve permitir evolução sem implementar recursos futuros agora.
- **RNF-06:** regras de negócio não devem depender da interface.
- **RNF-07:** associações entre módulos devem ser opcionais e fracamente acopladas.
- **RNF-08:** exclusões devem evitar perda acidental de histórico.
- **RNF-09:** datas e recorrências devem ser tratadas de forma consistente com o fuso do usuário.
- **RNF-10:** modelos e catálogos reutilizáveis não devem alterar registros históricos.
- **RNF-11:** formulários devem permitir correção de erros sem exigir recriação completa do registro.
- **RNF-12:** o sistema deve diferenciar claramente itens ativos, pausados, concluídos e arquivados.
- **RNF-13:** o desempenho não deve depender de análises de IA ou serviços externos no MVP.

## 16. Critérios de sucesso do MVP

O MVP deve permitir que o usuário:

- planeje e consulte o dia sem depender apenas da memória;
- atualize metas com pouco atrito;
- registre valores parciais sem perder informação;
- reagende sem adulterar o histórico;
- mantenha um projeto atual contextualizado;
- associe metas a projetos sem criar um gerenciador de tarefas;
- registre treinos livres ou baseados em modelos;
- consulte sessões anteriores e o histórico de exercícios;
- preserve registros antigos ao editar modelos ou arquivar exercícios;
- consulte o que foi ou não cumprido anteriormente;
- continue usando o sistema depois do período inicial de novidade.

**Validação sugerida:** usar o MVP por pelo menos duas semanas antes de expandir o escopo.

### 16.1 Sinais de falha do MVP

O MVP deve ser revisto antes de receber novas funcionalidades se:

- o registro diário exigir passos demais;
- o usuário continuar preferindo controlar as informações mentalmente;
- os modelos de treino não reduzirem o esforço de registro;
- o módulo de Projetos não gerar contexto útil;
- o Histórico não ajudar a recuperar informação;
- o usuário abandonar o sistema antes de duas semanas de uso.

## 17. Próximos passos

1. Fechar as regras funcionais de Histórico e Lembretes.
2. Atualizar a documentação para a versão 0.4.
3. Resolver plataforma inicial e necessidade de autenticação.
4. Criar casos de uso e critérios de aceitação dos fluxos principais.
5. Desenhar os fluxos do usuário.
6. Definir a arquitetura de informação e a navegação.
7. Modelar o banco de dados.
8. Escolher a stack com base nos requisitos reais.
9. Dividir a implementação em entregas pequenas e utilizáveis.

## 18. Instrução-base para uma IA

> Use esta documentação como fonte de verdade do projeto Ascend. Não trate itens futuros, questões abertas ou detalhes técnicos ainda não decididos como requisitos do MVP. Antes de propor implementação, identifique decisões ausentes, conflitos, riscos de perda de histórico e complexidade desnecessária. Prefira a solução mais simples que preserve os requisitos confirmados. Não amplie o escopo sem justificar o ganho prático e registrar a mudança. Modelos, recorrências e cadastros reutilizáveis nunca devem reescrever registros históricos já realizados.

## 19. Histórico de versões

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
