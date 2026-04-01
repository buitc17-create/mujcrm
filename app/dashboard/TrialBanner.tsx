import Link from 'next/link';

type Props = {
  plan: string | null;
  trialEndsAt: string | null;
};

export default function TrialBanner({ plan, trialEndsAt }: Props) {
  if (plan !== 'trial' || !trialEndsAt) return null;

  const now = new Date();
  const end = new Date(trialEndsAt);
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  if (daysLeft === 0) {
    return (
      <div className="mb-6 flex items-center justify-between gap-4 px-5 py-4 rounded-2xl"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: '#f87171' }}>Zkušební doba vypršela</p>
            <p className="text-xs" style={{ color: 'rgba(237,237,237,0.5)' }}>Vyber tarif a pokračuj bez omezení.</p>
          </div>
        </div>
        <Link href="/dashboard/billing"
          className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff' }}>
          Vybrat tarif →
        </Link>
      </div>
    );
  }

  const isUrgent = daysLeft <= 2;
  const accent = isUrgent ? '#f59e0b' : '#00BFFF';

  return (
    <div className="mb-6 flex items-center justify-between gap-4 px-5 py-4 rounded-2xl"
      style={{ background: `rgba(${isUrgent ? '245,158,11' : '0,191,255'},0.07)`, border: `1px solid rgba(${isUrgent ? '245,158,11' : '0,191,255'},0.25)` }}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: accent + '18', color: accent }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div>
          <p className="text-sm font-bold text-white">
            Business trial — zbývá {daysLeft} {daysLeft === 1 ? 'den' : daysLeft <= 4 ? 'dny' : 'dní'}
          </p>
          <p className="text-xs" style={{ color: 'rgba(237,237,237,0.5)' }}>
            {isUrgent ? 'Brzy vyprší — vyber tarif a nepřijdi o přístup.' : 'Vyzkoušej všechny funkce Business plánu zdarma.'}
          </p>
        </div>
      </div>
      <Link href="/dashboard/billing"
        className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap"
        style={{ background: `linear-gradient(135deg, ${accent}, ${isUrgent ? '#d97706' : '#0090cc'})`, color: '#0a0a0a' }}>
        Vybrat tarif →
      </Link>
    </div>
  );
}
