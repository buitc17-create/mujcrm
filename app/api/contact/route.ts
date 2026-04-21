import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { name, email, company, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Chybí povinná pole' }, { status: 400 });
    }

    const smtpPort = Number(process.env.SYSTEM_SMTP_PORT ?? 465);
    const transporter = nodemailer.createTransport({
      host: process.env.SYSTEM_SMTP_HOST,
      port: smtpPort,
      secure: process.env.SYSTEM_SMTP_SECURE === 'true' || smtpPort === 465,
      auth: {
        user: process.env.SYSTEM_SMTP_USER,
        pass: process.env.SYSTEM_SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SYSTEM_SMTP_FROM ?? `"MujCRM" <${process.env.SYSTEM_SMTP_USER}>`,
      to: 'info@mujcrm.cz',
      replyTo: email,
      subject: `Nová zpráva z webu od ${name}`,
      html: `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nová zpráva z kontaktního formuláře</title></head>
<body style="margin:0; padding:0; background:#f3f4f6; font-family:Arial, Helvetica, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6; padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <!-- HEADER -->
  <tr><td style="background:linear-gradient(135deg, #0a0a0a 0%, #1a1040 100%); padding:36px 40px; text-align:center;">
    <div style="color:#00BFFF; font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; margin-bottom:12px;">MujCRM</div>
    <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:800;">Nová zpráva z webu</h1>
    <p style="margin:10px 0 0; color:rgba(255,255,255,0.6); font-size:13px;">Kontaktní formulář · mujcrm.cz</p>
  </td></tr>

  <!-- CONTENT -->
  <tr><td style="padding:36px 40px 28px;">

    <!-- INFO ROWS -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:10px 0; border-bottom:1px solid #f3f4f6; font-size:13px; font-weight:700; color:#6b7280; width:90px; vertical-align:top;">Jméno</td>
        <td style="padding:10px 0; border-bottom:1px solid #f3f4f6; font-size:14px; color:#111827; vertical-align:top;">${name}</td>
      </tr>
      <tr>
        <td style="padding:10px 0; border-bottom:1px solid #f3f4f6; font-size:13px; font-weight:700; color:#6b7280; vertical-align:top;">E-mail</td>
        <td style="padding:10px 0; border-bottom:1px solid #f3f4f6; font-size:14px; vertical-align:top;"><a href="mailto:${email}" style="color:#00BFFF; text-decoration:none; font-weight:600;">${email}</a></td>
      </tr>
      ${company ? `
      <tr>
        <td style="padding:10px 0; border-bottom:1px solid #f3f4f6; font-size:13px; font-weight:700; color:#6b7280; vertical-align:top;">Firma</td>
        <td style="padding:10px 0; border-bottom:1px solid #f3f4f6; font-size:14px; color:#111827; vertical-align:top;">${company}</td>
      </tr>` : ''}
    </table>

    <!-- MESSAGE BOX -->
    <div style="background:#f8fafc; border-radius:10px; border-left:4px solid #00BFFF; padding:20px 24px;">
      <div style="font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#00BFFF; margin-bottom:10px;">Zpráva</div>
      <p style="margin:0; font-size:14px; color:#374151; line-height:1.75; white-space:pre-wrap;">${message}</p>
    </div>

    <!-- REPLY BUTTON -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
      <tr><td align="center">
        <a href="mailto:${email}" style="display:inline-block; background:linear-gradient(135deg, #00BFFF, #0090cc); color:#0a0a0a; font-size:14px; font-weight:800; text-decoration:none; padding:12px 36px; border-radius:10px; letter-spacing:0.3px;">
          Odpovědět →
        </a>
      </td></tr>
    </table>

  </td></tr>

  <!-- DIVIDER -->
  <tr><td style="padding:0 40px;"><div style="height:1px; background:#f3f4f6;"></div></td></tr>

  <!-- FOOTER -->
  <tr><td style="padding:24px 40px 32px; text-align:center;">
    <p style="margin:0 0 8px; font-size:13px; color:#9ca3af;">Zpráva doručena přes kontaktní formulář na</p>
    <a href="https://www.mujcrm.cz" style="color:#00BFFF; font-size:13px; text-decoration:none; font-weight:600;">www.mujcrm.cz</a>
    <p style="margin:16px 0 0; font-size:11px; color:#d1d5db;">© MujCRM · Automaticky generovaný e-mail</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return NextResponse.json({ error: 'Nepodařilo se odeslat zprávu' }, { status: 500 });
  }
}
