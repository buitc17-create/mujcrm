import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Přijímá řádky ve formátu "email", "email,jméno" nebo "email,jméno,firma"
// (čárka i tabulátor jako oddělovač — tak, jak to vyexportuje Google Sheets).
function parseLines(raw: string) {
  const rows: { email: string; jmeno: string | null; firma: string | null }[] = []
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const parts = trimmed.split(/[,\t;]/).map(p => p.trim())
    const email = parts.find(p => EMAIL_RE.test(p))
    if (!email) continue
    const rest = parts.filter(p => p !== email)
    rows.push({
      email: email.toLowerCase(),
      jmeno: rest[0] || null,
      firma: rest[1] || null,
    })
  }
  return rows
}

export async function POST(req: Request) {
  if (!(await isAuthorizedAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { text } = await req.json()
  if (!text || typeof text !== 'string') return NextResponse.json({ error: 'Chybí text' }, { status: 400 })

  const rows = parseLines(text)
  if (rows.length === 0) return NextResponse.json({ error: 'Nenašel jsem žádné platné e-maily.' }, { status: 400 })

  const admin = getAdmin()

  // Dedupe proti tomu, co už v tabulce je (email je unique, takže duplicity jen přeskočíme)
  const { data: existing } = await admin.from('outreach_recipients').select('email')
  const existingSet = new Set((existing ?? []).map(r => r.email.toLowerCase()))

  const toInsert = rows.filter(r => !existingSet.has(r.email))
  const skipped = rows.length - toInsert.length

  let imported = 0
  if (toInsert.length > 0) {
    const { error } = await admin.from('outreach_recipients').insert(toInsert)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    imported = toInsert.length
  }

  return NextResponse.json({ imported, skipped })
}
