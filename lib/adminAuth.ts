import crypto from 'crypto'

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
