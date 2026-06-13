-- EID-53 — Create the eidos_system_secrets rotation-tracking table.
--
-- Companion to SH-41 (Stone Harbor's system_secrets row for the
-- consumer token). This is the Eidos-side surface for the secrets
-- that belong to the Eidos product: admin API token, admin password,
-- and the Vercel cron secret. The operator interacts with this through
-- the new eidos-admin /security page (also added in EID-53).
--
-- Schema choice
-- -------------
-- Matches Stone Harbor admin's `system_secrets` column shape exactly so
-- the UI patterns + future tooling can stay parallel:
--   key, label, category, description, rotation_interval_days,
--   last_rotated_at, last_rotated_by, notes, is_critical
--
-- Differences from SH's table:
--   - Table name is `eidos_system_secrets` (clear product-namespacing)
--   - `last_rotated_by` references nothing (the eidos-admin app
--     doesn't have an `admin_accounts` table yet; until EID-45 lands
--     and we have multi-actor RBAC, the column stays uuid-nullable
--     with no FK)
--   - RLS enabled with no permissive policies (service-role only,
--     same posture as every other eidos-engine table per the §12.6
--     architecture state)
--
-- Notes column convention (carried forward from SH-41 / 2026-06-13
-- discovery): the /security UI treats `notes` as a per-rotation
-- incident log textarea bound to the rotate endpoint, NOT as reference
-- documentation. Seeds should leave `notes` NULL. Rotation runbook
-- lives in stone-harbor-docs/CHANGELOG.md + Eidos_Behavioral_Inference_Architecture.md.

CREATE TABLE IF NOT EXISTS public.eidos_system_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  category text NOT NULL,
  description text,
  rotation_interval_days integer NOT NULL,
  last_rotated_at timestamptz,
  last_rotated_by uuid,
  notes text,
  is_critical boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Cheap secondary index for "most-critical first, then alphabetical"
-- ordering which the UI prefers (matches SH admin's pattern).
CREATE INDEX IF NOT EXISTS idx_eidos_system_secrets_sort
  ON public.eidos_system_secrets (is_critical DESC, label ASC);

-- RLS posture: locked down. The only consumer of this table is the
-- engine's own admin-token-authenticated routes (lib/auth/verifyAdminToken).
-- No browser ever reads or writes this directly. Same posture as the
-- other eidos-engine tables per §12.6 of the architecture spec.
ALTER TABLE public.eidos_system_secrets ENABLE ROW LEVEL SECURITY;

-- updated_at trigger to keep the column honest. Mirrors the pattern
-- used elsewhere in the engine.
CREATE OR REPLACE FUNCTION public.eidos_system_secrets_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_eidos_system_secrets_updated_at
  ON public.eidos_system_secrets;
CREATE TRIGGER trg_eidos_system_secrets_updated_at
  BEFORE UPDATE ON public.eidos_system_secrets
  FOR EACH ROW
  EXECUTE FUNCTION public.eidos_system_secrets_set_updated_at();

-- Seed the three Eidos secrets that exist today. Idempotent via
-- ON CONFLICT (key) DO NOTHING so re-running this migration on a
-- partially-seeded DB doesn't blow up.
INSERT INTO public.eidos_system_secrets (
  key, label, category, description,
  rotation_interval_days, last_rotated_at, notes, is_critical
)
VALUES
  (
    'eidos_admin_api_token',
    'Eidos Admin API Token',
    'auth',
    'Shared bearer token that authenticates eidos-admin → eidos-engine read calls (`GET /api/v1/members`, `GET /api/v1/members/[c]/[u]`, and the EID-53 secrets routes). Lives in EIDOS_ADMIN_API_TOKEN env var on BOTH the eidos-engine and eidos-admin Vercel projects (Production scope) — the two values MUST match byte-for-byte. No DB row backs it; rotation is pure env-var swap + redeploy both projects. Rotation runbook: see stone-harbor-docs CHANGELOG.md 2026-06-12 entry + Eidos_Behavioral_Inference_Architecture.md §12.7 (the Vercel env-var rename redeploy gotcha is documented there).',
    90,
    TIMESTAMPTZ '2026-06-13 01:50:00+00',
    NULL,
    TRUE
  ),
  (
    'eidos_admin_password',
    'Eidos Admin Password',
    'auth',
    'Single shared secret authenticating humans signing into eidos-admin. Lives in EIDOS_ADMIN_PASSWORD env var on the eidos-admin Vercel project (Production scope). When EID-45 lands and a second admin actor appears, this graduates to a real `eidos_admin_tokens` table with per-actor rows + scopes; until then, one secret, one operator, no RBAC.',
    90,
    TIMESTAMPTZ '2026-06-13 01:50:00+00',
    NULL,
    TRUE
  ),
  (
    'cron_secret',
    'Cron Secret',
    'integration',
    'Vercel auto-cron authentication secret used by `/api/eidos/compute-circadian`, `/api/eidos/baseline-circadian`, and every future per-construct cron route. Vercel signs cron invocations with the CRON_SECRET env var name (with EIDOS_CRON_SECRET as a manual-curl fallback). Lives on the eidos-engine Vercel project (Production scope). Has never been rotated since the EID-20 cron infrastructure shipped — flagged as needs-initial-rotation here. Rotation: generate new value, update CRON_SECRET on eidos-engine, redeploy, next cron run will use the new value (no traffic disruption since crons are scheduled).',
    180,
    NULL,
    NULL,
    FALSE
  )
ON CONFLICT (key) DO NOTHING;
