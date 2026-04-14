import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { decryptPassword } from '@/lib/emailCrypto';

const MEMBER_LIMITS: Record<string, number> = {
  trial:      10,
  start:       0,
  tym:         3,
  business:   10,
  enterprise: 999,
  active:     10,
  free:        0,
};

function inviteEmailHtml(inviteUrl: string, invitedBy: string) {
  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#0a0a0a 0%,#111827 100%);padding:32px 40px;text-align:center">
    <div style="display:inline-flex;align-items:center;gap:10px">
      <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#00BFFF,#7B2FFF);display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;color:#ffffff">M</div>
      <span style="font-size:20px;font-weight:700;color:#ffffff">Muj<span style="color:#00BFFF">CRM</span></span>
    </div>
  </div>
  <div style="padding:40px">
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827">Byl jsi pozván do týmu</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6">
      <strong style="color:#111827">${invitedBy}</strong> tě pozval ke spolupráci v <strong style="color:#111827">MujCRM</strong>. Přijmi pozvánku a získej přístup ke svému pracovnímu prostoru.
    </p>
    <a href="${inviteUrl}" style="display:inline-block;background:linear-gradient(135deg,#00BFFF,#0090cc);color:#0a0a0a;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none">
      Přijmout pozvánku →
    </a>
    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.6">
      Pokud jsi pozvánku neočekával, tento email můžeš ignorovat. Odkaz vyprší za 24 hodin.
    </p>
  </div>
  <div style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center">
    <p style="margin:0;font-size:12px;color:#9ca3af">© 2025 MujCRM · Automatický email, neodpovídej na něj</p>
  </div>
</div>`;
}

async function sendViaOwnerSmtp(
  ownerUserId: string,
  toEmail: string,
  inviteUrl: string,
  invitedBy: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
) {
  const { data: settings } = await supabase
    .from('email_settings')
    .select('smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password, display_name')
    .eq('user_id', ownerUserId)
    .eq('is_verified', true)
    .maybeSingle();

  if (!settings) return false;
  const s = settings as { smtp_host: string; smtp_port: number; smtp_secure: boolean; smtp_user: string; smtp_password: string; display_name: string | null };

  try {
    const transporter = nodemailer.createTransport({
      host: s.smtp_host,
      port: s.smtp_port,
      secure: s.smtp_secure,
      auth: { user: s.smtp_user, pass: decryptPassword(s.smtp_password) },
    });
    await transporter.sendMail({
      from: `"${s.display_name || 'MujCRM'}" <${s.smtp_user}>`,
      to: toEmail,
      subject: 'Byl jsi pozván do MujCRM',
      html: inviteEmailHtml(inviteUrl, invitedBy),
    });
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 });

  const { email, name, role } = await request.json();
  if (!email?.trim()) return NextResponse.json({ error: 'Email je povinný.' }, { status: 400 });

  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single();
  const limit = MEMBER_LIMITS[profile?.plan ?? 'free'] ?? 0;

  if (limit === 0) {
    return NextResponse.json({ error: 'Tvůj tarif neumožňuje přidávat členy týmu. Upgraduj na plán Tým nebo vyšší.' }, { status: 403 });
  }

  const { count } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', user.id)
    .neq('status', 'neaktivni');

  if ((count ?? 0) >= limit) {
    return NextResponse.json({ error: `Dosáhl jsi limitu ${limit} členů pro tvůj tarif. Upgraduj pro více míst.` }, { status: 403 });
  }

  if (email.trim().toLowerCase() === user.email?.toLowerCase()) {
    return NextResponse.json({ error: 'Nemůžeš pozvat sám sebe.' }, { status: 400 });
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: memberRecord, error: memberError } = await adminClient
    .from('team_members')
    .upsert({
      owner_id: user.id,
      member_email: email.trim().toLowerCase(),
      member_name: name?.trim() || null,
      role: role || 'clen',
      status: 'pozvan',
      member_user_id: null,
    }, { onConflict: 'owner_id,member_email' })
    .select()
    .single();

  if (memberError || !memberRecord) {
    return NextResponse.json({ error: 'Nepodařilo se uložit pozvánku.' }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const ownerName = (user.user_metadata?.full_name as string) || user.email || 'MujCRM';
  const inviteData = {
    data: {
      owner_id: user.id,
      team_role: role || 'clen',
      invited_by: ownerName,
      team_member_id: memberRecord.id,
    },
    redirectTo: `${origin}/auth/accept-invite`,
  };

  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    email.trim().toLowerCase(), inviteData
  );

  if (inviteError) {
    // Při jakékoli chybě zkus generateLink jako fallback
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'invite',
      email: email.trim().toLowerCase(),
      options: { data: inviteData.data, redirectTo: inviteData.redirectTo },
    });

    if (linkData?.properties?.action_link) {
      await sendViaOwnerSmtp(user.id, email.trim().toLowerCase(), linkData.properties.action_link, ownerName, adminClient);
    } else {
      console.error('inviteUserByEmail error:', inviteError.message);
      console.error('generateLink error:', linkError?.message);
      return NextResponse.json({ error: `Nepodařilo se odeslat pozvánkový email: ${inviteError.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, member: memberRecord });
}
