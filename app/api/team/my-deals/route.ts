import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

function getServiceSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Vrátí kombinovaná data člena: vlastní + přiřazené adminem
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getServiceSupabase();

  // Najdi admina tohoto člena
  const { data: tm } = await admin
    .from('team_members')
    .select('owner_id')
    .eq('member_user_id', user.id)
    .eq('status', 'aktivni')
    .limit(1)
    .single();

  const ownerId = tm?.owner_id ?? null;

  // Vlastní zakázky člena + zakázky přiřazené adminem paralelně
  const [{ data: ownDeals }, { data: assignedDeals }, { data: ownLeads }, { data: ownActivities }] = await Promise.all([
    admin
      .from('deals')
      .select('id, nazev, hodnota, pravdepodobnost, stage_id, datum_uzavreni, contacts(jmeno, prijmeni)')
      .eq('user_id', user.id),
    ownerId
      ? admin
          .from('deals')
          .select('id, nazev, hodnota, pravdepodobnost, stage_id, datum_uzavreni, contacts(jmeno, prijmeni)')
          .eq('user_id', ownerId)
          .eq('assigned_to', user.id)
      : Promise.resolve({ data: [] }),
    admin.from('leads').select('id, zdroj, konvertovan, lead_status_id, created_at').eq('user_id', user.id),
    admin.from('activities').select('id, typ, datum').eq('user_id', user.id).order('datum', { ascending: false }),
  ]);

  // Deduplikace — pokud je zakázka přiřazena a zároveň je user_id = member, nesmí být dvakrát
  const ownIds = new Set((ownDeals ?? []).map((d: { id: string }) => d.id));
  const uniqueAssigned = (assignedDeals ?? []).filter((d: { id: string }) => !ownIds.has(d.id));
  const allDeals = [...(ownDeals ?? []), ...uniqueAssigned];

  // Pokud je člen, musíme také stage data admina (pro správnou detekci Vyhráno/Prohráno)
  const stagesUserId = ownerId ?? user.id;
  const { data: stages } = await admin
    .from('pipeline_stages')
    .select('id, nazev, barva')
    .eq('user_id', stagesUserId)
    .order('poradi');

  return NextResponse.json({
    deals: allDeals,
    leads: ownLeads ?? [],
    activities: ownActivities ?? [],
    stages: stages ?? [],
  });
}
