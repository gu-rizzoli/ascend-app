# Ascend - Documentação de Produto e MVP

**Versão:** 0.2  
**Data:** 10 de julho de 2026  
**Status:** Documento vivo - descoberta e definição funcional  
**Marco desta versão:** regras dos módulos de Metas e Projetos consolidadas

> Este documento registra somente decisões confirmadas. Sugestões ainda não validadas aparecem como hipóteses, itens futuros ou questões em aberto, nunca como requisitos obrigatórios.

## 1. Propósito da documentação

Este documento é a fonte central das decisões do Ascend. Ele existe para:

- registrar o problema que o produto pretende resolver;
- separar decisões confirmadas de ideias futuras;
- controlar o escopo do MVP;
- manter consistência durante o desenvolvimento com auxílio de IA;
- evitar que sugestões antigas sejam tratadas como requisitos atuais;
- registrar mudanças de direção e seus motivos.

**Regra de manutenção:** atualizar o documento ao concluir um módulo funcional, alterar uma regra importante ou remover uma funcionalidade do MVP.

## 2. Problema central

Atualmente, o usuário controla mentalmente metas e informações da rotina. Isso dificulta visualizar o que precisa ser feito, registrar progresso de forma consistente e consultar a evolução ao longo do tempo.

### 2.1 Problema escolhido

O Ascend deve permitir acompanhar produtividade e evolução física em um único sistema, sem obrigar o usuário a distribuir metas, projetos e treinos entre diversas ferramentas.

### 2.2 Hipótese de valor

Se o usuário puder planejar o dia, atualizar metas, consultar próximas atividades, manter um projeto em foco e registrar treinos em um único lugar, ele dependerá menos da memória e terá maior clareza sobre execução e evolução.

### 2.3 Risco principal

Centralizar funcionalidades demais pode tornar o produto confuso. Os módulos devem coexistir sem serem misturados indevidamente e sem obrigar todas as informações a aparecerem na mesma tela.

## 3. Contexto de uso

- Frequência esperada: aproximadamente cinco acessos por dia.
- Ações principais: atualizar metas, verificar próximas atividades, registrar treino e outros dados.
- O sistema deve permitir tanto planejar quanto acompanhar a execução do dia.
- O registro de treino não precisa ser otimizado para uso durante o treino no MVP.
- A entrada de dados deve priorizar cliques e seleções, mantendo digitação quando necessária.
- Um rastreador de metas isolado não seria suficiente para o uso pretendido.

## 4. Princípios do produto

1. **Utilidade antes de abrangência:** uma funcionalidade só entra no MVP quando contribui diretamente para o uso real.
2. **Módulos independentes:** metas, projetos e treinos não precisam ocupar a mesma tela nem compartilhar regras sem necessidade.
3. **Histórico confiável:** reagendamentos e correções não devem apagar silenciosamente o que ocorreu na data original.
4. **Baixo atrito:** ações recorrentes devem exigir poucos passos e poucos campos obrigatórios.
5. **Complexidade adiada:** recursos interessantes, mas não essenciais, permanecem no backlog.
6. **Decisões explícitas:** recomendações não se tornam requisitos até serem avaliadas e confirmadas.
7. **Simplicidade estrutural:** não criar um segundo produto dentro de um módulo, como um gerenciador completo de projetos ou um aplicativo completo de academia.

## 5. Escopo confirmado do MVP

O MVP é composto por quatro áreas funcionais:

1. Metas e planejamento diário.
2. Projetos.
3. Treinos.
4. Histórico e lembretes.

Os módulos de Metas e Projetos estão funcionalmente definidos nesta versão. O módulo de Treinos ainda precisa de detalhamento antes de ser considerado fechado.

---

## 6. Módulo de Metas e Planejamento Diário

### 6.1 Objetivo

Permitir que o usuário planeje datas, acompanhe o dia atual, atualize metas e mantenha um histórico fiel do que foi ou não realizado.

### 6.2 Dados de uma meta

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

### 6.3 Tipos de meta

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

### 6.4 Frequências suportadas

O MVP deve permitir:

- uma única ocorrência;
- repetição diária;
- repetição em dias selecionados da semana;
- repetição a cada X dias.

Regras mensais complexas, como "toda segunda terça-feira do mês", ficam fora do MVP.

### 6.5 Organização das metas do dia

As metas devem ser exibidas nesta ordem:

1. metas com horário, ordenadas cronologicamente;
2. metas sem horário.

O usuário não precisa reorganizar manualmente a lista no MVP.

### 6.6 Planejamento de datas futuras

O usuário pode abrir uma data futura e adicionar metas específicas, mesmo que elas não sejam recorrentes.

O Ascend deve servir tanto para planejamento quanto para acompanhamento da execução.

### 6.7 Edição de metas recorrentes

Ao editar uma ocorrência pertencente a uma recorrência, o sistema deve perguntar se a alteração vale para:

- apenas aquela ocorrência;
- aquela ocorrência e as futuras.

Ocorrências anteriores não devem ser alteradas.

### 6.8 Pausa e reativação

Uma meta recorrente pode ser pausada sem ser excluída.

Durante a pausa:

- novas ocorrências não devem ser geradas;
- o histórico anterior deve permanecer intacto.

A meta pode ser reativada posteriormente.

### 6.9 Regras para metas numéricas

- O usuário pode atualizar o valor aos poucos.
- O sistema deve permitir ultrapassar o valor-alvo.
- O indicador visual pode parar em 100%, mas o valor real deve ser preservado.
- Se o dia terminar abaixo do alvo, a meta é registrada como não concluída.
- Mesmo quando não concluída, o valor atingido permanece salvo no histórico.

### 6.10 Encerramento do dia

O dia deve ser encerrado automaticamente.

Ao encerrar:

- metas pendentes tornam-se não concluídas;
- valores parciais de metas numéricas são preservados;
- o usuário não precisa pressionar um botão de encerramento.

O horário técnico e o tratamento de fuso serão definidos na arquitetura, mas o comportamento de produto está confirmado.

### 6.11 Correção retroativa

O usuário pode corrigir registros anteriores pelo histórico.

O MVP não precisa de auditoria completa, mas cada ocorrência corrigida deve guardar:

- data e hora da última alteração;
- indicação de que foi modificada depois do encerramento do dia.

O sistema não deve alterar histórico silenciosamente.

### 6.12 Reagendamento

Uma meta não concluída pode ser reagendada manualmente.

Regras:

- a ocorrência original permanece registrada como não concluída;
- uma nova ocorrência é criada na data escolhida;
- a nova ocorrência fica vinculada à ocorrência original;
- o reagendamento não transforma a falha anterior em conclusão.

### 6.13 Requisitos funcionais do módulo de Metas

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

### 6.14 Itens adiados no módulo de Metas

- categorias;
- prioridades;
- drag and drop;
- regras mensais avançadas;
- dependência entre metas;
- pontuação ou gamificação;
- sequência de dias;
- análises por inteligência artificial.

---

## 7. Módulo de Projetos

### 7.1 Objetivo

Oferecer contexto de foco para o usuário sem transformar o Ascend em um gerenciador de projetos completo.

No MVP, um projeto representa uma iniciativa como um todo. Ele não possui tarefas internas.

### 7.2 Dados de um projeto

Cada projeto deve possuir:

- nome;
- descrição opcional;
- status;
- próximo passo em texto livre;
- data de início;
- prazo opcional;
- indicação de projeto atual.

O campo de link externo fica fora do MVP.

### 7.3 Status suportados

- planejado;
- em andamento;
- pausado;
- concluído;
- arquivado.

### 7.4 Projeto atual

O usuário pode ter vários projetos cadastrados ou em andamento, mas somente um pode estar marcado como projeto atual.

Ao marcar outro projeto como atual:

- o anterior perde apenas o destaque;
- o status do projeto anterior não é alterado automaticamente.

### 7.5 Próximo passo

O campo de próximo passo é um texto livre.

Exemplo:

> Implementar a recorrência das metas.

Ele não é uma tarefa, não possui estado próprio e não deve gerar uma estrutura paralela de gerenciamento de tarefas.

### 7.6 Associação entre metas e projetos

Uma meta pode ser associada opcionalmente a um projeto.

Exemplo:

- meta: trabalhar uma hora no backend;
- projeto associado: Ascend.

A meta continua pertencendo ao módulo de Metas. O projeto funciona apenas como contexto.

### 7.7 Conclusão de projeto

Ao marcar um projeto como concluído:

- ele deixa automaticamente de ser o projeto atual;
- o sistema pergunta o que fazer com metas recorrentes associadas.

O usuário pode decidir manter ou pausar essas metas. O tratamento individual pode ser oferecido caso a interface permaneça simples.

### 7.8 Arquivamento e exclusão

Regras confirmadas:

- projetos sem registros associados podem ser excluídos definitivamente;
- projetos com metas associadas devem priorizar o arquivamento;
- a exclusão definitiva permanece disponível mediante confirmação clara;
- metas existentes não são apagadas ao excluir o projeto;
- as metas apenas perdem a associação com o projeto.

O sistema não deve excluir metas em cascata ao apagar um projeto.

### 7.9 Requisitos funcionais do módulo de Projetos

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

### 7.10 Itens adiados no módulo de Projetos

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

## 8. Módulo de Treinos - Escopo Preliminar

O módulo de Treinos ainda não está funcionalmente fechado. As decisões abaixo representam apenas o escopo geral já aceito e devem ser detalhadas antes da modelagem do banco.

### 8.1 Objetivo preliminar

Permitir registrar o que foi realizado e consultar o histórico posteriormente.

### 8.2 Funcionalidades preliminares

- cadastrar ou reutilizar exercícios;
- criar modelos predefinidos;
- iniciar um registro a partir de um modelo;
- registrar treino livre;
- adicionar ou remover exercícios;
- registrar séries, repetições e cargas;
- adicionar observação;
- consultar histórico básico.

### 8.3 Limites já definidos

- o registro não precisa ser otimizado para uso durante o treino no MVP;
- modelo e treino livre devem gerar o mesmo tipo de registro final;
- recursos avançados de academia não entram automaticamente no MVP.

### 8.4 Decisões pendentes

- cadastro reutilizável de exercícios e criação rápida;
- registro resumido ou série por série;
- informações salvas nos modelos;
- duração da sessão;
- nível mínimo do histórico;
- edição e exclusão de treinos antigos;
- integração automática com metas;
- inclusão ou não de peso corporal no MVP.

## 9. Histórico e Lembretes - Escopo Preliminar

### 9.1 Histórico

O MVP deve permitir:

- consultar metas concluídas e não concluídas;
- visualizar valores parciais de metas numéricas;
- identificar reagendamentos;
- corrigir registros anteriores;
- consultar treinos anteriores, conforme regras ainda pendentes.

### 9.2 Lembretes

O sistema deve permitir lembretes para metas com horário.

O canal técnico ainda não foi definido. As possibilidades dependem da plataforma escolhida e podem incluir notificação interna, navegador, PWA, e-mail ou notificação mobile futura.

## 10. Itens fora do MVP geral

- sequência de dias;
- inteligência artificial;
- gamificação;
- nutrição detalhada;
- medidas corporais e fotos;
- relatórios e gráficos avançados;
- tarefas dentro de projetos;
- diário de progresso de projetos;
- treino em tempo real;
- cronômetro e descanso entre séries;
- supersets, periodização e prescrição de treino;
- múltiplos usuários;
- colaboração;
- recursos premium.

## 11. Registro de decisões

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
| D-024 | Treinos | Modelo predefinido e treino livre com registro comum | Direção aceita; detalhamento pendente |
| D-025 | Uso durante treino | Não é requisito inicial | Confirmada |
| D-026 | Meta não cumprida | Registrar falha e permitir reagendamento manual | Confirmada |
| D-027 | Sequência de dias | Removida do MVP | Confirmada |
| D-028 | IA | Adiada até haver dados e necessidade concreta | Confirmada |

## 12. Questões ainda abertas

### Produto e plataforma

- plataforma inicial: site responsivo, PWA ou aplicativo;
- autenticação no primeiro ciclo de uso pessoal;
- canal técnico dos lembretes;
- forma de navegação entre módulos;
- identidade visual definitiva.

### Metas

- comportamento exato quando uma recorrência é editada em uma data futura já materializada;
- momento técnico de encerramento do dia e tratamento de fuso horário;
- opções exatas ao concluir ou arquivar projeto com metas recorrentes associadas.

### Projetos

- comportamento de exclusão quando existirem apenas associações históricas;
- se o prazo vencido gera apenas indicação visual ou também lembrete.

### Treinos

- todas as decisões listadas na seção 8.4.

### Histórico

- formato de calendário ou lista;
- filtros mínimos;
- nível mínimo de comparação no histórico de treino.

## 13. Requisitos não funcionais preliminares

- **RNF-01:** ações recorrentes devem exigir poucos passos.
- **RNF-02:** módulos devem evitar telas sobrecarregadas.
- **RNF-03:** o histórico não pode ser alterado silenciosamente.
- **RNF-04:** caso seja web, deve funcionar em computador e celular.
- **RNF-05:** a estrutura deve permitir evolução sem implementar recursos futuros agora.
- **RNF-06:** regras de negócio não devem depender da interface.
- **RNF-07:** associações entre módulos devem ser opcionais e fracamente acopladas.
- **RNF-08:** exclusões devem evitar perda acidental de histórico.
- **RNF-09:** datas e recorrências devem ser tratadas de forma consistente com o fuso do usuário.

## 14. Critérios de sucesso do MVP

O MVP deve permitir que o usuário:

- planeje e consulte o dia sem depender apenas da memória;
- atualize metas com pouco atrito;
- registre valores parciais sem perder informação;
- reagende sem adulterar o histórico;
- mantenha um projeto atual contextualizado;
- associe metas a projetos sem criar um gerenciador de tarefas;
- registre treinos sem recriar toda a estrutura, após o módulo ser detalhado;
- consulte o que foi ou não cumprido anteriormente;
- continue usando o sistema depois do período inicial de novidade.

**Validação sugerida:** usar o MVP por pelo menos duas semanas antes de expandir o escopo.

## 15. Próximos passos

1. Fechar as regras funcionais do módulo de Treinos.
2. Definir o escopo mínimo do Histórico e dos Lembretes.
3. Atualizar a documentação para a versão 0.3.
4. Resolver plataforma inicial e necessidade de autenticação.
5. Criar casos de uso e critérios de aceitação.
6. Desenhar fluxos do usuário.
7. Modelar o banco de dados.
8. Escolher a stack com base nos requisitos reais.
9. Dividir a implementação em entregas pequenas e utilizáveis.

## 16. Instrução-base para uma IA

> Use esta documentação como fonte de verdade do projeto Ascend. Não trate itens futuros ou pendentes como requisitos do MVP. Antes de propor implementação, identifique decisões ausentes, conflitos, riscos de perda de histórico e complexidade desnecessária. Prefira a solução mais simples que preserve os requisitos confirmados. Não amplie o escopo sem justificar o ganho prático e registrar a mudança.

## 17. Histórico de versões

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
