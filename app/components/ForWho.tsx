'use client';

import { useState } from 'react';

const tabs = [
  {
    id: 'makler',
    label: 'Realitní makléř',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>
      </svg>
    ),
    headline: 'Zakázky, poptávky i klienti přehledně na jednom místě',
    desc: 'Žádné excel tabulky ani rozházené poznámky ze schůzek. MujCRM ti drží pipeline zakázek, poptávky klientů i kontakty pohromadě.',
    bullets: [
      'Přehledný pipeline zakázek od kontaktu po podpis',
      'Evidence poptávek klientů (investor / kupující) a co hledají',
      'Sledování zdroje každého leadu, včetně doporučení',
      'Provize s výpočtem bez i s DPH',
    ],
    accent: '#00BFFF',
  },
  {
    id: 'obchodnik',
    label: 'Obchodník',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
    headline: 'Víc uzavřených obchodů, míň administrativy',
    desc: 'Sleduj každý lead od prvního kontaktu až po podpis, automatizuj follow-upy a měj přehled, co skutečně funguje.',
    bullets: [
      'Kanban pipeline pro obchody a leady',
      'E-mailové automatizace a sekvence follow-upů',
      'Reporting a výhled příjmů podle období',
      'Import kontaktů z vlastní tabulky',
    ],
    accent: '#7B2FFF',
  },
  {
    id: 'poradce',
    label: 'Finanční poradce',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5c0-1.4 1.1-2.5 2.5-2.5s2.5.7 2.5 2c0 2-5 1.5-5 3.5 0 1.3 1.1 2 2.5 2s2.5-1.1 2.5-2.5"/>
      </svg>
    ),
    headline: 'Klienti a doporučení pod kontrolou',
    desc: 'Evidence klientů, sledování doporučení a automatické připomínky, ať ti žádný follow-up neproklouzne mezi prsty.',
    bullets: [
      'Evidence klientů a historie komunikace',
      'Sledování zdroje leadu a doporučitele',
      'Automatické e-mailové sekvence a připomínky',
      'Přehledné reporty pro klientská jednání',
    ],
    accent: '#00BFFF',
  },
  {
    id: 'vedouci',
    label: 'Vedoucí týmu',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    headline: 'Přiřaď práci a měj přehled',
    desc: 'Přiřaď zákazníky a zakázky konkrétním členům týmu. Každý ví, co má na starosti, a ty dostaneš automatický měsíční výkaz výkonu každého člena.',
    bullets: [
      'Přiřazení zakázek a leadů konkrétním členům týmu',
      'Pozvání členů a správa přístupových rolí',
      'Automatický měsíční výkaz výkonu každého člena e‑mailem',
      'Limity členů dle tarifu (Tým 3, Business 10, Enterprise neomezený)',
    ],
    accent: '#7B2FFF',
  },
];

export default function ForWho() {
  const [active, setActive] = useState('makler');
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
