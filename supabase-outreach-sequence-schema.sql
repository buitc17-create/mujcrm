-- Rozšíření outreach kampaně o navazující sekvenci (den 5, den 12 po prvním e-mailu).
-- Spustit ručně v Supabase SQL editoru (projekt mujcrm) — outreach_recipients tabulka už existuje.

alter table outreach_recipients
  add column if not exists sequence_step integer not null default 0,
  add column if not exists first_sent_at timestamptz;
-- sequence_step: 0 = nic neodesláno, 1 = odeslán úvodní e-mail, 2 = odeslána 1. připomínka (den 5), 3 = odeslána 2. připomínka (den 12)
-- first_sent_at: kdy šel úvodní e-mail — od tohoto data se počítá odstup pro připomínky (ne od posledního odeslání)
-- status navíc může nabývat hodnoty 'converted' (mezitím se zaregistroval v MujCRM, sekvence se automaticky zastaví)
