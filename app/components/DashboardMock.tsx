'use client';

// SVG icon components for stat cards
const IconUsers = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconBriefcase = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <line x1="12" y1="12" x2="12" y2="12" />
    <path d="M2 12h20" />
  </svg>
);

const IconTrendingUp = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconCheckSquare = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const statCards = [
  {
    label: 'Zákazníků',
    value: '247',
    icon: <IconUsers />,
    trend: '+12 tento měsíc',
    trendUp: true,
    accent: '#00BFFF',
  },
  {
    label: 'Otevřené obchody',
    value: '34',
    icon: <IconBriefcase />,
    trend: '+5 tento týden',
    trendUp: true,
    accent: '#7B2FFF',
  },
  {
    label: 'Příjmy',
    value: '89 400 Kč',
    icon: <IconTrendingUp />,
    trend: '+18 % vs. min. měsíc',
    trendUp: true,
    accent: '#00BFFF',
  },
  {
    label: 'Úkoly',
    icon: <IconCheckSquare />,
    value: '12',
    trend: '3 po termínu',
    trendUp: false,
    accent: '#7B2FFF',
  },
];

const kanbanColumns = [
  {
    title: 'Nový kontakt',
    color: '#666',
    cards: [
      { name: 'Novák s.r.o.', value: '45 000 Kč', avatar: 'N' },
      { name: 'FreshByte', value: '12 000 Kč', avatar: 'F' },
    ],
  },
  {
    title: 'Jednání',
    color: '#00BFFF',
    cards: [
      { name: 'K&K Tech', value: '120 000 Kč', avatar: 'K' },
      { name: 'AutoMax CZ', value: '67 000 Kč', avatar: 'A' },
      { name: 'Zelená k.s.', value: '34 500 Kč', avatar: 'Z' },
    ],
  },
  {
    title: 'Nabídka odeslána',
    color: '#7B2FFF',
    cards: [
      { name: 'MedTech EU', value: '250 000 Kč', avatar: 'M' },
      { name: 'Stavby BB', value: '88 000 Kč', avatar: 'S' },
    ],
  },
  {
    title: 'Vyhráno',
    color: '#22c55e',
    cards: [
      { name: 'Omega IT', value: '310 000 Kč', avatar: 'O' },
    ],
  },
];

export default function DashboardMock() {
  return (
    <section className="relative py-20 px-6 overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(123,47,255,0.08) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Section label */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#00BFFF' }}>
            Přehled na jednom místě
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Váš CRM dashboard, přehledný a rychlý
          </h2>
        </div>

        {/* Browser window mock */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            background: '#111111',
            boxShadow: '0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* Browser chrome */}
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ background: '#1a1a1a', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* Traffic lights */}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
            </div>
            {/* Address bar */}
            <div
              className="flex-1 max-w-xs mx-auto flex items-center gap-2 px-3 py-1.5 rounded-md text-xs"
              style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(237,237,237,0.5)' }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: 0.5 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              app.mujcrm.cz/prehled
            </div>
            {/* Nav controls placeholder */}
            <div className="flex items-center gap-2 ml-auto">
              <div className="w-6 h-6 rounded-md" style={{ background: 'rgba(255,255,255,0.05)' }} />
              <div className="w-6 h-6 rounded-md" style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>
          </div>

          {/* Dashboard content */}
          <div className="p-6" style={{ background: '#0d0d0d' }}>
            {/* Inner nav */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-white">Přehled</h3>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(237,237,237,0.4)' }}>Dnes, 19. března 2026</p>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: 'rgba(0,191,255,0.1)', color: '#00BFFF', border: '1px solid rgba(0,191,255,0.2)' }}
                >
                  + Nový kontakt
                </div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-xl p-4"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium" style={{ color: 'rgba(237,237,237,0.5)' }}>
                      {card.label}
                    </span>
                    <span
                      className="flex items-center justify-center w-7 h-7 rounded-lg"
                      style={{ background: card.accent + '18', color: card.accent }}
                    >
                      {card.icon}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-white mb-1">{card.value}</p>
                  <p
                    className="text-xs"
                    style={{ color: card.trendUp ? '#22c55e' : '#f97316' }}
                  >
                    {card.trendUp ? '↑' : '↓'} {card.trend}
                  </p>
                </div>
              ))}
            </div>

            {/* Kanban pipeline */}
            <div
              className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <p className="text-xs font-semibold text-white mb-4">Pipeline obchodů</p>
              <div className="grid grid-cols-4 gap-3">
                {kanbanColumns.map((col) => (
                  <div key={col.title}>
                    {/* Column header */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col.color }} />
                      <span className="text-xs font-semibold" style={{ color: 'rgba(237,237,237,0.6)' }}>
                        {col.title}
                      </span>
                      <span
                        className="ml-auto text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(237,237,237,0.5)' }}
                      >
                        {col.cards.length}
                      </span>
                    </div>
                    {/* Cards */}
                    <div className="flex flex-col gap-2">
                      {col.cards.map((card) => (
                        <div
                          key={card.name}
                          className="rounded-lg p-3"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.07)',
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ background: col.color + '33', color: col.color }}
                            >
                              {card.avatar}
                            </div>
                            <span className="text-xs font-medium text-white truncate">{card.name}</span>
                          </div>
                          <p className="text-xs font-semibold" style={{ color: col.color }}>
                            {card.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fade out bottom edge */}
        <div
          className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #0a0a0a)' }}
        />
      </div>
    </section>
  );
}
