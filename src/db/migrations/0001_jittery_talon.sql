CREATE TYPE "public"."estado_meta" AS ENUM('ativa', 'pausada', 'excluida');--> statement-breakpoint
CREATE TYPE "public"."estado_ocorrencia" AS ENUM('pendente', 'concluida', 'nao_concluida');--> statement-breakpoint
CREATE TYPE "public"."frequencia_meta" AS ENUM('unica', 'diaria', 'semanal', 'intervalo');--> statement-breakpoint
CREATE TYPE "public"."origem_ocorrencia" AS ENUM('regra', 'reagendada');--> statement-breakpoint
CREATE TYPE "public"."tipo_meta" AS ENUM('binaria', 'numerica');--> statement-breakpoint
CREATE TABLE "meta" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"tipo" "tipo_meta" NOT NULL,
	"unidade" text,
	"estado" "estado_meta" DEFAULT 'ativa' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"excluida_em" timestamp with time zone,
	CONSTRAINT "meta_unidade_conforme_tipo" CHECK (("meta"."tipo" = 'numerica') = ("meta"."unidade" is not null))
);
--> statement-breakpoint
CREATE TABLE "meta_versao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meta_id" uuid NOT NULL,
	"vigente_de" date NOT NULL,
	"vigente_ate" date,
	"titulo" text NOT NULL,
	"descricao" text,
	"horario" time,
	"valor_alvo" numeric(12, 3),
	"frequencia" "frequencia_meta" NOT NULL,
	"dias_semana" smallint[],
	"intervalo_dias" integer,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meta_versao_vigencia" CHECK ("meta_versao"."vigente_ate" is null or "meta_versao"."vigente_ate" >= "meta_versao"."vigente_de"),
	CONSTRAINT "meta_versao_dias_semana" CHECK (("meta_versao"."frequencia" = 'semanal') = ("meta_versao"."dias_semana" is not null)
        and ("meta_versao"."dias_semana" is null or (cardinality("meta_versao"."dias_semana") > 0
        and "meta_versao"."dias_semana" <@ array[0,1,2,3,4,5,6]::smallint[]))),
	CONSTRAINT "meta_versao_intervalo" CHECK (("meta_versao"."frequencia" = 'intervalo') = ("meta_versao"."intervalo_dias" is not null)
        and ("meta_versao"."intervalo_dias" is null or "meta_versao"."intervalo_dias" >= 2)),
	CONSTRAINT "meta_versao_valor_alvo" CHECK ("meta_versao"."valor_alvo" is null or "meta_versao"."valor_alvo" > 0)
);
--> statement-breakpoint
CREATE TABLE "ocorrencia" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"meta_id" uuid NOT NULL,
	"versao_id" uuid NOT NULL,
	"origem" "origem_ocorrencia" DEFAULT 'regra' NOT NULL,
	"data_prevista" date,
	"data" date NOT NULL,
	"reagendada_de_id" uuid,
	"estado" "estado_ocorrencia" DEFAULT 'pendente' NOT NULL,
	"valor_atual" numeric(12, 3),
	"titulo" text,
	"horario" time,
	"valor_alvo" numeric(12, 3),
	"concluida_em" timestamp with time zone,
	"encerrada_em" timestamp with time zone,
	"corrigida_apos_encerramento" boolean DEFAULT false NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ocorrencia_origem" CHECK (("ocorrencia"."origem" = 'regra' and "ocorrencia"."data_prevista" is not null and "ocorrencia"."reagendada_de_id" is null)
        or ("ocorrencia"."origem" = 'reagendada' and "ocorrencia"."data_prevista" is null and "ocorrencia"."reagendada_de_id" is not null)),
	CONSTRAINT "ocorrencia_valor_atual" CHECK ("ocorrencia"."valor_atual" is null or "ocorrencia"."valor_atual" >= 0)
);
--> statement-breakpoint
ALTER TABLE "meta" ADD CONSTRAINT "meta_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_versao" ADD CONSTRAINT "meta_versao_meta_id_meta_id_fk" FOREIGN KEY ("meta_id") REFERENCES "public"."meta"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocorrencia" ADD CONSTRAINT "ocorrencia_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocorrencia" ADD CONSTRAINT "ocorrencia_meta_id_meta_id_fk" FOREIGN KEY ("meta_id") REFERENCES "public"."meta"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocorrencia" ADD CONSTRAINT "ocorrencia_versao_id_meta_versao_id_fk" FOREIGN KEY ("versao_id") REFERENCES "public"."meta_versao"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocorrencia" ADD CONSTRAINT "ocorrencia_reagendada_de_fk" FOREIGN KEY ("reagendada_de_id") REFERENCES "public"."ocorrencia"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meta_usuario_idx" ON "meta" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "meta_versao_meta_idx" ON "meta_versao" USING btree ("meta_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ocorrencia_vaga_unica" ON "ocorrencia" USING btree ("meta_id","data_prevista") WHERE "ocorrencia"."origem" = 'regra';--> statement-breakpoint
CREATE INDEX "ocorrencia_usuario_data_idx" ON "ocorrencia" USING btree ("usuario_id","data");--> statement-breakpoint
CREATE INDEX "ocorrencia_usuario_data_prevista_idx" ON "ocorrencia" USING btree ("usuario_id","data_prevista");