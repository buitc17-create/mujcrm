'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function AcceptInvitePage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')

    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token }).then(async ({ data }) => {
        if (data.session) {
          await fetch('/api/team/accept-invite', { method: 'POST' })
          router.replace('/auth/update-password?invited=true')
        } else {
          router.replace('/auth/login?error=invite_expired')
        }
      })
    } else {
      // Fallback - zkusit existující session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          fetch('/api/team/accept-invite', { method: 'POST' }).then(() => {
            router.replace('/auth/update-password?invited=true')
          })
        } else {
          router.replace('/auth/login?error=invite_expired')
        }
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
      <div className="text-center">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-base mx-auto mb-6"
          style={{ background: 'linear-gradient(135deg, #00BFFF, #7B2FFF)' }}>M</div>
        <p style={{ color: 'rgba(237,237,237,0.6)', fontSize: 15 }}>Přijímám pozvánku…</p>
      </div>
    </div>
  )
}
