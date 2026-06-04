-- Stone Harbor / The Long Light — consumer_001_settings_and_gate
-- Applied: 2026-06-04 via Supabase MCP apply_migration
-- Phase 2 (consumer-aware data layer) — Migration 1 of 3 (additive pass).
-- Plan: stone-harbor-docs/The_Long_Light_Phase_2_Plan.md §2.1
--
-- Introduces a per-consumer signup gate, replacing reliance on the single
-- global app_settings.registration_open boolean. The two consumers'
-- gates (stone_harbor, long_light) are genuinely independent: toggling one
-- has no effect on the other. Both default CLOSED for this POC pass; the
-- admin_invited bypass (handled in the signup trigger, rewritten later in
-- Migration 4) still applies to both consumers.
--
-- NOTE: app_settings.registration_open is intentionally LEFT IN PLACE this
-- phase. enforce_registration_open() still reads it until the trigger
-- rewrite (Migration 4) repoints it at this table. Do NOT drop app_settings
-- here.

create table if not exists public.consumer_settings (
  consumer text primary key
    check (consumer in ('stone_harbor', 'long_light')),
  registration_open boolean not null default true,
  updated_at timestamptz not null default now()
);

comment on table public.consumer_settings is
  'Per-consumer signup gate. One row per product. registration_open is read by enforce_registration_open() after Migration 4. Gates are independent across consumers.';

-- Seed both consumers CLOSED. Stone Harbor mirrors today's
-- app_settings.registration_open = false; Long Light also starts closed
-- per plan §7-Q1 (opened only via admin_invited accounts or temporary
-- toggle windows — see plan §2.6).
insert into public.consumer_settings (consumer, registration_open)
values
  ('stone_harbor', false),
  ('long_light', false)
on conflict (consumer) do nothing;

-- RLS: mirror app_settings — public read, admin-only write. No public
-- INSERT/DELETE policies (rows are seeded by migration; service_role and
-- SECURITY DEFINER functions bypass RLS).
alter table public.consumer_settings enable row level security;

drop policy if exists consumer_settings_public_read on public.consumer_settings;
create policy consumer_settings_public_read
  on public.consumer_settings
  for select
  using (true);

drop policy if exists consumer_settings_admin_write on public.consumer_settings;
create policy consumer_settings_admin_write
  on public.consumer_settings
  for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.role = 'admin'
    )
  );
