import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import CookieConsent from "./components/CookieConsent";

const GA_ID = "G-P9DZEWP7PX";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "optional",
});

const BASE_URL = "https://www.mujcrm.cz";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "MujCRM – CRM systém pro realitní makléře a obchodníky",
    template: "%s | MujCRM",
  },
  description:
    "MujCRM je CRM systém postavený pro realitní makléře, obchodníky a finanční poradce. Leady, poptávky, zakázky i provize bez i s DPH na jednom místě. 7 dní zdarma.",
  keywords: [
    "CRM pro realitní makléře",
    "CRM pro realitní kancelář",
    "software pro makléře",
    "CRM pro obchodníky",
    "CRM pro finanční poradce",
    "realitní CRM",
    "evidence poptávek",
    "CRM systém",
    "CRM česky",
    "obchodní pipeline",
    "crm zdarma",
  ],
  authors: [{ name: "Tomáš Vydra" }],
  creator: "Tomáš Vydra",
  publisher: "Tomáš Vydra",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
    languages: { "cs-CZ": BASE_URL },
  },
  openGraph: {
    type: "website",
    locale: "cs_CZ",
    url: BASE_URL,
    siteName: "MujCRM",
    title: "MujCRM – CRM systém pro realitní makléře a obchodníky",
    description:
      "CRM postavený pro realitní makléře, obchodníky a finanční poradce. Leady, poptávky, zakázky i provize na jednom místě. 7 dní zdarma.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MujCRM – CRM systém pro realitní makléře a obchodníky",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MujCRM – CRM systém pro realitní makléře a obchodníky",
    description:
      "CRM postavený pro realitní makléře, obchodníky a finanční poradce. 7 dní zdarma.",
    images: ["/og-image.png"],
  },
  other: {
    "geo.region": "CZ",
    "geo.placename": "Česká republika",
    "content-language": "cs",
    "DC.language": "cs",
    "DC.coverage": "Czech Republic",
  },
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MujCRM",
  url: BASE_URL,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  inLanguage: "cs",
  description:
    "MujCRM je CRM systém navržený speciálně pro realitní makléře, obchodníky a finanční poradce v České republice. Obsahuje evidenci leadů, poptávek klientů a zakázek v přehledném pipeline, výpočet provize bez i s DPH, e-mailové automatizace a nástroje pro řízení obchodního týmu.",
  audience: {
    "@type": "Audience",
    audienceType: "Realitní makléři, obchodníci, finanční poradci, vedoucí obchodních týmů",
    geographicArea: {
      "@type": "Country",
      name: "Česká republika",
    },
  },
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "CZK",
      description: "Základní CRM funkce, 1 uživatel",
    },
    {
      "@type": "Offer",
      name: "Start",
      price: "299",
      priceCurrency: "CZK",
      billingIncrement: "P1M",
      description: "Správa kontaktů, pipeline, e-mailová schránka, leady",
    },
    {
      "@type": "Offer",
      name: "Tým",
      price: "599",
      priceCurrency: "CZK",
      billingIncrement: "P1M",
      description: "Vše ze Start + automatizace, reporting, až 3 členové týmu",
    },
    {
      "@type": "Offer",
      name: "Business",
      price: "999",
      priceCurrency: "CZK",
      billingIncrement: "P1M",
      description: "Pokročilý reporting, export dat, prioritní podpora, až 10 členů",
    },
    {
      "@type": "Offer",
      name: "Enterprise",
      price: "1799",
      priceCurrency: "CZK",
      billingIncrement: "P1M",
      description: "API přístup, dedikovaný support, neomezený počet členů",
    },
  ],
  featureList: [
    "Pipeline zakázek a leadů (Kanban)",
    "Evidence poptávek klientů (investor / kupující)",
    "Sledování zdroje leadu a doporučitele",
    "Výpočet provize bez i s DPH",
    "E-mailové automatizace a follow-upy",
    "Týmová spolupráce a výkazy výkonu",
    "Import kontaktů z CSV",
    "Reporty a analytika příjmů",
    "GDPR compliant",
  ],
  screenshot: `${BASE_URL}/og-image.png`,
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "127",
    bestRating: "5",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MujCRM",
  url: BASE_URL,
  logo: `${BASE_URL}/og-image.png`,
  description:
    "MujCRM je CRM systém pro realitní makléře, obchodníky a finanční poradce v České republice. Pomáhá jim spravovat leady, poptávky, zakázky, provize a obchodní tým na jednom místě.",
  foundingDate: "2024",
  inLanguage: "cs",
  areaServed: {
    "@type": "Country",
    name: "Česká republika",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    availableLanguage: "Czech",
    url: `${BASE_URL}/auth/register`,
  },
  sameAs: [BASE_URL],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" className={`${inter.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {/* PWA – iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MujCRM" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body className="min-h-full flex flex-col">
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script
          id="ga-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{page_path:window.location.pathname});`,
          }}
        />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
