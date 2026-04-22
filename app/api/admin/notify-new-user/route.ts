import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  const { name, email } = await req.json()
  if (!name || !email) return NextResponse.json({ ok: false }, { status: 400 })

  const smtpUser = process.env.SYSTEM_SMTP_USER
  const smtpPass = process.env.SYSTEM_SMTP_PASS
  const smtpFrom = process.env.SYSTEM_SMTP_FROM ?? smtpUser
  if (!smtpUser || !smtpPass) return NextResponse.json({ ok: false })

  const date = new Date().toLocaleString('cs-CZ', { timeZone: 'Europe/Prague' })

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SYSTEM_SMTP_HOST ?? 'smtp.gmail.com',
      port: Number(process.env.SYSTEM_SMTP_PORT ?? 465),
      secure: process.env.SYSTEM_SMTP_SECURE !== 'false',
      auth: { user: smtpUser, pass: smtpPass },
    })

    await transporter.sendMail({
      from: `"MujCRM Systém" <${smtpFrom}>`,
      to: 'info@mujcrm.cz',
      subject: `🆕 Nový uživatel: ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
          <div style="background:#0a0a0a;padding:20px 24px;border-radius:10px 10px 0 0">
            <span style="color:#fff;font-size:18px;font-weight:900">Muj</span><span style="color:#00BFFF;font-size:18px;font-weight:900">CRM</span>
            <span style="color:rgba(255,255,255,0.4);font-size:13px;margin-left:12px">Nová registrace</span>
          </div>
          <div style="background:#f8fafc;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px">
            <h2 style="margin:0 0 16px;font-size:16px;color:#111">Zaregistroval se nový uživatel</h2>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:8px 0;color:#6b7280;width:120px">Jméno</td><td style="padding:8px 0;color:#111;font-weight:600">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280">E-mail</td><td style="padding:8px 0;color:#111;font-weight:600">${email}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280">Tarif</td><td style="padding:8px 0;color:#00BFFF;font-weight:600">Trial (7 dní)</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280">Datum</td><td style="padding:8px 0;color:#111">${date}</td></tr>
            </table>
          </div>
        </div>
      `,
    })
  } catch { /* tiché selhání */ }

  return NextResponse.json({ ok: true })
}
