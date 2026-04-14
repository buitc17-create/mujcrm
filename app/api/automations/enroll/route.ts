import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { decryptPassword } from '@/lib/emailCrypto';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 });

  const { lead_id, sequence_id } = await request.json();
  if (!lead_id || !sequence_id) {
    return NextResponse.json({ error: 'Chybí lead_id nebo sequence_id' }, { status: 400 });
  }

  // Ověř lead
  const { data: lead } = await supabase
    .from('leads').select('id, email, jmeno, prijmeni')
    .eq('id', lead_id).eq('user_id', user.id).single();
  if (!lead) return NextResponse.json({ error: 'Lead nenalezen' }, { status: 404 });
  if (!lead.email) return NextResponse.json({ error: 'Lead nemá emailovou adresu' }, { status: 400 });

  // Ověř sekvenci
  const { data: sequence } = await supabase
    .from('automation_sequences').select('id, name')
    .eq('id', sequence_id).eq('user_id', user.id).single();
  if (!sequence) return NextResponse.json({ error: 'Sekvence nenalezena' }, { status: 404 });

  // Zkontroluj existující aktivní enrollment pro tento lead
  const { data: existing } = await supabase
    .from('automation_enrollments').select('id')
    .eq('lead_id', lead_id).eq('status', 'active').limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'Lead je již v aktivní sekvenci' }, { status: 409 });
  }

  // Načti kroky sekvence
  const { data: steps } = await supabase
    .from('automation_steps').select('*')
    .eq('sequence_id', sequence_id).eq('user_id', user.id)
    .order('step_order');
  if (!steps || steps.length === 0) {
    return NextResponse.json({ error: 'Sekvence nemá žádné kroky' }, { status: 400 });
  }

  // Vytvoř enrollment
  const { data: enrollment, error: enrollError } = await supabase
    .from('automation_enrollments').insert({
      user_id: user.id,
      sequence_id,
      lead_id,
      status: 'active',
      current_step: 0,
    }).select('*, automation_sequences(name)').single();
  if (enrollError || !enrollment) {
    return NextResponse.json({ error: enrollError?.message ?? 'Chyba při vytváření enrollmentu' }, { status: 500 });
  }

  // Pokud první krok má delay_days=0, odešli ho ihned
  const firstStep = steps[0];
  let emailSent = false;
  let firstEmailError = '';

  if (firstStep.delay_days === 0) {
    const { data: emailSettings } = await supabase
      .from('email_settings').select('*').eq('user_id', user.id).single();

    if (emailSettings) {
      try {
        const transporter = nodemailer.createTransport({
          host: emailSettings.smtp_host,
          port: emailSettings.smtp_port,
          secure: emailSettings.smtp_secure,
          auth: { user: emailSettings.smtp_user, pass: decryptPassword(emailSettings.smtp_password) },
        });

        const mailOptions: nodemailer.SendMailOptions = {
          from: `"${emailSettings.display_name || emailSettings.smtp_user}" <${emailSettings.smtp_user}>`,
          to: lead.email,
          subject: firstStep.subject,
          html: firstStep.body + (emailSettings.signature
            ? `<br><br><hr style="border:none;border-top:1px solid #ddd;margin:16px 0"><div>${emailSettings.signature}</div>`
            : ''),
        };

        // Příloha ze Storage
        if (firstStep.attachment_path && firstStep.attachment_name) {
          try {
            const { data: signedUrlData } = await supabase.storage
              .from('automation-attachments')
              .createSignedUrl(firstStep.attachment_path, 60);
            if (signedUrlData?.signedUrl) {
              const resp = await fetch(signedUrlData.signedUrl);
              if (resp.ok) {
                mailOptions.attachments = [{
                  filename: firstStep.attachment_name,
                  content: Buffer.from(await resp.arrayBuffer()),
                }];
              }
            }
          } catch { /* příloha se nepodaří, email se odešle bez ní */ }
        }

        await transporter.sendMail(mailOptions);
        emailSent = true;
      } catch (err) {
        firstEmailError = err instanceof Error ? err.message : 'Chyba při odesílání';
      }
    } else {
      firstEmailError = 'Email není nastaven v nastavení';
    }

    // Zapis do logu
    await supabase.from('automation_step_logs').insert({
      enrollment_id: enrollment.id,
      step_id: firstStep.id,
      user_id: user.id,
      to_email: lead.email,
      subject: firstStep.subject,
      status: emailSent ? 'sent' : 'error',
      error: firstEmailError || null,
    });

    // Posuň current_step
    await supabase.from('automation_enrollments')
      .update({ current_step: 1 })
      .eq('id', enrollment.id);
    enrollment.current_step = 1;
  }

  return NextResponse.json({
    enrollment,
    emailSent,
    firstEmailError: firstEmailError || null,
    totalSteps: steps.length,
  });
}
