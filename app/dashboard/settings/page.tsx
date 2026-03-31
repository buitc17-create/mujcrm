'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  padding: '10px 14px',
  color: '#ededed',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
};

export default function SettingsPage() {
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [loadingUser, setLoadingUser] = useState(true);

  // Email change state
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailPending, setEmailPending] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Toast
  const [toast, setToast] = useState<{ message: string; color: string } | null>(null);
  const showToast = (message: string, color: string) => {
    setToast({ message, color });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? '');
        setFullName(user.user_metadata?.full_name ?? '');
      }
      setLoadingUser(false);
    });
  }, []);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || newEmail.trim() === email) return;
    setEmailSending(true);
    setEmailError('');

    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });

    if (error) {
      setEmailError(error.message);
      setEmailSending(false);
      return;
    }

    setEmailPending(true);
    setShowEmailForm(false);
    setNewEmail('');
    setEmailSending(false);
    showToast('Potvrzovací e-mail byl odeslán na novou adresu.', '#f59e0b');
  };

  const cancelEmailChange = () => {
    setShowEmailForm(false);
    setNewEmail('');
    setEmailError('');
  };

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'rgba(237,237,237,0.35)' }}>
        Načítám…
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black text-white mb-2">Nastavení</h1>
      <p className="text-sm mb-8" style={{ color: 'rgba(237,237,237,0.45)' }}>
        Správa účtu a nastavení aplikace.
      </p>

      {/* ── Profil ── */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h2 className="text-base font-bold text-white mb-5">Profil</h2>

        <div className="flex flex-col gap-5">
          {/* Jméno (readonly) */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.45)' }}>
              Jméno
            </label>
            <input
              type="text"
              value={fullName}
              readOnly
              style={{ ...inputStyle, color: 'rgba(237,237,237,0.5)', cursor: 'default' }}
            />
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.45)' }}>
              E-mail
            </label>

            {/* Readonly email + status badge + change link */}
            <div className="flex items-center gap-2 mb-2">
              <input
                type="email"
                value={email}
                readOnly
                style={{ ...inputStyle, color: 'rgba(237,237,237,0.5)', cursor: 'default' }}
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {emailPending && (
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}
                >
                  ⏳ Čeká na potvrzení
                </span>
              )}
              {!showEmailForm && (
                <button
                  onClick={() => { setShowEmailForm(true); setEmailPending(false); }}
                  className="text-xs font-semibold transition-colors"
                  style={{ color: '#00BFFF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#38d4ff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#00BFFF')}
                >
                  Změnit e-mail
                </button>
              )}
            </div>

            {/* Inline change form */}
            {showEmailForm && (
              <div
                className="mt-3 rounded-xl p-4"
                style={{ background: 'rgba(0,191,255,0.05)', border: '1px solid rgba(0,191,255,0.15)' }}
              >
                <p className="text-xs font-semibold mb-3" style={{ color: 'rgba(237,237,237,0.6)' }}>
                  Nová e-mailová adresa
                </p>
                <form onSubmit={handleEmailChange} className="flex flex-col gap-3">
                  <input
                    type="email"
                    placeholder="novy@email.cz"
                    value={newEmail}
                    onChange={e => { setNewEmail(e.target.value); setEmailError(''); }}
                    autoFocus
                    required
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                  {emailError && (
                    <p className="text-xs" style={{ color: '#f87171' }}>{emailError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={emailSending || !newEmail.trim()}
                      className="px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50 transition-all"
                      style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}
                    >
                      {emailSending ? 'Odesílám…' : 'Odeslat potvrzení'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEmailChange}
                      className="px-4 py-2 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.6)' }}
                    >
                      Zrušit
                    </button>
                  </div>
                </form>

                {/* Info note */}
                <p className="text-xs mt-3" style={{ color: 'rgba(237,237,237,0.35)' }}>
                  Na novou adresu zašleme potvrzovací e-mail. Změna se projeví až po potvrzení.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Průvodce aplikací ── */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h2 className="text-base font-bold text-white mb-1">Průvodce aplikací</h2>
        <p className="text-sm mb-4" style={{ color: 'rgba(237,237,237,0.45)' }}>
          Spusť interaktivního průvodce, který tě znovu provede všemi sekcemi MujCRM.
        </p>
        <button
          onClick={() => {
            localStorage.removeItem('mujcrm_tour_completed')
            window.location.href = '/dashboard'
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'rgba(0,191,255,0.1)', border: '1px solid rgba(0,191,255,0.25)', color: '#00BFFF' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,191,255,0.18)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,191,255,0.1)')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Spustit průvodce znovu
        </button>
      </div>

      {/* ── Emailová schránka ── */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(0,191,255,0.12)', color: '#00BFFF' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-white mb-0.5">Emailová schránka</h2>
              <p className="text-sm" style={{ color: 'rgba(237,237,237,0.45)' }}>
                Propoj vlastní emailovou schránku a piš emaily přímo z CRM.
              </p>
            </div>
          </div>
          <a href="/dashboard/settings/email"
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: 'rgba(0,191,255,0.1)', border: '1px solid rgba(0,191,255,0.25)', color: '#00BFFF' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,191,255,0.18)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,191,255,0.1)')}>
            Nastavit email →
          </a>
        </div>
      </div>

      {/* ── Další sekce (placeholder) ── */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
        <p className="text-sm font-semibold text-white mb-1">Další nastavení</p>
        <p className="text-sm" style={{ color: 'rgba(237,237,237,0.35)' }}>
          Fakturace a notifikace — brzy dostupné.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold shadow-xl"
          style={{
            background: toast.color + '18',
            border: `1px solid ${toast.color}40`,
            color: toast.color,
            backdropFilter: 'blur(8px)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {toast.message}
        </div>
      )}
    </div>
  );
}
