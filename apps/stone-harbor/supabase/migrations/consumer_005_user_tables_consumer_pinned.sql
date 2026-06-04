-- Stone Harbor / The Long Light — consumer_005_user_tables_consumer_pinned
-- Applied: 2026-06-04 via Supabase MCP apply_migration
-- Phase 2 (consumer-aware data layer) — Migration "M3a-C" (additive pass).
-- Plan: stone-harbor-docs/The_Long_Light_Phase_2_Plan.md §2.3a (category C)
--
-- Adds the consumer discriminator to the 12 "category C" user-owned tables:
-- Stone-Harbor-only-by-design surfaces (the brotherhood pairing system, the
-- community feed, blog, direct messaging, and the SH roadmap/small-things
-- progress trackers). The Long Light is NOT planned to write these — its
-- community/editorial surfaces are a separate later build — so the CHECK is
-- PINNED to a single value: consumer = 'stone_harbor'. This is a guardrail,
-- not a multi-tenant column: any attempt to stamp a 'long_light' row here
-- raises a check_violation, surfacing the mistake at write time rather than
-- silently leaking a Long Light row into a Stone Harbor surface.
--
-- Difference from consumer_004 (category A):
--   * CHECK is (consumer = 'stone_harbor'), NOT (consumer IN (...both)).
--   * NO per-table index. The column is single-valued for the foreseeable
--     future, so an index on it is non-selective dead weight. (The A tables
--     in consumer_004 get an index because they are genuinely multi-valued
--     and will be filtered by consumer.) If Long Light ever does grow one of
--     these surfaces, the follow-up migration would relax the CHECK to IN
--     (...) and add the index then.
--
-- Every existing row is Stone Harbor data, backfilled to 'stone_harbor' by
-- the constant default at column-add time (metadata-only, no rewrite).
--
-- Idempotency: ADD COLUMN IF NOT EXISTS for the column; DROP CONSTRAINT IF
-- EXISTS before ADD CONSTRAINT for the named CHECK. Safe to replay.
--
-- Tables: brotherhood_pairing_requests, brotherhood_pairings,
--   member_story_invitations, member_posts, post_solidarity, blog_posts,
--   blog_comments, conversations, conversation_members, messages,
--   user_roadmap_progress, user_small_things

-- brotherhood_pairing_requests
alter table public.brotherhood_pairing_requests add column if not exists consumer text not null default 'stone_harbor';
alter table public.brotherhood_pairing_requests drop constraint if exists brotherhood_pairing_requests_consumer_check;
alter table public.brotherhood_pairing_requests add constraint brotherhood_pairing_requests_consumer_check check (consumer = 'stone_harbor');
comment on column public.brotherhood_pairing_requests.consumer is 'Tenant discriminator (category C: Stone-Harbor-only). Pinned by CHECK to stone_harbor; a long_light write raises check_violation.';

-- brotherhood_pairings
alter table public.brotherhood_pairings add column if not exists consumer text not null default 'stone_harbor';
alter table public.brotherhood_pairings drop constraint if exists brotherhood_pairings_consumer_check;
alter table public.brotherhood_pairings add constraint brotherhood_pairings_consumer_check check (consumer = 'stone_harbor');
comment on column public.brotherhood_pairings.consumer is 'Tenant discriminator (category C: Stone-Harbor-only). Pinned by CHECK to stone_harbor; a long_light write raises check_violation.';

-- member_story_invitations
alter table public.member_story_invitations add column if not exists consumer text not null default 'stone_harbor';
alter table public.member_story_invitations drop constraint if exists member_story_invitations_consumer_check;
alter table public.member_story_invitations add constraint member_story_invitations_consumer_check check (consumer = 'stone_harbor');
comment on column public.member_story_invitations.consumer is 'Tenant discriminator (category C: Stone-Harbor-only). Pinned by CHECK to stone_harbor; a long_light write raises check_violation.';

-- member_posts
alter table public.member_posts add column if not exists consumer text not null default 'stone_harbor';
alter table public.member_posts drop constraint if exists member_posts_consumer_check;
alter table public.member_posts add constraint member_posts_consumer_check check (consumer = 'stone_harbor');
comment on column public.member_posts.consumer is 'Tenant discriminator (category C: Stone-Harbor-only). Pinned by CHECK to stone_harbor; a long_light write raises check_violation.';

-- post_solidarity
alter table public.post_solidarity add column if not exists consumer text not null default 'stone_harbor';
alter table public.post_solidarity drop constraint if exists post_solidarity_consumer_check;
alter table public.post_solidarity add constraint post_solidarity_consumer_check check (consumer = 'stone_harbor');
comment on column public.post_solidarity.consumer is 'Tenant discriminator (category C: Stone-Harbor-only). Pinned by CHECK to stone_harbor; a long_light write raises check_violation.';

-- blog_posts
alter table public.blog_posts add column if not exists consumer text not null default 'stone_harbor';
alter table public.blog_posts drop constraint if exists blog_posts_consumer_check;
alter table public.blog_posts add constraint blog_posts_consumer_check check (consumer = 'stone_harbor');
comment on column public.blog_posts.consumer is 'Tenant discriminator (category C: Stone-Harbor-only). Pinned by CHECK to stone_harbor; a long_light write raises check_violation.';

-- blog_comments
alter table public.blog_comments add column if not exists consumer text not null default 'stone_harbor';
alter table public.blog_comments drop constraint if exists blog_comments_consumer_check;
alter table public.blog_comments add constraint blog_comments_consumer_check check (consumer = 'stone_harbor');
comment on column public.blog_comments.consumer is 'Tenant discriminator (category C: Stone-Harbor-only). Pinned by CHECK to stone_harbor; a long_light write raises check_violation.';

-- conversations
alter table public.conversations add column if not exists consumer text not null default 'stone_harbor';
alter table public.conversations drop constraint if exists conversations_consumer_check;
alter table public.conversations add constraint conversations_consumer_check check (consumer = 'stone_harbor');
comment on column public.conversations.consumer is 'Tenant discriminator (category C: Stone-Harbor-only). Pinned by CHECK to stone_harbor; a long_light write raises check_violation.';

-- conversation_members
alter table public.conversation_members add column if not exists consumer text not null default 'stone_harbor';
alter table public.conversation_members drop constraint if exists conversation_members_consumer_check;
alter table public.conversation_members add constraint conversation_members_consumer_check check (consumer = 'stone_harbor');
comment on column public.conversation_members.consumer is 'Tenant discriminator (category C: Stone-Harbor-only). Pinned by CHECK to stone_harbor; a long_light write raises check_violation.';

-- messages
alter table public.messages add column if not exists consumer text not null default 'stone_harbor';
alter table public.messages drop constraint if exists messages_consumer_check;
alter table public.messages add constraint messages_consumer_check check (consumer = 'stone_harbor');
comment on column public.messages.consumer is 'Tenant discriminator (category C: Stone-Harbor-only). Pinned by CHECK to stone_harbor; a long_light write raises check_violation.';

-- user_roadmap_progress
alter table public.user_roadmap_progress add column if not exists consumer text not null default 'stone_harbor';
alter table public.user_roadmap_progress drop constraint if exists user_roadmap_progress_consumer_check;
alter table public.user_roadmap_progress add constraint user_roadmap_progress_consumer_check check (consumer = 'stone_harbor');
comment on column public.user_roadmap_progress.consumer is 'Tenant discriminator (category C: Stone-Harbor-only). Pinned by CHECK to stone_harbor; a long_light write raises check_violation.';

-- user_small_things
alter table public.user_small_things add column if not exists consumer text not null default 'stone_harbor';
alter table public.user_small_things drop constraint if exists user_small_things_consumer_check;
alter table public.user_small_things add constraint user_small_things_consumer_check check (consumer = 'stone_harbor');
comment on column public.user_small_things.consumer is 'Tenant discriminator (category C: Stone-Harbor-only). Pinned by CHECK to stone_harbor; a long_light write raises check_violation.';
