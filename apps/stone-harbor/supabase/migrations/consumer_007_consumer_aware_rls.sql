-- Stone Harbor / The Long Light — consumer_007_consumer_aware_rls
-- Authored: 2026-06-04 (NOT YET APPLIED — author-only pass for Cowork review)
-- Phase 2 (consumer-aware data layer) — Migration "M5" (defense-in-depth RLS).
-- Plan: stone-harbor-docs/The_Long_Light_Phase_2_Plan.md §2.5
--
-- WHY RLS NOW
-- M1–M4 gave every member-owned table a `consumer` discriminator and made
-- signup stamp it. Per-user RLS (auth.uid() = owner) already prevents one user
-- from reading another user's rows. What it does NOT prevent is a *cross-
-- consumer* read on the multi-user/community surfaces: a Long Light session
-- querying, say, member_posts or profiles could otherwise see Stone Harbor
-- rows that the existing "published / community-visible" permissive policies
-- expose. This migration adds a defense-in-depth layer so that — regardless of
-- what the per-feature permissive policies allow — an authenticated session can
-- only ever see rows whose `consumer` matches the consumer of its own profile.
--
-- THE PATTERN — SECURITY DEFINER helper + RESTRICTIVE policy
--   * public.current_user_consumer() returns the consumer of the calling user's
--     profile. It is SECURITY DEFINER + STABLE + SET search_path = '' so that:
--       - it runs as the function owner, which (because profiles has RLS
--         ENABLED but not FORCED — verified pre-authoring) bypasses RLS on
--         public.profiles. This is what prevents infinite recursion when the
--         helper is itself invoked from a policy ON profiles.
--       - STABLE lets the planner evaluate it once per query (cached), not once
--         per row.
--   * Each policy is AS RESTRICTIVE. Postgres OR-combines permissive policies
--     but AND-combines restrictive ones, so a RESTRICTIVE consumer predicate
--     *narrows* whatever the existing permissive ownership/community policies
--     grant — it can never widen access. A PERMISSIVE policy here would be
--     wrong (it would be OR'd in and could expose more rows).
--   * FOR ALL TO authenticated. USING governs which existing rows are visible
--     to SELECT/UPDATE/DELETE. (Postgres also applies the USING expression as
--     the WITH CHECK for INSERT/UPDATE when WITH CHECK is omitted — see the
--     "WRITE-PATH NOTE" below; this is intentional but has an app dependency.)
--
-- WRITE-PATH NOTE (flagged for review)
-- Because these are FOR ALL with an implicit WITH CHECK, an authenticated
-- INSERT/UPDATE must produce a row whose consumer equals the caller's
-- current_user_consumer(). Today that is safe:
--   * SH users: the profiles.consumer is 'stone_harbor' and every member table's
--     consumer column DEFAULTS to 'stone_harbor', so a default insert satisfies
--     the check.
--   * LL users: there are none doing app-level inserts yet, and the LL write-
--     side work (stamping consumer='long_light' on inserts) is still pending
--     (the SH leak-audit / LL write PRs). Once LL users write app rows, the app
--     MUST stamp consumer explicitly, or the column default ('stone_harbor')
--     would fail this check for an LL session.
--   * Trigger/server writes: handle_new_user() (SECURITY DEFINER) and any
--     service_role writes bypass RLS, so they are unaffected.
-- If Cowork prefers read-only isolation for this pass, narrow each policy from
-- FOR ALL to FOR SELECT — that removes the write-path dependency entirely.
--
-- ANON / PUBLIC READ NOTE (flagged for review)
-- These policies are TO authenticated, matching the plan's member-facing scope.
-- Any permissive policy that exposes rows to anon/public (e.g. a published-blog
-- read path) is NOT narrowed by an authenticated-scoped restrictive policy.
-- That is acceptable for the POC (LL has no public blog yet; SH's public blog is
-- SH content), but if a public LL surface ever ships, the anon read path needs
-- its own consumer handling.
--
-- EXCEPTIONS / SPECIAL CASES
--   * eidos_safety_events — INTENTIONALLY NOT given a consumer_isolation policy.
--     Per plan §2.5 it stays service-role-only: RLS is enabled with ZERO
--     member-facing policies (verified: policy_count = 0), so no client session
--     can read it at all. Its consumer column (added in M3) exists purely for
--     server-side analytics filtering. Adding a member-facing policy here would
--     *open* a table that is meant to stay closed — so it is omitted by design.
--   * brotherhood_pairings — has two FK columns (no single owner column); its
--     existing policies use an OR pattern over the two member columns. The
--     consumer_isolation policy is additive and, because brotherhood_pairings
--     is a category-C table pinned to consumer='stone_harbor', it is a no-op for
--     LL sessions (their current_user_consumer()='long_light' matches no row)
--     and a redundant-but-safe check for SH sessions. Acceptable.
--   * profiles — gets the policy too, so a session can only read profiles within
--     its own consumer. (The only profile today is Rafael's, in stone_harbor;
--     this correctly blocks any future LL session from reading it cross-consumer.)
--
-- POLICY COUNT: 28
--   profiles (1) + 5 §2.3 B-tables [journal_entries, eidos_sessions,
--   eidos_responses, eidos_layer_scores, eidos_chapters — eidos_safety_events
--   EXCLUDED] + 10 consumer_004 A-tables + 12 consumer_005 C-tables = 28.
--
-- IDEMPOTENCY
-- Postgres has no CREATE POLICY IF NOT EXISTS, so each policy is
-- DROP POLICY IF EXISTS <name> ON <table>; CREATE POLICY <name> ...
-- The helper uses CREATE OR REPLACE FUNCTION. Safe to replay.

-- ===========================================================================
-- Helper function
-- ===========================================================================
create or replace function public.current_user_consumer()
  returns text
  language sql
  stable
  security definer
  set search_path = ''
as $function$
  select consumer
    from public.profiles
   where id = (select auth.uid());
$function$;

comment on function public.current_user_consumer() is
  'Returns the consumer of the authenticated user''s profile. SECURITY DEFINER + STABLE so RLS policies can call it once per query without recursing on profiles (profiles RLS is enabled-not-forced, so the owner-context SELECT bypasses it). Used by the *_consumer_isolation defense-in-depth policies (Phase 2 M5).';

grant execute on function public.current_user_consumer() to anon, authenticated;

-- ===========================================================================
-- profiles (M2)
-- ===========================================================================
drop policy if exists "profiles_consumer_isolation" on public.profiles;
create policy "profiles_consumer_isolation"
  on public.profiles
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

-- ===========================================================================
-- §2.3 B-tables (eidos_safety_events intentionally excluded — see header)
-- ===========================================================================
drop policy if exists "journal_entries_consumer_isolation" on public.journal_entries;
create policy "journal_entries_consumer_isolation"
  on public.journal_entries
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

drop policy if exists "eidos_sessions_consumer_isolation" on public.eidos_sessions;
create policy "eidos_sessions_consumer_isolation"
  on public.eidos_sessions
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

drop policy if exists "eidos_responses_consumer_isolation" on public.eidos_responses;
create policy "eidos_responses_consumer_isolation"
  on public.eidos_responses
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

drop policy if exists "eidos_layer_scores_consumer_isolation" on public.eidos_layer_scores;
create policy "eidos_layer_scores_consumer_isolation"
  on public.eidos_layer_scores
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

drop policy if exists "eidos_chapters_consumer_isolation" on public.eidos_chapters;
create policy "eidos_chapters_consumer_isolation"
  on public.eidos_chapters
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

-- ===========================================================================
-- consumer_004 A-tables (multi-consumer)
-- ===========================================================================
drop policy if exists "notifications_consumer_isolation" on public.notifications;
create policy "notifications_consumer_isolation"
  on public.notifications
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

drop policy if exists "terms_acceptances_consumer_isolation" on public.terms_acceptances;
create policy "terms_acceptances_consumer_isolation"
  on public.terms_acceptances
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

drop policy if exists "profile_change_history_consumer_isolation" on public.profile_change_history;
create policy "profile_change_history_consumer_isolation"
  on public.profile_change_history
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

drop policy if exists "profile_cover_images_consumer_isolation" on public.profile_cover_images;
create policy "profile_cover_images_consumer_isolation"
  on public.profile_cover_images
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

drop policy if exists "member_acquisitions_consumer_isolation" on public.member_acquisitions;
create policy "member_acquisitions_consumer_isolation"
  on public.member_acquisitions
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

drop policy if exists "member_page_views_consumer_isolation" on public.member_page_views;
create policy "member_page_views_consumer_isolation"
  on public.member_page_views
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

drop policy if exists "body_checks_consumer_isolation" on public.body_checks;
create policy "body_checks_consumer_isolation"
  on public.body_checks
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

drop policy if exists "member_milestones_consumer_isolation" on public.member_milestones;
create policy "member_milestones_consumer_isolation"
  on public.member_milestones
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

drop policy if exists "member_warnings_consumer_isolation" on public.member_warnings;
create policy "member_warnings_consumer_isolation"
  on public.member_warnings
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

drop policy if exists "content_flags_consumer_isolation" on public.content_flags;
create policy "content_flags_consumer_isolation"
  on public.content_flags
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

-- ===========================================================================
-- consumer_005 C-tables (Stone-Harbor-pinned)
-- ===========================================================================
drop policy if exists "brotherhood_pairing_requests_consumer_isolation" on public.brotherhood_pairing_requests;
create policy "brotherhood_pairing_requests_consumer_isolation"
  on public.brotherhood_pairing_requests
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

drop policy if exists "brotherhood_pairings_consumer_isolation" on public.brotherhood_pairings;
create policy "brotherhood_pairings_consumer_isolation"
  on public.brotherhood_pairings
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

drop policy if exists "member_story_invitations_consumer_isolation" on public.member_story_invitations;
create policy "member_story_invitations_consumer_isolation"
  on public.member_story_invitations
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

drop policy if exists "member_posts_consumer_isolation" on public.member_posts;
create policy "member_posts_consumer_isolation"
  on public.member_posts
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

drop policy if exists "post_solidarity_consumer_isolation" on public.post_solidarity;
create policy "post_solidarity_consumer_isolation"
  on public.post_solidarity
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

drop policy if exists "blog_posts_consumer_isolation" on public.blog_posts;
create policy "blog_posts_consumer_isolation"
  on public.blog_posts
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

drop policy if exists "blog_comments_consumer_isolation" on public.blog_comments;
create policy "blog_comments_consumer_isolation"
  on public.blog_comments
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

drop policy if exists "conversations_consumer_isolation" on public.conversations;
create policy "conversations_consumer_isolation"
  on public.conversations
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

drop policy if exists "conversation_members_consumer_isolation" on public.conversation_members;
create policy "conversation_members_consumer_isolation"
  on public.conversation_members
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

drop policy if exists "messages_consumer_isolation" on public.messages;
create policy "messages_consumer_isolation"
  on public.messages
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

drop policy if exists "user_roadmap_progress_consumer_isolation" on public.user_roadmap_progress;
create policy "user_roadmap_progress_consumer_isolation"
  on public.user_roadmap_progress
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

drop policy if exists "user_small_things_consumer_isolation" on public.user_small_things;
create policy "user_small_things_consumer_isolation"
  on public.user_small_things
  as restrictive
  for all
  to authenticated
  using (consumer = public.current_user_consumer());

-- eidos_safety_events: NO POLICY ADDED — service-role-only by design (see header).
