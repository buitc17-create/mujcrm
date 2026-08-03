const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mujcrm.cz'

export function buildTrialWarningEmailHtml(userName: string, daysLeft: number): string {
  return `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Zkušební verze brzy skončí</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <tr><td style="background:linear-gradient(135deg,#0a0a0a 0%,#1a1040 100%);padding:36px 40px;text-align:center;">
    <div style="color:#00BFFF;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;">MujCRM</div>
    <div style="width:52px;height:52px;background:rgba(245,158,11,0.15);border-radius:50%;margin:0 auto 16px;line-height:52px;text-align:center;font-size:24px;">⏰</div>
    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">Zkušební verze brzy skončí</h1>
    <p style="margin:10px 0 0;color:rgba(255,255,255,0.55);font-size:13px;">Zbývají ti pouze <strong style="color:#f59e0b;">${daysLeft} ${daysLeft === 1 ? 'den' : 'dny'}</strong></p>
  </td></tr>

  <tr><td style="padding:36px 40px 28px;">
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
      Dobrý den${userName ? `, <strong>${userName}</strong>` : ''},
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
      tvoje 7denní zkušební verze <strong>MujCRM</strong> vyprší za <strong>${daysLeft} ${daysLeft === 1 ? 'den' : 'dny'}</strong>. Aby ti nezmizel přístup k datům, vyber si tarif ještě dnes.
    </p>

    <div style="background:#fffbeb;border-radius:10px;border-left:4px solid #f59e0b;padding:16px 20px;margin-bottom:28px;">
      <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
        <strong>Po vypršení zkušební doby</strong> budeš mít i nadále přístup ke svým datům — stačí si vybrat tarif a pokračovat.
      </p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      ${[
        ['Start', 'Pro freelancery a malé firmy'],
        ['Tým', 'Pro rostoucí obchodní týmy'],
        ['Business', 'Pro firmy které rostou rychle'],
        ['Enterprise', 'Pro velké organizace'],
      ].map(([name, desc]) => `
      <tr>
        <td style="padding:8px 12px;background:#f8fafc;border-radius:8px;margin-bottom:6px;display:block;">
          <strong style="color:#111827;font-size:13px;">${name}</strong>
          <span style="color:#6b7280;font-size:12px;margin-left:8px;">${desc}</span>
        </td>
      </tr>`).join('')}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${APP_URL}/dashboard/billing"
          style="display:inline-block;background:linear-gradient(135deg,#00BFFF,#0090cc);color:#0a0a0a;font-size:14px;font-weight:800;text-decoration:none;padding:13px 36px;border-radius:10px;letter-spacing:0.3px;">
          Vybrat tarif →
        </a>
      </td></tr>
    </table>
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
