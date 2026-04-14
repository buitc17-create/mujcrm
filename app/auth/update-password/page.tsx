'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [isInvited, setIsInvited] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('invited') === 'true') setIsInvited(true)

    const handleAuth = async () => {
      const code = params.get('code')
      const tokenHash = params.get('token_hash')
      const type = params.get('type')

      // PKCE flow: code exchange (client-side má přístup k code_verifier)
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) { setSessionReady(true); return }
      }

      // Legacy token_hash flow
      if (tokenHash && type === 'recovery') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' as any })
        if (!error) { setSessionReady(true); return }
      }

      // Implicit flow: access_token v hash fragmentu
      const hash = window.location.hash
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const hashType = hashParams.get('type')
        if (accessToken && refreshToken && hashType === 'recovery') {
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          if (!error) { setSessionReady(true); return }
        }
      }

      // Zkontroluj existující session (např. přes onAuthStateChange PASSWORD_RECOVERY)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) { setSessionReady(true); return }

      // Nic nefungovalo → login
      router.replace('/auth/login?error=session_expired')
    }

    // Poslouchej PASSWORD_RECOVERY event (implicit flow)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setSessionReady(true)
      }
    })

    handleAuth()
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Hesla se neshodují')
      return
    }
    if (password.length < 8) {
      setError('Heslo musí mít minimálně 8 znaků')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('Nepodařilo se změnit heslo. Zkuste znovu.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    if (!isInvited) {
      // Send password change notification email (fire-and-forget)
      fetch('/api/auth/notify-password-change', { method: 'POST' }).catch(() => {})
    }

    setTimeout(async () => {
      if (isInvited) {
        router.push('/dashboard')
      } else {
        await supabase.auth.signOut()
        router.push('/auth/login?reset=success')
      }
    }, 2000)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, color: '#ededed', fontSize: 14, outline: 'none',
    transition: 'border-color 0.2s',
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0a0a' }}>
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(123,47,255,0.12) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,191,255,0.1) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <a href="/" className="flex items-center justify-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-base"
            style={{ background: 'linear-gradient(135deg, #00BFFF, #7B2FFF)' }}>M</div>
          <span className="font-bold text-xl text-white">Muj<span style={{ color: '#00BFFF' }}>CRM</span></span>
        </a>

        <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(34,197,94,0.15)' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Heslo bylo nastaveno</h2>
              <p className="text-sm mb-6" style={{ color: 'rgba(237,237,237,0.5)' }}>
                {isInvited ? 'Vítej v MujCRM! Tvůj účet je připraven.' : 'Heslo bylo úspěšně aktualizováno. Za chvíli budeš přesměrován na přihlášení.'}
              </p>
              {isInvited && (
                <a
                  href="/dashboard"
                  className="inline-block w-full py-3.5 rounded-xl text-sm font-bold text-center transition-all"
                  style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}
                >
                  Vstup do CRM →
                </a>
              )}
            </div>
          ) : (
            <>
              {isInvited && (
                <div className="mb-5 px-4 py-3 rounded-xl flex items-center gap-2.5 text-sm font-semibold"
                  style={{ background: 'rgba(0,191,255,0.1)', border: '1px solid rgba(0,191,255,0.3)', color: '#00BFFF' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  Byl jsi přijat do týmu! Nastav si heslo pro přihlášení.
                </div>
              )}
              <h1 className="text-2xl font-bold text-white mb-1">
                {isInvited ? 'Nastav si heslo' : 'Nastavit nové heslo'}
              </h1>
              <p className="text-sm mb-8" style={{ color: 'rgba(237,237,237,0.5)' }}>
                {isInvited ? 'Zvol si heslo pro přihlašování do MujCRM.' : 'Zadejte nové heslo pro váš účet MujCRM.'}
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'rgba(237,237,237,0.6)' }}>Nové heslo</label>
                  <input
                    type="password" required value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimálně 8 znaků"
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'rgba(237,237,237,0.6)' }}>Potvrdit nové heslo</label>
                  <input
                    type="password" required value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Zopakuj heslo"
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

                {!sessionReady && (
                  <p className="text-xs text-center" style={{ color: 'rgba(237,237,237,0.3)' }}>
                    Připravuji session…
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !sessionReady}
                  className="w-full py-3.5 rounded-xl text-sm font-bold mt-1 transition-all disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}
                >
                  {loading ? 'Ukládám…' : 'Nastavit nové heslo →'}
                </button>
              </form>

              <div className="text-center mt-6">
                <a href="/auth/login" className="text-xs" style={{ color: '#00BFFF' }}>
                  ← Zpět na přihlášení
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
