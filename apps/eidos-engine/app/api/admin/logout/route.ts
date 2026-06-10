import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Eidos Engine — admin logout POST (EID-21).
 *
 * Clears the session cookie and bounces back to the login page with a
 * confirmation banner. Triggered by the "Sign out" link in the admin
 * layout header, which is wrapped in a small POST form (POST so a
 * preloader/spider can't accidentally log you out).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "eidos_admin_session";

export async function POST(req: NextRequest) {
  const response = NextResponse.redirect(
    new URL("/admin/login?logged_out=1", req.url),
    { status: 303 },
  );
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
