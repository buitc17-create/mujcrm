'use client';

import Link from 'next/link';

type Props = { show: boolean };

export default function TrialExpiredModal({ show }: Props) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 text-center"
        style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 60px rgba(0,0,0,0.6)' }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <h2 className="text-2xl font-black text-white mb-3">Bezplatná verze skončila</h2>
        <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(237,237,237,0.55)' }}>
          Tvoje 7denní zkušební verze Business plánu vypršela.<br/>
          Vyber si tarif a pokračuj v práci bez přerušení.
        </p>

        <Link
          href="/dashboard/billing"
          className="block w-full py-4 rounded-xl text-sm font-bold transition-all"
          style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}
        >
          Vybrat tarif →
        </Link>

        <p className="text-xs mt-4" style={{ color: 'rgba(237,237,237,0.25)' }}>
          Všechny ceny jsou bez DPH. Plán lze kdykoli zrušit nebo změnit.
        </p>
      </div>
    </div>
  );
}
