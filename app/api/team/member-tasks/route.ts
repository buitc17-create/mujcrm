import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST – create task as member (bypasses RLS so user_id = ownerId)
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const admin = getAdmin()

  // Verify user is an active team member
  const { data: memberRecord } = await admin
    .from('team_members')
    .select('owner_id')
    .eq('member_user_id', user.id)
    .eq('status', 'aktivni')
    .maybeSingle()

  if (!memberRecord) return NextResponse.json({ error: 'Nejsi člen týmu' }, { status: 403 })

  const body = await request.json()
  const { nazev, popis, deadline, contact_id, assigned_to } = body

  if (!nazev?.trim()) return NextResponse.json({ error: 'Název je povinný' }, { status: 400 })

  const { data, error } = await admin
    .from('tasks')
    .insert({
      user_id: memberRecord.owner_id,
      nazev: nazev.trim(),
      popis: popis?.trim() || null,
      deadline: deadline || null,
      contact_id: contact_id || null,
      // If member doesn't assign to someone else, assign to themselves so it shows in their task list
      assigned_to: assigned_to || user.id,
      dokonceno: false,
    })
    .select('id, nazev, popis, deadline, dokonceno, contact_id, assigned_to, created_at, contacts(jmeno, prijmeni)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Calendar event — user_id = member's own ID so RLS shows it to the member
  if (deadline) {
    await admin.from('calendar_events').insert({
      user_id: user.id,
      nazev: nazev.trim(),
      typ: 'deadline',
      datum: deadline.slice(0, 10),
      cas_od: deadline.length >= 16 ? deadline.slice(11, 16) : null,
      cas_do: null,
      popis: popis?.trim() || null,
      contact_id: contact_id || null,
      deal_id: null,
      task_id: data.id,
    })
  }

  return NextResponse.json({ task: data })
}

// PATCH – update task as member
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const admin = getAdmin()

  const { data: memberRecord } = await admin
    .from('team_members')
    .select('owner_id')
    .eq('member_user_id', user.id)
    .eq('status', 'aktivni')
    .maybeSingle()

  if (!memberRecord) return NextResponse.json({ error: 'Nejsi člen týmu' }, { status: 403 })

  const body = await request.json()
  const { id, nazev, popis, deadline, contact_id, assigned_to } = body

  if (!id) return NextResponse.json({ error: 'Chybí id' }, { status: 400 })

  // Verify task belongs to owner's workspace
  const { data: existing } = await admin
    .from('tasks')
    .select('id')
    .eq('id', id)
    .eq('user_id', memberRecord.owner_id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Úkol nenalezen' }, { status: 404 })

  const { data, error } = await admin
    .from('tasks')
    .update({
      nazev: nazev.trim(),
      popis: popis?.trim() || null,
      deadline: deadline || null,
      contact_id: contact_id || null,
      assigned_to: assigned_to || null,
    })
    .eq('id', id)
    .select('id, nazev, popis, deadline, dokonceno, contact_id, assigned_to, created_at, contacts(jmeno, prijmeni)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update calendar event — user_id = member's own ID
  if (deadline) {
    await admin.from('calendar_events').upsert({
      user_id: user.id,
      nazev: nazev.trim(),
      typ: 'deadline',
      datum: deadline.slice(0, 10),
      cas_od: deadline.length >= 16 ? deadline.slice(11, 16) : null,
      popis: popis?.trim() || null,
      contact_id: contact_id || null,
      task_id: id,
    }, { onConflict: 'task_id' })
  } else {
    await admin.from('calendar_events').delete().eq('task_id', id)
  }

  return NextResponse.json({ task: data })
}
