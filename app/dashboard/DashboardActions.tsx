'use client';

const quickActions = [
  { label: 'Přidat zákazníka', icon: '👤', accent: '#00BFFF' },
  { label: 'Nová zakázka', icon: '🎯', accent: '#7B2FFF' },
  { label: 'Přidat úkol', icon: '✓', accent: '#00BFFF' },
  { label: 'Importovat kontakty', icon: '📥', accent: '#7B2FFF' },
];

export default function DashboardActions() {
  return (
    <>
      {/* Quick actions */}
      <div
        id="quick-actions"
        className="rounded-2xl p-6 mb-8"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
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
          id="btn-add-customer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all"
          style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 24px rgba(0,191,255,0.35)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          + Přidat zákazníka
        </button>
      </div>
    </>
  );
}
