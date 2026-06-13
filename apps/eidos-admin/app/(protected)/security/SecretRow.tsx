"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { SystemSecretRow } from "@/lib/engine";

/**
 * Eidos Admin /security — single row.
 *
 * Client component because we need the expand/collapse toggle, the
 * notes textarea, and the Mark As Rotated button. The actual POST
 * goes through the eidos-admin Next.js API route
 * `/api/security/[id]/mark-rotated` which proxies to the engine —
 * keeps the EIDOS_ADMIN_API_TOKEN server-side.
 *
 * After a successful mark-rotated, calls router.refresh() so the
 * server-rendered list re-fetches from the engine and the row's
 * "Last rotated" timestamp + overdue badge update without a full
 * page reload.
 */
export function SecretRow({ secret }: { secret: SystemSecretRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const last = secret.last_rotated_at
    ? new Date(secret.last_rotated_at).toLocaleDateString()
    : "—";
  const subtitle = secret.last_rotated_at
    ? `Last rotated ${last}${
        secret.days_since_rotation !== null
          ? ` · ${secret.days_since_rotation}d ago`
          : ""
      } · rotate every ${secret.rotation_interval_days}d`
    : `Never rotated · rotate every ${secret.rotation_interval_days}d`;

  async function rotate() {
    setError(null);
    const res = await fetch(
      `/api/security/${encodeURIComponent(secret.id)}/mark-rotated`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes.trim() || undefined }),
      },
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "<unreadable>");
      setError(`Engine returned ${res.status}: ${detail}`);
      return;
    }
    setNotes("");
    setOpen(false);
    startTransition(() => router.refresh());
  }

  const borderColor = secret.overdue ? "#7a3838" : "#1f2128";
  const overdueBadge = secret.overdue && (
    <span
      style={{
        marginLeft: "0.5rem",
        fontSize: "9px",
        textTransform: "uppercase",
        letterSpacing: "0.22em",
        color: "#ff8080",
        border: "1px solid #5a2a2a",
        background: "rgba(255, 128, 128, 0.05)",
        padding: "1px 6px",
      }}
    >
      {secret.last_rotated_at ? "Overdue" : "Needs initial rotation"}
    </span>
  );

  return (
    <div
      style={{
        border: `1px solid ${borderColor}`,
        background: "#0e1015",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "0.7rem 1rem",
          background: "transparent",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: "inherit",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
            {secret.label}
          </span>
          {secret.is_critical && (
            <span
              style={{
                marginLeft: "0.5rem",
                fontSize: "9px",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                color: "#ff8080",
              }}
            >
              Critical
            </span>
          )}
          {overdueBadge}
        </div>
        <p
          style={{
            marginTop: "0.25rem",
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.22em",
            opacity: 0.55,
          }}
        >
          {subtitle}
        </p>
      </button>

      {open && (
        <div
          style={{
            borderTop: "1px solid #1f2128",
            padding: "1rem",
            fontSize: "0.85rem",
          }}
        >
          {secret.description && (
            <p
              style={{
                opacity: 0.75,
                marginBottom: "0.85rem",
                lineHeight: 1.55,
              }}
            >
              {secret.description}
            </p>
          )}

          <label style={{ display: "block" }}>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                opacity: 0.6,
              }}
            >
              Notes (optional)
            </span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What you did, when, who else knows…"
              style={{
                marginTop: "0.3rem",
                width: "100%",
                boxSizing: "border-box",
                padding: "0.5rem 0.65rem",
                background: "#0a0b10",
                color: "#e6e6e6",
                border: "1px solid #2a2d36",
                borderRadius: 4,
                fontFamily: "inherit",
                fontSize: "0.85rem",
                outline: "none",
                resize: "vertical",
              }}
            />
          </label>

          {error && (
            <p
              style={{
                marginTop: "0.5rem",
                color: "#ff8080",
                fontSize: "0.8rem",
              }}
            >
              {error}
            </p>
          )}

          <div style={{ marginTop: "0.8rem" }}>
            <button
              type="button"
              onClick={rotate}
              disabled={isPending}
              style={{
                padding: "0.4rem 0.95rem",
                background: "#7aa2f7",
                color: "#0b0c10",
                fontWeight: 600,
                border: "none",
                borderRadius: 4,
                fontFamily: "inherit",
                fontSize: "0.78rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: isPending ? "default" : "pointer",
                opacity: isPending ? 0.5 : 1,
              }}
            >
              {isPending ? "Saving…" : "Mark as rotated"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
