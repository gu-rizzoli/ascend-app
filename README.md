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
- Wireframes, stack e backlog estão definidos;
- A implementação começou pela entrega 0 (fundação do projeto).

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

Arquitetura técnica:

- [Arquitetura técnica e backlog](docs/tecnico/arquitetura.md)

Versões anteriores estão disponíveis em [`docs/arquivo`](docs/arquivo).

## Desenvolvimento

Stack: Next.js (App Router) em TypeScript, PostgreSQL com Drizzle, Tailwind, Vitest. Hospedagem no Netlify e banco no Neon. Detalhes em [arquitetura.md](docs/tecnico/arquitetura.md).

Pré-requisitos: Node.js 22 e pnpm 10.

```bash
pnpm install
cp .env.example .env.local   # preencha DATABASE_URL com a string do Neon
pnpm dev                     # http://localhost:3000
```

Comandos úteis:

| Comando | O que faz |
| --- | --- |
| `pnpm test` | Roda os testes (Vitest) |
| `pnpm lint` | Verifica o código com ESLint |
| `pnpm typecheck` | Verifica os tipos do TypeScript |
| `pnpm format` | Formata o código com Prettier |
| `pnpm build` | Gera o build de produção |
| `pnpm db:generate` | Gera uma migração a partir de `src/db/schema.ts` |
| `pnpm db:migrate` | Aplica as migrações no banco de `DATABASE_URL` |

O CI (GitHub Actions) roda formatação, lint, tipos, testes e build em cada pull request.

## Próximos passos

1. ~~Mapear fluxos, modelo de dados e navegação~~ (feito);
2. ~~Criar wireframes, escolher a stack e montar o backlog~~ (feito);
3. Implementar as entregas 0 a 8 do [backlog](docs/tecnico/arquitetura.md#backlog), uma pull request por entrega;
4. Usar o Ascend por 2 semanas antes de pensar em qualquer coisa nova.
