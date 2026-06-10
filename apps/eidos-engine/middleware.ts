import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Eidos Engine — admin session middleware (EID-21).
 *
 * Gates every request under `/admin/*` except `/admin/login` itself,
 * by checking an HttpOnly cookie set by the login route. No browser
 * Basic Auth prompt — a real Eidos-branded login page lives at
 * `/admin/login`. Same token-based credential model.
 *
 * Cookie name: `eidos_admin_session`. Value: literal admin token.
 * The middleware compares cookie value → EIDOS_ADMIN_TOKEN env var.
 *
 * Missing/invalid cookie on a protected `/admin/*` URL → 303 redirect
 * to `/admin/login?next=<original_path>` so post-login lands the user
 * where they were going. The login API route does its own validation.
 *
 * API routes /api/admin/login and /api/admin/logout are intentionally
 * NOT covered by this matcher — they own their own logic (validate-
 * and-set-cookie / clear-cookie). Including them here would block the
 * login flow from ever running.
 */

const COOKIE_NAME = "eidos_admin_session";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Let the login page through without auth — otherwise the user can
  // never see it to authenticate.
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return NextResponse.next();
  }

  const adminToken = process.env.EIDOS_ADMIN_TOKEN;
  if (!adminToken) {
    // Misconfiguration — surface to the login page so the operator
    // sees the "unconfigured" banner rather than an opaque 500.
    return NextResponse.redirect(
      new URL("/admin/login?error=unconfigured", req.url),
      { status: 303 },
    );
  }

  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (cookie && cookie === adminToken) {
    return NextResponse.next();
  }

  // Preserve where the user was going. Strip the host — `next` is an
  // internal path only (the login API + page both re-sanitise).
  const nextParam = encodeURIComponent(`${pathname}${search}`);
  return NextResponse.redirect(
    new URL(`/admin/login?next=${nextParam}`, req.url),
    { status: 303 },
  );
}

export const config = {
  matcher: ["/admin/:path*"],
};
