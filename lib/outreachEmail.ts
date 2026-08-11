const BASE_URL = 'https://www.mujcrm.cz'

function header() {
  return `
  <tr><td style="background:#0a0a0a;padding:28px 40px;text-align:center;">
    <span style="font-size:18px;font-weight:800;color:#fff;">Muj<span style="color:#00BFFF">CRM</span></span>
  </td></tr>`
}

function footer(unsubscribeUrl: string) {
  return `
  <tr><td style="padding:28px 40px 8px;text-align:center;">
    <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
      MujCRM · <a href="${BASE_URL}" style="color:#6b7280;">mujcrm.cz</a>
      &nbsp;·&nbsp;
      <a href="${unsubscribeUrl}" style="color:#9ca3af;">Už nechci dostávat tyto e-maily</a>
    </p>
  </td></tr>`
}

function wrap(inner: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
${inner}
</table>
</td></tr>
</table>
</body></html>`
}

function ctaButton(href: string, label: string) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 4px;">
      <tr><td align="center">
        <a href="${href}" style="display:inline-block;background:#00BFFF;color:#0a0a0a;font-size:15px;font-weight:800;text-decoration:none;padding:13px 32px;border-radius:10px;">${label}</a>
      </td></tr>
    </table>`
}

export function buildOutreachStep1Html(jmeno: string | null, unsubscribeToken: string): string {
  const greeting = jmeno ? `Ahoj ${jmeno},` : 'Dobrý den,'
  const unsubscribeUrl = `${BASE_URL}/api/outreach/unsubscribe?token=${unsubscribeToken}`

  const body = `
  <tr><td style="padding:36px 40px 8px;">
    <p style="margin:0 0 18px;font-size:15px;color:#27272a;line-height:1.7;">${greeting}</p>
    <p style="margin:0 0 18px;font-size:15px;color:#27272a;line-height:1.7;">jmenuji se Tomáš a postavil jsem MujCRM, systém pro realitní makléře, protože jsem viděl, že spousta z nich tráví čas vyplňováním excel tabulek a hledáním, kdy a s kým měli vlastně schůzku.</p>
    <p style="margin:0 0 18px;font-size:15px;color:#27272a;line-height:1.7;">Většina makléřů, se kterými mluvím, řeší pořád to samé: záznamy o schůzkách rozházené po sešitech a mailech, leady, co se ztrácí, a poptávky, co nikde neeviduje.</p>
    <p style="margin:0 0 18px;font-size:15px;color:#27272a;line-height:1.7;">Tak jsem MujCRM postavil tak, aby tohle všechno drželo pohromadě na jednom místě, v přehledném pipeline, kde vidíš každou zakázku, schůzku i poznámku k ní:</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      ${[
        'Leady, poptávky i zakázky v přehledném pipeline',
        'E-mailové automatizace, co pracují za tebe i o víkendu',
        'Tým, kterému přiřadíš zakázky a uvidíš jeho výkon',
        'Provize a reporting, co sedí bez i s DPH',
        'Kontakty, kalendář a úkoly propojené se zakázkami, všechno na jednom místě',
      ].map(item => `
      <tr><td style="padding:4px 0;font-size:14px;color:#374151;line-height:1.6;">
        <span style="color:#00BFFF;font-weight:800;margin-right:8px;">✓</span>${item}
      </td></tr>`).join('')}
    </table>

    <div style="background:#eff8ff;border-left:3px solid #00BFFF;border-radius:8px;padding:14px 18px;">
      <p style="margin:0;font-size:14px;color:#1e40af;line-height:1.6;">Mrkni se na to, stačí pár kliknutí a uvidíš to naostro na vlastních datech. Prvních 7 dní zdarma, bez karty.</p>
    </div>

    ${ctaButton(`${BASE_URL}/auth/register`, 'Vyzkoušet MujCRM zdarma →')}

    <p style="margin:24px 0 0;font-size:14px;color:#27272a;line-height:1.7;">Kdyby cokoliv, klidně odpověz přímo na tenhle e-mail, čtu každou zprávu osobně.</p>
    <p style="margin:20px 0 0;font-size:14px;color:#27272a;line-height:1.5;">Tomáš<br/>MujCRM</p>
  </td></tr>`

  return wrap(header() + body + footer(unsubscribeUrl))
}

export function buildOutreachStep2Html(jmeno: string | null, unsubscribeToken: string): string {
  const greeting = jmeno ? `Ahoj ${jmeno},` : 'Dobrý den,'
  const unsubscribeUrl = `${BASE_URL}/api/outreach/unsubscribe?token=${unsubscribeToken}`

  const body = `
  <tr><td style="padding:36px 40px 8px;">
    <p style="margin:0 0 18px;font-size:15px;color:#27272a;line-height:1.7;">${greeting}</p>
    <p style="margin:0 0 18px;font-size:15px;color:#27272a;line-height:1.7;">minulý týden jsem ti psal o systému pro makléře MujCRM. Nevím, jestli se ti to nezaválelo někde v poště, tak jen krátce připomínám.</p>
    <p style="margin:0 0 18px;font-size:15px;color:#27272a;line-height:1.7;">Je to systém, kam si makléři dají leady, poptávky, zakázky i provize, a nemusí k tomu už žádný excel ani rozházené poznámky.</p>
    <p style="margin:0 0 4px;font-size:15px;color:#27272a;line-height:1.7;">Pokud tě to zajímá, klikni a zkus si to na 7 dní zdarma, bez karty:</p>

    ${ctaButton(`${BASE_URL}/auth/register`, 'Vyzkoušet MujCRM zdarma →')}

    <p style="margin:24px 0 0;font-size:14px;color:#27272a;line-height:1.5;">Tomáš<br/>MujCRM</p>
  </td></tr>`

  return wrap(header() + body + footer(unsubscribeUrl))
}

export function buildOutreachStep3Html(jmeno: string | null, unsubscribeToken: string): string {
  const greeting = jmeno ? `Ahoj ${jmeno},` : 'Dobrý den,'
  const unsubscribeUrl = `${BASE_URL}/api/outreach/unsubscribe?token=${unsubscribeToken}`

  const body = `
  <tr><td style="padding:36px 40px 8px;">
    <p style="margin:0 0 18px;font-size:15px;color:#27272a;line-height:1.7;">${greeting}</p>
    <p style="margin:0 0 18px;font-size:15px;color:#27272a;line-height:1.7;">tohle je poslední e-mail, co ti k MujCRM pošlu. Možná bylo 7 dní na pořádné vyzkoušení málo, tak ti přidávám 30 dní navíc.</p>
    <p style="margin:0 0 4px;font-size:15px;color:#27272a;line-height:1.7;">Přes tenhle odkaz se ti při registraci automaticky nastaví 37 dní zkušební doby místo 7, bez karty:</p>

    ${ctaButton(`${BASE_URL}/auth/register?promo=makler30`, 'Vyzkoušet MujCRM na 37 dní zdarma →')}

    <p style="margin:24px 0 0;font-size:14px;color:#27272a;line-height:1.7;">Kdyby tě to nezajímalo, žádný problém, víc už se ozývat nebudu.</p>
    <p style="margin:20px 0 0;font-size:14px;color:#27272a;line-height:1.5;">Tomáš<br/>MujCRM</p>
  </td></tr>`

  return wrap(header() + body + footer(unsubscribeUrl))
}

const SUBJECTS: Record<1 | 2 | 3, string> = {
  1: 'CRM ušitý na míru realitním makléřům — 7 dní zdarma',
  2: 'Ještě jste nezkusili MujCRM?',
  3: 'Poslední připomínka: 37 dní MujCRM zdarma pro vás 🎁',
}

const BUILDERS: Record<1 | 2 | 3, (jmeno: string | null, token: string) => string> = {
  1: buildOutreachStep1Html,
  2: buildOutreachStep2Html,
  3: buildOutreachStep3Html,
}

type SendResult = { ok: true } | { ok: false; error: string }

export async function sendOutreachEmail(
  to: string,
  jmeno: string | null,
  unsubscribeToken: string,
  step: 1 | 2 | 3 = 1
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.OUTREACH_FROM_EMAIL
  const replyTo = process.env.OUTREACH_REPLY_TO

  if (!apiKey || !from) {
    return { ok: false, error: 'RESEND_API_KEY nebo OUTREACH_FROM_EMAIL není nastaveno v proměnných prostředí.' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject: SUBJECTS[step],
        html: BUILDERS[step](jmeno, unsubscribeToken),
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 300)}` }
    }

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Neznámá chyba' }
  }
}
