import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MujCRM – Tvůj byznys si zaslouží systém",
  description: "Zákazníci, obchody i tým přehledně na jednom místě. Konečně bez chaosu. Vyzkoušej MujCRM 7 dní zdarma.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" style={{ background: '#0a0a0a', color: '#ededed' }}>
        {children}
      </body>
    </html>
  );
}
