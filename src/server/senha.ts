import "server-only";

import { hash, verify } from "@node-rs/argon2";

// Argon2id com os parâmetros mínimos recomendados pela OWASP (19 MiB, 2
// passagens). O hash guarda os parâmetros, então dá para subir depois.
const OPCOES = { memoryCost: 19_456, timeCost: 2, parallelism: 1 };

export function gerarHashDeSenha(senha: string): Promise<string> {
  return hash(senha, OPCOES);
}

// Hash de uma senha qualquer, usado quando o e-mail não existe: a resposta
// demora o mesmo tanto e não revela quais e-mails têm conta.
let hashFicticio: Promise<string> | undefined;

export async function conferirSenha(
  senhaHash: string | undefined,
  senha: string,
): Promise<boolean> {
  if (!senhaHash) {
    hashFicticio ??= gerarHashDeSenha("senha-que-nao-existe");
    await verify(await hashFicticio, senha);
    return false;
  }
  return verify(senhaHash, senha);
}
