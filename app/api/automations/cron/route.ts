import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { decryptPassword } from '@/lib/emailCrypto';
import { buildMonthlyReportHtml } from '@/lib/monthlyReportHtml';

// Používáme service role key — cron běží bez uživatelské session
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: Request) {
  // Ověř CRON_SECRET
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = new URL(request.url);
  const forceBirthday = url.searchParams.get('force_birthday') === '1';

  const supabase = getSupabase();
  const now = new Date();

  // Načti všechny aktivní enrollmenty včetně kroků sekvence a emailu leadu
  const { data: enrollments, error: enrollErr } = await supabase
    .from('automation_enrollments')
    .select(`
      id, user_id, lead_id, sequence_id, enrolled_at, current_step,
      leads(id, email, jmeno, prijmeni, konvertovan),
      automation_sequences(id, name, automation_steps(id, step_order, delay_days, subject, body, attachment_path, attachment_name))
    `)
    .eq('status', 'active');

  if (enrollErr) {
    return NextResponse.json({ error: enrollErr.message }, { status: 500 });
  }

  let processed = 0;
  let sent = 0;
  let completed = 0;
  let stopped = 0;
  const errors: string[] = [];

  for (const enrollment of enrollments ?? []) {
    processed++;

    const lead = Array.isArray(enrollment.leads) ? enrollment.leads[0] : enrollment.leads;
    const seq = Array.isArray(enrollment.automation_sequences) ? enrollment.automation_sequences[0] : enrollment.automation_sequences;
    const steps = (
      Array.isArray(seq?.automation_steps)
        ? seq.automation_steps
        : seq?.automation_steps ? [seq.automation_steps] : []
    ).sort((a: { step_order: number }, b: { step_order: number }) => a.step_order - b.step_order);

    // Pokud lead nemá email nebo byl konvertován / nemá leads → zastav
    if (!lead || !lead.email || lead.konvertovan) {
      await supabase
        .from('automation_enrollments')
        .update({ status: 'stopped', stopped_reason: lead?.konvertovan ? 'Lead konvertován' : 'Lead nemá email' })
        .eq('id', enrollment.id);
      stopped++;
      continue;
    }

    const currentStep = enrollment.current_step as number;

    // Všechny kroky odeslány → označ jako completed
    if (currentStep >= steps.length) {
      await supabase
        .from('automation_enrollments')
        .update({ status: 'completed' })
        .eq('id', enrollment.id);
      completed++;
      continue;
    }

    // Vypočti čas odeslání dalšího kroku:
    // send_time = enrolled_at + součet delay_days kroků 0..currentStep (včetně)
    const enrolledAt = new Date(enrollment.enrolled_at as string);
    let cumulativeDays = 0;
    for (let i = 0; i <= currentStep; i++) {
      cumulativeDays += (steps[i]?.delay_days ?? 0);
    }

    const sendAt = new Date(enrolledAt.getTime() + cumulativeDays * 24 * 60 * 60 * 1000);

    if (now < sendAt) {
      // Ještě není čas
      continue;
    }

    // Odešli krok
    const step = steps[currentStep];
    if (!step) continue;

    const userId = enrollment.user_id as string;

    // Načti SMTP nastavení pro tohoto uživatele
    const { data: emailSettings } = await supabase
      .from('email_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!emailSettings) {
      errors.push(`enrollment ${enrollment.id}: email settings chybí`);
      continue;
    }

    let emailSent = false;
    let emailError = '';

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
        subject: step.subject,
        html: step.body + (emailSettings.signature
          ? `<br><br><hr style="border:none;border-top:1px solid #ddd;margin:16px 0"><div>${emailSettings.signature}</div>`
          : ''),
      };

      // Příloha ze Storage
      if (step.attachment_path && step.attachment_name) {
        try {
          const { data: signedData } = await supabase.storage
            .from('automation-attachments')
            .createSignedUrl(step.attachment_path, 60);
          if (signedData?.signedUrl) {
            const resp = await fetch(signedData.signedUrl);
            if (resp.ok) {
              mailOptions.attachments = [{
                filename: step.attachment_name,
                content: Buffer.from(await resp.arrayBuffer()),
              }];
            }
          }
        } catch { /* bez přílohy */ }
      }

      await transporter.sendMail(mailOptions);
      emailSent = true;
      sent++;
    } catch (err) {
      emailError = err instanceof Error ? err.message : 'Neznámá chyba';
      errors.push(`enrollment ${enrollment.id} krok ${currentStep + 1}: ${emailError}`);
    }

    // Zapis do logu
    await supabase.from('automation_step_logs').insert({
      enrollment_id: enrollment.id,
      step_id: step.id,
      user_id: userId,
      to_email: lead.email,
      subject: step.subject,
      status: emailSent ? 'sent' : 'error',
      error: emailError || null,
    });

    if (emailSent) {
      const nextStep = currentStep + 1;
      if (nextStep >= steps.length) {
        // Poslední krok odeslán → dokončeno
        await supabase
          .from('automation_enrollments')
          .update({ current_step: nextStep, status: 'completed' })
          .eq('id', enrollment.id);
        completed++;
      } else {
        await supabase
          .from('automation_enrollments')
          .update({ current_step: nextStep })
          .eq('id', enrollment.id);
      }
    }
  }

  // ── NAROZENINOVÁ SEKVENCE ────────────────────────────────────────────────
  // Kontrolujeme dnes i včera — pokud cron včera nesepnul, zachytí to dnes
  const toMMDD = (d: Date) =>
    `${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

  const todayMMDD = toMMDD(now);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayMMDD = toMMDD(yesterday);

  // Načti všechny zákazníky s narozeninami dnes nebo včera
  const { data: birthdayContacts } = await supabase
    .from('contacts')
    .select('id, email, jmeno, prijmeni, user_id, datum_narozeni')
    .not('datum_narozeni', 'is', null)
    .not('email', 'is', null);

  const todayBirthdays = (birthdayContacts ?? []).filter(c => {
    if (!c.datum_narozeni) return false;
    const mmdd = c.datum_narozeni.slice(5); // "YYYY-MM-DD" → "MM-DD"
    return mmdd === todayMMDD || mmdd === yesterdayMMDD;
  });

  let birthdaySent = 0;
  const birthdayDebug: string[] = [];

  for (const contact of todayBirthdays) {
    // Pokud je kontakt člena týmu, použij owner_id pro sekvenci a email settings
    const { data: memberRecord } = await supabase
      .from('team_members')
      .select('owner_id')
      .eq('member_user_id', contact.user_id)
      .eq('status', 'aktivni')
      .maybeSingle();

    const effectiveUserId = memberRecord?.owner_id ?? contact.user_id;

    // Najdi narozeninovou sekvenci (vlastního nebo adminova účtu)
    const { data: seqData } = await supabase
      .from('automation_sequences')
      .select('id, automation_steps(id, step_order, delay_days, subject, body, attachment_path, attachment_name)')
      .eq('user_id', effectiveUserId)
      .eq('je_narozeninova', true)
      .limit(1)
      .single();

    if (!seqData) {
      birthdayDebug.push(`${contact.email} (${contact.datum_narozeni}): SKIP – žádná narozeninová sekvence pro user ${effectiveUserId}`);
      continue;
    }

    const steps = (Array.isArray(seqData.automation_steps) ? seqData.automation_steps : [seqData.automation_steps])
      .sort((a: { step_order: number }, b: { step_order: number }) => a.step_order - b.step_order);
    if (!steps.length) {
      birthdayDebug.push(`${contact.email} (${contact.datum_narozeni}): SKIP – sekvence nemá žádné kroky`);
      continue;
    }

    // Zkontroluj zda letos nebyl narozeninový email pro tohoto zákazníka odeslán
    const thisYearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
    const birthdayStepIds = steps.map((s: { id: string }) => s.id);
    const { data: existingLog } = await supabase
      .from('automation_step_logs')
      .select('id')
      .eq('user_id', effectiveUserId)
      .eq('to_email', contact.email)
      .eq('status', 'sent')
      .in('step_id', birthdayStepIds)
      .gte('sent_at', thisYearStart)
      .limit(1);

    if (existingLog && existingLog.length > 0 && !forceBirthday) {
      birthdayDebug.push(`${contact.email} (${contact.datum_narozeni}): SKIP – email letos již odeslán`);
      continue;
    }

    // Načti SMTP nastavení (vlastní nebo adminovo)
    const { data: emailSettings } = await supabase
      .from('email_settings')
      .select('*')
      .eq('user_id', effectiveUserId)
      .single();

    if (!emailSettings) {
      birthdayDebug.push(`${contact.email} (${contact.datum_narozeni}): SKIP – chybí SMTP nastavení pro user ${effectiveUserId}`);
      continue;
    }

    const step = steps[0];
    let bdSent = false;
    let bdError = '';

    try {
      const transporter = nodemailer.createTransport({
        host: emailSettings.smtp_host,
        port: emailSettings.smtp_port,
        secure: emailSettings.smtp_secure,
        auth: { user: emailSettings.smtp_user, pass: decryptPassword(emailSettings.smtp_password) },
      });

      const info = await transporter.sendMail({
        from: `"${emailSettings.display_name || emailSettings.smtp_user}" <${emailSettings.smtp_user}>`,
        to: contact.email,
        subject: step.subject,
        html: step.body + (emailSettings.signature
          ? `<br><br><hr style="border:none;border-top:1px solid #ddd;margin:16px 0"><div>${emailSettings.signature}</div>`
          : ''),
      });

      bdSent = true;
      birthdaySent++;
      birthdayDebug.push(`${contact.email}: ODESLÁNO přes ${emailSettings.smtp_user} @ ${emailSettings.smtp_host} | messageId: ${info.messageId} | response: ${info.response}`);
    } catch (err) {
      bdError = err instanceof Error ? err.message : 'Chyba';
      errors.push(`Narozeniny ${contact.email}: ${bdError}`);
      birthdayDebug.push(`${contact.email}: SMTP CHYBA – ${bdError} (host: ${emailSettings.smtp_host}, user: ${emailSettings.smtp_user})`);
    }

    // Vytvoř enrollment + zapis log (bez navazujících kroků — jen pro evidenci)
    const { data: bdEnrollment } = await supabase
      .from('automation_enrollments')
      .insert({
        user_id: effectiveUserId,
        sequence_id: seqData.id,
        lead_id: null,
        status: 'completed',
        current_step: 1,
        stopped_reason: 'Narozeninový email',
      })
      .select()
      .single();

    if (bdEnrollment) {
      await supabase.from('automation_step_logs').insert({
        enrollment_id: bdEnrollment.id,
        step_id: step.id,
        user_id: effectiveUserId,
        to_email: contact.email,
        subject: step.subject,
        status: bdSent ? 'sent' : 'error',
        error: bdError || null,
      });
    }
  }

  // ── MĚSÍČNÍ VÝKAZY ──────────────────────────────────────────────────────────
  // Odesílá se vždy 1. dne v měsíci — za každého aktivního člena jeden e-mail adminovi
  let reportsSent = 0;

  if (now.getUTCDate() === 1) {
    const prevMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const prevMonthEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59));

    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('owner_id, member_user_id')
      .eq('status', 'aktivni');

    for (const tm of teamMembers ?? []) {
      try {
        // SMTP admina
        const { data: emailSettings } = await supabase
          .from('email_settings').select('*').eq('user_id', tm.owner_id).single();
        if (!emailSettings) continue;

        // Info o adminovi a členovi z auth
        const [{ data: adminAuth }, { data: memberAuth }] = await Promise.all([
          supabase.auth.admin.getUserById(tm.owner_id),
          supabase.auth.admin.getUserById(tm.member_user_id),
        ]);
        const adminEmail  = adminAuth.user?.email;
        const memberEmail = memberAuth.user?.email ?? '';
        const memberName  = memberAuth.user?.user_metadata?.full_name
          ?? memberEmail.split('@')[0]
          ?? 'Člen týmu';
        if (!adminEmail) continue;

        // Fáze pipeline admina
        const { data: stages } = await supabase
          .from('pipeline_stages').select('id, nazev, barva, poradi')
          .eq('user_id', tm.owner_id).order('poradi');

        // Všechny zakázky přiřazené členovi
        const { data: allDeals } = await supabase
          .from('deals')
          .select('id, nazev, hodnota, stage_id, datum_uzavreni, pravdepodobnost, contacts(jmeno, prijmeni, firma)')
          .eq('user_id', tm.owner_id)
          .eq('assigned_to', tm.member_user_id);

        // Zakázky vytvořené v minulém měsíci
        const { data: newThisMonth } = await supabase
          .from('deals')
          .select('id')
          .eq('user_id', tm.owner_id)
          .eq('assigned_to', tm.member_user_id)
          .gte('created_at', prevMonthStart.toISOString())
          .lte('created_at', prevMonthEnd.toISOString());

        const stageMap = Object.fromEntries((stages ?? []).map(s => [s.id, s]));

        const wonStageIds  = (stages ?? []).filter(s => /vyhráno|vyhrano/i.test(s.nazev)).map(s => s.id);
        const lostStageIds = (stages ?? []).filter(s => /prohr/i.test(s.nazev)).map(s => s.id);

        const deals = allDeals ?? [];
        const wonDeals  = deals.filter(d => wonStageIds.includes(d.stage_id));
        const lostDeals = deals.filter(d => lostStageIds.includes(d.stage_id));
        const activeDeals = deals.filter(d => !wonStageIds.includes(d.stage_id) && !lostStageIds.includes(d.stage_id));

        const wonValue  = wonDeals.reduce((s, d) => s + (d.hodnota ?? 0), 0);
        const totalValue = activeDeals.reduce((s, d) => s + (d.hodnota ?? 0), 0);

        // Počty per stage pro graf
        const stageCounts: Record<string, number> = {};
        for (const d of activeDeals) {
          if (d.stage_id) stageCounts[d.stage_id] = (stageCounts[d.stage_id] ?? 0) + 1;
        }
        const maxCount = Math.max(1, ...Object.values(stageCounts));

        const html = buildMonthlyReportHtml({
          memberName, memberEmail, adminEmail,
          periodStart: prevMonthStart,
          periodEnd: prevMonthEnd,
          stages: stages ?? [],
          deals, wonDeals, lostDeals, activeDeals,
          wonValue, totalValue,
          newThisMonthCount: newThisMonth?.length ?? 0,
          stageCounts, maxCount,
          stageMap,
        });

        const transporter = nodemailer.createTransport({
          host: emailSettings.smtp_host,
          port: emailSettings.smtp_port,
          secure: emailSettings.smtp_secure,
          auth: { user: emailSettings.smtp_user, pass: decryptPassword(emailSettings.smtp_password) },
        });

        const monthLabel = prevMonthStart.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric', timeZone: 'UTC' });

        await transporter.sendMail({
          from: `"MujCRM výkaz" <${emailSettings.smtp_user}>`,
          to: adminEmail,
          subject: `Měsíční výkaz: ${memberName} – ${monthLabel}`,
          html,
        });

        reportsSent++;
      } catch (err) {
        errors.push(`Měsíční výkaz ${tm.member_user_id}: ${err instanceof Error ? err.message : 'Chyba'}`);
      }
    }
  }

  return NextResponse.json({ processed, sent, completed, stopped, birthdaySent, reportsSent, errors, birthdayDebug, birthdayContactsFound: todayBirthdays.length, todayMMDD });
}

// buildMonthlyReportHtml přesunuto do lib/monthlyReportHtml.ts
