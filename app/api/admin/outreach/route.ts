import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/adminAuth'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  return !!token && verifyAdminToken(token)
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = getAdmin()
  const { data, error } = await admin
    .from('outreach_recipients')
    .select('id, email, jmeno, firma, status, sequence_step, sent_at, error, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const stats = {
    total: data?.length ?? 0,
    pending: data?.filter(r => r.status === 'pending').length ?? 0,
    sent: data?.filter(r => r.status === 'sent').length ?? 0,
    failed: data?.filter(r => r.status === 'failed').length ?? 0,
    unsubscribed: data?.filter(r => r.status === 'unsubscribed').length ?? 0,
    converted: data?.filter(r => r.status === 'converted').length ?? 0,
  }

  return NextResponse.json({ recipients: data ?? [], stats })
}

export async function DELETE(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Chybí id' }, { status: 400 })

  const admin = getAdmin()
  const { error } = await admin.from('outreach_recipients').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
