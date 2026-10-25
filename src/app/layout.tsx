import type { Metadata, Viewport } from "next";
import { Manrope, Nunito, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// PRÉVIA: as fontes dos três estilos. Depois da escolha fica uma.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--fonte-jakarta",
});
const nunito = Nunito({ subsets: ["latin"], variable: "--fonte-nunito" });
const manrope = Manrope({ subsets: ["latin"], variable: "--fonte-manrope" });

export const metadata: Metadata = {
  title: "Ascend",
  description: "Metas, projetos e treinos em um só lugar.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// PRÉVIA: ?tema=menta|sol|noite troca o estilo e fica lembrado no aparelho.
const escolherTema = `try{var t=new URLSearchParams(location.search).get("tema");if(t)localStorage.setItem("ascend:tema",t);t=localStorage.getItem("ascend:tema");if(t)document.documentElement.dataset.tema=t}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-tema="menta"
      suppressHydrationWarning
      className={`${jakarta.variable} ${nunito.variable} ${manrope.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: escolherTema }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
