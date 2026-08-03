import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

function getServiceSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Vrátí, zda je přihlášený uživatel členem cizího týmu
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ isMember: false });

  const admin = getServiceSupabase();

  const { data: tm } = await admin
    .from('team_members')
    .select('id, owner_id')
    .eq('member_user_id', user.id)
    .eq('status', 'aktivni')
    .limit(1)
    .single();

  if (tm) {
    const { data: ownerProfile } = await admin.from('profiles').select('plan').eq('id', tm.owner_id).maybeSingle();
    return NextResponse.json({ isMember: true, plan: ownerProfile?.plan ?? 'free' });
  }
  const { data: ownProfile } = await admin.from('profiles').select('plan').eq('id', user.id).maybeSingle();
  return NextResponse.json({ isMember: false, plan: ownProfile?.plan ?? 'free' });
}
