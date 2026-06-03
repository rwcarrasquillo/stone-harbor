import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase auth callback handler.
 *
 * Exchanges the `code` query param (set on the redirect back from a
 * magic-link / email-confirmation flow) for a session, writing the
 * session cookies via the server client. Then redirects the visitor on
 * to `next` (defaults to /dashboard).
 *
 * This is Supabase's documented Next.js SSR pattern. Stone Harbor uses
 * a client-only auth flow today; The Long Light adopts the SSR cookie
 * pattern so middleware can refresh sessions server-side.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code, or the exchange failed — send them to login to try again.
  return NextResponse.redirect(`${origin}/login`);
}
