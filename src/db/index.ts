import "server-only";

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

let instancia: NodePgDatabase<typeof schema> | undefined;

/**
 * Conexão com o PostgreSQL (Neon em produção). Criada na primeira chamada,
 * para que o build não precise de DATABASE_URL.
 */
export function db(): NodePgDatabase<typeof schema> {
  if (!instancia) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL não definida. Veja .env.example.");
    }
    instancia = drizzle(url, { schema });
  }
  return instancia;
}
