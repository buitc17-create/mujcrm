import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import nodemailer from 'nodemailer';
import { decryptPassword } from '@/lib/emailCrypto';
import { buildMonthlyReportHtml } from '@/lib/monthlyReportHtml';

function getServiceSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  // Ověř přihlášeného uživatele
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { memberUserId } = await request.json();
  if (!memberUserId) return NextResponse.json({ error: 'Chybí memberUserId' }, { status: 400 });

  const admin = getServiceSupabase();

  // Ověř, že volající je vlastníkem tohoto člena
  const { data: tm } = await admin
    .from('team_members')
    .select('owner_id, member_user_id')
    .eq('owner_id', user.id)
    .eq('member_user_id', memberUserId)
    .eq('status', 'aktivni')
    .single();

  if (!tm) {
    return NextResponse.json({ error: 'Člen nebyl nalezen nebo nemáte oprávnění.' }, { status: 403 });
  }

  try {
    // SMTP admina
    const { data: emailSettings } = await admin
      .from('email_settings').select('*').eq('user_id', user.id).single();
    if (!emailSettings) {
      return NextResponse.json({ error: 'Nemáte nastavený odchozí e-mail. Přejděte do Nastavení → E-mail.' }, { status: 422 });
    }

    // Info o adminovi a členovi
    const [{ data: adminAuth }, { data: memberAuth }] = await Promise.all([
      admin.auth.admin.getUserById(user.id),
      admin.auth.admin.getUserById(memberUserId),
    ]);

    const adminEmail  = adminAuth.user?.email;
    const memberEmail = memberAuth.user?.email ?? '';
    const memberName  = memberAuth.user?.user_metadata?.full_name
      ?? memberEmail.split('@')[0]
      ?? 'Člen týmu';
    if (!adminEmail) return NextResponse.json({ error: 'Nepodařilo se načíst e-mail admina.' }, { status: 500 });

    // Aktuální měsíc (od 1. do dneška)
    const now = new Date();
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const periodEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));

    // Fáze pipeline
    const { data: stages } = await admin
      .from('pipeline_stages').select('id, nazev, barva, poradi')
      .eq('user_id', user.id).order('poradi');

    // Všechny zakázky přiřazené členovi
    const { data: allDeals } = await admin
      .from('deals')
      .select('id, nazev, hodnota, stage_id, datum_uzavreni, pravdepodobnost, contacts(jmeno, prijmeni, firma)')
      .eq('user_id', user.id)
      .eq('assigned_to', memberUserId);

    // Nové zakázky v tomto měsíci
    const { data: newThisMonth } = await admin
      .from('deals')
      .select('id')
      .eq('user_id', user.id)
      .eq('assigned_to', memberUserId)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString());

    const stageMap = Object.fromEntries((stages ?? []).map(s => [s.id, s]));
    const wonStageIds  = (stages ?? []).filter(s => /vyhráno|vyhrano/i.test(s.nazev)).map(s => s.id);
    const lostStageIds = (stages ?? []).filter(s => /prohr/i.test(s.nazev)).map(s => s.id);

    const deals = allDeals ?? [];
    const wonDeals    = deals.filter(d => wonStageIds.includes(d.stage_id));
    const lostDeals   = deals.filter(d => lostStageIds.includes(d.stage_id));
    const activeDeals = deals.filter(d => !wonStageIds.includes(d.stage_id) && !lostStageIds.includes(d.stage_id));

    const wonValue   = wonDeals.reduce((s, d) => s + (d.hodnota ?? 0), 0);
    const totalValue = activeDeals.reduce((s, d) => s + (d.hodnota ?? 0), 0);

    const stageCounts: Record<string, number> = {};
    for (const d of activeDeals) {
      if (d.stage_id) stageCounts[d.stage_id] = (stageCounts[d.stage_id] ?? 0) + 1;
    }
    const maxCount = Math.max(1, ...Object.values(stageCounts));

    const html = buildMonthlyReportHtml({
      memberName, memberEmail, adminEmail,
      periodStart, periodEnd,
      stages: stages ?? [],
      deals, wonDeals, lostDeals, activeDeals,
      wonValue, totalValue,
      newThisMonthCount: newThisMonth?.length ?? 0,
      stageCounts, maxCount, stageMap,
      isOnDemand: true,
    });

    const transporter = nodemailer.createTransport({
      host: emailSettings.smtp_host,
      port: emailSettings.smtp_port,
      secure: emailSettings.smtp_secure,
      auth: { user: emailSettings.smtp_user, pass: decryptPassword(emailSettings.smtp_password) },
    });

    const monthLabel = periodStart.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric', timeZone: 'UTC' });

    await transporter.sendMail({
      from: `"MujCRM výkaz" <${emailSettings.smtp_user}>`,
      to: adminEmail,
      subject: `Výkaz na vyžádání: ${memberName} – ${monthLabel}`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Nepodařilo se odeslat výkaz.' },
      { status: 500 }
    );
  }
}
