import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grafos - Plataforma Educacional Completa",
  description: "Plataforma educacional completa para prefeituras e escolas. Melhore o IDEB com banco de questões BNCC, diário online, simulados SAEB e gestão pedagógica integrada.",
  keywords: [
    "plataforma educacional",
    "gestão escolar",
    "BNCC",
    "SAEB",
    "IDEB",
    "diário online",
    "banco de questões",
    "simulados",
    "educação",
    "prefeituras",
    "escolas"
  ],
  authors: [{ name: "Grafos Educação" }],
  openGraph: {
    title: "Grafos - Plataforma Educacional Completa",
    description: "Transformando a educação no Brasil através da tecnologia",
    url: "https://grafoseducacional.com.br",
    siteName: "Grafos",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grafos - Plataforma Educacional",
    description: "Transformando a educação no Brasil através da tecnologia",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
