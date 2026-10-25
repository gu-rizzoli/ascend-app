CREATE TABLE "exercicio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"nome_normalizado" text NOT NULL,
	"arquivado_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modelo_exercicio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"modelo_id" uuid NOT NULL,
	"exercicio_id" uuid NOT NULL,
	"ordem" integer NOT NULL,
	"series_sugeridas" integer NOT NULL,
	"reps_min" integer NOT NULL,
	"reps_max" integer,
	CONSTRAINT "modelo_exercicio_series" CHECK ("modelo_exercicio"."series_sugeridas" >= 1),
	CONSTRAINT "modelo_exercicio_reps" CHECK ("modelo_exercicio"."reps_min" >= 1 and ("modelo_exercicio"."reps_max" is null or "modelo_exercicio"."reps_max" >= "modelo_exercicio"."reps_min"))
);
--> statement-breakpoint
CREATE TABLE "modelo_treino" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"observacao" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "serie" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"treino_exercicio_id" uuid NOT NULL,
	"ordem" integer NOT NULL,
	"repeticoes" integer NOT NULL,
	"carga_kg" numeric(6, 2),
	"observacao" text,
	CONSTRAINT "serie_repeticoes" CHECK ("serie"."repeticoes" > 0),
	CONSTRAINT "serie_carga" CHECK ("serie"."carga_kg" is null or "serie"."carga_kg" >= 0)
);
--> statement-breakpoint
CREATE TABLE "treino" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nome" text,
	"data" date NOT NULL,
	"observacao" text,
	"modelo_id" uuid,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treino_exercicio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"treino_id" uuid NOT NULL,
	"exercicio_id" uuid NOT NULL,
	"ordem" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exercicio" ADD CONSTRAINT "exercicio_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modelo_exercicio" ADD CONSTRAINT "modelo_exercicio_modelo_id_modelo_treino_id_fk" FOREIGN KEY ("modelo_id") REFERENCES "public"."modelo_treino"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modelo_exercicio" ADD CONSTRAINT "modelo_exercicio_exercicio_id_exercicio_id_fk" FOREIGN KEY ("exercicio_id") REFERENCES "public"."exercicio"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modelo_treino" ADD CONSTRAINT "modelo_treino_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serie" ADD CONSTRAINT "serie_treino_exercicio_id_treino_exercicio_id_fk" FOREIGN KEY ("treino_exercicio_id") REFERENCES "public"."treino_exercicio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treino" ADD CONSTRAINT "treino_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treino" ADD CONSTRAINT "treino_modelo_id_modelo_treino_id_fk" FOREIGN KEY ("modelo_id") REFERENCES "public"."modelo_treino"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treino_exercicio" ADD CONSTRAINT "treino_exercicio_treino_id_treino_id_fk" FOREIGN KEY ("treino_id") REFERENCES "public"."treino"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treino_exercicio" ADD CONSTRAINT "treino_exercicio_exercicio_id_exercicio_id_fk" FOREIGN KEY ("exercicio_id") REFERENCES "public"."exercicio"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "exercicio_nome_unico" ON "exercicio" USING btree ("usuario_id","nome_normalizado");--> statement-breakpoint
CREATE INDEX "modelo_exercicio_modelo_idx" ON "modelo_exercicio" USING btree ("modelo_id");--> statement-breakpoint
CREATE INDEX "modelo_exercicio_exercicio_idx" ON "modelo_exercicio" USING btree ("exercicio_id");--> statement-breakpoint
CREATE INDEX "modelo_treino_usuario_idx" ON "modelo_treino" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "serie_treino_exercicio_idx" ON "serie" USING btree ("treino_exercicio_id");--> statement-breakpoint
CREATE INDEX "treino_usuario_data_idx" ON "treino" USING btree ("usuario_id","data");--> statement-breakpoint
CREATE INDEX "treino_exercicio_treino_idx" ON "treino_exercicio" USING btree ("treino_id");--> statement-breakpoint
CREATE INDEX "treino_exercicio_exercicio_idx" ON "treino_exercicio" USING btree ("exercicio_id");