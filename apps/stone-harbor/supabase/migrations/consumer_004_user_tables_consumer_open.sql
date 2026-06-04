-- Stone Harbor / The Long Light — consumer_004_user_tables_consumer_open
-- Applied: 2026-06-04 via Supabase MCP apply_migration
-- Phase 2 (consumer-aware data layer) — Migration "M3a-A" (additive pass).
-- Plan: stone-harbor-docs/The_Long_Light_Phase_2_Plan.md §2.3a (category A)
--
-- Adds the consumer discriminator to the 10 "category A" user-owned tables:
-- generic per-member infrastructure that BOTH consumers will eventually
-- write. Same shape as M3 — text NOT NULL DEFAULT 'stone_harbor', CHECK
-- (consumer IN ('stone_harbor','long_light')), + a per-table index (these
-- columns are multi-valued and will be filtered by consumer, so the index
-- is useful — unlike the pinned C tables in consumer_005).
--
-- Every existing row is Stone Harbor data, backfilled to 'stone_harbor' by
-- the constant default at column-add time (metadata-only, no rewrite).
-- The Long-Light-aware writes that populate these with 'long_light' arrive
-- with later feature phases; this migration only lays the column down.
--
-- Idempotency: ADD COLUMN IF NOT EXISTS for the column; DROP CONSTRAINT IF
-- EXISTS before ADD CONSTRAINT for the named CHECK; CREATE INDEX IF NOT
-- EXISTS for the index. Safe to replay.
--
-- Tables: notifications, terms_acceptances, profile_change_history,
--   profile_cover_images, member_acquisitions, member_page_views,
--   body_checks, member_milestones, member_warnings, content_flags

-- notifications
alter table public.notifications add column if not exists consumer text not null default 'stone_harbor';
alter table public.notifications drop constraint if exists notifications_consumer_check;
alter table public.notifications add constraint notifications_consumer_check check (consumer in ('stone_harbor', 'long_light'));
create index if not exists notifications_consumer_idx on public.notifications (consumer);
comment on column public.notifications.consumer is 'Tenant discriminator (category A: multi-consumer). Defaults to stone_harbor; stamped by the app on insert.';

-- terms_acceptances
alter table public.terms_acceptances add column if not exists consumer text not null default 'stone_harbor';
alter table public.terms_acceptances drop constraint if exists terms_acceptances_consumer_check;
alter table public.terms_acceptances add constraint terms_acceptances_consumer_check check (consumer in ('stone_harbor', 'long_light'));
create index if not exists terms_acceptances_consumer_idx on public.terms_acceptances (consumer);
comment on column public.terms_acceptances.consumer is 'Tenant discriminator (category A: multi-consumer). Defaults to stone_harbor; stamped by the app on insert.';

-- profile_change_history
alter table public.profile_change_history add column if not exists consumer text not null default 'stone_harbor';
alter table public.profile_change_history drop constraint if exists profile_change_history_consumer_check;
alter table public.profile_change_history add constraint profile_change_history_consumer_check check (consumer in ('stone_harbor', 'long_light'));
create index if not exists profile_change_history_consumer_idx on public.profile_change_history (consumer);
comment on column public.profile_change_history.consumer is 'Tenant discriminator (category A: multi-consumer). Defaults to stone_harbor; stamped by the app on insert.';

-- profile_cover_images
alter table public.profile_cover_images add column if not exists consumer text not null default 'stone_harbor';
alter table public.profile_cover_images drop constraint if exists profile_cover_images_consumer_check;
alter table public.profile_cover_images add constraint profile_cover_images_consumer_check check (consumer in ('stone_harbor', 'long_light'));
create index if not exists profile_cover_images_consumer_idx on public.profile_cover_images (consumer);
comment on column public.profile_cover_images.consumer is 'Tenant discriminator (category A: multi-consumer). Defaults to stone_harbor; stamped by the app on insert.';

-- member_acquisitions
alter table public.member_acquisitions add column if not exists consumer text not null default 'stone_harbor';
alter table public.member_acquisitions drop constraint if exists member_acquisitions_consumer_check;
alter table public.member_acquisitions add constraint member_acquisitions_consumer_check check (consumer in ('stone_harbor', 'long_light'));
create index if not exists member_acquisitions_consumer_idx on public.member_acquisitions (consumer);
comment on column public.member_acquisitions.consumer is 'Tenant discriminator (category A: multi-consumer). Defaults to stone_harbor; stamped by the app on insert.';

-- member_page_views
alter table public.member_page_views add column if not exists consumer text not null default 'stone_harbor';
alter table public.member_page_views drop constraint if exists member_page_views_consumer_check;
alter table public.member_page_views add constraint member_page_views_consumer_check check (consumer in ('stone_harbor', 'long_light'));
create index if not exists member_page_views_consumer_idx on public.member_page_views (consumer);
comment on column public.member_page_views.consumer is 'Tenant discriminator (category A: multi-consumer). Defaults to stone_harbor; stamped by the app on insert.';

-- body_checks
alter table public.body_checks add column if not exists consumer text not null default 'stone_harbor';
alter table public.body_checks drop constraint if exists body_checks_consumer_check;
alter table public.body_checks add constraint body_checks_consumer_check check (consumer in ('stone_harbor', 'long_light'));
create index if not exists body_checks_consumer_idx on public.body_checks (consumer);
comment on column public.body_checks.consumer is 'Tenant discriminator (category A: multi-consumer). Defaults to stone_harbor; stamped by the app on insert.';

-- member_milestones
alter table public.member_milestones add column if not exists consumer text not null default 'stone_harbor';
alter table public.member_milestones drop constraint if exists member_milestones_consumer_check;
alter table public.member_milestones add constraint member_milestones_consumer_check check (consumer in ('stone_harbor', 'long_light'));
create index if not exists member_milestones_consumer_idx on public.member_milestones (consumer);
comment on column public.member_milestones.consumer is 'Tenant discriminator (category A: multi-consumer). Defaults to stone_harbor; stamped by the app on insert.';

-- member_warnings
alter table public.member_warnings add column if not exists consumer text not null default 'stone_harbor';
alter table public.member_warnings drop constraint if exists member_warnings_consumer_check;
alter table public.member_warnings add constraint member_warnings_consumer_check check (consumer in ('stone_harbor', 'long_light'));
create index if not exists member_warnings_consumer_idx on public.member_warnings (consumer);
comment on column public.member_warnings.consumer is 'Tenant discriminator (category A: multi-consumer). Defaults to stone_harbor; stamped by the app on insert.';

-- content_flags
alter table public.content_flags add column if not exists consumer text not null default 'stone_harbor';
alter table public.content_flags drop constraint if exists content_flags_consumer_check;
alter table public.content_flags add constraint content_flags_consumer_check check (consumer in ('stone_harbor', 'long_light'));
create index if not exists content_flags_consumer_idx on public.content_flags (consumer);
comment on column public.content_flags.consumer is 'Tenant discriminator (category A: multi-consumer). Defaults to stone_harbor; stamped by the app on insert.';
