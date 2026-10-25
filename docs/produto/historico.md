# Ascend – Histórico

25/10/2026 · gustavo

O Histórico (seção 10 do [MVP v0.4](Ascend_Documentacao_Produto_MVP_v0.4.md)) é uma camada de consulta: não tem tabela própria e lê as ocorrências de metas, os treinos e as trocas de projeto atual (13.9). Implementado na entrega 7.

## Telas

| Endereço | Tela |
| --- | --- |
| `/historico?mes=2026-10` | Calendário do mês com a taxa de cada dia e as 4 estatísticas do mês |
| `/historico/lista?de=2026-10-01&ate=2026-10-25` | Lista cronológica agrupada por data, do mais recente para o mais antigo, com as 4 estatísticas do período |
| `/historico/2026-10-22` | Detalhe do dia: metas com estado, valor, projeto, reagendamento e correção; projeto em foco; treino; botão Corrigir |

Os filtros `tipo` (`metas` ou `treinos`) e `projeto` valem nas duas primeiras telas e ficam no endereço.

## Decisões da entrega 7 (25/10/2026)

Pontos que o v0.4 não fechava. Todos podem ser revistos na revisão da PR.

| # | Situação | Como ficou |
| --- | --- | --- |
| 1 | Hoje entra no Histórico? | As metas entram só até ontem, porque uma meta só vira "não concluída" quando o dia termina; hoje continua na tela Hoje. Treinos entram até hoje, porque um treino registrado já aconteceu |
| 2 | Cor do calendário | Uma cor só (azul), mais forte quanto maior a taxa, em 5 faixas. Dia sem metas fica em branco e sem número. Um ponto marca dia com treino |
| 3 | Período das estatísticas | No calendário, o mês aberto. Na lista, o intervalo escolhido (padrão: do dia 1 do mês até hoje) |
| 4 | Filtro por projeto | Vale para as metas, pelo projeto da versão que regia a ocorrência. Treinos não têm projeto (9.12), então continuam aparecendo; para escondê-los, use "Só metas" |
| 5 | Filtro por tipo | "Só metas" esconde treinos e a estatística de treinos; "Só treinos" esconde metas e as três estatísticas de metas |
| 6 | Lista | Só aparecem dias com algum registro. Cada dia mostra a contagem, o projeto em foco, as metas e o treino |
| 7 | Detalhe do dia | Só para dias encerrados; hoje leva a Hoje e o futuro à tela do dia. O selo "Corrigida" mostra quando foi a última alteração |
| 8 | Corrigir pelo Histórico | O botão abre a correção do dia (`/dia/…?corrigir=1`) e o Pronto volta para o detalhe no Histórico |
| 9 | Reagendada no Histórico | A original conta como não concluída no dia dela e a cópia conta no dia novo. Os selos "Reagendada de/para" levam ao outro dia |
