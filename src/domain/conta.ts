import { z } from "zod";

/** Regras da conta (11.1): campos do cadastro e duração da sessão. */

export const SENHA_MINIMA = 8;
// Argon2 aceita senhas longas, mas um limite evita hash de textos enormes.
export const SENHA_MAXIMA = 128;

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Digite um e-mail válido."));

export const esquemaCadastro = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "Digite seu nome.")
    .max(80, "Use no máximo 80 caracteres."),
  email,
  senha: z
    .string()
    .min(
      SENHA_MINIMA,
      `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`,
    )
    .max(SENHA_MAXIMA, `Use no máximo ${SENHA_MAXIMA} caracteres.`),
});

export const esquemaEntrada = z.object({
  email,
  senha: z.string().min(1, "Digite sua senha.").max(SENHA_MAXIMA),
});

export type DadosCadastro = z.infer<typeof esquemaCadastro>;
export type DadosEntrada = z.infer<typeof esquemaEntrada>;

export type ErrosDeCampo<T> = Partial<Record<keyof T, string>>;

/** Primeira mensagem de erro de cada campo, para mostrar no formulário. */
export function errosPorCampo<T>(erro: z.ZodError<T>): ErrosDeCampo<T> {
  const erros: Record<string, string> = {};
  for (const problema of erro.issues) {
    const campo = String(problema.path[0]);
    erros[campo] ??= problema.message;
  }
  return erros as ErrosDeCampo<T>;
}

const MS_POR_DIA = 86_400_000;

/** Quanto tempo uma sessão dura sem uso. */
export const DIAS_DE_SESSAO = 30;

export function expiracaoDaSessao(agora: Date): Date {
  return new Date(agora.getTime() + DIAS_DE_SESSAO * MS_POR_DIA);
}

export function sessaoExpirada(expiraEm: Date, agora: Date): boolean {
  return expiraEm.getTime() <= agora.getTime();
}

/**
 * A sessão é estendida quando passa da metade da validade. Assim quem usa o
 * app com frequência não precisa entrar de novo, e o banco não é gravado a
 * cada página aberta.
 */
export function sessaoPrecisaRenovar(expiraEm: Date, agora: Date): boolean {
  const restante = expiraEm.getTime() - agora.getTime();
  return restante < (DIAS_DE_SESSAO * MS_POR_DIA) / 2;
}
