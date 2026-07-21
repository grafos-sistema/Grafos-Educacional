import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/styles/accessibility.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Providers } from "./providers";
import { SkipNav } from "@/components/a11y/SkipNav";
import { getMunicipalityConfig, getMunicipalityCSSVariables } from "@/config/municipality.config";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b82f6" },
    { media: "(prefers-color-scheme: dark)", color: "#1e40af" },
  ],
};

// Carrega configuração do município para metadata dinâmico
const municipalityConfig = getMunicipalityConfig();
const isMainDeployment = process.env.NEXT_PUBLIC_DEPLOYMENT_TYPE !== 'MUNICIPALITY';

export const metadata: Metadata = {
  metadataBase: new URL(isMainDeployment ? 'https://grafoseducacional.com.br' : municipalityConfig.contact.website || 'https://grafoseducacional.com.br'),
  title: {
    default: isMainDeployment
      ? "Grafos - Plataforma Educacional | Sistema de Gestão Escolar BNCC"
      : `${municipalityConfig.name} | ${municipalityConfig.slogan}`,
    template: isMainDeployment
      ? "%s | Grafos - Plataforma Educacional"
      : `%s | ${municipalityConfig.shortName}`
  },
  description: isMainDeployment
    ? "Plataforma educacional completa para prefeituras e escolas. Melhore o IDEB com banco de questões BNCC, diário online, simulados SAEB, relatórios e gestão pedagógica integrada."
    : `Sistema de Gestão Escolar da ${municipalityConfig.name} - ${municipalityConfig.slogan}`,
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
    other: [
      { rel: "icon", url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { rel: "icon", url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Grafos",
  },
  keywords: [
    "gestão escolar",
    "plataforma educacional",
    "BNCC",
    "IDEB",
    "SAEB",
    "banco de questões",
    "diário online",
    "simulados",
    "gestão pedagógica",
    "sistema escolar",
    "educação básica",
    "ensino fundamental",
    "prefeituras",
    "escolas públicas",
    "rankings escolares",
    "frequência escolar",
    "notas e avaliações"
  ],
  authors: [{ name: "Grafos Educação" }],
  creator: "Grafos",
  publisher: "Grafos",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://grafoseducacional.com.br",
    title: "Grafos - Plataforma Educacional | Melhore o IDEB da sua Rede",
    description: "Transforme a educação com nossa plataforma completa: banco de 10.000+ questões BNCC, diário online, simulados SAEB e gestão pedagógica integrada.",
    siteName: "Grafos - Plataforma Educacional",
    images: [
      {
        url: "/logo-grafos.png",
        width: 1200,
        height: 630,
        alt: "Grafos - Plataforma Educacional",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Grafos - Plataforma Educacional",
    description: "Plataforma completa para gestão escolar: BNCC, IDEB, SAEB, diário online e muito mais.",
    images: ["/logo-grafos.png"],
    creator: "@grafoseducacao",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "google-site-verification-code", // Adicionar código real
    // yandex: "yandex-verification-code",
    // bing: "bing-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Aplica CSS variables das cores do município
  const cssVariables = getMunicipalityCSSVariables();

  return (
    <html lang="pt-BR" className="light" suppressHydrationWarning>
      <head>
        {/* Remove browser extension attributes before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Remove attributes added by browser extensions that cause hydration mismatch
                const observer = new MutationObserver(function(mutations) {
                  mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes') {
                      const target = mutation.target;
                      if (target.hasAttribute && (
                        target.hasAttribute('bis_skin_checked') ||
                        target.hasAttribute('data-lastpass-icon-root') ||
                        target.hasAttribute('data-dashlane-rid') ||
                        target.hasAttribute('data-bitwarden-watching')
                      )) {
                        target.removeAttribute('bis_skin_checked');
                        target.removeAttribute('data-lastpass-icon-root');
                        target.removeAttribute('data-dashlane-rid');
                        target.removeAttribute('data-bitwarden-watching');
                      }
                    }
                  });
                });

                if (typeof window !== 'undefined') {
                  observer.observe(document.documentElement, {
                    attributes: true,
                    subtree: true,
                    attributeFilter: ['bis_skin_checked', 'data-lastpass-icon-root', 'data-dashlane-rid', 'data-bitwarden-watching']
                  });

                  // Clean up on page load
                  window.addEventListener('DOMContentLoaded', function() {
                    document.querySelectorAll('[bis_skin_checked], [data-lastpass-icon-root], [data-dashlane-rid], [data-bitwarden-watching]').forEach(function(el) {
                      el.removeAttribute('bis_skin_checked');
                      el.removeAttribute('data-lastpass-icon-root');
                      el.removeAttribute('data-dashlane-rid');
                      el.removeAttribute('data-bitwarden-watching');
                    });
                  });
                }
              })();
            `,
          }}
        />
        {/* PWA Icons */}
        <link rel="apple-touch-icon" sizes="72x72" href="/icons/icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="96x96" href="/icons/icon-96x96.png" />
        <link rel="apple-touch-icon" sizes="128x128" href="/icons/icon-128x128.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="384x384" href="/icons/icon-384x384.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512x512.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="canonical" href="https://grafoseducacional.com.br" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-secondary-50`}
        style={cssVariables}
        suppressHydrationWarning
      >
        <SkipNav />
        <Providers>
          <AuthProvider>{children}</AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
