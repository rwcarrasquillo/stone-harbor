"use client";

import { Analytics } from "@vercel/analytics/next";

/**
 * Authenticated route prefixes. Analytics events for any of these are
 * dropped via the beforeSend callback before being transmitted, so
 * Vercel Web Analytics only ever sees the public / pre-auth surface of
 * The Long Light.
 *
 * This mirrors Stone Harbor's MarketingAnalytics and implements the
 * same privacy promise: anonymous marketing visitors get aggregate
 * pageview counts; signed-in members are never tracked by external
 * analytics.
 *
 * For Phase 1 the only authenticated surface is /dashboard. As the
 * member app grows (journal, map, etc.), add new authenticated route
 * prefixes here. Public routes (/, /login, /signup, /crisis-resources)
 * are tracked by default — no change required.
 */
const AUTHENTICATED_PATH_PREFIXES = ["/dashboard"];

function isAuthenticatedRoute(url: string): boolean {
  try {
    const path = new URL(url).pathname;
    return AUTHENTICATED_PATH_PREFIXES.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`)
    );
  } catch {
    // Malformed URL — fail closed (do NOT send the event).
    return true;
  }
}

export function MarketingAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        if (isAuthenticatedRoute(event.url)) return null;
        return event;
      }}
    />
  );
}
