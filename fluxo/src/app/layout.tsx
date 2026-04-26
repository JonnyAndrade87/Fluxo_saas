import type { Metadata } from "next";
import { Geist, Manrope } from 'next/font/google';
import "./globals.css";
import '@/lib/deployment-debug';
import { AnalyticsScripts } from '@/components/analytics/AnalyticsScripts';
import { LandingPageAnalytics } from '@/components/analytics/LandingPageAnalytics';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.fluxeer.com.br'),
  title: {
    default: "Fluxeer | Software de cobrança B2B para contas a receber",
    template: "%s | Fluxeer"
  },
  description: "Software de cobrança B2B para equipes financeiras que precisam organizar contas a receber, priorizar risco e ganhar previsibilidade de caixa.",
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
    title: 'Fluxeer | Software de cobrança B2B para contas a receber',
    description: 'Software de cobrança B2B para equipes financeiras que precisam organizar contas a receber, priorizar risco e ganhar previsibilidade de caixa.',
    images: [
      {
        url: '/logo_fluxeer.png',
        alt: 'Fluxeer - Software de cobrança B2B',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fluxeer | Software de cobrança B2B para contas a receber',
    description: 'Software de cobrança B2B para equipes financeiras que precisam organizar contas a receber, priorizar risco e ganhar previsibilidade de caixa.',
    images: ['/logo_fluxeer.png'],
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
      className={`${geist.variable} ${manrope.variable} h-full antialiased`}
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
        <AnalyticsScripts />
        <LandingPageAnalytics />
        {children}
      </body>
    </html>
  );
}
