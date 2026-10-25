CREATE TYPE "public"."status_projeto" AS ENUM('planejado', 'em_andamento', 'pausado', 'concluido', 'arquivado');--> statement-breakpoint
CREATE TABLE "projeto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"status" "status_projeto" DEFAULT 'em_andamento' NOT NULL,
	"proximo_passo" text,
	"data_inicio" date NOT NULL,
	"prazo" date,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projeto_prazo" CHECK ("projeto"."prazo" is null or "projeto"."prazo" >= "projeto"."data_inicio")
);
--> statement-breakpoint
CREATE TABLE "projeto_atual_troca" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"projeto_id" uuid,
	"data" date NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meta_versao" ADD COLUMN "projeto_id" uuid;--> statement-breakpoint
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projeto_atual_troca" ADD CONSTRAINT "projeto_atual_troca_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projeto_atual_troca" ADD CONSTRAINT "projeto_atual_troca_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projeto_usuario_idx" ON "projeto" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "projeto_atual_troca_usuario_idx" ON "projeto_atual_troca" USING btree ("usuario_id","data","criado_em");--> statement-breakpoint
ALTER TABLE "meta_versao" ADD CONSTRAINT "meta_versao_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meta_versao_projeto_idx" ON "meta_versao" USING btree ("projeto_id");