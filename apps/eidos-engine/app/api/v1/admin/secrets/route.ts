import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifyAdminToken } from "@/lib/auth/verifyAdminToken";
import { getServiceClient } from "@/lib/supabase/server";

/**
 * Eidos Engine — `GET /api/v1/admin/secrets`
 *
 * Lists every row in `eidos_system_secrets`, enriched with the same
 * derived fields the Stone Harbor admin /security UI expects:
 * `days_since_rotation` and `overdue`. The eidos-admin app's
 * /security page renders from this exact shape.
 *
 * Auth: bearer `EIDOS_ADMIN_API_TOKEN` (see verifyAdminToken).
 *
 * Mirrors the SH admin pattern in
 * apps/stone-harbor-admin/app/api/admin/secrets/route.ts so the two
 * surfaces stay parallel. Scope is read-only for v1 (per EID-53
 * acceptance) — no POST/create here; new rows go in via the
 * migration. Mark-rotated lives at `/api/v1/admin/secrets/[id]/mark-rotated`.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = verifyAdminToken(req);
  if (!auth.ok) {
    return NextResponse.json(
      { error: "unauthorized", reason: auth.reason },
      { status: auth.reason === "unconfigured" ? 500 : 401 },
    );
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("eidos_system_secrets")
    .select(
      "id, key, label, category, description, rotation_interval_days, last_rotated_at, last_rotated_by, notes, is_critical, created_at, updated_at",
    )
    .order("is_critical", { ascending: false })
    .order("label", { ascending: true });
  if (error) {
    return NextResponse.json(
      { error: "db_error", detail: error.message },
      { status: 500 },
    );
  }

  // Match SH admin's enrichment shape so the UI patterns stay
  // parallel. Days_since_rotation is null when the secret has never
  // been rotated; overdue is true either when never rotated OR when
  // the elapsed days exceed the cadence.
  const now = Date.now();
  const enriched = (data ?? []).map((s) => {
    const last = s.last_rotated_at
      ? new Date(s.last_rotated_at as string).getTime()
      : null;
    const days =
      last !== null ? Math.floor((now - last) / (1000 * 60 * 60 * 24)) : null;
    const overdue =
      days === null || days >= (s.rotation_interval_days as number);
    return { ...s, days_since_rotation: days, overdue };
  });

  return NextResponse.json({ secrets: enriched });
}
