const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mujcrm.cz';

export function buildPaymentFailedEmailHtml(amount: string): string {
  return `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Platba se nezdařila</title></head>
<body style="margin:0; padding:0; background:#f3f4f6; font-family:Arial, Helvetica, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6; padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <!-- HEADER -->
  <tr><td style="background:linear-gradient(135deg, #0a0a0a 0%, #1a1040 100%); padding:36px 40px; text-align:center;">
    <div style="color:#00BFFF; font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; margin-bottom:12px;">MujCRM</div>
    <div style="width:52px; height:52px; background:rgba(255,80,80,0.15); border-radius:50%; margin:0 auto 16px; display:flex; align-items:center; justify-content:center;">
      <div style="width:52px; height:52px; background:rgba(255,80,80,0.15); border-radius:50%; line-height:52px; text-align:center; font-size:24px;">⚠️</div>
    </div>
    <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:800;">Platba se nezdařila</h1>
    <p style="margin:10px 0 0; color:rgba(255,255,255,0.6); font-size:13px;">Vaše předplatné MujCRM nebylo obnoveno</p>
  </td></tr>

  <!-- CONTENT -->
  <tr><td style="padding:36px 40px 28px;">
    <p style="margin:0 0 16px; font-size:15px; color:#374151; line-height:1.7;">
      Dobrý den,
    </p>
    <p style="margin:0 0 24px; font-size:15px; color:#374151; line-height:1.7;">
      bohužel se nám nepodařilo strhnout platbu <strong>${amount}</strong> za vaše předplatné MujCRM. Váš přístup zůstává zatím aktivní, ale doporučujeme co nejdříve aktualizovat platební údaje.
    </p>

    <!-- ALERT BOX -->
    <div style="background:#fff5f5; border-radius:10px; border-left:4px solid #ff4444; padding:16px 20px; margin-bottom:28px;">
      <p style="margin:0; font-size:13px; color:#c0392b; line-height:1.6;">
        <strong>Co se stane pokud platbu neobnovíte?</strong><br/>
        Stripe se pokusí o platbu automaticky ještě několikrát v průběhu 2 týdnů. Pokud se platba nepodaří, váš přístup bude omezen.
      </p>
    </div>

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${APP_URL}/dashboard/billing"
          style="display:inline-block; background:linear-gradient(135deg, #00BFFF, #0090cc); color:#0a0a0a; font-size:15px; font-weight:800; text-decoration:none; padding:14px 40px; border-radius:10px; letter-spacing:0.3px;">
          Aktualizovat platební údaje →
        </a>
      </td></tr>
    </table>
  </td></tr>

  <!-- DIVIDER -->
  <tr><td style="padding:0 40px;"><div style="height:1px; background:#f3f4f6;"></div></td></tr>

  <!-- FOOTER -->
  <tr><td style="padding:24px 40px 32px; text-align:center;">
    <p style="margin:0 0 8px; font-size:13px; color:#9ca3af;">Máte otázky? Napište nám na</p>
    <a href="mailto:info@mujcrm.cz" style="color:#00BFFF; font-size:13px; text-decoration:none; font-weight:600;">info@mujcrm.cz</a>
    <p style="margin:16px 0 0; font-size:11px; color:#d1d5db;">© MujCRM · Automaticky generovaný e-mail</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
