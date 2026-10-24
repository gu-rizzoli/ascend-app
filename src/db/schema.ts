// Esquema do banco (Drizzle). As tabelas entram junto com a entrega que as usa:
// usuario e sessao na entrega 1, meta/meta_versao/ocorrencia na 2, e assim
// por diante. O desenho completo está em docs/produto/modelo-dados-metas.md,
// projetos.md e treinos.md.
import { sql } from "drizzle-orm";
import {
  date,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/** Dono de todos os dados (11.1, 13.6). */
export const usuario = pgTable(
  "usuario",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nome: text("nome").notNull(),
    email: text("email").notNull(),
    senhaHash: text("senha_hash").notNull(),
    // Até que dia o fechamento preguiçoso já rodou (11.5). Nasce como a véspera
    // do cadastro: não há nada a fechar antes da conta existir.
    fechadoAte: date("fechado_ate").notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // E-mail único sem diferenciar maiúsculas.
    uniqueIndex("usuario_email_unico").on(sql`lower(${t.email})`),
  ],
);

/**
 * Sessão no servidor. O navegador guarda só o token, num cookie HttpOnly; o
 * banco guarda o hash SHA-256 dele, para que um vazamento do banco não dê
 * acesso às contas.
 */
export const sessao = pgTable(
  "sessao",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Sessão não é histórico: some junto com a conta numa exclusão futura.
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuario.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiraEm: timestamp("expira_em", { withTimezone: true }).notNull(),
  },
  (t) => [index("sessao_usuario_idx").on(t.usuarioId)],
);
