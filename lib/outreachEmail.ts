const BASE_URL = 'https://www.mujcrm.cz'

function header() {
  return `
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;width:48px;height:48px;background:linear-gradient(135deg,#00BFFF,#7B2FFF);border-radius:14px;line-height:48px;font-size:22px;font-weight:900;color:#0a0a0a;text-align:center;">M</div>
    <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:20px;font-weight:700;color:#fff;">Muj<span style="color:#00BFFF">CRM</span></span>
  </div>`
}

function footer(unsubscribeUrl: string) {
  return `
  <p style="text-align:center;color:rgba(237,237,237,0.25);font-size:12px;margin-top:24px;">
    MujCRM · <a href="${BASE_URL}" style="color:rgba(0,191,255,0.6);">mujcrm.cz</a>
    &nbsp;·&nbsp;
    <a href="${unsubscribeUrl}" style="color:rgba(237,237,237,0.35);">Už nechci dostávat tyto e-maily</a>
  </p>`
}

function wrap(inner: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">${inner}</div>
</body></html>`
}

export function buildOutreachStep1Html(jmeno: string | null, unsubscribeToken: string): string {
  const greeting = jmeno ? `Ahoj ${jmeno},` : 'Dobrý den,'
  const unsubscribeUrl = `${BASE_URL}/api/outreach/unsubscribe?token=${unsubscribeToken}`

  return wrap(`
  ${header()}
  <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:36px;">
    <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 8px;">CRM ušitý na míru realitním makléřům</h1>
    <p style="color:rgba(237,237,237,0.6);font-size:15px;line-height:1.6;margin:0 0 24px;">${greeting} posílám krátkou nabídku na MujCRM, CRM systém postavený přímo pro realitní makléře a obchodníky.</p>

    <div style="background:rgba(0,191,255,0.06);border:1px solid rgba(0,191,255,0.2);border-radius:14px;padding:20px;margin-bottom:16px;">
      <p style="color:#00BFFF;font-weight:700;margin:0 0 6px;font-size:14px;">🏠 Leady, poptávky a zakázky na jednom místě</p>
      <p style="color:rgba(237,237,237,0.55);font-size:13px;margin:0;">Přehledný pipeline pro vaše zakázky, evidence poptávek klientů (investor / kupující) a jasné sledování zdroje každého leadu, včetně doporučení.</p>
    </div>

    <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:14px;padding:20px;margin-bottom:16px;">
      <p style="color:#f59e0b;font-weight:700;margin:0 0 6px;font-size:14px;">✉️ Automatizace, která pracuje za vás</p>
      <p style="color:rgba(237,237,237,0.55);font-size:13px;margin:0;">Nastavte e-mailové sekvence, které se klientům odešlou samy v přesně daný den, a narozeninové přání navíc odejde automaticky. Ušetříte hodiny ruční práce každý týden.</p>
    </div>

    <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:14px;padding:20px;margin-bottom:16px;">
      <p style="color:#10b981;font-weight:700;margin:0 0 6px;font-size:14px;">👥 Pracujte společně jako tým</p>
      <p style="color:rgba(237,237,237,0.55);font-size:13px;margin:0;">Přidejte kolegy do svého účtu, přiřazujte jim leady a zakázky a mějte přehled o výkonu celého týmu na jednom místě.</p>
    </div>

    <div style="background:rgba(123,47,255,0.08);border:1px solid rgba(123,47,255,0.2);border-radius:14px;padding:20px;margin-bottom:16px;">
      <p style="color:#a78bfa;font-weight:700;margin:0 0 6px;font-size:14px;">💰 Provize a reporting</p>
      <p style="color:rgba(237,237,237,0.55);font-size:13px;margin:0;">Provizi počítáte bez i s DPH, reporting vám ukáže příjmy i výhled napříč měsícem, pololetím i rokem.</p>
    </div>

    <div style="background:rgba(0,191,255,0.06);border:1px solid rgba(0,191,255,0.2);border-radius:14px;padding:20px;margin-bottom:28px;">
      <p style="color:#00BFFF;font-weight:700;margin:0 0 6px;font-size:14px;">⚡ 7 dní zdarma, bez karty</p>
      <p style="color:rgba(237,237,237,0.55);font-size:13px;margin:0;">Vyzkoušíte naostro, se všemi funkcemi. Založení účtu trvá 2 minuty.</p>
    </div>

    <a href="${BASE_URL}/auth/register" style="display:block;text-align:center;background:linear-gradient(135deg,#00BFFF,#0090cc);color:#0a0a0a;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;">Vyzkoušet MujCRM zdarma →</a>
    <p style="text-align:center;color:rgba(237,237,237,0.45);font-size:13px;line-height:1.6;margin:16px 0 0;">Víc o všech funkcích najdete na <a href="${BASE_URL}" style="color:#00BFFF;text-decoration:none;">mujcrm.cz</a>. Vyzkoušejte MujCRM stejně jako další makléři, kteří ho už dnes používají.</p>
  </div>
  ${footer(unsubscribeUrl)}`)
}

export function buildOutreachStep2Html(jmeno: string | null, unsubscribeToken: string): string {
  const greeting = jmeno ? `Ahoj ${jmeno},` : 'Dobrý den,'
  const unsubscribeUrl = `${BASE_URL}/api/outreach/unsubscribe?token=${unsubscribeToken}`

  return wrap(`
  ${header()}
  <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:36px;">
    <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 8px;">Ještě jste nezkusili MujCRM? 👋</h1>
    <p style="color:rgba(237,237,237,0.6);font-size:15px;line-height:1.6;margin:0 0 24px;">${greeting} minulý týden jsem vám psal o MujCRM, CRM systému postaveném přímo pro realitní makléře. Nevím, jestli se zpráva neztratila ve schránce, tak jen krátce připomínám hlavní výhodu.</p>

    <div style="background:rgba(0,191,255,0.06);border:1px solid rgba(0,191,255,0.2);border-radius:14px;padding:20px;margin-bottom:28px;">
      <p style="color:#00BFFF;font-weight:700;margin:0 0 6px;font-size:14px;">🏠 Vše na jednom místě</p>
      <p style="color:rgba(237,237,237,0.55);font-size:13px;margin:0;">Leady, poptávky, zakázky, provize i reporting v jedné přehledné appce, bez tabulek a papírování. Navíc s automatizací a možností přidat celý tým.</p>
    </div>

    <a href="${BASE_URL}/auth/register" style="display:block;text-align:center;background:linear-gradient(135deg,#00BFFF,#0090cc);color:#0a0a0a;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;">Vyzkoušet MujCRM zdarma →</a>
    <p style="text-align:center;color:rgba(237,237,237,0.45);font-size:13px;line-height:1.6;margin:16px 0 0;">Víc o všech funkcích najdete na <a href="${BASE_URL}" style="color:#00BFFF;text-decoration:none;">mujcrm.cz</a>.</p>
  </div>
  ${footer(unsubscribeUrl)}`)
}

export function buildOutreachStep3Html(jmeno: string | null, unsubscribeToken: string): string {
  const greeting = jmeno ? `Ahoj ${jmeno},` : 'Dobrý den,'
  const unsubscribeUrl = `${BASE_URL}/api/outreach/unsubscribe?token=${unsubscribeToken}`

  return wrap(`
  ${header()}
  <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:36px;">
    <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 8px;">Poslední připomínka 🙂</h1>
    <p style="color:rgba(237,237,237,0.6);font-size:15px;line-height:1.6;margin:0 0 24px;">${greeting} tohle je poslední e-mail, který vám k MujCRM pošlu. Možná bylo standardních 7 dní na pořádné vyzkoušení málo, tak přidávám 30 dní navíc.</p>

    <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:14px;padding:20px;margin-bottom:28px;">
      <p style="color:#10b981;font-weight:700;margin:0 0 6px;font-size:14px;">🎁 37 dní zdarma jen pro vás</p>
      <p style="color:rgba(237,237,237,0.55);font-size:13px;margin:0;">Přes tenhle odkaz se vám při registraci automaticky prodlouží zkušební doba na celých 37 dní, bez karty. Ať máte dost času vyzkoušet si to naostro na vlastních zakázkách.</p>
    </div>

    <a href="${BASE_URL}/auth/register?promo=makler30" style="display:block;text-align:center;background:linear-gradient(135deg,#00BFFF,#0090cc);color:#0a0a0a;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;">Vyzkoušet MujCRM na 37 dní zdarma →</a>
    <p style="text-align:center;color:rgba(237,237,237,0.45);font-size:13px;line-height:1.6;margin:16px 0 0;">Kdykoliv později se na vše ostatní podíváte na <a href="${BASE_URL}" style="color:#00BFFF;text-decoration:none;">mujcrm.cz</a>.</p>
  </div>
  ${footer(unsubscribeUrl)}`)
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
