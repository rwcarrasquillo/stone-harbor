import { listSystemSecrets, type SystemSecretRow } from "@/lib/engine";
import { SecretRow } from "./SecretRow";

/**
 * Eidos Admin — /security
 *
 * Rotation tracker for the three Eidos secrets: admin API token,
 * admin password, and cron secret. Each row shows last rotated,
 * cadence, overdue state. Mark As Rotated calls the engine route
 * `/api/v1/admin/secrets/[id]/mark-rotated`.
 *
 * This page is the Eidos-side companion to Stone Harbor admin's
 * /security page (which tracks only the consumer token — the one
 * secret that genuinely IS a Stone Harbor secret). Scope is read-only
 * for v1 per EID-53 acceptance — no create/edit/delete UI, rows come
 * from the migration.
 *
 * Note: this page TRACKS rotation, it doesn't perform it. The actual
 * env-var swap + redeploy happens in Vercel (see each row's
 * description for the runbook reference).
 */

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  let secrets: SystemSecretRow[] = [];
  let fetchError: string | null = null;

  try {
    const result = await listSystemSecrets();
    secrets = result.secrets;
  } catch (err) {
    fetchError = err instanceof Error ? err.message : String(err);
  }

  if (fetchError) {
    return (
      <ErrorPanel title="Failed to reach the Eidos engine" detail={fetchError} />
    );
  }

  // Group by category. SH admin's /security does this too — gives the
  // operator a clean visual chunking by what kind of secret it is.
  const byCategory = new Map<string, SystemSecretRow[]>();
  for (const s of secrets) {
    const list = byCategory.get(s.category) ?? [];
    list.push(s);
    byCategory.set(s.category, list);
  }
  const categories = Array.from(byCategory.keys()).sort();

  return (
    <section>
      <h1 style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>
        Secret rotation
      </h1>
      <p style={{ opacity: 0.6, fontSize: "0.85rem", marginBottom: "0.5rem" }}>
        Tracker for the Eidos-side secrets. Rotation actually happens in
        Vercel — this surface just records when you did it so the overdue
        highlight wakes up at the cadence.
      </p>
      <p
        style={{
          opacity: 0.5,
          fontSize: "0.75rem",
          marginBottom: "1.75rem",
          fontStyle: "italic",
        }}
      >
        The Stone Harbor consumer token lives on{" "}
        <a
          href="https://admin.stoneharbor.app/security"
          style={{ color: "#7aa2f7" }}
        >
          admin.stoneharbor.app/security
        </a>
        , not here — it&apos;s a Stone Harbor secret, not an Eidos one.
      </p>

      {categories.length === 0 ? (
        <p style={{ opacity: 0.6 }}>No secrets registered yet.</p>
      ) : (
        categories.map((cat) => (
          <div key={cat} style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                opacity: 0.6,
                marginBottom: "0.75rem",
                color: "#c8a96a",
              }}
            >
              {cat}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {byCategory.get(cat)!.map((s) => (
                <SecretRow key={s.id} secret={s} />
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}

function ErrorPanel({ title, detail }: { title: string; detail: string }) {
  return (
    <section
      style={{
        padding: "1rem 1.25rem",
        border: "1px solid #5a2a2a",
        background: "#1c0f0f",
        borderRadius: 4,
      }}
    >
      <strong style={{ color: "#ff8080" }}>{title}</strong>
      <pre
        style={{
          marginTop: "0.5rem",
          whiteSpace: "pre-wrap",
          fontSize: "0.8rem",
          opacity: 0.8,
        }}
      >
        {detail}
      </pre>
    </section>
  );
}
