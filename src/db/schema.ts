// Esquema do banco (Drizzle). As tabelas entram junto com a entrega que as usa:
// usuario e sessao na entrega 1, meta/meta_versao/ocorrencia na 2, e assim
// por diante. O desenho completo está em docs/produto/modelo-dados-metas.md,
// projetos.md e treinos.md.
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  time,
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

// ---------------------------------------------------------------------------
// Metas (docs/produto/modelo-dados-metas.md)

export const tipoMeta = pgEnum("tipo_meta", ["binaria", "numerica"]);
export const estadoMeta = pgEnum("estado_meta", [
  "ativa",
  "pausada",
  "excluida",
]);
export const frequenciaMeta = pgEnum("frequencia_meta", [
  "unica",
  "diaria",
  "semanal",
  "intervalo",
]);
export const origemOcorrencia = pgEnum("origem_ocorrencia", [
  "regra",
  "reagendada",
]);
export const estadoOcorrencia = pgEnum("estado_ocorrencia", [
  "pendente",
  "concluida",
  "nao_concluida",
]);

// Até 3 casas decimais ("1,5 L", "0,25 h"), lido como number no TypeScript.
const valor = (nome: string) =>
  numeric(nome, { precision: 12, scale: 3, mode: "number" });

/** A identidade da meta: só o que nunca muda ao longo da vida dela. */
export const meta = pgTable(
  "meta",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuario.id, { onDelete: "restrict" }),
    // Tipo e unidade são imutáveis: trocar de tipo é criar outra meta.
    tipo: tipoMeta("tipo").notNull(),
    unidade: text("unidade"),
    estado: estadoMeta("estado").notNull().default("ativa"),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    excluidaEm: timestamp("excluida_em", { withTimezone: true }),
  },
  (t) => [
    index("meta_usuario_idx").on(t.usuarioId),
    check(
      "meta_unidade_conforme_tipo",
      sql`(${t.tipo} = 'numerica') = (${t.unidade} is not null)`,
    ),
  ],
);

/**
 * A regra da meta com vigência. "Esta e as próximas", pausa e reativação
 * fecham uma versão e abrem outra; as versões não se sobrepõem. Uma versão
 * que ainda não tinha começado quando a meta foi pausada fica vazia
 * (vigente_ate = vigente_de - 1): não gera nada, mas continua existindo para
 * as ocorrências que apontam para ela. O projeto associado é da versão: trocar
 * de projeto em "esta e as próximas" não muda o passado.
 */
export const metaVersao = pgTable(
  "meta_versao",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    metaId: uuid("meta_id")
      .notNull()
      .references(() => meta.id, { onDelete: "restrict" }),
    vigenteDe: date("vigente_de").notNull(),
    vigenteAte: date("vigente_ate"),
    titulo: text("titulo").notNull(),
    descricao: text("descricao"),
    // Hora local de São Paulo, sem fuso (11.4).
    horario: time("horario"),
    valorAlvo: valor("valor_alvo"),
    frequencia: frequenciaMeta("frequencia").notNull(),
    diasSemana: smallint("dias_semana").array(),
    intervaloDias: integer("intervalo_dias"),
    // Excluir o projeto tira a associação e mantém a meta (RF-PRO-12).
    projetoId: uuid("projeto_id").references(() => projeto.id, {
      onDelete: "set null",
    }),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("meta_versao_meta_idx").on(t.metaId),
    index("meta_versao_projeto_idx").on(t.projetoId),
    check(
      "meta_versao_vigencia",
      sql`${t.vigenteAte} is null or ${t.vigenteAte} >= ${t.vigenteDe} - 1`,
    ),
    check(
      "meta_versao_dias_semana",
      sql`(${t.frequencia} = 'semanal') = (${t.diasSemana} is not null)
        and (${t.diasSemana} is null or (cardinality(${t.diasSemana}) > 0
        and ${t.diasSemana} <@ array[0,1,2,3,4,5,6]::smallint[]))`,
    ),
    check(
      "meta_versao_intervalo",
      sql`(${t.frequencia} = 'intervalo') = (${t.intervaloDias} is not null)
        and (${t.intervaloDias} is null or ${t.intervaloDias} >= 2)`,
    ),
    check(
      "meta_versao_valor_alvo",
      sql`${t.valorAlvo} is null or ${t.valorAlvo} > 0`,
    ),
  ],
);

/**
 * A meta numa data, com o que de fato aconteceu: a fonte do Histórico (13.9).
 * As datas futuras são calculadas pela regra; uma vaga só vira linha quando
 * alguém mexe nela ou quando o fechamento do dia passa por ela.
 */
export const ocorrencia = pgTable(
  "ocorrencia",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Repetido aqui para filtrar por dono sem join (13.6).
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuario.id, { onDelete: "restrict" }),
    metaId: uuid("meta_id")
      .notNull()
      .references(() => meta.id, { onDelete: "restrict" }),
    versaoId: uuid("versao_id")
      .notNull()
      .references(() => metaVersao.id, { onDelete: "restrict" }),
    origem: origemOcorrencia("origem").notNull().default("regra"),
    // A vaga da regra; só em origem = regra.
    dataPrevista: date("data_prevista"),
    // Onde a ocorrência aparece. Muda quando uma pendente é adiada.
    data: date("data").notNull(),
    reagendadaDeId: uuid("reagendada_de_id"),
    estado: estadoOcorrencia("estado").notNull().default("pendente"),
    valorAtual: valor("valor_atual"),
    // Ajustes de "só esta": nulos, a não ser que a ocorrência tenha sido
    // editada sozinha. Quando preenchidos, prevalecem sobre a versão.
    titulo: text("titulo"),
    horario: time("horario"),
    valorAlvo: valor("valor_alvo"),
    concluidaEm: timestamp("concluida_em", { withTimezone: true }),
    encerradaEm: timestamp("encerrada_em", { withTimezone: true }),
    corrigidaAposEncerramento: boolean("corrigida_apos_encerramento")
      .notNull()
      .default(false),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      name: "ocorrencia_reagendada_de_fk",
      columns: [t.reagendadaDeId],
      foreignColumns: [t.id],
    }).onDelete("restrict"),
    // Impede duplicatas e torna a geração idempotente (13.8).
    uniqueIndex("ocorrencia_vaga_unica")
      .on(t.metaId, t.dataPrevista)
      .where(sql`${t.origem} = 'regra'`),
    // Uma ocorrência é reagendada no máximo uma vez (RF-MET-13).
    uniqueIndex("ocorrencia_reagendada_unica")
      .on(t.reagendadaDeId)
      .where(sql`${t.reagendadaDeId} is not null`),
    index("ocorrencia_usuario_data_idx").on(t.usuarioId, t.data),
    index("ocorrencia_usuario_data_prevista_idx").on(
      t.usuarioId,
      t.dataPrevista,
    ),
    check(
      "ocorrencia_origem",
      sql`(${t.origem} = 'regra' and ${t.dataPrevista} is not null and ${t.reagendadaDeId} is null)
        or (${t.origem} = 'reagendada' and ${t.dataPrevista} is null and ${t.reagendadaDeId} is not null)`,
    ),
    check(
      "ocorrencia_valor_atual",
      sql`${t.valorAtual} is null or ${t.valorAtual} >= 0`,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Projetos (docs/produto/projetos.md)

export const statusProjeto = pgEnum("status_projeto", [
  "planejado",
  "em_andamento",
  "pausado",
  "concluido",
  "arquivado",
]);

/** Um contexto de foco com status e próximo passo, sem tarefas (D-016, D-019). */
export const projeto = pgTable(
  "projeto",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuario.id, { onDelete: "restrict" }),
    nome: text("nome").notNull(),
    descricao: text("descricao"),
    status: statusProjeto("status").notNull().default("em_andamento"),
    proximoPasso: text("proximo_passo"),
    dataInicio: date("data_inicio").notNull(),
    prazo: date("prazo"),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("projeto_usuario_idx").on(t.usuarioId),
    check(
      "projeto_prazo",
      sql`${t.prazo} is null or ${t.prazo} >= ${t.dataInicio}`,
    ),
  ],
);

/**
 * Cada troca de projeto atual (D-053). O atual é a última troca do usuário;
 * o foco de uma data é a última troca com `data` até ela (RF-HIS-09). Não há
 * coluna "atual" no projeto, então existe no máximo um por construção.
 */
export const projetoAtualTroca = pgTable(
  "projeto_atual_troca",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuario.id, { onDelete: "restrict" }),
    // Nulo = nenhum projeto atual. Excluir o projeto também deixa nulo.
    projetoId: uuid("projeto_id").references(() => projeto.id, {
      onDelete: "set null",
    }),
    data: date("data").notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("projeto_atual_troca_usuario_idx").on(
      t.usuarioId,
      t.data,
      t.criadoEm,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Treinos (docs/produto/treinos.md)

export const grupoMuscular = pgEnum("grupo_muscular", [
  "peito",
  "costas",
  "ombros",
  "biceps",
  "triceps",
  "antebracos",
  "quadriceps",
  "posteriores",
  "gluteos",
  "panturrilhas",
  "abdomen",
]);

/**
 * O catálogo de exercícios (9.3). Renomear muda o nome em todos os treinos,
 * porque é o mesmo exercício. Um exercício usado não é apagado: é arquivado
 * (9.4), e as referências com RESTRICT garantem isso no banco.
 */
export const exercicio = pgTable(
  "exercicio",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuario.id, { onDelete: "restrict" }),
    nome: text("nome").notNull(),
    // Minúsculas, sem acentos e com espaços simples: "Supino  Reto" e
    // "supino reto" são o mesmo nome (treinos.md, decisão 5).
    nomeNormalizado: text("nome_normalizado").notNull(),
    // O grupo principal, só para organizar o catálogo. Opcional.
    grupo: grupoMuscular("grupo"),
    arquivadoEm: timestamp("arquivado_em", { withTimezone: true }),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("exercicio_nome_unico").on(t.usuarioId, t.nomeNormalizado),
  ],
);

/** Um ponto de partida para registrar treinos, sem carga (9.6, D-032). */
export const modeloTreino = pgTable(
  "modelo_treino",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuario.id, { onDelete: "restrict" }),
    nome: text("nome").notNull(),
    observacao: text("observacao"),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("modelo_treino_usuario_idx").on(t.usuarioId)],
);

export const modeloExercicio = pgTable(
  "modelo_exercicio",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    modeloId: uuid("modelo_id")
      .notNull()
      .references(() => modeloTreino.id, { onDelete: "cascade" }),
    exercicioId: uuid("exercicio_id")
      .notNull()
      .references(() => exercicio.id, { onDelete: "restrict" }),
    ordem: integer("ordem").notNull(),
    seriesSugeridas: integer("series_sugeridas").notNull(),
    repsMin: integer("reps_min").notNull(),
    repsMax: integer("reps_max"),
  },
  (t) => [
    index("modelo_exercicio_modelo_idx").on(t.modeloId),
    index("modelo_exercicio_exercicio_idx").on(t.exercicioId),
    check("modelo_exercicio_series", sql`${t.seriesSugeridas} >= 1`),
    check(
      "modelo_exercicio_reps",
      sql`${t.repsMin} >= 1 and (${t.repsMax} is null or ${t.repsMax} >= ${t.repsMin})`,
    ),
  ],
);

/**
 * Uma sessão de musculação registrada (9.5, 9.8). Chama-se treino para não
 * confundir com a sessão de login. É uma cópia independente do modelo:
 * `modelo_id` só informa de onde veio (D-033, D-045).
 */
export const treino = pgTable(
  "treino",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuario.id, { onDelete: "restrict" }),
    nome: text("nome"),
    data: date("data").notNull(),
    observacao: text("observacao"),
    modeloId: uuid("modelo_id").references(() => modeloTreino.id, {
      onDelete: "set null",
    }),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("treino_usuario_data_idx").on(t.usuarioId, t.data)],
);

export const treinoExercicio = pgTable(
  "treino_exercicio",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    treinoId: uuid("treino_id")
      .notNull()
      .references(() => treino.id, { onDelete: "cascade" }),
    exercicioId: uuid("exercicio_id")
      .notNull()
      .references(() => exercicio.id, { onDelete: "restrict" }),
    ordem: integer("ordem").notNull(),
  },
  (t) => [
    index("treino_exercicio_treino_idx").on(t.treinoId),
    index("treino_exercicio_exercicio_idx").on(t.exercicioId),
  ],
);

/** Uma série: repetições obrigatórias, carga opcional para peso corporal. */
export const serie = pgTable(
  "serie",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    treinoExercicioId: uuid("treino_exercicio_id")
      .notNull()
      .references(() => treinoExercicio.id, { onDelete: "cascade" }),
    ordem: integer("ordem").notNull(),
    repeticoes: integer("repeticoes").notNull(),
    cargaKg: numeric("carga_kg", { precision: 6, scale: 2, mode: "number" }),
    observacao: text("observacao"),
  },
  (t) => [
    index("serie_treino_exercicio_idx").on(t.treinoExercicioId),
    check("serie_repeticoes", sql`${t.repeticoes} > 0`),
    check("serie_carga", sql`${t.cargaKg} is null or ${t.cargaKg} >= 0`),
  ],
);
