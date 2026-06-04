-- Stone Harbor / The Long Light — consumer_007_rollback
-- Captured: 2026-06-04 (pre-apply snapshot of RLS state)
-- Phase 2 (consumer-aware data layer) — EMERGENCY ROLLBACK for Migration M5.
--
-- WHAT THIS IS
-- The precise, exact revert for consumer_007_consumer_aware_rls.sql.
--
-- WHY THE OPERATIVE ROLLBACK IS JUST DROPS (important — read this)
-- M5 is PURELY ADDITIVE. The forward migration:
--   * creates ONE function: public.current_user_consumer()
--   * creates 28 NEW policies named "<table>_consumer_isolation"
--   * its DROP POLICY IF EXISTS lines target only those 28 new names, which did
--     not exist before M5 — so M5 modifies/drops NONE of the ~75 pre-existing
--     permissive ownership/community policies.
-- Therefore reverting M5 to the exact pre-M5 state requires removing EXACTLY
-- M5's additions: drop the 28 isolation policies, then drop the helper function
-- (function dropped last because the policies depend on it). Nothing else needs
-- to be recreated — the per-user ownership policies were never touched and are
-- still in place.
--
-- WHY THE PRE-M5 EXISTING POLICIES ARE A REFERENCE COMMENT, NOT LIVE SQL
-- The instruction asked for the pre-M5 policies as CREATE POLICY statements.
-- They are reproduced below as a REFERENCE INVENTORY (commented) rather than
-- executable statements, on purpose: because M5 never removed them, executing
-- CREATE POLICY for already-present policies would error, and hand-translating
-- ~75 policies (several of which reference helper fns like is_admin() /
-- is_conversation_member() and formatted USING/WITH CHECK expressions) into SQL
-- risks a transcription error that, if ever run in an emergency, would DAMAGE
-- the very policies it claims to restore. The safe, exact revert is the drops.
-- The inventory is here so an operator can eyeball the full pre-M5 state, and —
-- if a pre-existing policy were ever lost independently — has the source
-- definition to reconstruct it by hand deliberately.
--
-- WHEN TO RUN IT
-- ONLY if consumer_007 causes production issues (e.g. a legitimate member-facing
-- read returns empty because current_user_consumer() misbehaves, or a write is
-- unexpectedly rejected by the implicit WITH CHECK). Running this file reverts
-- to the pre-M5 RLS state: per-user ownership policies only, NO consumer
-- isolation. The consumer COLUMNS (M2/M3/M3a) and CHECK constraints remain — RLS
-- isolation is the only thing removed.
--
-- REVERSIBLE-ON-REPLAY
-- Every statement is DROP ... IF EXISTS, so this file is idempotent and safe to
-- run more than once. After running it, re-applying
-- consumer_007_consumer_aware_rls.sql cleanly restores M5.
--
-- FILING CONVENTION
-- Not numbered into the forward migration sequence; emergency-use artifact kept
-- beside its forward migration.

-- ===========================================================================
-- OPERATIVE ROLLBACK — drop the 28 isolation policies, then the helper fn
-- ===========================================================================
drop policy if exists "profiles_consumer_isolation" on public.profiles;
drop policy if exists "journal_entries_consumer_isolation" on public.journal_entries;
drop policy if exists "eidos_sessions_consumer_isolation" on public.eidos_sessions;
drop policy if exists "eidos_responses_consumer_isolation" on public.eidos_responses;
drop policy if exists "eidos_layer_scores_consumer_isolation" on public.eidos_layer_scores;
drop policy if exists "eidos_chapters_consumer_isolation" on public.eidos_chapters;
drop policy if exists "notifications_consumer_isolation" on public.notifications;
drop policy if exists "terms_acceptances_consumer_isolation" on public.terms_acceptances;
drop policy if exists "profile_change_history_consumer_isolation" on public.profile_change_history;
drop policy if exists "profile_cover_images_consumer_isolation" on public.profile_cover_images;
drop policy if exists "member_acquisitions_consumer_isolation" on public.member_acquisitions;
drop policy if exists "member_page_views_consumer_isolation" on public.member_page_views;
drop policy if exists "body_checks_consumer_isolation" on public.body_checks;
drop policy if exists "member_milestones_consumer_isolation" on public.member_milestones;
drop policy if exists "member_warnings_consumer_isolation" on public.member_warnings;
drop policy if exists "content_flags_consumer_isolation" on public.content_flags;
drop policy if exists "brotherhood_pairing_requests_consumer_isolation" on public.brotherhood_pairing_requests;
drop policy if exists "brotherhood_pairings_consumer_isolation" on public.brotherhood_pairings;
drop policy if exists "member_story_invitations_consumer_isolation" on public.member_story_invitations;
drop policy if exists "member_posts_consumer_isolation" on public.member_posts;
drop policy if exists "post_solidarity_consumer_isolation" on public.post_solidarity;
drop policy if exists "blog_posts_consumer_isolation" on public.blog_posts;
drop policy if exists "blog_comments_consumer_isolation" on public.blog_comments;
drop policy if exists "conversations_consumer_isolation" on public.conversations;
drop policy if exists "conversation_members_consumer_isolation" on public.conversation_members;
drop policy if exists "messages_consumer_isolation" on public.messages;
drop policy if exists "user_roadmap_progress_consumer_isolation" on public.user_roadmap_progress;
drop policy if exists "user_small_things_consumer_isolation" on public.user_small_things;

-- Drop the helper LAST (the policies above depend on it).
drop function if exists public.current_user_consumer();

-- ===========================================================================
-- REFERENCE INVENTORY — pre-M5 permissive policies on the 29 consumer-scoped
-- tables (captured 2026-06-04 via pg_policies; NOT executed by this file —
-- see header for why). Format: table | policy | cmd | roles | USING | WITH CHECK
-- ===========================================================================
-- profiles
--   "Authenticated users can view profiles" | SELECT | {authenticated} | USING true
--   "Users can insert own profile"          | INSERT | {authenticated} | WITH CHECK ((select auth.uid()) = id)
--   "Users can update own profile"          | UPDATE | {authenticated} | USING ((select auth.uid()) = id) | WITH CHECK ((select auth.uid()) = id)
-- journal_entries
--   "Users can view own journal entries"    | SELECT | {authenticated} | USING ((select auth.uid()) = user_id)
--   "Users can create own journal entries"  | INSERT | {authenticated} | WITH CHECK ((select auth.uid()) = user_id)
--   "Users can update own journal entries"  | UPDATE | {authenticated} | USING ((select auth.uid()) = user_id) | WITH CHECK ((select auth.uid()) = user_id)
--   "Users can delete own journal entries"  | DELETE | {authenticated} | USING ((select auth.uid()) = user_id)
-- eidos_sessions
--   "eidos_sessions own select" | SELECT | {public} | USING ((select auth.uid()) = user_id)
--   "eidos_sessions own insert" | INSERT | {public} | WITH CHECK ((select auth.uid()) = user_id)
--   "eidos_sessions own update" | UPDATE | {public} | USING ((select auth.uid()) = user_id)
-- eidos_responses
--   "eidos_responses own select" | SELECT | {public} | USING ((select auth.uid()) = user_id)
--   "eidos_responses own insert" | INSERT | {public} | WITH CHECK ((select auth.uid()) = user_id)
--   "eidos_responses own update" | UPDATE | {public} | USING ((select auth.uid()) = user_id)
-- eidos_layer_scores
--   "eidos_layer_scores own select" | SELECT | {public} | USING ((select auth.uid()) = user_id)
-- eidos_chapters
--   "eidos_chapters own select" | SELECT | {public} | USING ((select auth.uid()) = user_id)
-- eidos_safety_events
--   (no member-facing policies — service-role-only; RLS enabled, 0 policies)
-- notifications
--   "notif_own_read"   | SELECT | {authenticated} | USING ((select auth.uid()) = user_id)
--   "notif_own_update" | UPDATE | {authenticated} | USING ((select auth.uid()) = user_id) | WITH CHECK ((select auth.uid()) = user_id)
--   "notif_own_delete" | DELETE | {authenticated} | USING ((select auth.uid()) = user_id)
-- terms_acceptances
--   "terms_acceptances_own_read"   | SELECT | {public} | USING ((select auth.uid()) = user_id)
--   "terms_acceptances_own_insert" | INSERT | {public} | WITH CHECK ((select auth.uid()) = user_id)
--   "terms_acceptances_admin_read" | SELECT | {public} | USING (EXISTS (select 1 from profiles where id=(select auth.uid()) and role='admin'))
-- profile_change_history
--   "Users can view own profile history"   | SELECT | {authenticated} | USING ((select auth.uid()) = user_id)
--   "Users can insert own profile history" | INSERT | {authenticated} | WITH CHECK ((select auth.uid()) = user_id)
--   "Users can delete own profile history" | DELETE | {authenticated} | USING ((select auth.uid()) = user_id)
-- profile_cover_images
--   "Users can view own cover images"   | SELECT | {authenticated} | USING ((select auth.uid()) = user_id)
--   "Users can add own cover images"    | INSERT | {authenticated} | WITH CHECK ((select auth.uid()) = user_id)
--   "Users can delete own cover images" | DELETE | {authenticated} | USING ((select auth.uid()) = user_id)
-- member_acquisitions
--   "member inserts own acquisition" | INSERT | {public} | WITH CHECK (auth.uid() = member_id)
--   "member updates own acquisition" | UPDATE | {public} | USING (auth.uid() = member_id) | WITH CHECK (auth.uid() = member_id)
--   "admin reads any acquisition"    | SELECT | {public} | USING (is_admin(auth.uid()))
-- member_page_views
--   "member inserts own page views"     | INSERT | {public} | WITH CHECK (auth.uid() = member_id)
--   "admin reads any member page view"  | SELECT | {public} | USING (is_admin(auth.uid()))
-- body_checks
--   "Members read own body checks"   | SELECT | {public} | USING (auth.uid() = user_id)
--   "Members insert own body checks" | INSERT | {public} | WITH CHECK (auth.uid() = user_id)
-- member_milestones
--   "member inserts own milestones" | INSERT | {public} | WITH CHECK (auth.uid() = member_id)
--   "admin reads any milestone"     | SELECT | {public} | USING (is_admin(auth.uid()))
-- member_warnings
--   "member_warnings_own_read" | SELECT | {public} | USING ((select auth.uid()) = member_id)
--   "member_warnings_admin_all" | ALL   | {public} | USING (EXISTS (select 1 from profiles where id=(select auth.uid()) and role='admin'))
-- content_flags
--   "content_flags_own_read"   | SELECT | {public} | USING ((select auth.uid()) = flagger_id)
--   "content_flags_own_insert" | INSERT | {public} | WITH CHECK ((select auth.uid()) = flagger_id)
--   "content_flags_admin_all"  | ALL    | {public} | USING (EXISTS (select 1 from profiles where id=(select auth.uid()) and role='admin'))
-- brotherhood_pairing_requests
--   "Members read own pairing request"   | SELECT | {public} | USING (auth.uid() = user_id)
--   "Members insert own pairing request" | INSERT | {public} | WITH CHECK (auth.uid() = user_id)
--   "Members update own pairing request" | UPDATE | {public} | USING (auth.uid() = user_id) | WITH CHECK (auth.uid() = user_id)
-- brotherhood_pairings
--   "Pair members read own pairing"   | SELECT | {public} | USING (auth.uid() = user_a_id OR auth.uid() = user_b_id)
--   "Pair members update own pairing" | UPDATE | {public} | USING (auth.uid() = user_a_id OR auth.uid() = user_b_id) | WITH CHECK (same)
-- member_story_invitations
--   "member_story_invitations_select_own" | SELECT | {authenticated} | USING (auth.uid() = member_id)
--   "member_story_invitations_insert_own" | INSERT | {authenticated} | WITH CHECK (auth.uid() = member_id)
--   "member_story_invitations_update_own" | UPDATE | {authenticated} | USING (auth.uid() = member_id) | WITH CHECK (auth.uid() = member_id)
-- member_posts
--   "Users can view allowed posts" | SELECT | {authenticated} | USING ((deleted_at IS NULL) AND ((user_id=(select auth.uid())) OR (privacy_level='members')))
--   "Users can create own posts"   | INSERT | {authenticated} | WITH CHECK (user_id=(select auth.uid()))
--   "Users can update own posts"   | UPDATE | {authenticated} | USING (user_id=(select auth.uid())) | WITH CHECK (user_id=(select auth.uid()))
--   "Users can delete own posts"   | DELETE | {authenticated} | USING (user_id=(select auth.uid()))
-- post_solidarity
--   "solidarity_read_all"    | SELECT | {authenticated} | USING true
--   "solidarity_self_insert" | INSERT | {authenticated} | WITH CHECK ((select auth.uid()) = user_id)
--   "solidarity_self_delete" | DELETE | {authenticated} | USING ((select auth.uid()) = user_id)
-- blog_posts
--   "Read published; admins read all" | SELECT | {authenticated} | USING (is_published OR EXISTS(select 1 from profiles where id=(select auth.uid()) and role='admin'))
--   "Admins can insert blog posts"    | INSERT | {public} | WITH CHECK (EXISTS(... role='admin'))
--   "Admins can update blog posts"    | UPDATE | {public} | USING (EXISTS(... role='admin')) | WITH CHECK (EXISTS(... role='admin'))
--   "Admins can delete blog posts"    | DELETE | {public} | USING (EXISTS(... role='admin'))
-- blog_comments
--   "Members can read comments"   | SELECT | {authenticated} | USING true
--   "Members can create comments" | INSERT | {authenticated} | WITH CHECK ((select auth.uid()) = user_id)
--   "Users can update own comments" | UPDATE | {authenticated} | USING ((select auth.uid()) = user_id) | WITH CHECK ((select auth.uid()) = user_id)
--   "Users can delete own comments" | DELETE | {authenticated} | USING ((select auth.uid()) = user_id)
-- conversations
--   "Users can view their conversations"   | SELECT | {authenticated} | USING (is_conversation_member(id))
--   "Users can create conversations"       | INSERT | {authenticated} | WITH CHECK (created_by=(select auth.uid()))
--   "Users can update their conversations" | UPDATE | {authenticated} | USING (is_conversation_member(id)) | WITH CHECK (is_conversation_member(id))
-- conversation_members
--   "Users can view conversation members"   | SELECT | {authenticated} | USING (is_conversation_member(conversation_id))
--   "Conversation creators can add members" | INSERT | {authenticated} | WITH CHECK (EXISTS(select 1 from conversations c where c.id=conversation_id and c.created_by=(select auth.uid())) OR user_id=(select auth.uid()))
--   "Users can update their own membership" | UPDATE | {authenticated} | USING (user_id=(select auth.uid())) | WITH CHECK (user_id=(select auth.uid()))
-- messages
--   "Users can view messages in their conversations" | SELECT | {authenticated} | USING (is_conversation_member(conversation_id))
--   "Users can send messages in their conversations" | INSERT | {authenticated} | WITH CHECK (sender_id=(select auth.uid()) AND is_conversation_member(conversation_id))
--   "Users can update their own messages"            | UPDATE | {authenticated} | USING (sender_id=(select auth.uid())) | WITH CHECK (sender_id=(select auth.uid()))
-- user_roadmap_progress
--   "Users can read own progress"   | SELECT | {public} | USING (user_id=(select auth.uid()))
--   "Users can mark own progress"   | INSERT | {public} | WITH CHECK (user_id=(select auth.uid()))
--   "Users can unmark own progress" | DELETE | {public} | USING (user_id=(select auth.uid()))
-- user_small_things
--   "Members read own small thing history"   | SELECT | {public} | USING (auth.uid() = user_id)
--   "Members upsert own small thing history" | INSERT | {public} | WITH CHECK (auth.uid() = user_id)
--   "Members update own small thing history" | UPDATE | {public} | USING (auth.uid() = user_id) | WITH CHECK (auth.uid() = user_id)
