import { formatarDataLonga, hoje } from "@/domain/datas";

// Página provisória da entrega 0: confirma que o app sobe e que a data
// civil é calculada no fuso do produto. Será trocada pelo redirecionamento
// para /hoje na entrega 2.
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-2 px-4">
      <h1 className="text-2xl font-semibold">Ascend</h1>
      <p className="text-neutral-600">Hoje é {formatarDataLonga(hoje())}.</p>
    </main>
  );
}
