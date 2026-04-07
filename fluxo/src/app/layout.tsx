import type { Metadata } from "next";
import "./globals.css";
import '@/lib/deployment-debug';

export const metadata: Metadata = {
  title: "Fluxeer – Inteligência Financeira",
  description: "Plataforma avançada de pagamentos, cobranças e visão de futuro.",
  icons: {
    icon: [
      { url: '/favicon.ico' },            // Fallback para browsers antigos
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',       // iOS Safari home screen
    shortcut: '/favicon.ico',             // Firefox / Edge
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
