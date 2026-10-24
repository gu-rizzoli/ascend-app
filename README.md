# Ascend

Aplicação pessoal para planejamento e acompanhamento de metas, foco em projetos e registro de treinos de musculação.

## Status do projeto

O escopo funcional do MVP foi fechado na versão 0.4.

Atualmente:

- Metas e planejamento estão definidos;
- Projetos estão definidos;
- Treinos estão definidos;
- Histórico e estatísticas básicas estão definidos;
- Autenticação simples e regras globais estão definidas;
- Lembretes e notificações estão fora do MVP;
- A plataforma será uma aplicação web responsiva mobile-first;
- Fluxos e modelo de dados de Metas, Projetos e Treinos estão definidos;
- O banco de dados será PostgreSQL;
- A navegação está definida (quatro áreas: Hoje, Projetos, Treinos e Histórico);
- Wireframes e stack são as próximas etapas.

## Objetivo

Centralizar produtividade e evolução física em um único sistema, reduzindo a dependência de memória e permitindo acompanhar o que foi planejado e realizado.

## Escopo do MVP

### Módulos funcionais

- Metas e planejamento diário;
- Projetos;
- Treinos;
- Histórico e estatísticas básicas.

### Fundação do sistema

- Cadastro e autenticação com e-mail e senha;
- Separação dos dados por usuário;
- Aplicação web responsiva mobile-first;
- Tratamento de datas no fuso `America/Sao_Paulo`;
- Armazenamento de instantes técnicos em UTC.

## Documentação

A especificação atual do produto está disponível em:

- [Documentação do MVP](docs/produto/Ascend_Documentacao_Produto_MVP_v0.4.md)

Fluxos e modelagem:

- [Fluxos de Hoje e Metas](docs/produto/fluxos-metas.md)
- [Modelo de dados de Metas](docs/produto/modelo-dados-metas.md)
- [Projetos: fluxos e modelo](docs/produto/projetos.md)
- [Treinos: fluxos e modelo](docs/produto/treinos.md)
- [Navegação](docs/produto/navegacao.md)

Versões anteriores estão disponíveis em [`docs/arquivo`](docs/arquivo).

## Próximos passos

1. ~~Mapear os fluxos de Hoje e Metas~~ (feito);
2. ~~Modelar o banco de dados de Metas~~ (feito);
3. ~~Mapear os fluxos e o modelo de dados de Projetos e Treinos~~ (feito);
4. ~~Definir a navegação e a arquitetura de informação~~ (feito);
5. Criar wireframes para celular e computador;
6. Escolher a stack e definir a arquitetura técnica;
7. Criar o backlog de desenvolvimento;
8. Iniciar a implementação em pequenas entregas.
