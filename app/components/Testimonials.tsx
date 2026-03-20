'use client';

const reviews = [
  {
    stars: 5,
    quote: 'MujCRM nám ušetřilo hodiny každý týden. Nakonec víme co se děje s každým zákazníkem — žádný chaos, žádné zapomenuté follow-upy.',
    initials: 'TN',
    name: 'Tomáš Novotný',
    role: 'Jednatel, FreshByte s.r.o.',
    accent: '#00BFFF',
  },
  {
    stars: 5,
    quote: 'Zkoušeli jsme dražší zahraniční řešení, ale MujCRM je v češtině, intuitivní a podporu dostanete opravdu od lidí. To se počítá.',
    initials: 'LK',
    name: 'Lucie Kratochvílová',
    role: 'Obchodní ředitelka, K&K Tech',
    accent: '#7B2FFF',
  },
  {
    stars: 5,
    quote: 'Jako freelancer jsem potřeboval jednoduchost. Nastavení trvalo 5 minut, pipeline si mě uchvátil. Mým klientům teď nic neunikne.',
    initials: 'MH',
    name: 'Marek Horák',
    role: 'Freelance konzultant',
    accent: '#00BFFF',
  },
];

const Stars = ({ count }: { count: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: count }).map((_, i) => (
      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="none">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ))}
  </div>
);

export default function Testimonials() {
  return (
    <section className="relative py-24 px-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(0,191,255,0.05) 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#00BFFF' }}>
            Reference
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Reálné výsledky, skutečné firmy
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-5 mb-12">
          {reviews.map((r) => (
            <div
              key={r.name}
              className="rounded-2xl p-7 flex flex-col gap-5"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <Stars count={r.stars} />

              <p
                className="text-sm leading-relaxed flex-1"
                style={{ color: 'rgba(237,237,237,0.7)' }}
              >
                &ldquo;{r.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: r.accent + '22', color: r.accent }}
                >
                  {r.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{r.name}</p>
                  <p className="text-xs" style={{ color: 'rgba(237,237,237,0.45)' }}>{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <a
            href="/onboarding"
            className="btn-cyan inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold"
          >
            Zkusit zdarma – 7 dní bez karty
            <span>→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
