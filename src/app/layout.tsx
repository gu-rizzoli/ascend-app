import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { scriptDaAparencia } from "@/ui/aparencia";

import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--fonte-jakarta",
});

export const metadata: Metadata = {
  title: "Ascend",
  description: "Metas, projetos e treinos em um só lugar.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // O script troca o data-tema antes de o React montar.
    <html lang="pt-BR" suppressHydrationWarning className={jakarta.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptDaAparencia }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
