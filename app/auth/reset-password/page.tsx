'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  padding: '12px 16px',
  color: '#ededed',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.2s',
};

export default function ResetPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });
    if (error) {
      setError('Nepodařilo se odeslat e-mail. Zkontroluj adresu a zkus to znovu.');
      setLoading(false);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0a0a' }}>
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(123,47,255,0.12) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,191,255,0.1) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative w-full max-w-md">
        <a href="/" className="flex items-center justify-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-base"
            style={{ background: 'linear-gradient(135deg, #00BFFF, #7B2FFF)' }}>M</div>
          <span className="font-bold text-xl text-white">Muj<span style={{ color: '#00BFFF' }}>CRM</span></span>
        </a>

        <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(0,191,255,0.15)' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00BFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Zkontroluj e-mail</h2>
              <p className="text-sm mb-6" style={{ color: 'rgba(237,237,237,0.55)' }}>
                Poslali jsme ti odkaz pro obnovu hesla na{' '}
                <strong style={{ color: '#ededed' }}>{email}</strong>.
              </p>
              <a href="/auth/login" className="text-sm font-semibold" style={{ color: '#00BFFF' }}>
                ← Zpět na přihlášení
              </a>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white mb-1">Zapomenuté heslo</h1>
              <p className="text-sm mb-8" style={{ color: 'rgba(237,237,237,0.5)' }}>
                Zadej svůj e-mail a pošleme ti odkaz pro obnovu hesla.
              </p>

              <form onSubmit={handleReset} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'rgba(237,237,237,0.6)' }}>E-mail</label>
                  <input
                    type="email" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="jan@firma.cz"
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                </div>

                {error && (
                  <p className="text-xs px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl text-sm font-bold mt-1 transition-all disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}
                >
                  {loading ? 'Odesílám...' : 'Odeslat odkaz pro obnovu'}
                </button>
              </form>

              <p className="text-center text-sm mt-6" style={{ color: 'rgba(237,237,237,0.4)' }}>
                <a href="/auth/login" style={{ color: '#00BFFF' }} className="font-semibold">
                  ← Zpět na přihlášení
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
