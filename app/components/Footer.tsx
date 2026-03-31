'use client';

const navLinks = [
  { label: 'Funkce', href: '/#funkce' },
  { label: 'Ceník', href: '/#pricing' },
  { label: 'Blog', href: '/blog' },
  { label: 'Kontakt', href: '/#kontakt' },
];

const supportLinks = [
  { label: 'FAQ', href: '/#podpora' },
  { label: 'Znalostní báze', href: '/znalostni-baze' },
  { label: 'GDPR', href: '/gdpr' },
  { label: 'Podmínky použití', href: '/podminky' },
];

export default function Footer() {
  return (
    <footer
      className="relative mt-auto px-6 pt-16 pb-8"
      style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div className="lg:col-span-2">
            <a href="/" className="inline-flex items-center gap-2 mb-5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-base"
                style={{ background: 'linear-gradient(135deg, #00BFFF, #7B2FFF)' }}
              >
                M
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                Muj<span style={{ color: '#00BFFF' }}>CRM</span>
              </span>
            </a>
            <p className="text-sm leading-relaxed max-w-xs mb-6" style={{ color: 'rgba(237,237,237,0.45)' }}>
              Moderní CRM pro české firmy. Zákazníci, obchody a tým přehledně na jednom místě.
            </p>
            {/* Status indicator */}
            <div
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: '#22c55e' }}
                />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#22c55e' }} />
              </span>
              <span style={{ color: '#22c55e' }}>Všechny systémy funkční</span>
            </div>
          </div>

          {/* Nav */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-5" style={{ color: 'rgba(237,237,237,0.35)' }}>
              Navigace
            </p>
            <ul className="flex flex-col gap-3">
              {navLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-sm transition-colors"
                    style={{ color: 'rgba(237,237,237,0.55)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ededed')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(237,237,237,0.55)')}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-5" style={{ color: 'rgba(237,237,237,0.35)' }}>
              Podpora
            </p>
            <ul className="flex flex-col gap-3">
              {supportLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-sm transition-colors"
                    style={{ color: 'rgba(237,237,237,0.55)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ededed')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(237,237,237,0.55)')}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(237,237,237,0.3)' }}>
            © 2026 MujCRM s.r.o. Všechna práva vyhrazena.
          </p>
          <div className="flex items-center gap-5">
            <a href="/zasady-soukromi" className="text-xs transition-colors" style={{ color: 'rgba(237,237,237,0.3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(237,237,237,0.7)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(237,237,237,0.3)')}>
              Zásady soukromí
            </a>
            <a href="/podminky" className="text-xs transition-colors" style={{ color: 'rgba(237,237,237,0.3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(237,237,237,0.7)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(237,237,237,0.3)')}>
              Podmínky služby
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
