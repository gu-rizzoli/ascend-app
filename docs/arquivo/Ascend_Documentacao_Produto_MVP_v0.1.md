# Ascend — Documentação de Produto e MVP

**Versão:** 0.1  
**Data:** 10 de julho de 2026  
**Status:** Documento vivo — descoberta e definição funcional

> Este documento registra apenas o que já foi discutido e confirmado. Ideias antigas que ainda não foram validadas aparecem como hipótese, item futuro ou questão em aberto — não como requisito.

## 1. Propósito desta documentação

Este documento é a fonte central das decisões do Ascend. Ele existe para registrar o problema, separar decisões de hipóteses, controlar o escopo do MVP, dar contexto consistente para IAs e manter uma trilha das escolhas do produto.

**Regra:** sempre que uma decisão importante mudar, registrar a nova decisão, a data e o motivo.

## 2. Problema central

Atualmente, o usuário controla mentalmente suas metas e informações da rotina. Isso dificulta acompanhar o que precisa ser feito no dia, registrar progresso de forma consistente e consultar a evolução ao longo do tempo.

### Problema escolhido

O Ascend deve permitir acompanhar evolução física e produtividade em um único sistema, sem exigir ferramentas separadas para metas, projetos e treinos.

### Hipótese de valor

Se o usuário puder planejar o dia, atualizar metas, consultar próximas atividades e registrar dados de treino em um único lugar, haverá menos dependência de memória e maior clareza sobre execução e evolução.

**Risco principal:** centralizar funcionalidades demais pode tornar o produto confuso. Os módulos precisam coexistir sem obrigar todas as informações a aparecerem juntas.

## 3. Contexto de uso

- Frequência esperada: aproximadamente cinco acessos por dia.
- Ações principais: atualizar metas, verificar próximas atividades, registrar treino e outros dados.
- O sistema deve permitir planejar e acompanhar a execução do dia.
- O registro de treino não precisa ser otimizado para uso durante o treino no MVP.
- A entrada de dados deve priorizar cliques e seleções, mantendo digitação quando necessária.

## 4. Princípios do produto

1. **Utilidade antes de abrangência:** uma funcionalidade só entra no MVP quando contribui para o uso real.
2. **Módulos independentes:** metas, projetos e treinos não precisam ser misturados na mesma tela ou fluxo.
3. **Histórico confiável:** reagendamentos não devem apagar o que aconteceu na data original.
4. **Baixo atrito:** ações recorrentes devem exigir poucos passos.
5. **Complexidade adiada:** recursos não essenciais são documentados como futuros.

## 5. Escopo confirmado do MVP

### 5.1 Metas e planejamento diário

- Criar metas avulsas ou recorrentes.
- Definir horário opcional.
- Planejar metas para uma data.
- Visualizar e atualizar o planejado para o dia.
- Registrar conclusão total ou progresso numérico.
- Atualizar metas numéricas gradualmente.
- Registrar metas não cumpridas.
- Reagendar manualmente sem alterar o histórico original.

#### Frequências suportadas

- Uma vez.
- Diária.
- Dias selecionados da semana.
- A cada X dias.

#### Tipos iniciais

- **Binária:** concluída ou não.
- **Numérica:** valor atual, valor-alvo e unidade.

**Regra:** uma meta não cumprida permanece registrada como não cumprida. O reagendamento cria uma nova ocorrência.

### 5.2 Projetos

No MVP, a área de projetos registra o projeto como um todo; ela não é um gerenciador de tarefas.

- Cadastrar vários projetos.
- Definir apenas um projeto como atual.
- Nome, descrição e status.
- Próximo passo em texto livre.
- Prazo opcional, ainda sujeito à validação.
- Arquivar projetos concluídos ou abandonados.

Ficam de fora: tarefas internas, subtarefas, Kanban, dependências, controle de horas e percentual manual de progresso.

### 5.3 Treinos

O módulo aceita modelos predefinidos e treinos livres. Ambos geram o mesmo tipo de registro final.

#### Modelo de treino

- Nome e observação opcional.
- Lista ordenada de exercícios.
- Uso como ponto de partida para uma execução.

#### Treino livre

- Criar sessão sem modelo.
- Adicionar exercícios manualmente.

#### Registro da execução

- Data.
- Nome da sessão.
- Exercícios.
- Séries, repetições e carga.
- Observação opcional.
- Histórico básico.

Ficam de fora: cronômetro, descanso entre séries, salvamento por série, supersets, periodização e acompanhamento em tempo real.

### 5.4 Histórico e lembretes

- Consultar metas concluídas e não concluídas.
- Consultar treinos anteriores.
- Exibir lembretes para metas com horário.
- Reagendar manualmente uma meta não cumprida.

O canal técnico dos lembretes ainda não foi definido.

## 6. Itens fora do MVP

- Sequência de dias.
- Inteligência artificial.
- Gamificação.
- Nutrição detalhada.
- Medidas corporais e fotos.
- Relatórios e gráficos avançados.
- Tarefas dentro de projetos.
- Treino em tempo real.
- Múltiplos usuários e recursos premium.

## 7. Registro de decisões

| ID | Tema | Decisão | Status |
|---|---|---|---|
| D-001 | Problema principal | Centralizar produtividade e evolução física | Confirmada |
| D-002 | Escopo inicial | Metas, projetos e base de treinos | Confirmada |
| D-003 | Tipos de meta | Binária e numérica | Confirmada |
| D-004 | Recorrência | Uma vez, diária, dias da semana e a cada X dias | Confirmada |
| D-005 | Metas numéricas | Atualização gradual | Confirmada |
| D-006 | Projetos | Vários cadastrados, um atual e sem tarefas internas | Confirmada |
| D-007 | Treinos | Modelo predefinido e treino livre com registro comum | Recomendação aceita |
| D-008 | Uso durante treino | Não é requisito inicial | Confirmada |
| D-009 | Meta não cumprida | Registrar falha e permitir reagendamento manual | Confirmada |
| D-010 | Sequência de dias | Removida do MVP | Confirmada |
| D-011 | IA | Adiada até haver dados e necessidade concreta | Confirmada |

## 8. Questões ainda abertas

- Plataforma inicial: site responsivo, PWA ou aplicativo?
- Autenticação: é necessária no primeiro ciclo de uso pessoal?
- Canal dos lembretes.
- Prazo opcional nos projetos.
- Forma de visualizar o histórico de metas.
- Nível mínimo de comparação no histórico de treino.
- Como encerrar ocorrências pendentes ao fim do dia.
- Regras de edição retroativa.

## 9. Requisitos funcionais preliminares

- **RF-01:** criar meta binária ou numérica.
- **RF-02:** definir data, horário opcional e frequência.
- **RF-03:** gerar ocorrências conforme a frequência.
- **RF-04:** atualizar gradualmente uma meta numérica.
- **RF-05:** registrar cada ocorrência sem sobrescrever o histórico.
- **RF-06:** reagendar manualmente meta não cumprida.
- **RF-07:** cadastrar, editar, arquivar e consultar projetos.
- **RF-08:** permitir apenas um projeto atual.
- **RF-09:** registrar próximo passo textual.
- **RF-10:** criar modelos de treino com exercícios ordenados.
- **RF-11:** registrar sessão por modelo ou treino livre.
- **RF-12:** registrar séries, repetições e carga.
- **RF-13:** consultar histórico básico de metas e treinos.
- **RF-14:** emitir lembretes conforme o canal definido posteriormente.

### Requisitos não funcionais preliminares

- **RNF-01:** ações recorrentes devem exigir poucos passos.
- **RNF-02:** módulos devem evitar telas sobrecarregadas.
- **RNF-03:** o histórico não pode ser alterado silenciosamente.
- **RNF-04:** caso seja web, deve funcionar em computador e celular.
- **RNF-05:** a estrutura deve permitir evolução sem implementar recursos futuros agora.

## 10. Critérios de sucesso do MVP

O MVP deve permitir que o usuário:

- Planeje e consulte o dia sem depender apenas da memória.
- Atualize metas com pouco atrito.
- Mantenha um projeto atual contextualizado.
- Registre treinos sem recriar toda a estrutura.
- Consulte o que foi ou não cumprido anteriormente.
- Continue usando o sistema após o período inicial de novidade.

**Validação sugerida:** usar o MVP por pelo menos duas semanas antes de expandir o escopo.

## 11. Próximos passos

1. Resolver questões abertas que afetam comportamento: plataforma, autenticação e lembretes.
2. Criar casos de uso e critérios de aceitação.
3. Desenhar fluxos do usuário.
4. Modelar banco de dados.
5. Escolher a stack com base nos requisitos reais.
6. Dividir a implementação em entregas pequenas e utilizáveis.

## 12. Instrução-base para uma IA

> Use esta documentação como fonte de verdade do projeto Ascend. Não trate itens futuros como requisitos do MVP. Antes de propor implementação, identifique decisões ausentes, conflitos e complexidade desnecessária. Prefira a solução mais simples que preserve os requisitos confirmados.

## 13. Histórico de versões

- **0.1 — 10/07/2026:** primeira consolidação do problema, contexto, escopo, regras, itens adiados e questões abertas.

> Nome, identidade visual, stack e arquitetura técnica ainda não são decisões definitivas nesta nova rodada do projeto.
