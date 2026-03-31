import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Znalostní báze – Nápověda a návody",
  description:
    "Odpovědi na nejčastější otázky o MujCRM. Návody pro správu zákazníků, obchodní pipeline, fakturaci a technickou podporu. Vše v češtině.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://mujcrm.vercel.app/znalostni-baze" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
