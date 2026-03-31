'use client'

export default function TourButton() {
  return (
    <button
      onClick={() => {
        localStorage.removeItem('mujcrm_tour_completed')
        window.location.reload()
      }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
      style={{
        background: 'rgba(0,191,255,0.08)',
        border: '1px solid rgba(0,191,255,0.2)',
        color: '#00BFFF',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,191,255,0.15)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,191,255,0.08)')}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      Spustit průvodce
    </button>
  )
}
