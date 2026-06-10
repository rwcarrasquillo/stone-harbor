import type { ReactNode } from "react";

/**
 * Eidos Engine — protected-admin layout (EID-21).
 *
 * Wraps every authed `/admin` page (everything except `/admin/login`).
 * Header strip with the Events index link and a Sign-out button. The
 * cookie-based session is invalidated by POSTing to /api/admin/logout,
 * which clears the cookie and bounces back to the login page.
 *
 * Sign-out uses a POST form rather than a GET link so link-prefetchers
 * (Next.js prefetch, antivirus extensions, etc.) can't accidentally
 * sign you out by following the URL.
 */
export default function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh" }}>
      <header
        style={{
          padding: "1rem 2rem",
          borderBottom: "1px solid #1f2128",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          fontSize: "0.85rem",
        }}
      >
        <strong style={{ fontWeight: 600 }}>Eidos Admin</strong>
        <a href="/admin/events" style={{ color: "#7aa2f7" }}>
          Events index
        </a>
        <span style={{ marginLeft: "auto", opacity: 0.6 }}>
          internal · service surface
        </span>
        <form method="POST" action="/api/admin/logout" style={{ margin: 0 }}>
          <button
            type="submit"
            style={{
              background: "transparent",
              border: "1px solid #2a2d36",
              color: "#e6e6e6",
              fontFamily: "inherit",
              fontSize: "0.75rem",
              padding: "0.3rem 0.7rem",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </form>
      </header>
      <main style={{ padding: "2rem", maxWidth: 1100, margin: "0 auto" }}>
        {children}
      </main>
    </div>
  );
}
