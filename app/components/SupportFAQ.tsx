'use client';

import { useState } from 'react';

const channels = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: 'Live chat',
    desc: 'Odpovídáme do 5 minut v pracovní době.',
    accent: '#00BFFF',
    cta: 'Zahájit chat',
    href: '#kontakt',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    title: 'E-mail',
    desc: 'Detailní dotazy vyřešíme do 24 hodin.',
    accent: '#7B2FFF',
    cta: 'Napsat e-mail',
    href: 'mailto:info@mujcrm.cz',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    title: 'Znalostní báze',
    desc: 'Stovky návodů a videí pro samostatné řešení.',
    accent: '#00BFFF',
    cta: 'Procházet návody',
    href: '/znalostni-baze',
  },
];

const faqs = [
  {
    q: 'Musím zadávat platební kartu při registraci?',
    a: 'Ne. Zkušební období 7 dní Business plánu je zcela zdarma a bez platební karty. Kartu zadáš až v případě, že se rozhodneš pokračovat v placeném tarifu.',
  },
  {
    q: 'Mohu kdykoliv zrušit předplatné?',
    a: 'Ano, kdykoli a bez poplatků. Zrušení provedete jedním kliknutím v nastavení účtu. Data si po dobu 30 dní uchováme, kdybyste se rozmysleli.',
  },
  {
    q: 'Jsou moje data v bezpečí a kde jsou uložena?',
    a: 'Data jsou uložena na serverech v EU (Frankfurt), šifrována při přenosu i uložení (AES-256). Jsme plně GDPR compliant.',
  },
  {
    q: 'Mohu importovat zákazníky z Excelu nebo jiného CRM?',
    a: 'Samozřejmě. Podporujeme import z CSV, XLS i přímou migraci z nejpoužívanějších CRM systémů. Pomůžeme vám s každým krokem.',
  },
  {
    q: 'Co se stane po skončení zkušební doby?',
    a: 'Po 7 dnech se účet automaticky přepne na plán Start — neztratíte data ani přístup. Přechod na vyšší plán je na vás, neúčtujeme nic bez vašeho souhlasu.',
  },
];

export default function SupportFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="relative py-24 px-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(123,47,255,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#00BFFF' }}>
            Podpora
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Jsme tu pro vás
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left — channels */}
          <div className="flex flex-col gap-4">
            <p className="text-base font-semibold text-white mb-2">Jak nás kontaktovat</p>
            {channels.map((ch) => (
              <div
                key={ch.title}
                className="rounded-2xl p-5 flex items-start gap-4"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: ch.accent + '15', color: ch.accent }}
                >
                  {ch.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white mb-0.5">{ch.title}</p>
                  <p className="text-xs" style={{ color: 'rgba(237,237,237,0.5)' }}>{ch.desc}</p>
                </div>
                <a
                  href={ch.href}
                  className="text-xs font-semibold flex-shrink-0 mt-0.5 transition-colors"
                  style={{ color: ch.accent }}
                >
                  {ch.cta} →
                </a>
              </div>
            ))}
          </div>

          {/* Right — FAQ accordion */}
          <div className="flex flex-col gap-2">
            <p className="text-base font-semibold text-white mb-2">Časté dotazy</p>
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <button
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  style={{ background: open === i ? 'rgba(0,191,255,0.05)' : 'rgba(255,255,255,0.02)' }}
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  <span className="text-sm font-semibold text-white">{faq.q}</span>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="rgba(237,237,237,0.4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ flexShrink: 0, transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {open === i && (
                  <div
                    className="px-5 pb-4 text-sm leading-relaxed"
                    style={{ color: 'rgba(237,237,237,0.55)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <p className="pt-3">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
