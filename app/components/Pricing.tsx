'use client';

import { useState } from 'react';
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
    badge: null,
    highlight: false,
    features: [
      'Správa kontaktů a firem',
      'Integrovaná e-mailová schránka',
      'Úkoly, aktivity a follow-upy',
      'Správa leadů a obchodů',
      'Kanban pipeline',
      'Základní přehledy a statistiky',
    ],
    cta: 'Začít se Start',
    ctaStyle: 'outline',
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
    badge: 'Nejoblíbenější',
    highlight: true,
    features: [
      'Vše z plánu Start',
      'Automatizace',
      'Základní reporting',
      'Kalendář a plánování',
      'Až 3 členové týmu',
    ],
    cta: 'Začít s Tým',
    ctaStyle: 'cyan',
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
    badge: null,
    highlight: false,
    features: [
      'Vše z plánů Start a Tým',
      'Pokročilý reporting s KPI',
      'Export dat do CSV',
      'Prioritní podpora',
      'Až 10 členů týmu',
    ],
    cta: 'Začít s Business',
    ctaStyle: 'outline',
  },
  {
    key: 'ENTERPRISE' as const,
    name: PLANS.ENTERPRISE.name,
    monthlyPrice: PLANS.ENTERPRISE.monthly.amount,
    yearlyPrice: Math.round(PLANS.ENTERPRISE.yearly.amount / 12),
    yearlyTotal: PLANS.ENTERPRISE.yearly.amount,
    monthlyPriceId: PLANS.ENTERPRISE.monthly.priceId,
    yearlyPriceId: PLANS.ENTERPRISE.yearly.priceId,
    desc: 'Pro velké organizace s nejvyššími nároky.',
    badge: null,
    highlight: false,
    features: [
      'Vše ze všech tarifů',
      'API přístup',
      'Dedikovaný support',
      'Neomezený počet členů',
    ],
    cta: 'Kontaktovat obchod',
    ctaStyle: 'outline',
  },
];

export default function Pricing() {
  const [yearly, setYearly] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(priceId: string, planKey: string) {
    if (planKey === 'ENTERPRISE') {
      window.location.href = '#kontakt';
      return;
    }
    setLoading(planKey);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (res.status === 401) {
        window.location.href = '/auth/login';
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="relative py-24 px-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(123,47,255,0.07) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,191,255,0.06) 0%, transparent 70%)', filter: 'blur(70px)' }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#00BFFF' }}>
            Ceník
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8">
            Plán který pasuje vám
          </h2>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => setYearly(false)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              style={
                !yearly
                  ? { background: 'rgba(0,191,255,0.15)', color: '#00BFFF', border: '1px solid rgba(0,191,255,0.3)' }
                  : { color: 'rgba(237,237,237,0.5)', border: '1px solid transparent' }
              }
            >
              Měsíčně
            </button>
            <button
              onClick={() => setYearly(true)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2"
              style={
                yearly
                  ? { background: 'rgba(0,191,255,0.15)', color: '#00BFFF', border: '1px solid rgba(0,191,255,0.3)' }
                  : { color: 'rgba(237,237,237,0.5)', border: '1px solid transparent' }
              }
            >
              Ročně
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                style={{ background: 'rgba(0,191,255,0.2)', color: '#00BFFF' }}
              >
                -20 %
              </span>
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {plans.map((plan) => {
            const priceId = yearly ? plan.yearlyPriceId : plan.monthlyPriceId;
            const displayPrice = yearly ? plan.yearlyPrice : plan.monthlyPrice;
            const isLoading = loading === plan.key;

            return (
              <div
                key={plan.key}
                className="rounded-2xl p-7 flex flex-col gap-6 relative"
                style={
                  plan.highlight
                    ? {
                        background: 'rgba(0,191,255,0.06)',
                        border: '1px solid rgba(0,191,255,0.35)',
                        boxShadow: '0 0 40px rgba(0,191,255,0.08)',
                      }
                    : {
                        background: 'rgba(255,255,255,0.025)',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }
                }
              >
                {plan.badge && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                    style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}
                  >
                    {plan.badge}
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: plan.highlight ? '#00BFFF' : 'rgba(237,237,237,0.5)' }}>
                    {plan.name}
                  </p>
                  <div className="flex items-end gap-1.5 mb-2">
                    <span className="text-3xl font-black text-white">
                      {displayPrice} Kč
                    </span>
                    <span className="text-sm mb-1.5" style={{ color: 'rgba(237,237,237,0.4)' }}>/měs</span>
                  </div>
                  {yearly && (
                    <p className="text-xs mb-1" style={{ color: 'rgba(237,237,237,0.35)' }}>
                      Fakturováno ročně ({plan.yearlyTotal} Kč)
                    </p>
                  )}
                  <p className="text-sm" style={{ color: 'rgba(237,237,237,0.5)' }}>{plan.desc}</p>
                </div>

                <ul className="flex flex-col gap-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: plan.highlight ? 'rgba(0,191,255,0.2)' : 'rgba(255,255,255,0.08)' }}
                      >
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={plan.highlight ? '#00BFFF' : 'rgba(237,237,237,0.5)'} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <span className="text-sm" style={{ color: 'rgba(237,237,237,0.7)' }}>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(priceId, plan.key)}
                  disabled={isLoading}
                  className={plan.ctaStyle === 'cyan' ? 'btn-cyan' : 'btn-outline'}
                  style={{ display: 'block', textAlign: 'center', padding: '12px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, width: '100%', opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'wait' : 'pointer' }}
                >
                  {isLoading ? 'Přesměrování...' : plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs mt-8" style={{ color: 'rgba(237,237,237,0.3)' }}>
          Všechny ceny jsou bez DPH. Plán lze kdykoli zrušit nebo změnit.
        </p>
      </div>
    </section>
  );
}
