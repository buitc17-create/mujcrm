import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SYSTEM_SMTP_USER!,
      pass: process.env.SYSTEM_SMTP_PASS!,
    },
  })
}

const FROM = `"MujCRM" <${process.env.SYSTEM_SMTP_USER}>`
const BASE_URL = 'https://www.mujcrm.cz'

// ─── Email šablony ────────────────────────────────────────────────────────────

function step1Html(name: string) {
  return `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;width:48px;height:48px;background:linear-gradient(135deg,#00BFFF,#7B2FFF);border-radius:14px;line-height:48px;font-size:22px;font-weight:900;color:#0a0a0a;text-align:center;">M</div>
    <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:20px;font-weight:700;color:#fff;">Muj<span style="color:#00BFFF">CRM</span></span>
  </div>
  <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:36px;">
    <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 8px;">Jak přidat zákazníky rychle a správně</h1>
    <p style="color:rgba(237,237,237,0.6);font-size:15px;line-height:1.6;margin:0 0 24px;">Ahoj ${name}, tady je pár tipů jak naplnit databázi zákazníků:</p>
    <div style="border-left:3px solid #00BFFF;padding-left:16px;margin-bottom:20px;">
      <p style="color:#fff;font-weight:700;margin:0 0 4px;">Import z CSV nebo Excelu</p>
      <p style="color:rgba(237,237,237,0.55);font-size:13px;margin:0;">Máš existující seznam v tabulce? Jdi do Zákazníci → Import CSV a nahraj ho jedním klikem. Systém automaticky rozpozná sloupce.</p>
    </div>
    <div style="border-left:3px solid #00BFFF;padding-left:16px;margin-bottom:20px;">
      <p style="color:#fff;font-weight:700;margin:0 0 4px;">Tagy pro lepší přehled</p>
      <p style="color:rgba(237,237,237,0.55);font-size:13px;margin:0;">Každý zákazník může mít tag: zákazník, lead, VIP nebo partner. Filtrovanie pak ušetří hodně času.</p>
    </div>
    <div style="border-left:3px solid #00BFFF;padding-left:16px;margin-bottom:28px;">
      <p style="color:#fff;font-weight:700;margin:0 0 4px;">Přidej datum narození</p>
      <p style="color:rgba(237,237,237,0.55);font-size:13px;margin:0;">MujCRM automaticky pošle narozeninový email tvým zákazníkům — stačí nastavit datum v detailu kontaktu.</p>
    </div>
    <a href="${BASE_URL}/dashboard/contacts" style="display:block;text-align:center;background:linear-gradient(135deg,#00BFFF,#0090cc);color:#0a0a0a;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;">Přidat zákazníky →</a>
  </div>
  <p style="text-align:center;color:rgba(237,237,237,0.25);font-size:12px;margin-top:24px;">MujCRM · <a href="${BASE_URL}" style="color:rgba(0,191,255,0.6);">mujcrm.cz</a></p>
</div>
</body></html>`
}

function step2Html(name: string) {
  return `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;width:48px;height:48px;background:linear-gradient(135deg,#00BFFF,#7B2FFF);border-radius:14px;line-height:48px;font-size:22px;font-weight:900;color:#0a0a0a;text-align:center;">M</div>
    <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:20px;font-weight:700;color:#fff;">Muj<span style="color:#00BFFF">CRM</span></span>
  </div>
  <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:36px;">
    <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 8px;">Automatizuj svůj prodej ✨</h1>
    <p style="color:rgba(237,237,237,0.6);font-size:15px;line-height:1.6;margin:0 0 24px;">Ahoj ${name}, víš, že MujCRM umí pracovat za tebe i mimo pracovní dobu?</p>
    <div style="background:rgba(123,47,255,0.08);border:1px solid rgba(123,47,255,0.2);border-radius:14px;padding:20px;margin-bottom:16px;">
      <p style="color:#a78bfa;font-weight:700;margin:0 0 6px;font-size:14px;">📧 E-mailové sekvence</p>
      <p style="color:rgba(237,237,237,0.55);font-size:13px;margin:0;">Nastav sérii emailů, které se automaticky odešlou leadům v přesně definovaných dnech. Ušetří hodiny ruční práce.</p>
    </div>
    <div style="background:rgba(123,47,255,0.08);border:1px solid rgba(123,47,255,0.2);border-radius:14px;padding:20px;margin-bottom:16px;">
      <p style="color:#a78bfa;font-weight:700;margin:0 0 6px;font-size:14px;">🎂 Narozeninové emaily</p>
      <p style="color:rgba(237,237,237,0.55);font-size:13px;margin:0;">Zákazníci dostanou automatický email k narozeninám. Maličkost, která buduje loajalitu.</p>
    </div>
    <div style="background:rgba(123,47,255,0.08);border:1px solid rgba(123,47,255,0.2);border-radius:14px;padding:20px;margin-bottom:28px;">
      <p style="color:#a78bfa;font-weight:700;margin:0 0 6px;font-size:14px;">📋 Úkoly a pipeline</p>
      <p style="color:rgba(237,237,237,0.55);font-size:13px;margin:0;">Sleduj stav každé zakázky v přehledném Kanbanu. Nikdy ti nic neuteče.</p>
    </div>
    <a href="${BASE_URL}/dashboard/automations" style="display:block;text-align:center;background:linear-gradient(135deg,#7B2FFF,#5b21b6);color:#fff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;">Prozkoumat automatizace →</a>
  </div>
  <p style="text-align:center;color:rgba(237,237,237,0.25);font-size:12px;margin-top:24px;">MujCRM · <a href="${BASE_URL}" style="color:rgba(0,191,255,0.6);">mujcrm.cz</a></p>
</div>
</body></html>`
}

function step3UpsellHtml(name: string, upsellType: 'to_business' | 'to_team' | 'none') {
  if (upsellType === 'none') return null

  const isToBusiness = upsellType === 'to_business'
  const headline = isToBusiness
    ? 'Připrav se na růst — přidej tým'
    : 'Tvůj tým roste — přejdi na Team plán'
  const body = isToBusiness
    ? `Používáš MujCRM už měsíc a věříme, že vidíš hodnotu. Věděl/a jsi, že na Business plánu můžeš přidat až 4 členy týmu, kteří budou mít přístup ke sdíleným zákazníkům a zakázkám?`
    : `Váš tým je aktivní a blíží se limitu členů. Na Team plánu získáš až 10 členů, prioritní podporu a pokročilé reporty.`
  const cta = isToBusiness ? 'Vyzkoušet Business plán' : 'Přejít na Team plán'

  return `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;width:48px;height:48px;background:linear-gradient(135deg,#00BFFF,#7B2FFF);border-radius:14px;line-height:48px;font-size:22px;font-weight:900;color:#0a0a0a;text-align:center;">M</div>
    <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:20px;font-weight:700;color:#fff;">Muj<span style="color:#00BFFF">CRM</span></span>
  </div>
  <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:36px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="background:linear-gradient(135deg,#00BFFF20,#7B2FFF20);border:1px solid rgba(0,191,255,0.3);border-radius:20px;padding:6px 16px;font-size:12px;font-weight:700;color:#00BFFF;">🚀 Speciální nabídka</span>
    </div>
    <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 16px;text-align:center;">${headline}</h1>
    <p style="color:rgba(237,237,237,0.6);font-size:15px;line-height:1.6;margin:0 0 24px;">Ahoj ${name},</p>
    <p style="color:rgba(237,237,237,0.6);font-size:15px;line-height:1.6;margin:0 0 24px;">${body}</p>
    <div style="background:rgba(0,191,255,0.06);border:1px solid rgba(0,191,255,0.15);border-radius:14px;padding:20px;margin-bottom:28px;">
      <p style="color:#fff;font-weight:700;margin:0 0 10px;">Co získáš navíc:</p>
      ${isToBusiness ? `
      <p style="color:rgba(237,237,237,0.7);font-size:13px;margin:0 0 6px;">✓ Až 4 členové týmu se sdíleným přístupem</p>
      <p style="color:rgba(237,237,237,0.7);font-size:13px;margin:0 0 6px;">✓ Měsíční výkazy aktivity každého člena</p>
      <p style="color:rgba(237,237,237,0.7);font-size:13px;margin:0 0 6px;">✓ Přidělování zakázek a úkolů</p>
      <p style="color:rgba(237,237,237,0.7);font-size:13px;margin:0;">✓ Prioritní podpora</p>
      ` : `
      <p style="color:rgba(237,237,237,0.7);font-size:13px;margin:0 0 6px;">✓ Až 10 členů týmu</p>
      <p style="color:rgba(237,237,237,0.7);font-size:13px;margin:0 0 6px;">✓ Pokročilé reporty a analytika</p>
      <p style="color:rgba(237,237,237,0.7);font-size:13px;margin:0 0 6px;">✓ Dedikovaná zákaznická podpora</p>
      <p style="color:rgba(237,237,237,0.7);font-size:13px;margin:0;">✓ SLA garance dostupnosti</p>
      `}
    </div>
    <a href="${BASE_URL}/dashboard/billing" style="display:block;text-align:center;background:linear-gradient(135deg,#00BFFF,#0090cc);color:#0a0a0a;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;">${cta} →</a>
    <p style="text-align:center;color:rgba(237,237,237,0.3);font-size:12px;margin-top:16px;">Zrušit nebo změnit plán můžeš kdykoliv.</p>
  </div>
  <p style="text-align:center;color:rgba(237,237,237,0.25);font-size:12px;margin-top:24px;">MujCRM · <a href="${BASE_URL}" style="color:rgba(0,191,255,0.6);">mujcrm.cz</a></p>
</div>
</body></html>`
}

function step4Html(name: string) {
  return `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;width:48px;height:48px;background:linear-gradient(135deg,#00BFFF,#7B2FFF);border-radius:14px;line-height:48px;font-size:22px;font-weight:900;color:#0a0a0a;text-align:center;">M</div>
    <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:20px;font-weight:700;color:#fff;">Muj<span style="color:#00BFFF">CRM</span></span>
  </div>
  <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:36px;">
    <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 16px;">Jak se ti daří? 💬</h1>
    <p style="color:rgba(237,237,237,0.6);font-size:15px;line-height:1.6;margin:0 0 16px;">Ahoj ${name},</p>
    <p style="color:rgba(237,237,237,0.6);font-size:15px;line-height:1.6;margin:0 0 24px;">Používáš MujCRM více než měsíc a rádi bychom slyšeli tvůj názor. Co funguje, co chybí, co bys zlepšil/a?</p>
    <p style="color:rgba(237,237,237,0.6);font-size:15px;line-height:1.6;margin:0 0 24px;">Tvá zpětná vazba přímo ovlivňuje to, co stavíme dál. Stačí odpovědět na tento email — přečteme každou zprávu.</p>
    <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.15);border-radius:14px;padding:20px;margin-bottom:28px;">
      <p style="color:#10b981;font-weight:700;margin:0 0 6px;font-size:14px;">Doporuč nás a získej odměnu</p>
      <p style="color:rgba(237,237,237,0.55);font-size:13px;margin:0;">Pokud je MujCRM přínosem pro tvůj business, sdílej ho s kolegy a přáteli. Každé doporučení nám pomáhá růst.</p>
    </div>
    <a href="mailto:info@mujcrm.cz?subject=Zpětná vazba k MujCRM" style="display:block;text-align:center;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#ededed;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;">Napsat zpětnou vazbu →</a>
  </div>
  <p style="text-align:center;color:rgba(237,237,237,0.25);font-size:12px;margin-top:24px;">MujCRM · <a href="${BASE_URL}" style="color:rgba(0,191,255,0.6);">mujcrm.cz</a></p>
</div>
</body></html>`
}

// ─── Cron handler ─────────────────────────────────────────────────────────────

// step → [delay_days, subject]
const STEPS: Record<number, { days: number; subject: (name: string) => string }> = {
  1: { days: 3,  subject: (n) => `${n}, jak rychle přidat zákazníky do MujCRM` },
  2: { days: 7,  subject: (n) => `Automatizuj svůj prodej, ${n} 🚀` },
  3: { days: 30, subject: (n) => `${n}, tvůj CRM pracuje — jsi připraven/a na více?` },
  4: { days: 37, subject: (n) => `Jak se ti daří s MujCRM, ${n}?` },
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const admin = getAdmin()
  const now = new Date()

  const { data: enrollments, error } = await admin
    .from('onboarding_enrollments')
    .select('*')
    .eq('status', 'active')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let sent = 0
  let completed = 0
  const errors: string[] = []

  for (const enrollment of enrollments ?? []) {
    const step = enrollment.current_step as number
    const stepConfig = STEPS[step]

    if (!stepConfig) {
      // Sekvence dokončena
      await admin.from('onboarding_enrollments').update({ status: 'completed' }).eq('id', enrollment.id)
      completed++
      continue
    }

    const enrolledAt = new Date(enrollment.enrolled_at as string)
    const sendAt = new Date(enrolledAt.getTime() + stepConfig.days * 24 * 60 * 60 * 1000)

    if (now < sendAt) continue // Ještě není čas

    const name = (enrollment.user_name as string) ?? 'příteli'
    const email = enrollment.user_email as string
    let html: string | null = null

    if (step === 1) html = step1Html(name)
    else if (step === 2) html = step2Html(name)
    else if (step === 3) {
      // Zjisti plán a počet členů pro upsell
      const { data: profile } = await admin.from('profiles').select('plan').eq('id', enrollment.user_id).single()
      const plan = (profile?.plan as string) ?? 'trial'

      let upsellType: 'to_business' | 'to_team' | 'none' = 'none'
      if (['trial', 'starter', 'free'].includes(plan)) {
        upsellType = 'to_business'
      } else if (plan === 'business') {
        const { count } = await admin.from('team_members').select('id', { count: 'exact', head: true }).eq('owner_id', enrollment.user_id).eq('status', 'aktivni')
        if ((count ?? 0) >= 3) upsellType = 'to_team' // Blíží se limitu 4 členů
      }

      html = step3UpsellHtml(name, upsellType)
    } else if (step === 4) html = step4Html(name)

    if (!html) {
      // Upsell skipped (plan team) — jen posun na další krok
      await admin.from('onboarding_enrollments').update({ current_step: step + 1 }).eq('id', enrollment.id)
      continue
    }

    try {
      const transporter = getTransporter()
      await transporter.sendMail({
        from: FROM,
        to: email,
        subject: stepConfig.subject(name),
        html,
      })

      const nextStep = step + 1
      const isLast = !STEPS[nextStep]
      await admin.from('onboarding_enrollments').update({
        current_step: nextStep,
        ...(isLast ? { status: 'completed' } : {}),
      }).eq('id', enrollment.id)

      if (isLast) completed++
      sent++
    } catch (err) {
      errors.push(`${email} step ${step}: ${err instanceof Error ? err.message : 'Chyba'}`)
    }
  }

  return NextResponse.json({ sent, completed, errors })
}
