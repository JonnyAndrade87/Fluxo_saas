import type { Metadata } from "next";
import "./globals.css";
import '@/lib/deployment-debug';

export const metadata: Metadata = {
  title: "Fluxeer – Inteligência Financeira",
  description: "Plataforma avançada de pagamentos, cobranças e visão de futuro.",
  icons: {
    icon: '/favicon.png',
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
