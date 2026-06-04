-- Stone Harbor / The Long Light — consumer_006_rollback
-- Captured: 2026-06-04 (pre-apply snapshot of the LIVE function bodies)
-- Phase 2 (consumer-aware data layer) — EMERGENCY ROLLBACK for Migration M4.
--
-- WHAT THIS IS
-- The verbatim, pre-rewrite bodies of the two auth.users trigger functions as
-- they existed in production immediately BEFORE
-- consumer_006_consumer_aware_triggers.sql was applied. Captured via
-- pg_get_functiondef() so this is an exact reproduction of live behavior.
--
-- WHEN TO RUN IT
-- ONLY if consumer_006_consumer_aware_triggers.sql causes production issues
-- (e.g. signups failing unexpectedly, the consumer_settings read misbehaving
-- under real traffic). Running this file reverts BOTH functions to their
-- Stone-Harbor-only behavior:
--   * enforce_registration_open() goes back to reading the single global
--     public.app_settings.registration_open (id = 1) and always speaking as
--     "Stone Harbor". Per-consumer gating via consumer_settings is undone, so
--     Long Light signups will once again be blocked whenever the SH gate is
--     closed.
--   * handle_new_user() goes back to hard-coding healing_stage = 'clarity' and
--     NOT stamping profiles.consumer. New rows will fall back to the
--     profiles.consumer column DEFAULT ('stone_harbor' from Migration M2), so
--     a Long Light signup created while rolled back would be mislabeled
--     stone_harbor — re-apply M4 before resuming LL signups.
--
-- The CREATE OR REPLACE statements are atomic and replace the bodies in place;
-- the trigger attachments on auth.users are untouched (same as the forward
-- migration). The additive consumer columns / consumer_settings table from
-- M1–M3a are NOT removed by this file — it reverts only the two functions.
--
-- FILING CONVENTION
-- Rollback files are deliberately NOT numbered into the main migration
-- sequence (no consumer_00N number that apply_migration would record as a
-- forward step). This is an out-of-band, emergency-use artifact kept beside
-- its forward migration for fast access. Do not apply it as part of normal
-- forward migration runs.

-- ---------------------------------------------------------------------------
-- 1. enforce_registration_open() — PRE-REWRITE body (SH-only, app_settings)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_registration_open()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_open           boolean;
  v_admin_invited  boolean;
begin
  -- Read the gate. If the table is somehow empty, default to OPEN
  -- (fail-open so a misconfigured DB doesn't lock everyone out).
  select registration_open
    into v_open
    from public.app_settings
   where id = 1;

  if v_open is null then v_open := true; end if;

  -- Allow admin-invited signups even when closed. The admin invite
  -- flow sets raw_user_meta_data->>'admin_invited' = 'true' on create.
  v_admin_invited := coalesce(
    (new.raw_user_meta_data->>'admin_invited')::boolean,
    false
  );

  if v_open or v_admin_invited then
    return new;
  end if;

  raise exception
    'Stone Harbor is not currently open to new members.'
    using errcode = 'P0001';
end;
$function$;

-- ---------------------------------------------------------------------------
-- 2. handle_new_user() — PRE-REWRITE body (hard-coded 'clarity', no consumer)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into public.profiles (id, email, healing_stage, privacy_level, role)
  values (
    new.id,
    new.email,
    'clarity',
    'private',
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;
