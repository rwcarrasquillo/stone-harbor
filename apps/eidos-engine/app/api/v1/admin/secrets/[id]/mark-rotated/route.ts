import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifyAdminToken } from "@/lib/auth/verifyAdminToken";
import { getServiceClient } from "@/lib/supabase/server";

/**
 * Eidos Engine — `POST /api/v1/admin/secrets/[id]/mark-rotated`
 *
 * Records that a secret has been rotated. Body is optional:
 *
 *   { notes?: string }
 *
 * If notes are provided, they overwrite the `notes` column on the row
 * (per-rotation incident log — the same semantic SH admin's table
 * uses). Empty / omitted body leaves notes untouched.
 *
 * Sets `last_rotated_at = now()`. We don't track `last_rotated_by`
 * because the eidos-admin app doesn't have a real user_id today
 * (single shared `EIDOS_ADMIN_PASSWORD` session); when EID-45 lands
 * with per-actor auth, that column gets populated.
 *
 * Auth: bearer `EIDOS_ADMIN_API_TOKEN` (admin app calls this from its
 * own server routes via `lib/engine.ts`).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = verifyAdminToken(req);
  if (!auth.ok) {
    return NextResponse.json(
      { error: "unauthorized", reason: auth.reason },
      { status: auth.reason === "unconfigured" ? 500 : 401 },
    );
  }

  const { id } = await params;
  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: "bad_request", detail: "id is required" },
      { status: 400 },
    );
  }

  type Body = { notes?: string };
  const body = (await req.json().catch(() => ({}))) as Body;
  const trimmedNotes = body.notes?.trim();
  const supabase = getServiceClient();

  // Build the update payload conditionally — only touch `notes` when
  // the caller actually provided something. Empty strings reset to
  // NULL (operator explicitly cleared the field in the UI).
  const update: Record<string, unknown> = {
    last_rotated_at: new Date().toISOString(),
  };
  if (body.notes !== undefined) {
    update.notes = trimmedNotes ? trimmedNotes : null;
  }

  const { data, error } = await supabase
    .from("eidos_system_secrets")
    .update(update)
    .eq("id", id)
    .select("id, key, last_rotated_at")
    .single();
  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json(
        { error: "not_found", detail: `No secret with id ${id}` },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "db_error", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, secret: data });
}
