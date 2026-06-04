-- Stone Harbor / The Long Light — consumer_006_consumer_aware_triggers
-- Authored: 2026-06-04 (NOT YET APPLIED — author-only pass for Cowork review)
-- Phase 2 (consumer-aware data layer) — Migration "M4" (the high-risk one).
-- Plan: stone-harbor-docs/The_Long_Light_Phase_2_Plan.md §2.4
--
-- WHY THIS MIGRATION EXISTS
-- The two auth.users triggers are the last Stone-Harbor-coupled pieces of the
-- signup path. They are rewritten here to become consumer-aware:
--
--   1. enforce_registration_open()  (BEFORE INSERT on auth.users)
--        Today it reads the single global app_settings.registration_open and
--        always speaks as "Stone Harbor". It blocks EVERY signup — including
--        Long Light — whenever SH registration is closed. After this rewrite it
--        reads the PER-CONSUMER gate (consumer_settings.registration_open) for
--        the consumer carried in the signup's auth metadata, so the two
--        products' gates are genuinely independent.
--
--   2. handle_new_user()            (AFTER INSERT on auth.users)
--        Today it hard-codes healing_stage='clarity' (a Stone Harbor concept)
--        and does not stamp profiles.consumer. After this rewrite it stamps the
--        resolved consumer and branches healing_stage: SH keeps 'clarity', Long
--        Light gets NULL (the live profiles_healing_stage_check already permits
--        NULL — confirmed in plan §2.2; LL grows its own phase/season vocab in a
--        later content phase).
--
-- WHAT CHANGES FOR STONE HARBOR
-- Nothing observable. Both functions resolve consumer from
-- raw_user_meta_data->>'consumer' and DEFAULT TO 'stone_harbor' when it is
-- missing or empty. The existing SH signup flow does not pass a consumer, so it
-- falls into the stone_harbor branch and behaves exactly as before:
-- gated by the SH gate, profile created with healing_stage='clarity'. The
-- admin_invited bypass is preserved for both consumers. SH closure message
-- preserved verbatim; LL closure message added in parallel.
--
-- WHAT THIS ENABLES FOR THE LONG LIGHT
-- The LL signup client passes options.data.consumer = 'long_light' (see
-- apps/the-long-light/app/signup/page.tsx in the companion commit). That value
-- lands in raw_user_meta_data->>'consumer', so the BEFORE-INSERT gate consults
-- the long_light row of consumer_settings (independent of SH's gate) and the
-- AFTER-INSERT profile is stamped consumer='long_light', healing_stage=NULL.
--
-- GATE SOURCE-OF-TRUTH CHANGE
-- enforce_registration_open() NO LONGER reads app_settings.registration_open;
-- consumer_settings is now the only gate source. The app_settings column is
-- intentionally LEFT IN PLACE for one release cycle as back-compat for any
-- direct readers/dashboards.
-- TODO (future migration): once nothing reads it, drop
--   public.app_settings.registration_open (and, if it becomes fully unused,
--   the app_settings row/table). Do NOT drop it in this migration.
--
-- IDEMPOTENCY / SAFETY
-- CREATE OR REPLACE FUNCTION replaces the bodies IN PLACE. The existing trigger
-- attachments on auth.users are NOT dropped or recreated — they keep pointing at
-- the same function OIDs, so no trigger churn and no window where signups run
-- untriggered. Both functions preserve SECURITY DEFINER and SET search_path = ''
-- (so every table reference stays schema-qualified). Safe to replay.

-- ---------------------------------------------------------------------------
-- 1. enforce_registration_open() — BEFORE INSERT on auth.users
-- ---------------------------------------------------------------------------
create or replace function public.enforce_registration_open()
  returns trigger
  language plpgsql
  security definer
  set search_path to ''
as $function$
declare
  v_consumer       text;
  v_open           boolean;
  v_admin_invited  boolean;
begin
  -- Resolve the consumer from signup metadata; default to stone_harbor for
  -- back-compat with any flow (the SH signup) that does not pass it. nullif
  -- treats an empty string the same as missing.
  v_consumer := coalesce(
    nullif(new.raw_user_meta_data->>'consumer', ''),
    'stone_harbor'
  );

  -- Reject unknown consumers outright rather than silently treating them as SH.
  if v_consumer not in ('stone_harbor', 'long_light') then
    raise exception
      'Unknown consumer "%" in signup metadata.', v_consumer
      using errcode = 'P0001';
  end if;

  -- Admin-invited signups bypass the gate for BOTH consumers. The admin invite
  -- flow sets raw_user_meta_data->>'admin_invited' = 'true' on create.
  -- (::boolean cast preserves the exact pre-rewrite bypass behavior.)
  v_admin_invited := coalesce(
    (new.raw_user_meta_data->>'admin_invited')::boolean,
    false
  );

  if v_admin_invited then
    return new;
  end if;

  -- Read the PER-CONSUMER gate. If the row is somehow missing, fail OPEN
  -- (matches the previous global behavior: a misconfigured gate must not lock
  -- everyone out).
  select cs.registration_open
    into v_open
    from public.consumer_settings cs
   where cs.consumer = v_consumer;

  if v_open is null then
    v_open := true;
  end if;

  if v_open then
    return new;
  end if;

  -- Closure messages are per-consumer so each product keeps its own brand
  -- voice. SH copy is preserved verbatim from the pre-rewrite function; LL gets
  -- a parallel line. errcode P0001 unchanged for both.
  if v_consumer = 'long_light' then
    raise exception
      'The Long Light is not currently open to new members.'
      using errcode = 'P0001';
  else
    raise exception
      'Stone Harbor is not currently open to new members.'
      using errcode = 'P0001';
  end if;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 2. handle_new_user() — AFTER INSERT on auth.users
-- ---------------------------------------------------------------------------
-- The current body performs exactly ONE side-effect: a single INSERT into
-- public.profiles (id, email, healing_stage, privacy_level, role) with
-- on conflict (id) do nothing. There are no other table writes to replicate.
-- The only consumer-dependent value is healing_stage; everything else keeps its
-- existing literal/default.
create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path to ''
as $function$
declare
  v_consumer       text;
  v_healing_stage  text;
begin
  v_consumer := coalesce(
    nullif(new.raw_user_meta_data->>'consumer', ''),
    'stone_harbor'
  );

  -- SH: 'clarity' (unchanged). LL: NULL (already satisfies the existing
  -- profiles_healing_stage_check, which permits NULL — see plan §2.2).
  if v_consumer = 'long_light' then
    v_healing_stage := null;
  else
    v_healing_stage := 'clarity';
  end if;

  insert into public.profiles (id, email, consumer, healing_stage, privacy_level, role)
  values (
    new.id,
    new.email,
    v_consumer,
    v_healing_stage,
    'private',
    'user'
  )
  on conflict (id) do nothing;

  return new;
end;
$function$;
