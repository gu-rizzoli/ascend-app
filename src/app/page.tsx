import { redirect } from "next/navigation";

// O app sempre abre em Hoje (navegacao.md, decisão 4). Quem não está logado é
// levado de lá para /entrar.
export default function Inicio() {
  redirect("/hoje");
}
