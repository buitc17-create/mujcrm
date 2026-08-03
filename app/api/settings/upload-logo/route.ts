import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const MAX_SIZE = 2 * 1024 * 1024 // 2 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Soubor nenalezen' }, { status: 400 })

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Logo je příliš velké (max 2 MB).' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Podporované formáty: PNG, JPG, WEBP, SVG.' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const path = `${user.id}/logo.${ext}`

  const admin = getAdmin()

  // Create bucket if it doesn't exist yet
  const { data: buckets } = await admin.storage.listBuckets()
  const bucketExists = buckets?.some(b => b.name === 'logos')
  if (!bucketExists) {
    await admin.storage.createBucket('logos', { public: true, fileSizeLimit: 2 * 1024 * 1024 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Remove old logo files with different extension
  const { data: existing } = await admin.storage.from('logos').list(user.id)
  if (existing) {
    const toDelete = existing.filter(f => f.name !== `logo.${ext}`).map(f => `${user.id}/${f.name}`)
    if (toDelete.length > 0) await admin.storage.from('logos').remove(toDelete)
  }

  const { error: uploadError } = await admin.storage
    .from('logos')
    .upload(path, buffer, { upsert: true, contentType: file.type })

  if (uploadError) {
    return NextResponse.json({ error: 'Chyba při nahrávání: ' + uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage.from('logos').getPublicUrl(path)
  const logoUrl = publicUrl + '?t=' + Date.now()

  await admin.from('company_settings').upsert(
    { user_id: user.id, logo_url: logoUrl, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )

  return NextResponse.json({ logoUrl })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const admin = getAdmin()

  const { data: existing } = await admin.storage.from('logos').list(user.id)
  if (existing && existing.length > 0) {
    const paths = existing.map(f => `${user.id}/${f.name}`)
    await admin.storage.from('logos').remove(paths)
  }

  await admin.from('company_settings').upsert(
    { user_id: user.id, logo_url: null, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )

  return NextResponse.json({ ok: true })
}
