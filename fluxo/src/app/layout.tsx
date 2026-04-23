import type { Metadata } from "next";
import "./globals.css";
import '@/lib/deployment-debug';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.fluxeer.com.br'),
  title: {
    default: "Fluxeer | Software de cobrança e contas a receber",
    template: "%s | Fluxeer"
  },
  description: "Organize recebíveis, priorize cobranças e tenha mais previsibilidade para o caixa com o Fluxeer.",
  keywords: ["software de cobrança", "contas a receber", "automação financeira", "gestão de recebíveis", "fluxo de caixa"],
  authors: [{ name: "Fluxeer Team" }],
  creator: "Fluxeer",
  publisher: "Fluxeer",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://www.fluxeer.com.br',
    siteName: 'Fluxeer',
    title: 'Fluxeer | Software de cobrança e contas a receber',
    description: 'Organize recebíveis, priorize cobranças e tenha mais previsibilidade para o caixa com o Fluxeer.',
    images: [
      {
        url: '/og-image.png', // We'll assume this exists or user will provide
        width: 1200,
        height: 630,
        alt: 'Fluxeer - Inteligência Financeira',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fluxeer | Software de cobrança e contas a receber',
    description: 'Organize recebíveis, priorize cobranças e tenha mais previsibilidade para o caixa com o Fluxeer.',
    images: ['/og-image.png'],
    creator: '@fluxeer',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
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
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        {/* Explicit favicon tags for Safari and all browsers */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
