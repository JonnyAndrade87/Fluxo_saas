import LandingPage from "./LandingPageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Fluxeer | Software de cobrança e contas a receber",
  },
  description: "Organize recebíveis, priorize cobranças e tenha mais previsibilidade para o caixa com o Fluxeer.",
  alternates: {
    canonical: "https://www.fluxeer.com.br",
  },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.fluxeer.com.br/#organization",
        "name": "Fluxeer",
        "url": "https://www.fluxeer.com.br",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.fluxeer.com.br/favicon.png"
        },
        "sameAs": [
          "https://www.instagram.com/fluxeer",
          "https://www.linkedin.com/company/fluxeer"
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://www.fluxeer.com.br/#website",
        "url": "https://www.fluxeer.com.br",
        "name": "Fluxeer",
        "description": "Software de cobrança e contas a receber",
        "publisher": {
          "@id": "https://www.fluxeer.com.br/#organization"
        },
        "inLanguage": "pt-BR"
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://www.fluxeer.com.br/#software",
        "name": "Fluxeer",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "offers": {
          "@type": "Offer",
          "price": "0.00",
          "priceCurrency": "BRL"
        }
      },
      {
        "@type": "FAQPage",
        "@id": "https://www.fluxeer.com.br/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "O que é o Fluxeer?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "O Fluxeer é um software avançado de cobrança e gestão de contas a receber focado em automatizar a régua de cobrança e trazer previsibilidade para o caixa das empresas."
            }
          },
          {
            "@type": "Question",
            "name": "Como o Fluxeer ajuda na inadimplência?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Através de uma régua de cobrança inteligente e priorização de faturas por risco, o Fluxeer permite agir antes do atraso se tornar um problema crítico."
            }
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
