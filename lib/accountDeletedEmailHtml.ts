const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mujcrm.cz'

export function buildAccountDeletedEmailHtml(userName: string): string {
  return `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Váš účet MujCRM byl smazán</title></head>
<body style="margin:0; padding:0; background:#f3f4f6; font-family:Arial, Helvetica, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6; padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <!-- HEADER -->
  <tr><td style="background:linear-gradient(135deg, #0a0a0a 0%, #1a1040 100%); padding:36px 40px; text-align:center;">
    <div style="color:#00BFFF; font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; margin-bottom:12px;">MujCRM</div>
    <div style="width:52px; height:52px; background:rgba(237,237,237,0.08); border-radius:50%; margin:0 auto 16px; line-height:52px; text-align:center; font-size:24px;">🗑️</div>
    <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:800;">Váš účet byl smazán</h1>
    <p style="margin:10px 0 0; color:rgba(255,255,255,0.55); font-size:13px;">Veškerá vaše data byla trvale odstraněna z platformy MujCRM</p>
  </td></tr>

  <!-- CONTENT -->
  <tr><td style="padding:36px 40px 28px;">
    <p style="margin:0 0 16px; font-size:15px; color:#374151; line-height:1.7;">
      Dobrý den${userName ? `, <strong>${userName}</strong>` : ''},
    </p>
    <p style="margin:0 0 24px; font-size:15px; color:#374151; line-height:1.7;">
      potvrzujeme, že váš účet na platformě <strong>MujCRM</strong> byl ke dni ${new Date().toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })} trvale smazán. V souladu s čl. 17 nařízení GDPR (EU) 2016/679 <em>(„právo na výmaz")</em> byly odstraněny veškeré vaše osobní údaje.
    </p>

    <!-- CO BYLO SMAZÁNO -->
    <div style="background:#f8fafc; border-radius:10px; border:1px solid #e5e7eb; padding:20px 24px; margin-bottom:28px;">
      <p style="margin:0 0 12px; font-size:13px; font-weight:700; color:#111827; text-transform:uppercase; letter-spacing:0.5px;">Co bylo smazáno:</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${[
          'Profil a přihlašovací údaje',
          'Kontakty a firmy',
          'Zakázky a obchodní pipeline',
          'Leady a obchodní příležitosti',
          'Úkoly a aktivity',
          'E-mailová komunikace a nastavení',
          'Automatizace a šablony',
          'Reporty a analytická data',
          'Nastavení účtu a týmu',
        ].map(item => `
        <tr>
          <td style="padding:4px 0; font-size:13px; color:#6b7280;">
            <span style="color:#22C55E; margin-right:8px;">✓</span>${item}
          </td>
        </tr>`).join('')}
      </table>
    </div>

    <p style="margin:0 0 24px; font-size:14px; color:#6b7280; line-height:1.7;">
      Pokud bylo k vašemu účtu vázáno aktivní předplatné, bylo automaticky zrušeno. V případě jakýchkoliv dotazů nebo pokud se domníváte, že ke smazání došlo omylem, kontaktujte nás neprodleně na <a href="mailto:info@mujcrm.cz" style="color:#00BFFF; text-decoration:none; font-weight:600;">info@mujcrm.cz</a>.
    </p>

    <!-- INFO BOX -->
    <div style="background:#f0f9ff; border-radius:10px; border-left:4px solid #00BFFF; padding:16px 20px; margin-bottom:28px;">
      <p style="margin:0; font-size:13px; color:#0369a1; line-height:1.6;">
        <strong>Uchování dat dle zákona:</strong> Některé zákonem vyžadované záznamy (např. daňové doklady) mohou být uchovány po dobu stanovenou platnou legislativou ČR (zpravidla 10 let), a to výhradně v rozsahu nezbytném pro splnění právních povinností správce dat.
      </p>
    </div>

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${APP_URL}"
          style="display:inline-block; background:linear-gradient(135deg, #00BFFF, #0090cc); color:#0a0a0a; font-size:14px; font-weight:800; text-decoration:none; padding:13px 36px; border-radius:10px; letter-spacing:0.3px;">
          Navštívit MujCRM →
        </a>
      </td></tr>
    </table>
  </td></tr>

  <!-- DIVIDER -->
  <tr><td style="padding:0 40px;"><div style="height:1px; background:#f3f4f6;"></div></td></tr>

  <!-- FOOTER -->
  <tr><td style="padding:24px 40px 32px; text-align:center;">
    <p style="margin:0 0 6px; font-size:12px; color:#9ca3af;">Správce osobních údajů: <strong style="color:#6b7280;">MujCRM (Tomáš Vydra)</strong></p>
    <p style="margin:0 0 8px; font-size:12px; color:#9ca3af;">Dotazy k ochraně osobních údajů:</p>
    <a href="mailto:info@mujcrm.cz" style="color:#00BFFF; font-size:13px; text-decoration:none; font-weight:600;">info@mujcrm.cz</a>
    <p style="margin:12px 0 4px; font-size:11px; color:#d1d5db;">
      <a href="${APP_URL}/gdpr" style="color:#d1d5db; text-decoration:none;">Zásady ochrany osobních údajů</a>
      &nbsp;·&nbsp;
      <a href="${APP_URL}/podminky" style="color:#d1d5db; text-decoration:none;">Obchodní podmínky</a>
    </p>
    <p style="margin:8px 0 0; font-size:11px; color:#d1d5db;">© ${new Date().getFullYear()} MujCRM · Automaticky generovaný e-mail</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}
