import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const statCards = [
  {
    label: 'Zákazníků',
    value: '0',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    accent: '#00BFFF',
    hint: 'Přidej prvního zákazníka',
  },
  {
    label: 'Otevřené obchody',
    value: '0',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M12 12h.01"/>
      </svg>
    ),
    accent: '#7B2FFF',
    hint: 'Vytvoř první obchod',
  },
  {
    label: 'Úkoly',
    value: '0',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
    accent: '#00BFFF',
    hint: 'Naplánuj první aktivitu',
  },
  {
    label: 'Příjmy',
    value: '0 Kč',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
    accent: '#7B2FFF',
    hint: 'Sleduj výsledky obchodů',
  },
];

const quickActions = [
  { label: 'Přidat zákazníka', icon: '👤', accent: '#00BFFF' },
  { label: 'Nový obchod', icon: '🎯', accent: '#7B2FFF' },
  { label: 'Přidat úkol', icon: '✓', accent: '#00BFFF' },
  { label: 'Importovat kontakty', icon: '📥', accent: '#7B2FFF' },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const name = user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'uživateli';

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', color: '#ededed' }}>
      {/* Top nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 h-16"
        style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm"
            style={{ background: 'linear-gradient(135deg, #00BFFF, #7B2FFF)' }}>M</div>
          <span className="font-bold text-base text-white">Muj<span style={{ color: '#00BFFF' }}>CRM</span></span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: 'rgba(0,191,255,0.15)', color: '#00BFFF' }}
          >
            {name[0]?.toUpperCase()}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-10">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
            style={{ background: 'rgba(0,191,255,0.08)', border: '1px solid rgba(0,191,255,0.2)', color: '#00BFFF' }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00BFFF' }} />
            Tvůj CRM je připraven
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
            Vítej, <span style={{
              background: 'linear-gradient(135deg, #00BFFF, #7B2FFF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>{name}</span>!
          </h1>
          <p style={{ color: 'rgba(237,237,237,0.55)', fontSize: '15px' }}>
            Pojďme přidat prvního zákazníka a rozjet tvůj byznys.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium" style={{ color: 'rgba(237,237,237,0.5)' }}>{card.label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: card.accent + '18', color: card.accent }}>
                  {card.icon}
                </div>
              </div>
              <p className="text-2xl font-black text-white mb-1">{card.value}</p>
              <p className="text-xs" style={{ color: card.accent + 'aa' }}>{card.hint} →</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl p-6 mb-8"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-sm font-bold text-white mb-4">Rychlé akce</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((a) => (
              <button
                key={a.label}
                className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl text-xs font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(237,237,237,0.7)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = a.accent + '40'; e.currentTarget.style.color = a.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(237,237,237,0.7)'; }}
              >
                <span className="text-xl">{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Empty state */}
        <div className="rounded-2xl p-10 text-center"
          style={{ background: 'rgba(0,191,255,0.03)', border: '1px dashed rgba(0,191,255,0.15)' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(0,191,255,0.1)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00BFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
          </div>
          <h3 className="text-base font-bold text-white mb-2">Zatím žádní zákazníci</h3>
          <p className="text-sm mb-6" style={{ color: 'rgba(237,237,237,0.45)' }}>
            Přidej prvního zákazníka nebo importuj existující kontakty.
          </p>
          <button
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}
          >
            + Přidat zákazníka
          </button>
        </div>
      </main>
    </div>
  );
}
