-- Stone Harbor / The Long Light — consumer_002_profiles_consumer
-- Applied: 2026-06-04 via Supabase MCP apply_migration
-- Phase 2 (consumer-aware data layer) — Migration 2 of 3 (additive pass).
-- Plan: stone-harbor-docs/The_Long_Light_Phase_2_Plan.md §2.2
--
-- Adds the tenant discriminator to profiles. Every existing row is Stone
-- Harbor data, so the NOT NULL DEFAULT 'stone_harbor' backfills them
-- correctly at column-add time (constant default = metadata-only, no table
-- rewrite). The Long-Light-aware signup trigger (Migration 4) will stamp
-- new rows with the correct consumer from auth metadata.
--
-- NOTE: No healing_stage CHECK change is made here. The live
-- profiles_healing_stage_check already permits NULL
-- (healing_stage IS NULL OR lower(healing_stage) = ANY ('clarity','calm',
-- 'strength')), so the "Long Light gets healing_stage = NULL" decision
-- (plan §7-Q2) needs only the trigger branch in Migration 4 — no constraint
-- migration. The SH stage vocabulary is unchanged in Phase 2.

alter table public.profiles
  add column if not exists consumer text not null default 'stone_harbor'
  check (consumer in ('stone_harbor', 'long_light'));

create index if not exists profiles_consumer_idx
  on public.profiles (consumer);

comment on column public.profiles.consumer is
  'Tenant discriminator: which product this profile belongs to. Source of truth for consumer scoping. Stamped at signup by handle_new_user() from auth metadata (Migration 4); defaults to stone_harbor.';
