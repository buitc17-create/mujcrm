-- Studená e-mailová kampaň pro databázi makléřů (nabídka vyzkoušení MujCRM).
-- Spustit ručně v Supabase SQL editoru (projekt mujcrm).

create table if not exists outreach_recipients (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  jmeno text,
  firma text,
  status text not null default 'pending', -- 'pending' | 'sent' | 'failed' | 'unsubscribed'
  sent_at timestamptz,
  error text,
  unsubscribe_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create index if not exists outreach_recipients_status_idx on outreach_recipients (status);

alter table outreach_recipients enable row level security;
-- Žádné RLS politiky — přístup jen přes service-role admin klienta v /api/admin/outreach a /api/outreach routách.
