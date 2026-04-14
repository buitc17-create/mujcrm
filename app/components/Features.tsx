'use client';

import Link from 'next/link';

const features = [
  {
    title: 'Správa zákazníků',
    desc: 'Kompletní profily kontaktů s historií komunikace, poznámkami a přílohami. Nikdy nezapomeneš na kontext.',
    accent: '#00BFFF',
    href: '/funkce/sprava-zakazniku',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    title: 'Přehledná analytika',
    desc: 'Grafy, trendové reporty a klíčové metriky na jednom dashboardu. Rozhoduj se na základě dat, ne tušení.',
    accent: '#7B2FFF',
    href: '/funkce/analytika',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
        <line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
  },
  {
    title: 'Komunikace',
    desc: 'E‑maily, poznámky a aktivity přímo u zákazníka. Veškerá komunikace přehledně na jednom místě.',
    accent: '#00BFFF',
    href: '/funkce/komunikace',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
  },
  {
    title: 'Bezpečnost a soukromí',
    desc: 'Data v EU, šifrování end-to-end, zálohy každých 24 hodin a GDPR compliance. Tvoje data jsou tvoje.',
    accent: '#7B2FFF',
    href: '/funkce/bezpecnost-a-soukromi',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    title: 'Automatizace a úkoly',
    desc: 'Nastav si automatické připomínky, follow-upy a workflow. Nechej rutinní práci na systému.',
    accent: '#00BFFF',
    href: '/funkce/automatizace',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
  {
    title: 'Integrace a API',
    desc: 'Propoj MujCRM s nástroji, které už používáš — e-mail, fakturace, kalendář nebo vlastní systémy přes API.',
    accent: '#7B2FFF',
    href: '/funkce/integrace-a-api',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
        <line x1="19" y1="12" x2="5" y2="12"/>
      </svg>
    ),
  },
];

export default function Features() {
  return (
    <section className="relative py-24 px-6 overflow-hidden">
      {/* Glow blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(123,47,255,0.08) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
        <div
          className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,191,255,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#00BFFF' }}>
            Funkce
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Vše co potřebujete<br className="hidden sm:block" /> na jednom místě
          </h2>
        </div>

        {/* Grid 3×2 */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className="group rounded-2xl p-6 flex flex-col gap-4"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
                transition: 'border-color 0.2s, background 0.2s',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = f.accent + '40';
                e.currentTarget.style.background = f.accent + '06';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
              }}
            >
              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: f.accent + '15', color: f.accent }}
              >
                {f.icon}
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-1.5">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(237,237,237,0.5)' }}>
                  {f.desc}
                </p>
              </div>

              {/* Arrow hint */}
              <div className="mt-auto pt-2">
                <span
                  className="text-xs font-semibold transition-all"
                  style={{ color: f.accent + 'aa' }}
                >
                  Více o funkci →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
