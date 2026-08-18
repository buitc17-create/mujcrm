import crypto from 'crypto'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

function getSecret() {
  return process.env.ADMIN_PASSWORD ?? ''
}

export function createAdminToken(): string {
  const secret = getSecret()
  const expires = Date.now() + 7 * 24 * 60 * 60 * 1000
  const payload = String(expires)
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return `${payload}.${sig}`
}

export function verifyAdminToken(token: string): boolean {
  const secret = getSecret()
  if (!secret) return false
  const dotIdx = token.lastIndexOf('.')
  if (dotIdx === -1) return false
  const payload = token.slice(0, dotIdx)
  const sig = token.slice(dotIdx + 1)
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  if (sig !== expected) return false
  return Date.now() < parseInt(payload)
}

export async function isAuthorizedAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (token && verifyAdminToken(token)) return true

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL
  if (!superAdminEmail) return false

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === superAdminEmail
}
