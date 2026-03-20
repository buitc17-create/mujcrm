'use client';

const steps = [
  {
    num: '01',
    title: 'Registruj se zdarma',
    desc: 'Žádná platební karta, žádné závazky. Účet máš připravený za 30 sekund.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Vyplň krátký dotazník',
    desc: 'Řekni nám o svém oboru a týmu. MujCRM se přizpůsobí přesně tvým potřebám.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Začni přidávat zákazníky',
    desc: 'Importuj kontakty, vytvoř první obchod a sleduj jak ti byznys roste.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

const Arrow = () => (
  <div className="hidden lg:flex items-center justify-center flex-shrink-0 mt-8">
    <svg width="40" height="16" viewBox="0 0 40 16" fill="none">
      <path d="M0 8 Q10 8 20 8 Q30 8 38 8" stroke="rgba(0,191,255,0.3)" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M34 4 L40 8 L34 12" stroke="rgba(0,191,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  </div>
);

export default function HowItWorks() {
  return (
    <section className="relative py-24 px-6 overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(123,47,255,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#00BFFF' }}>
            Jak to funguje
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Od nuly k prvnímu zákazníkovi<br className="hidden sm:block" /> za pár minut
          </h2>
        </div>

        {/* Cards + arrows */}
        <div className="flex flex-col lg:flex-row items-start gap-4 lg:gap-0 mb-12">
          {steps.map((step, i) => (
            <div key={step.num} className="contents">
              <div
                className="flex-1 rounded-2xl p-7 flex flex-col gap-5 w-full"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.25)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
              >
                {/* Number + icon row */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-4xl font-black leading-none"
                    style={{ color: 'rgba(255,255,255,0.06)', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {step.num}
                  </span>
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(0,191,255,0.1)', color: '#00BFFF' }}
                  >
                    {step.icon}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(237,237,237,0.55)' }}>
                    {step.desc}
                  </p>
                </div>
              </div>

              {i < steps.length - 1 && <Arrow />}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <a
            href="/onboarding"
            className="btn-cyan inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold"
          >
            Začít zdarma – krok 1
            <span>→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
