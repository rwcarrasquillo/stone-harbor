-- Stone Harbor / The Long Light — consumer_003_user_tables_consumer
-- Applied: 2026-06-04 via Supabase MCP apply_migration
-- Phase 2 (consumer-aware data layer) — Migration 3 of 3 (additive pass).
-- Plan: stone-harbor-docs/The_Long_Light_Phase_2_Plan.md §2.3
--
-- Denormalizes the consumer discriminator onto every user-owned table that
-- Long Light will eventually write (design decision D2: store consumer
-- LOCALLY rather than deriving via a join to profiles, so RLS predicates and
-- Eidos scoring writes never need a profile lookup). Every existing row is
-- Stone Harbor data — the NOT NULL DEFAULT 'stone_harbor' backfills them at
-- column-add time (constant default = metadata-only, no rewrite).
--
-- Tables (all have a user_id uuid owner column today; none had a consumer
-- column before this migration):
--   journal_entries, eidos_sessions, eidos_responses,
--   eidos_layer_scores, eidos_chapters, eidos_safety_events
--
-- Child tables (e.g. eidos_responses, eidos_layer_scores) carry consumer
-- locally even though it is functionally implied by their parent session;
-- a parent/child consistency CHECK is deferred (plan §2.3) — for the POC the
-- application stamps consumer on insert. No FKs are touched here; adding a
-- column cannot orphan existing rows.
--
-- Scope note: the original execution instruction listed table names
-- (vent_sessions, story_invitations, telemetry, page_views) that do NOT
-- exist in the live schema. The closest real tables (member_story_invitations,
-- member_page_views) are Stone-Harbor community/analytics tables and are NOT
-- in plan §2.3, so they are intentionally OUT OF SCOPE for this pass. This
-- migration follows the plan's verified six-table list.

alter table public.journal_entries
  add column if not exists consumer text not null default 'stone_harbor'
  check (consumer in ('stone_harbor', 'long_light'));
create index if not exists journal_entries_consumer_idx
  on public.journal_entries (consumer);
comment on column public.journal_entries.consumer is
  'Tenant discriminator (denormalized from profiles.consumer). Stamped by the app on insert; defaults to stone_harbor.';

alter table public.eidos_sessions
  add column if not exists consumer text not null default 'stone_harbor'
  check (consumer in ('stone_harbor', 'long_light'));
create index if not exists eidos_sessions_consumer_idx
  on public.eidos_sessions (consumer);
comment on column public.eidos_sessions.consumer is
  'Tenant discriminator (denormalized from profiles.consumer). Stamped by the app on insert; defaults to stone_harbor.';

alter table public.eidos_responses
  add column if not exists consumer text not null default 'stone_harbor'
  check (consumer in ('stone_harbor', 'long_light'));
create index if not exists eidos_responses_consumer_idx
  on public.eidos_responses (consumer);
comment on column public.eidos_responses.consumer is
  'Tenant discriminator (denormalized from profiles.consumer). Stamped by the app on insert; defaults to stone_harbor.';

alter table public.eidos_layer_scores
  add column if not exists consumer text not null default 'stone_harbor'
  check (consumer in ('stone_harbor', 'long_light'));
create index if not exists eidos_layer_scores_consumer_idx
  on public.eidos_layer_scores (consumer);
comment on column public.eidos_layer_scores.consumer is
  'Tenant discriminator (denormalized from profiles.consumer). Stamped by the app on insert; defaults to stone_harbor.';

alter table public.eidos_chapters
  add column if not exists consumer text not null default 'stone_harbor'
  check (consumer in ('stone_harbor', 'long_light'));
create index if not exists eidos_chapters_consumer_idx
  on public.eidos_chapters (consumer);
comment on column public.eidos_chapters.consumer is
  'Tenant discriminator (denormalized from profiles.consumer). Stamped by the app on insert; defaults to stone_harbor.';

alter table public.eidos_safety_events
  add column if not exists consumer text not null default 'stone_harbor'
  check (consumer in ('stone_harbor', 'long_light'));
create index if not exists eidos_safety_events_consumer_idx
  on public.eidos_safety_events (consumer);
comment on column public.eidos_safety_events.consumer is
  'Tenant discriminator (denormalized from profiles.consumer). Stamped by the app on insert; defaults to stone_harbor.';
