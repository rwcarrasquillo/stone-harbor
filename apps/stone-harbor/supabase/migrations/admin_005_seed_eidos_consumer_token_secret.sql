-- SH-41 — Seed `system_secrets` row for the Eidos consumer token.
--
-- Why this row exists
-- -------------------
-- EID-38 rotated the stone_harbor consumer token on 2026-06-13. The new
-- token (prefix e20668d8) lives in Stone Harbor's Vercel
-- `EIDOS_CONSUMER_TOKEN` env var and authenticates SH → Eidos engine
-- writes. Until this row existed, the operator had no last-rotated
-- breadcrumb + no overdue highlight on the /security Secret Rotation
-- tab — the rotation cycle was effectively uncounted.
--
-- This is the only Eidos-related secret that belongs on Stone Harbor's
-- security console. The other Eidos secrets (EIDOS_ADMIN_API_TOKEN,
-- EIDOS_ADMIN_PASSWORD, CRON_SECRET) live in eidos-engine + eidos-admin
-- Vercel projects and belong on the Eidos admin app's own /security
-- console — that work is tracked separately as EID-53.
--
-- Category choice: `integration`. Eidos is, from Stone Harbor's
-- perspective, an external service the app talks to over the network
-- — same lane as Unsplash and the Vercel deploy hook.
--
-- Idempotent: ON CONFLICT (key) DO NOTHING. Safe to re-apply.

-- Note on the `notes` column: the /security UI treats notes as a
-- per-rotation incident log (the textarea field below the row is bound
-- to the rotate endpoint's body). Don't seed it with reference
-- documentation — it'll show as empty placeholder text in the UI but
-- still be there in the DB, which is the worst of both worlds.
-- Reference documentation lives in stone-harbor-docs/ instead.

INSERT INTO public.system_secrets (
  key,
  label,
  category,
  description,
  rotation_interval_days,
  last_rotated_at,
  notes,
  is_critical
)
VALUES (
  'eidos_consumer_token',
  'Eidos Consumer Token',
  'integration',
  'Bearer token Stone Harbor uses to authenticate to the Eidos engine when pushing behavioral events (journal.created, mood.selected, safety_classifier.triggered). DB-backed in the eidos-engine project''s eidos_consumer_tokens table (consumer_id=''stone_harbor''). Lives in Stone Harbor''s Vercel project as EIDOS_CONSUMER_TOKEN (Production scope). Rotation runbook: see stone-harbor-docs CHANGELOG.md 2026-06-12 entry + Eidos_Behavioral_Inference_Architecture.md §12.7 (openssl-newline gotcha is non-obvious — strip trailing \n before hashing the new token plaintext).',
  90,
  TIMESTAMPTZ '2026-06-13 01:50:00+00',
  NULL,
  TRUE
)
ON CONFLICT (key) DO NOTHING;
