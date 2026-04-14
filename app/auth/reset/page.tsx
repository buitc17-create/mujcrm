'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function ResetPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const handleReset = async () => {
      const searchParams = new URLSearchParams(window.location.search)
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')
      const code = searchParams.get('code')

      // PKCE flow: code exchange
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          router.replace('/auth/update-password')
          return
        }
      }

      // Legacy flow: token_hash
      if (tokenHash && type === 'recovery') {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        })
        if (!error) {
          router.replace('/auth/update-password')
          return
        }
      }

      // Implicit flow: access_token v hash fragmentu
      const hash = window.location.hash
      if (hash) {
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const hashType = params.get('type')

        if (accessToken && refreshToken && hashType === 'recovery') {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (!error) {
            router.replace('/auth/update-password')
            return
          }
        }
      }

      // Fallback
      router.replace('/auth/login')
    }

    handleReset()
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 32 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #00BFFF, #7B2FFF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, color: '#fff', fontSize: 16,
          }}>M</div>
          <span style={{ fontWeight: 700, fontSize: 20, color: '#fff' }}>
            Muj<span style={{ color: '#00BFFF' }}>CRM</span>
          </span>
        </a>
        <p style={{ color: 'rgba(237,237,237,0.5)', fontSize: 14, marginTop: 16 }}>
          Připravujeme obnovu hesla…
        </p>
        <div style={{
          width: 36, height: 36,
          border: '3px solid rgba(255,255,255,0.1)',
          borderTop: '3px solid #00BFFF',
          borderRadius: '50%',
          margin: '20px auto',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}
