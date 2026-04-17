'use client';

import { useState, useEffect } from 'react';
import { PLANS } from '@/lib/stripe-config';

const plans = [
  {
    key: 'START' as const,
    name: PLANS.START.name,
    monthlyPrice: PLANS.START.monthly.amount,
    yearlyPrice: Math.round(PLANS.START.yearly.amount / 12),
    yearlyTotal: PLANS.START.yearly.amount,
    monthlyPriceId: PLANS.START.monthly.priceId,
    yearlyPriceId: PLANS.START.yearly.priceId,
    desc: 'Ideální pro freelancery a malé firmy.',
    highlight: false,
    badge: null,
    features: ['Správa kontaktů a firem', 'Integrovaná e-mailová schránka', 'Úkoly, aktivity a follow-upy', 'Správa leadů a obchodů', 'Kanban pipeline', 'Základní přehledy a statistiky'],
  },
  {
    key: 'TYM' as const,
    name: PLANS.TYM.name,
    monthlyPrice: PLANS.TYM.monthly.amount,
    yearlyPrice: Math.round(PLANS.TYM.yearly.amount / 12),
    yearlyTotal: PLANS.TYM.yearly.amount,
    monthlyPriceId: PLANS.TYM.monthly.priceId,
    yearlyPriceId: PLANS.TYM.yearly.priceId,
    desc: 'Pro rostoucí firmy a aktivní obchodní týmy.',
    highlight: true,
    badge: 'Nejoblíbenější',
    features: ['Vše z plánu Start', 'Automatizace', 'Základní reporting', 'Kalendář a plánování', 'Až 3 členové týmu'],
  },
  {
    key: 'BUSINESS' as const,
    name: PLANS.BUSINESS.name,
    monthlyPrice: PLANS.BUSINESS.monthly.amount,
    yearlyPrice: Math.round(PLANS.BUSINESS.yearly.amount / 12),
    yearlyTotal: PLANS.BUSINESS.yearly.amount,
    monthlyPriceId: PLANS.BUSINESS.monthly.priceId,
    yearlyPriceId: PLANS.BUSINESS.yearly.priceId,
    desc: 'Pro firmy které rostou rychle a potřebují více.',
    highlight: false,
    badge: null,
    trial: true,
    features: ['Vše z plánů Start a Tým', 'Pokročilý reporting s KPI', 'Export dat do CSV', 'Prioritní podpora', 'Až 10 členů týmu'],
  },
  {
    key: 'ENTERPRISE' as const,
    trial: false,
    name: PLANS.ENTERPRISE.name,
    monthlyPrice: PLANS.ENTERPRISE.monthly.amount,
    yearlyPrice: Math.round(PLANS.ENTERPRISE.yearly.amount / 12),
    yearlyTotal: PLANS.ENTERPRISE.yearly.amount,
    monthlyPriceId: PLANS.ENTERPRISE.monthly.priceId,
    yearlyPriceId: PLANS.ENTERPRISE.yearly.priceId,
    desc: 'Pro velké organizace s nejvyššími nároky.',
    highlight: false,
    badge: null,
    features: ['Vše ze všech tarifů', 'API přístup', 'Dedikovaný support', 'Neomezený počet členů'],
  },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BillingPage() {
  const [yearly, setYearly] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [hasStripe, setHasStripe] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [pendingPlanDate, setPendingPlanDate] = useState<string | null>(null);
  const [changing, setChanging] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [trialEnd, setTrialEnd] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/stripe/subscription-info').then(r => r.json()).then(d => {
      setCurrentPlan((d.plan ?? 'free').toUpperCase());
      setHasStripe(d.hasStripe ?? false);
      setHasSubscription(d.hasSubscription ?? false);
      setPendingPlan(d.pendingPlan ? d.pendingPlan.toUpperCase() : null);
      setPendingPlanDate(d.pendingPlanDate ?? null);
      setTrialEnd(d.trialEnd ?? null);
    });
  }, []);

  async function handlePortal() {
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  async function handleChangePlan(priceId: string, planKey: string) {
    setChanging(planKey);
    setMsg(null);
    try {
      const res = await fetch('/api/stripe/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.ok) {
        setPendingPlan(data.pendingPlan.toUpperCase());
        setPendingPlanDate(data.periodEnd);
        setMsg({ type: 'ok', text: `Plán ${planKey} bude aktivován ${formatDate(data.periodEnd)}.` });
      } else {
        setMsg({ type: 'err', text: data.error ?? 'Chyba při změně plánu.' });
      }
    } catch {
      setMsg({ type: 'err', text: 'Nepodařilo se změnit plán.' });
    } finally {
      setChanging(null);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white mb-1">Předplatné</h1>
        <p className="text-sm" style={{ color: 'rgba(237,237,237,0.45)' }}>Vyber plán který ti nejvíce vyhovuje.</p>
      </div>

      {/* Trial banner */}
      {trialEnd && (
        <div className="mb-6 px-4 py-3 rounded-xl flex items-center gap-3" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-sm" style={{ color: 'rgba(34,197,94,0.9)' }}>
            Využíváte <strong>7denní zkušební období Business plánu</strong> — zkušební doba končí <strong>{formatDate(trialEnd)}</strong>.
          </span>
        </div>
      )}

      {/* Naplánovaná změna */}
      {pendingPlan && pendingPlanDate && (
        <div className="mb-6 px-4 py-3 rounded-xl flex items-center gap-3" style={{ background: 'rgba(255,180,0,0.08)', border: '1px solid rgba(255,180,0,0.25)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFB400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-sm" style={{ color: 'rgba(255,180,0,0.9)' }}>
            Naplánovaná změna na plán <strong>{pendingPlan}</strong> — aktivuje se {formatDate(pendingPlanDate)}.
          </span>
        </div>
      )}

      {/* Zpráva o výsledku */}
      {msg && (
        <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium" style={msg.type === 'ok'
          ? { background: 'rgba(0,210,110,0.08)', border: '1px solid rgba(0,210,110,0.25)', color: 'rgba(0,210,110,0.9)' }
          : { background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.25)', color: 'rgba(255,80,80,0.9)' }
        }>
          {msg.text}
        </div>
      )}

      {/* Toggle */}
      <div className="flex items-center gap-4 mb-8">
        <div className="inline-flex items-center gap-2 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => setYearly(false)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={!yearly ? { background: 'rgba(0,191,255,0.15)', color: '#00BFFF', border: '1px solid rgba(0,191,255,0.3)' } : { color: 'rgba(237,237,237,0.5)', border: '1px solid transparent' }}
          >Měsíčně</button>
          <button
            onClick={() => setYearly(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
            style={yearly ? { background: 'rgba(0,191,255,0.15)', color: '#00BFFF', border: '1px solid rgba(0,191,255,0.3)' } : { color: 'rgba(237,237,237,0.5)', border: '1px solid transparent' }}
          >
            Ročně
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(0,191,255,0.2)', color: '#00BFFF' }}>-20 %</span>
          </button>
        </div>

        {hasStripe && (
          <button
            onClick={handlePortal}
            className="ml-auto text-sm font-semibold px-4 py-2 rounded-xl transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.6)' }}
          >
            Spravovat předplatné →
          </button>
        )}
      </div>

      {/* Plans grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const priceId = yearly ? plan.yearlyPriceId : plan.monthlyPriceId;
          const displayPrice = yearly ? plan.yearlyPrice : plan.monthlyPrice;
          const isCurrentPlan = currentPlan === plan.key;
          const isPendingPlan = pendingPlan === plan.key;

          return (
            <div
              key={plan.key}
              className="rounded-2xl p-6 flex flex-col gap-5 relative"
              style={isCurrentPlan
                ? { background: 'rgba(123,47,255,0.08)', border: '1px solid rgba(123,47,255,0.4)', boxShadow: '0 0 40px rgba(123,47,255,0.1)' }
                : isPendingPlan
                  ? { background: 'rgba(255,180,0,0.05)', border: '1px solid rgba(255,180,0,0.35)', boxShadow: '0 0 30px rgba(255,180,0,0.07)' }
                  : plan.highlight
                    ? { background: 'rgba(0,191,255,0.06)', border: '1px solid rgba(0,191,255,0.35)', boxShadow: '0 0 40px rgba(0,191,255,0.08)' }
                    : { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }
              }
            >
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                  style={{ background: 'linear-gradient(135deg, #7B2FFF, #5a1fd1)', color: '#fff' }}>
                  Váš aktuální plán
                </div>
              )}
              {isPendingPlan && !isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                  style={{ background: 'linear-gradient(135deg, #FFB400, #cc8f00)', color: '#0a0a0a' }}>
                  Naplánováno
                </div>
              )}
              {!isCurrentPlan && !isPendingPlan && plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                  style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}>
                  {plan.badge}
                </div>
              )}
              {!isCurrentPlan && !isPendingPlan && !hasSubscription && (plan as { trial?: boolean }).trial && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                  style={{ background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: '#fff' }}>
                  7 dní zdarma
                </div>
              )}

              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: plan.highlight ? '#00BFFF' : 'rgba(237,237,237,0.5)' }}>{plan.name}</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-3xl font-black text-white">{displayPrice} Kč</span>
                  <span className="text-sm mb-1" style={{ color: 'rgba(237,237,237,0.4)' }}>/měs</span>
                </div>
                {yearly && (
                  <p className="text-xs" style={{ color: 'rgba(237,237,237,0.35)' }}>Fakturováno ročně ({plan.yearlyTotal} Kč)</p>
                )}
                <p className="text-xs mt-1" style={{ color: 'rgba(237,237,237,0.45)' }}>{plan.desc}</p>
              </div>

              <ul className="flex flex-col gap-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: plan.highlight ? 'rgba(0,191,255,0.2)' : 'rgba(255,255,255,0.08)' }}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={plan.highlight ? '#00BFFF' : 'rgba(237,237,237,0.5)'} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="text-xs" style={{ color: 'rgba(237,237,237,0.7)' }}>{f}</span>
                  </li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <div
                  className="w-full py-3 rounded-xl text-sm font-bold text-center"
                  style={{ background: 'rgba(123,47,255,0.15)', border: '1px solid rgba(123,47,255,0.3)', color: 'rgba(180,140,255,0.8)', cursor: 'default' }}
                >
                  Aktivní plán
                </div>
              ) : isPendingPlan ? (
                <div
                  className="w-full py-3 rounded-xl text-sm font-bold text-center"
                  style={{ background: 'rgba(255,180,0,0.1)', border: '1px solid rgba(255,180,0,0.3)', color: 'rgba(255,180,0,0.8)', cursor: 'default' }}
                >
                  Aktivuje se {pendingPlanDate ? formatDate(pendingPlanDate) : ''}
                </div>
              ) : plan.key === 'ENTERPRISE' ? (
                <a
                  href="mailto:info@mujcrm.cz"
                  className="w-full py-3 rounded-xl text-sm font-bold transition-all block text-center"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(237,237,237,0.8)' }}
                >
                  Kontaktovat
                </a>
              ) : hasSubscription ? (
                // Existující předplatné — naplánuj změnu ke konci období
                <button
                  disabled={changing === plan.key}
                  onClick={() => handleChangePlan(priceId, plan.key)}
                  className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                  style={plan.highlight
                    ? { background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a', opacity: changing === plan.key ? 0.6 : 1 }
                    : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(237,237,237,0.8)', opacity: changing === plan.key ? 0.6 : 1 }
                  }
                >
                  {changing === plan.key ? 'Plánuji…' : `Přejít na ${plan.name}`}
                </button>
              ) : (
                // Nový zákazník — přímý checkout
                <div className="flex flex-col gap-1">
                  <a
                    href={`/api/stripe/checkout?priceId=${priceId}`}
                    className="w-full py-3 rounded-xl text-sm font-bold transition-all block text-center"
                    style={(plan as { trial?: boolean }).trial
                      ? { background: 'linear-gradient(135deg, #22C55E, #16a34a)', color: '#fff' }
                      : plan.highlight
                        ? { background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }
                        : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(237,237,237,0.8)' }
                    }
                  >
                    {(plan as { trial?: boolean }).trial ? 'Vyzkoušet 7 dní zdarma' : `Vybrat ${plan.name}`}
                  </a>
                  {(plan as { trial?: boolean }).trial && (
                    <p className="text-center text-xs" style={{ color: 'rgba(237,237,237,0.35)' }}>
                      Pak {plan.monthlyPrice} Kč/měs, zrušit kdykoliv
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs mt-6" style={{ color: 'rgba(237,237,237,0.3)' }}>
        Změna plánu se projeví po skončení aktuálního fakturačního období. Plán lze kdykoli zrušit nebo změnit.
      </p>
    </div>
  );
}
