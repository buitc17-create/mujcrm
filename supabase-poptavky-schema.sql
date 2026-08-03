-- Nový modul "Poptávky" — evidence klientů (investor / kupující fyzická osoba),
-- co shánějí a do jaké částky. Spustit ručně v Supabase SQL editoru (projekt mujcrm).

create table if not exists poptavky (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  assigned_to uuid references auth.users(id),
  assignment_status text,
  typ text not null default 'kupujici_fo', -- 'investor' | 'kupujici_fo'
  jmeno text not null,
  prijmeni text,
  telefon text,
  email text,
  co_shani text,
  castka_do numeric,
  poznamky text,
  created_at timestamptz not null default now()
);

alter table poptavky enable row level security;

create policy "poptavky_own" on poptavky
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "team_member_poptavky" on poptavky
  for all
  using (
    user_id in (
      select team_members.owner_id from team_members
      where team_members.member_user_id = auth.uid() and team_members.status = 'aktivni'
    )
  )
  with check (
    user_id in (
      select team_members.owner_id from team_members
      where team_members.member_user_id = auth.uid() and team_members.status = 'aktivni'
    )
  );
