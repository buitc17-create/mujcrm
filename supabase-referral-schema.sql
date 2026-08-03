-- Zdroj leadu "Doporučení" -> uložení údajů doporučeného (jméno, příjmení, telefon).
-- Spustit ručně v Supabase SQL editoru (projekt mujcrm).

alter table leads
  add column if not exists doporucitel_jmeno text,
  add column if not exists doporucitel_prijmeni text,
  add column if not exists doporucitel_telefon text;

alter table contacts
  add column if not exists doporucitel_jmeno text,
  add column if not exists doporucitel_prijmeni text,
  add column if not exists doporucitel_telefon text;

alter table deals
  add column if not exists doporucitel_jmeno text,
  add column if not exists doporucitel_prijmeni text,
  add column if not exists doporucitel_telefon text;
