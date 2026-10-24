import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { db } from "@/db";
import { sessao, usuario } from "@/db/schema";
import {
  expiracaoDaSessao,
  sessaoExpirada,
  sessaoPrecisaRenovar,
} from "@/domain/conta";

const COOKIE = "ascend_sessao";
// O cookie vive bastante; quem decide se a sessão vale é o banco (expira_em).
const COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

export type UsuarioDaSessao = {
  id: string;
  nome: string;
  email: string;
  fechadoAte: string;
};

function hashDoToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Cria a sessão no banco e grava o cookie. Só em Server Actions. */
export async function iniciarSessao(usuarioId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  await db()
    .insert(sessao)
    .values({
      usuarioId,
      tokenHash: hashDoToken(token),
      expiraEm: expiracaoDaSessao(new Date()),
    });

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

/** Apaga a sessão atual do banco e o cookie. Só em Server Actions. */
export async function encerrarSessao(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await db()
      .delete(sessao)
      .where(eq(sessao.tokenHash, hashDoToken(token)));
  }
  jar.delete(COOKIE);
}

/**
 * O usuário dono da sessão deste pedido, ou null. Memorizado por pedido, então
 * layout e página podem chamar à vontade.
 */
export const usuarioAtual = cache(async (): Promise<UsuarioDaSessao | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const [linha] = await db()
    .select({
      sessaoId: sessao.id,
      expiraEm: sessao.expiraEm,
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      fechadoAte: usuario.fechadoAte,
    })
    .from(sessao)
    .innerJoin(usuario, eq(sessao.usuarioId, usuario.id))
    .where(eq(sessao.tokenHash, hashDoToken(token)))
    .limit(1);
  if (!linha) return null;

  const agora = new Date();
  if (sessaoExpirada(linha.expiraEm, agora)) {
    await db().delete(sessao).where(eq(sessao.id, linha.sessaoId));
    return null;
  }
  if (sessaoPrecisaRenovar(linha.expiraEm, agora)) {
    await db()
      .update(sessao)
      .set({ expiraEm: expiracaoDaSessao(agora) })
      .where(eq(sessao.id, linha.sessaoId));
  }

  const { id, nome, email, fechadoAte } = linha;
  return { id, nome, email, fechadoAte };
});

/** Para páginas logadas: devolve o usuário ou manda para /entrar (RF-GLO-04). */
export async function exigirUsuario(): Promise<UsuarioDaSessao> {
  const atual = await usuarioAtual();
  if (!atual) redirect("/entrar");
  return atual;
}
