import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function page(message: string) {
  return `<!DOCTYPE html><html lang="cs"><head><meta charset="UTF-8"><title>Odhlášení — MujCRM</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="max-width:440px;padding:40px 32px;text-align:center;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;">
    <div style="display:inline-block;width:48px;height:48px;background:linear-gradient(135deg,#00BFFF,#7B2FFF);border-radius:14px;line-height:48px;font-size:22px;font-weight:900;color:#0a0a0a;margin-bottom:20px;">M</div>
    <p style="color:#fff;font-size:16px;line-height:1.6;margin:0;">${message}</p>
  </div>
</body></html>`
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return new Response(page('Chybí odhlašovací token.'), { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  const admin = getAdmin()
  const { data, error } = await admin
    .from('outreach_recipients')
    .update({ status: 'unsubscribed' })
    .eq('unsubscribe_token', token)
    .select('id')
    .maybeSingle()

  if (error || !data) {
    return new Response(page('Odkaz je neplatný nebo už byl použit.'), { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  return new Response(page('Odhlášeno. Už vám nebudeme posílat žádné další e-maily.'), { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
