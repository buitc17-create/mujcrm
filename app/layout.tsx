import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CookieConsent from "./components/CookieConsent";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const BASE_URL = "https://www.mujcrm.cz";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "MujCRM – CRM systém pro české podnikatele a firmy",
    template: "%s | MujCRM",
  },
  description:
    "MujCRM je moderní CRM systém pro podnikatele, freelancery a malé firmy v České republice. Správa zákazníků, obchodů a týmu na jednom místě. Vyzkoušejte zdarma.",
  keywords: [
    "CRM systém",
    "CRM pro podnikatele",
    "správa zákazníků",
    "CRM česky",
    "CRM pro malé firmy",
    "CRM freelancer",
    "obchodní pipeline",
    "správa kontaktů",
    "CRM software česká republika",
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
    title: "MujCRM – CRM systém pro české podnikatele a firmy",
    description:
      "Moderní CRM pro podnikatele, freelancery a malé firmy v ČR. Správa zákazníků, obchodů a týmu na jednom místě. 7 dní zdarma.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MujCRM – CRM systém pro české firmy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MujCRM – CRM systém pro české podnikatele a firmy",
    description:
      "Moderní CRM pro podnikatele, freelancery a malé firmy v ČR. 7 dní zdarma.",
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MujCRM",
  url: BASE_URL,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  inLanguage: "cs",
  description:
    "Moderní CRM systém pro české podnikatele, freelancery a malé firmy. Správa zákazníků, obchodů a týmu na jednom místě.",
  audience: {
    "@type": "Audience",
    audienceType: "Podnikatelé, freelanceři, malé a střední firmy",
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
    "Správa zákazníků a kontaktů",
    "Obchodní pipeline (Kanban)",
    "Týmová spolupráce",
    "Import z CSV",
    "Reporty a analytika",
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* PWA – iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MujCRM" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: '#0a0a0a', color: '#ededed' }}>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
