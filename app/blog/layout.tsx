import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog – Tipy a průvodci pro CRM v ČR",
  description:
    "Tipy, průvodci a srovnání pro podnikatele a firmy v ČR. Naučte se využívat CRM systém naplno a zvyšte obrat svého byznysu.",
  keywords: [
    "CRM blog",
    "tipy CRM",
    "CRM pro firmy česky",
    "správa zákazníků návody",
    "GDPR CRM",
    "obchodní pipeline",
  ],
  alternates: { canonical: "https://www.mujcrm.cz/blog" },
  openGraph: {
    title: "Blog – Tipy a průvodci pro CRM v ČR | MujCRM",
    description:
      "Tipy, průvodci a srovnání pro podnikatele a firmy v ČR. Naučte se využívat CRM naplno.",
    url: "https://www.mujcrm.cz/blog",
    type: "website",
    locale: "cs_CZ",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
