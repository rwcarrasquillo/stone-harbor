/**
 * Eidos Engine — root index.
 *
 * Deliberately minimal. Eidos is a service substrate (push-event
 * ingestion + per-construct cron compute + internal admin spot-check),
 * not a member-facing site. The member-visible behavioral inferences
 * render inside each host app (Stone Harbor's /map → Rhythm, etc.),
 * not here. This page exists so the deployment has a 200 root and a
 * place to land if someone visits the bare domain.
 */
export default function Home() {
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
        style={{ width: "100%", maxWidth: 460, textAlign: "center" }}
      >
        <div style={{ marginBottom: "1.25rem" }}>
          <EidosHorizonMark />
        </div>
        <p
          style={{
            lineHeight: 1.6,
            opacity: 0.7,
            fontSize: "0.85rem",
            margin: 0,
          }}
        >
          Behavioral-inference service for Stone Harbor Ventures. No member
          surface lives here.
        </p>
        <p
          style={{
            lineHeight: 1.6,
            opacity: 0.5,
            fontSize: "0.75rem",
            marginTop: "1.25rem",
          }}
        >
          Health:{" "}
          <a href="/api/health" style={{ color: "#7aa2f7" }}>
            /api/health
          </a>
        </p>
      </section>
    </main>
  );
}

function EidosHorizonMark() {
  return (
    <svg
      width="100%"
      style={{ maxWidth: 420 }}
      viewBox="0 0 540 180"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Eidos"
      role="img"
    >
      <defs>
        <radialGradient id="root_halo_outer" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d8e6f4" stopOpacity="0.45" />
          <stop offset="55%" stopColor="#8aabcb" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#2c4868" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="root_halo_inner" cx="40%" cy="34%" r="58%">
          <stop offset="0%" stopColor="#f5faff" stopOpacity="1" />
          <stop offset="42%" stopColor="#b3cee8" stopOpacity="0.7" />
          <stop offset="80%" stopColor="#5d80a2" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#2c4868" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="120" cy="90" r="110" fill="url(#root_halo_outer)" />
      <circle cx="120" cy="90" r="70" fill="url(#root_halo_inner)" />
      <circle cx="120" cy="90" r="44" fill="#0b0c10" />
      <circle
        cx="120"
        cy="90"
        r="44"
        fill="none"
        stroke="#f5faff"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1="10"
        y1="90"
        x2="530"
        y2="90"
        stroke="#ffffff"
        strokeWidth="1"
        strokeOpacity="0.9"
        vectorEffect="non-scaling-stroke"
      />
      <text
        x="210"
        y="90"
        fontFamily="'Avenir Next', Avenir, 'Helvetica Neue', ui-sans-serif, system-ui, sans-serif"
        fontSize="36"
        fontWeight="300"
        letterSpacing="5"
        fill="#ffffff"
      >
        eidos
      </text>
    </svg>
  );
}
