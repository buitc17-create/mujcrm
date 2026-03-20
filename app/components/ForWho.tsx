'use client';

import { useState } from 'react';

const tabs = [
  {
    id: 'podnikatel',
    label: 'Podnikatel',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M12 12v4"/><path d="M8 12h8"/>
      </svg>
    ),
    headline: 'Přehled celého byznysu na jednom místě',
    desc: 'Jako podnikatel žongluješ s desítkami věcí najednou. MujCRM ti dá kompletní přehled — zákazníci, obchody, příjmy a úkoly vždy po ruce.',
    bullets: [
      'Přehledný dashboard s klíčovými metrikami',
      'Pipeline obchodů od prvního kontaktu po podpis',
      'Správa zákazníků a kompletní historie komunikace',
      'Reporty a analytika pro lepší rozhodování',
    ],
    accent: '#00BFFF',
  },
  {
    id: 'zamestnavatel',
    label: 'Zaměstnavatel',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    headline: 'Koordinuj tým bez zbytečných porad',
    desc: 'Víš co dělá každý člen týmu, kdo řeší kterého zákazníka a jak plní cíle. Méně e-mailů, více výsledků.',
    bullets: [
      'Rozdělení zákazníků a obchodů mezi členy týmu',
      'Sledování výkonu a aktivit každého zaměstnance',
      'Sdílené poznámky a záznamy ke každému kontaktu',
      'Přístupová práva a role pro různé úrovně týmu',
    ],
    accent: '#7B2FFF',
  },
  {
    id: 'zamestnanec',
    label: 'Zaměstnanec',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      </svg>
    ),
    headline: 'Vždy víš co máš dělat a kdy',
    desc: 'Jasné úkoly, přehledná komunikace a žádné překvapení. Soustřeď se na práci, ne na hledání informací.',
    bullets: [
      'Osobní seznam úkolů a připomínek',
      'Přehled svých zákazníků a obchodů',
      'Historie komunikace vždy dostupná',
      'Notifikace na důležité termíny a změny',
    ],
    accent: '#00BFFF',
  },
  {
    id: 'freelancer',
    label: 'Freelancer',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    headline: 'Profesionální péče o klienty bez asistentky',
    desc: 'Pracuješ sám, ale chceš působit jako firma. MujCRM ti pomůže nezapomínat na klienty, termíny ani faktury.',
    bullets: [
      'Evidence klientů a projektů na jednom místě',
      'Sledování stavu každého projektu a platby',
      'Připomínky k follow-upům a termínům',
      'Jednoduché reporty pro daňové přiznání',
    ],
    accent: '#7B2FFF',
  },
];

export default function ForWho() {
  const [active, setActive] = useState('podnikatel');
  const tab = tabs.find(t => t.id === active)!;

  return (
    <section className="relative py-24 px-6 overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,191,255,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#00BFFF' }}>
            Pro koho
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Funguje pro každého z vás
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={
                active === t.id
                  ? { background: tab.accent + '18', border: `1px solid ${tab.accent}55`, color: tab.accent }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(237,237,237,0.55)' }
              }
            >
              <span style={{ color: active === t.id ? tab.accent : 'rgba(237,237,237,0.4)' }}>
                {t.icon}
              </span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content panel */}
        <div
          key={active}
          className="rounded-2xl p-8 sm:p-10 grid sm:grid-cols-2 gap-10 items-start"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: `1px solid ${tab.accent}22`,
            animation: 'fadeInUp 0.35s ease forwards',
          }}
        >
          {/* Left */}
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5"
              style={{ background: tab.accent + '15', color: tab.accent, border: `1px solid ${tab.accent}30` }}
            >
              {tab.icon}
              {tab.label}
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 leading-snug">{tab.headline}</h3>
            <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(237,237,237,0.55)' }}>
              {tab.desc}
            </p>
            <a
              href="/onboarding"
              className="btn-cyan inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold"
            >
              Vyzkoušet zdarma
              <span>→</span>
            </a>
          </div>

          {/* Right — bullets */}
          <ul className="flex flex-col gap-4 pt-1">
            {tab.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: tab.accent + '20' }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={tab.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="text-sm leading-relaxed" style={{ color: 'rgba(237,237,237,0.75)' }}>
                  {b}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
