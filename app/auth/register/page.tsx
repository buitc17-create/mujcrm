'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Hesla se neshodují.'); return; }
    if (password.length < 8) { setError('Heslo musí mít alespoň 8 znaků.'); return; }
    setLoading(true);

    // Načteme onboarding odpovědi uložené před registrací
    const onboardingRaw = localStorage.getItem('onboarding_answers');
    const onboardingAnswers = onboardingRaw ? JSON.parse(onboardingRaw) : null;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message === 'User already registered' ? 'Účet s tímto e-mailem již existuje.' : 'Registrace se nezdařila. Zkus to znovu.');
      setLoading(false);
    } else {
      // Pokud je user okamžitě přihlášen (auto-confirm), uložíme onboarding do DB
      if (data.user && onboardingAnswers) {
        await supabase.from('onboarding_answers').upsert({
          user_id: data.user.id,
          role: onboardingAnswers.role,
          industry: onboardingAnswers.industry,
          team_size: onboardingAnswers.team_size,
          crm_goal: onboardingAnswers.use_case,
          main_goal: onboardingAnswers.goal,
        });
        localStorage.removeItem('onboarding_answers');
      }
      setSuccess(true);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: '#0a0a0a' }}>
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(123,47,255,0.12) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,191,255,0.1) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative w-full max-w-md">
        <a href="/" className="flex items-center justify-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-base"
            style={{ background: 'linear-gradient(135deg, #00BFFF, #7B2FFF)' }}>M</div>
          <span className="font-bold text-xl text-white">Muj<span style={{ color: '#00BFFF' }}>CRM</span></span>
        </a>

        <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(0,191,255,0.15)' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00BFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Zkontroluj svůj e-mail</h2>
              <p className="text-sm" style={{ color: 'rgba(237,237,237,0.55)' }}>
                Poslali jsme ti potvrzovací odkaz na <strong style={{ color: '#ededed' }}>{email}</strong>. Klikni na něj pro aktivaci účtu.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white mb-1">Vytvoř si účet</h1>
              <p className="text-sm mb-8" style={{ color: 'rgba(237,237,237,0.5)' }}>
                Máš účet?{' '}
                <a href="/auth/login" style={{ color: '#00BFFF' }} className="font-semibold">Přihlásit se</a>
              </p>

              <button onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-semibold mb-6 transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#ededed' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Registrovat přes Google
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <span className="text-xs" style={{ color: 'rgba(237,237,237,0.3)' }}>nebo</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>

              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'rgba(237,237,237,0.6)' }}>Celé jméno</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)}
                    placeholder="Jan Novák" style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'rgba(237,237,237,0.6)' }}>E-mail</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="jan@firma.cz" style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'rgba(237,237,237,0.6)' }}>Heslo</label>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Minimálně 8 znaků" style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'rgba(237,237,237,0.6)' }}>Potvrdit heslo</label>
                  <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="Zopakuj heslo" style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                </div>

                {error && (
                  <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {error}
                  </p>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl text-sm font-bold mt-1 transition-all disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}>
                  {loading ? 'Vytvářím účet...' : 'Vytvořit účet zdarma'}
                </button>

                <p className="text-xs text-center" style={{ color: 'rgba(237,237,237,0.3)' }}>
                  Registrací souhlasíš s{' '}
                  <a href="#" style={{ color: '#00BFFF' }}>Podmínkami použití</a>
                  {' '}a{' '}
                  <a href="#" style={{ color: '#00BFFF' }}>Zásadami soukromí</a>.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
