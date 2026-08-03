const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mujcrm.cz'

export function buildTrialExpiredNotifEmailHtml(userName: string): string {
  return `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Zkušební verze skončila</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <tr><td style="background:linear-gradient(135deg,#0a0a0a 0%,#1a1040 100%);padding:36px 40px;text-align:center;">
    <div style="color:#00BFFF;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;">MujCRM</div>
    <div style="width:52px;height:52px;background:rgba(239,68,68,0.12);border-radius:50%;margin:0 auto 16px;line-height:52px;text-align:center;font-size:24px;">🔔</div>
    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">Zkušební verze skončila</h1>
    <p style="margin:10px 0 0;color:rgba(255,255,255,0.55);font-size:13px;">Vyber si tarif a pokračuj bez přerušení</p>
  </td></tr>

  <tr><td style="padding:36px 40px 28px;">
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
      Dobrý den${userName ? `, <strong>${userName}</strong>` : ''},
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
      tvoje 7denní zkušební verze <strong>MujCRM</strong> dnes skončila. Všechna tvá data jsou v bezpečí — stačí si vybrat tarif a pokračovat dál.
    </p>

    <div style="background:#fef2f2;border-radius:10px;border-left:4px solid #ef4444;padding:16px 20px;margin-bottom:28px;">
      <p style="margin:0;font-size:13px;color:#991b1b;line-height:1.6;">
        <strong>Tvá data jsou zachována.</strong> Po výběru tarifu budeš mít okamžitý přístup ke všem kontaktům, zakázkám a nastavením.
      </p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="padding:16px;background:#f8fafc;border-radius:10px;border:1px solid #e5e7eb;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#111827;text-transform:uppercase;letter-spacing:0.5px;">Dostupné tarify:</p>
          ${[
            ['Start', 'Kontakty, zakázky, aktivity'],
            ['Tým', 'Automatizace, reporty, tým do 3 lidí'],
            ['Business', 'Pokročilý reporting, tým do 10 lidí'],
            ['Enterprise', 'Neomezený tým, API přístup'],
          ].map(([name, desc]) => `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:6px;">
            <tr>
              <td style="padding:8px 12px;background:#ffffff;border-radius:8px;border:1px solid #e5e7eb;">
                <strong style="color:#111827;font-size:13px;">${name}</strong>
                <span style="color:#6b7280;font-size:12px;margin-left:8px;">${desc}</span>
              </td>
            </tr>
          </table>`).join('')}
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${APP_URL}/dashboard/billing"
          style="display:inline-block;background:linear-gradient(135deg,#00BFFF,#0090cc);color:#0a0a0a;font-size:14px;font-weight:800;text-decoration:none;padding:13px 36px;border-radius:10px;letter-spacing:0.3px;">
          Vybrat tarif a pokračovat →
        </a>
      </td></tr>
    </table>

    <p style="margin:20px 0 0;font-size:13px;color:#6b7280;text-align:center;line-height:1.6;">
      Máš otázky? Napiš nám na <a href="mailto:info@mujcrm.cz" style="color:#00BFFF;text-decoration:none;font-weight:600;">info@mujcrm.cz</a>
    </p>
  </td></tr>

  <tr><td style="padding:0 40px;"><div style="height:1px;background:#f3f4f6;"></div></td></tr>
  <tr><td style="padding:24px 40px 32px;text-align:center;">
    <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">Správce osobních údajů: <strong style="color:#6b7280;">MujCRM (Tomáš Vydra)</strong></p>
    <a href="mailto:info@mujcrm.cz" style="color:#00BFFF;font-size:13px;text-decoration:none;font-weight:600;">info@mujcrm.cz</a>
    <p style="margin:8px 0 0;font-size:11px;color:#d1d5db;">© ${new Date().getFullYear()} MujCRM · Automaticky generovaný e-mail</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}
