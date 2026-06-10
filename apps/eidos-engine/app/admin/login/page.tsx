/**
 * Eidos Engine — admin login page (EID-21).
 *
 * Single-field form. Token gets POSTed to /api/admin/login which
 * validates against EIDOS_ADMIN_TOKEN, sets an HttpOnly session cookie,
 * and redirects to either `next` (if provided) or `/admin/events`.
 *
 * Surfaces:
 *   ?error=invalid   — token was wrong on the previous attempt
 *   ?error=missing   — no token was sent
 *   ?logged_out=1    — user just signed out
 *   ?next=<path>     — preserved so post-login lands the user where they were going
 *
 * Plain inline styles, matching the rest of the Eidos admin chrome.
 */

interface SearchParams {
  error?: string;
  logged_out?: string;
  next?: string;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const errorMessage = pickErrorMessage(params.error);
  const loggedOut = params.logged_out === "1";
  const nextPath = sanitizeNext(params.next);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 380,
          border: "1px solid #1f2128",
          borderRadius: 6,
          padding: "1.75rem",
          background: "#0e1015",
        }}
      >
        <header style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              fontSize: "0.7rem",
              opacity: 0.55,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "0.35rem",
            }}
          >
            Eidos Engine
          </div>
          <h1 style={{ fontSize: "1rem", margin: 0, fontWeight: 600 }}>
            Admin sign in
          </h1>
          <p
            style={{
              opacity: 0.55,
              fontSize: "0.8rem",
              marginTop: "0.5rem",
              lineHeight: 1.5,
            }}
          >
            Internal-only validation surface. Enter your admin token.
          </p>
        </header>

        {loggedOut && (
          <Banner tone="ok">Signed out.</Banner>
        )}
        {errorMessage && (
          <Banner tone="err">{errorMessage}</Banner>
        )}

        <form method="POST" action="/api/admin/login">
          <input type="hidden" name="next" value={nextPath} />
          <label
            htmlFor="token"
            style={{
              display: "block",
              fontSize: "0.7rem",
              opacity: 0.6,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "0.4rem",
            }}
          >
            Token
          </label>
          <input
            id="token"
            name="token"
            type="password"
            autoComplete="current-password"
            autoFocus
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "0.6rem 0.75rem",
              fontFamily: "inherit",
              fontSize: "0.85rem",
              background: "#0a0b10",
              color: "#e6e6e6",
              border: "1px solid #2a2d36",
              borderRadius: 4,
              outline: "none",
            }}
          />

          <button
            type="submit"
            style={{
              marginTop: "1rem",
              width: "100%",
              padding: "0.6rem 0.75rem",
              fontFamily: "inherit",
              fontSize: "0.85rem",
              background: "#7aa2f7",
              color: "#0b0c10",
              border: "none",
              borderRadius: 4,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Sign in
          </button>
        </form>

        <p
          style={{
            marginTop: "1.5rem",
            opacity: 0.45,
            fontSize: "0.7rem",
            lineHeight: 1.5,
          }}
        >
          The token is held in an HttpOnly cookie for 7 days. Closing the
          browser does not sign you out — use the link in the header.
        </p>
      </section>
    </main>
  );
}

function pickErrorMessage(code: string | undefined): string | null {
  switch (code) {
    case "invalid":
      return "That token doesn't match.";
    case "missing":
      return "Please enter a token.";
    case "unconfigured":
      return "Server is missing EIDOS_ADMIN_TOKEN — admin sign-in is disabled.";
    default:
      return null;
  }
}

/**
 * Only allow internal paths under /admin to be used as the post-login
 * redirect. Without this, an attacker could craft `?next=https://evil`
 * and use a phishing email + the login flow to land users on an
 * external site that looks legit because the URL bar shows our domain
 * first. Bake the check into the page rather than relying on the API
 * route alone.
 */
function sanitizeNext(next: string | undefined): string {
  if (!next) return "/admin/events";
  if (!next.startsWith("/admin")) return "/admin/events";
  if (next.startsWith("/admin/login")) return "/admin/events";
  return next;
}

function Banner({
  tone,
  children,
}: {
  tone: "ok" | "err";
  children: React.ReactNode;
}) {
  const color = tone === "ok" ? "#4ade80" : "#ff8080";
  const border = tone === "ok" ? "#1e3a2b" : "#5a2a2a";
  const bg = tone === "ok" ? "#0f1a14" : "#1c0f0f";
  return (
    <p
      style={{
        marginTop: 0,
        marginBottom: "1rem",
        padding: "0.6rem 0.75rem",
        border: `1px solid ${border}`,
        background: bg,
        color,
        borderRadius: 4,
        fontSize: "0.8rem",
      }}
    >
      {children}
    </p>
  );
}
