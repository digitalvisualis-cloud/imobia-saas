import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "ImobIA — Plataforma Inteligente para Corretores e Imobiliárias",
  description: "Gerencie imóveis, gere conteúdo com IA, crie artes para redes sociais, exporte PDFs e construa seu site em minutos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <SessionProvider>
          {children}
          <Toaster position="top-right" />
        </SessionProvider>
      </body>
    </html>
  );
}
