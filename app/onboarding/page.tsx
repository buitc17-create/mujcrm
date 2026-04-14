'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const steps = [
  {
    title: 'Kdo jsi?',
    desc: 'Pomůže nám to přizpůsobit MujCRM přesně tobě.',
    key: 'role',
    options: [
      {
        value: 'podnikatel', label: 'Podnikatel / OSVČ',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
      },
      {
        value: 'zamestnavatel', label: 'Zaměstnavatel / Manažer',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
      },
      {
        value: 'obchodnik', label: 'Obchodník / Zaměstnanec',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      },
      {
        value: 'freelancer', label: 'Freelancer',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
      },
    ],
  },
  {
    title: 'Jaký obor?',
    desc: 'Nastavíme šablony a terminologii pro tvůj trh.',
    key: 'industry',
    options: [
      {
        value: 'it', label: 'IT & Technologie',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
      },
      {
        value: 'obchod', label: 'Obchod & Prodej',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
      },
      {
        value: 'marketing', label: 'Marketing',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
      },
      {
        value: 'ecommerce', label: 'E-commerce',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
      },
      {
        value: 'zdravotnictvi', label: 'Zdravotnictví & Servis',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
      },
      {
        value: 'jine', label: 'Jiné',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
      },
    ],
  },
  {
    title: 'Velikost týmu?',
    desc: 'Nastavíme správný plán a limity uživatelů.',
    key: 'team_size',
    options: [
      {
        value: 'solo', label: 'Jen já',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>,
      },
      {
        value: 'small', label: '2–5 lidí',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      },
      {
        value: 'medium', label: '6–20 lidí',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>,
      },
      {
        value: 'large', label: '20+ lidí',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
      },
    ],
  },
  {
    title: 'K čemu CRM potřebuješ?',
    desc: 'Přizpůsobíme dashboard a funkce.',
    key: 'use_case',
    options: [
      {
        value: 'contacts', label: 'Správa zákazníků',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      },
      {
        value: 'deals', label: 'Sledování obchodů',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
      },
      {
        value: 'team', label: 'Řízení týmu',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
      },
      {
        value: 'all', label: 'Vše výše',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
      },
    ],
  },
  {
    title: 'Jaký je tvůj hlavní cíl?',
    desc: 'Zaměříme se na to, co ti přinese největší hodnotu.',
    key: 'goal',
    options: [
      {
        value: 'deals', label: 'Více uzavřených obchodů',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
      },
      {
        value: 'overview', label: 'Lepší přehled',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
      },
      {
        value: 'time', label: 'Úspora času',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
      },
      {
        value: 'growth', label: 'Růst firmy',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
      },
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const current = steps[step];
  const selected = answers[current.key];
  const isLast = step === steps.length - 1;

  const select = (value: string) => {
    setAnswers(prev => ({ ...prev, [current.key]: value }));
  };

  const next = async () => {
    if (!selected) return;
    if (isLast) {
      setSaving(true);
      localStorage.setItem('onboarding_answers', JSON.stringify({ ...answers, [current.key]: selected }));
      router.push('/auth/register');
    } else {
      setStep(s => s + 1);
    }
  };

  const prev = () => setStep(s => s - 1);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: '#0a0a0a' }}>
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(123,47,255,0.1) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,191,255,0.08) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      {/* X zavřít */}
      <button
        onClick={() => router.push('/')}
        className="fixed top-5 right-5 z-50 w-9 h-9 rounded-xl flex items-center justify-center transition-all"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.5)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#ededed'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(237,237,237,0.5)'; }}
        aria-label="Zavřít"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
            style={{ background: 'linear-gradient(135deg, #00BFFF, #7B2FFF)' }}>M</div>
          <span className="font-bold text-lg text-white">Muj<span style={{ color: '#00BFFF' }}>CRM</span></span>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: '#00BFFF' }}>
              Krok {step + 1} z {steps.length}
            </span>
            <span className="text-xs" style={{ color: 'rgba(237,237,237,0.35)' }}>
              {Math.round(((step + 1) / steps.length) * 100)} %
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / steps.length) * 100}%`, background: 'linear-gradient(90deg, #7B2FFF, #00BFFF)' }}
            />
          </div>
          <div className="flex justify-between mt-3">
            {steps.map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full transition-all duration-300"
                style={{ background: i <= step ? '#00BFFF' : 'rgba(255,255,255,0.15)', transform: i === step ? 'scale(1.4)' : 'scale(1)' }} />
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-xl font-bold text-white mb-1">{current.title}</h2>
          <p className="text-sm mb-7" style={{ color: 'rgba(237,237,237,0.5)' }}>{current.desc}</p>

          <div className={`grid gap-3 ${current.options.length > 4 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {current.options.map(opt => {
              const isSelected = selected === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => select(opt.value)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 font-medium text-sm"
                  style={{
                    background: isSelected ? 'rgba(0,191,255,0.1)' : 'rgba(255,255,255,0.04)',
                    border: isSelected ? '1px solid rgba(0,191,255,0.45)' : '1px solid rgba(255,255,255,0.08)',
                    color: isSelected ? '#00BFFF' : 'rgba(237,237,237,0.75)',
                  }}
                >
                  <span
                    className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg"
                    style={{ background: isSelected ? 'rgba(0,191,255,0.15)' : 'rgba(255,255,255,0.06)', color: isSelected ? '#00BFFF' : 'rgba(237,237,237,0.5)' }}
                  >
                    {opt.icon}
                  </span>
                  <span>{opt.label}</span>
                  {isSelected && (
                    <div className="ml-auto flex-shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00BFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {!selected && (
            <p className="text-xs mt-5 text-center" style={{ color: 'rgba(237,237,237,0.3)' }}>
              Vyber jednu z možností pro pokračování
            </p>
          )}

          <div className="flex items-center gap-3 mt-4">
            {step > 0 && (
              <button onClick={prev}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.7)' }}>
                ← Zpět
              </button>
            )}
            <button onClick={next} disabled={!selected || saving}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: selected ? 'linear-gradient(135deg, #00BFFF, #0090cc)' : 'rgba(255,255,255,0.1)', color: selected ? '#0a0a0a' : 'rgba(237,237,237,0.4)' }}>
              {saving ? 'Ukládám...' : isLast ? 'Zaregistrovat se do CRM →' : 'Pokračovat →'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'rgba(237,237,237,0.25)' }}>
          Toto nastavení lze kdykoli změnit v profilu.
        </p>
      </div>
    </div>
  );
}
