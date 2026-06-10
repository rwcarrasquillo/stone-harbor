import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Eidos Engine — admin login POST (EID-21).
 *
 * Validates the submitted token against EIDOS_ADMIN_TOKEN. On match,
 * sets an HttpOnly cookie containing the token itself and redirects
 * to `next` (sanitised). On miss, redirects back to /admin/login with
 * an error flag.
 *
 * The cookie is the credential. Same security model as Basic Auth —
 * the browser holds the secret — but with proper login/logout UX.
 * HttpOnly means JavaScript can't read it (defeats XSS exfiltration);
 * Secure means it never goes over plain HTTP; SameSite=Lax means it
 * doesn't ride on cross-site requests.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "eidos_admin_session";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function POST(req: NextRequest) {
  const adminToken = process.env.EIDOS_ADMIN_TOKEN;
  if (!adminToken) {
    return redirect(req, "/admin/login?error=unconfigured");
  }

  const form = await req.formData().catch(() => null);
  const submitted =
    form && typeof form.get("token") === "string"
      ? (form.get("token") as string)
      : "";
  const nextRaw =
    form && typeof form.get("next") === "string"
      ? (form.get("next") as string)
      : "/admin/events";

  if (!submitted) {
    return redirect(req, `/admin/login?error=missing&next=${encodeURIComponent(nextRaw)}`);
  }

  if (submitted !== adminToken) {
    return redirect(req, `/admin/login?error=invalid&next=${encodeURIComponent(nextRaw)}`);
  }

  const next = sanitizeNext(nextRaw);
  const response = redirect(req, next);
  response.cookies.set({
    name: COOKIE_NAME,
    value: adminToken,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}

function redirect(req: NextRequest, location: string): NextResponse {
  return NextResponse.redirect(new URL(location, req.url), { status: 303 });
}

function sanitizeNext(next: string): string {
  if (!next.startsWith("/admin")) return "/admin/events";
  if (next.startsWith("/admin/login")) return "/admin/events";
  return next;
}
