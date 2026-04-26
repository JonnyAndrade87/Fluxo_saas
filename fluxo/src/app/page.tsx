import LandingPage from "./LandingPageClient";
import { Metadata } from "next";
import { landingFaqs } from '@/content/landing';

export const metadata: Metadata = {
  title: {
    absolute: "Fluxeer | Software de cobrança B2B para contas a receber",
  },
  description: "Software de cobrança B2B para equipes financeiras que precisam organizar contas a receber, priorizar risco e ganhar previsibilidade de caixa.",
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
          "url": "https://www.fluxeer.com.br/logo_fluxeer.png"
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
        "description": "Software de cobrança B2B e contas a receber",
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
        "description": "Plataforma para organizar contas a receber, automatizar a régua de cobrança e melhorar a previsibilidade de caixa em operações B2B."
      },
      {
        "@type": "FAQPage",
        "@id": "https://www.fluxeer.com.br/#faq",
        "mainEntity": landingFaqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
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
