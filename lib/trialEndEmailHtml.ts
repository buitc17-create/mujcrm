const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mujcrm.cz';

export function buildTrialEndEmailHtml(): string {
  return `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Váš bezplatný měsíc právě skončil</title></head>
<body style="margin:0; padding:0; background:#f3f4f6; font-family:Arial, Helvetica, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6; padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <!-- HEADER -->
  <tr><td style="background:linear-gradient(135deg, #0a0a0a 0%, #1a1040 100%); padding:36px 40px; text-align:center;">
    <div style="color:#00BFFF; font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; margin-bottom:12px;">MujCRM</div>
    <h1 style="margin:0; color:#ffffff; font-size:26px; font-weight:800;">Váš bezplatný měsíc skončil</h1>
    <p style="margin:12px 0 0; color:rgba(255,255,255,0.7); font-size:14px;">Děkujeme, že jste nám dali šanci</p>
  </td></tr>

  <!-- INTRO -->
  <tr><td style="padding:36px 40px 24px;">
    <p style="margin:0 0 16px; font-size:15px; color:#374151; line-height:1.7;">
      Dobrý den,
    </p>
    <p style="margin:0 0 16px; font-size:15px; color:#374151; line-height:1.7;">
      váš bezplatný měsíc v MujCRM právě skončil. Doufáme, že jste za tuto dobu objevili,
      jak vám náš systém může zjednodušit práci s klienty a obchodními příležitostmi.
    </p>
    <p style="margin:0; font-size:15px; color:#374151; line-height:1.7;">
      Aby váš přístup pokračoval bez přerušení, vyberte si tarif, který vám nejlépe vyhovuje.
    </p>
  </td></tr>

  <!-- DIVIDER -->
  <tr><td style="padding:0 40px;"><div style="height:1px; background:#f3f4f6;"></div></td></tr>

  <!-- PLANS -->
  <tr><td style="padding:28px 40px 8px;">
    <h2 style="margin:0 0 20px; font-size:16px; font-weight:800; color:#111827;">Vyberte si svůj tarif</h2>

    <!-- START -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden;">
      <tr>
        <td style="padding:16px 20px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:14px; font-weight:800; color:#111827; margin-bottom:4px;">Start</div>
              <div style="font-size:12px; color:#6b7280;">Pro freelancery a malé firmy. Správa kontaktů, leady, pipeline a základní přehledy.</div>
            </div>
            <div style="font-size:18px; font-weight:800; color:#111827; white-space:nowrap; padding-left:16px;">299 Kč<span style="font-size:11px; font-weight:400; color:#9ca3af;">/měs</span></div>
          </div>
        </td>
      </tr>
    </table>

    <!-- TYM -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px; border:2px solid #00BFFF; border-radius:10px; overflow:hidden; background:#f0fbff;">
      <tr>
        <td style="padding:16px 20px;">
          <div style="margin-bottom:6px;">
            <span style="background:#00BFFF; color:#0a0a0a; font-size:10px; font-weight:700; padding:2px 8px; border-radius:20px; letter-spacing:0.5px;">NEJOBLÍBENĚJŠÍ</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:14px; font-weight:800; color:#111827; margin-bottom:4px;">Tým</div>
              <div style="font-size:12px; color:#6b7280;">Pro rostoucí firmy. Vše ze Start + automatizace, reporting a až 3 členové týmu.</div>
            </div>
            <div style="font-size:18px; font-weight:800; color:#111827; white-space:nowrap; padding-left:16px;">599 Kč<span style="font-size:11px; font-weight:400; color:#9ca3af;">/měs</span></div>
          </div>
        </td>
      </tr>
    </table>

    <!-- BUSINESS -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden;">
      <tr>
        <td style="padding:16px 20px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:14px; font-weight:800; color:#111827; margin-bottom:4px;">Business</div>
              <div style="font-size:12px; color:#6b7280;">Pro firmy, které rostou rychle. Pokročilý reporting, export dat a až 10 členů týmu.</div>
            </div>
            <div style="font-size:18px; font-weight:800; color:#111827; white-space:nowrap; padding-left:16px;">999 Kč<span style="font-size:11px; font-weight:400; color:#9ca3af;">/měs</span></div>
          </div>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${APP_URL}/dashboard/billing"
          style="display:inline-block; background:linear-gradient(135deg, #00BFFF, #0090cc); color:#0a0a0a; font-size:15px; font-weight:800; text-decoration:none; padding:14px 40px; border-radius:10px; letter-spacing:0.3px;">
          Vybrat tarif →
        </a>
      </td></tr>
    </table>
  </td></tr>

  <!-- DIVIDER -->
  <tr><td style="padding:28px 40px 0;"><div style="height:1px; background:#f3f4f6;"></div></td></tr>

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
