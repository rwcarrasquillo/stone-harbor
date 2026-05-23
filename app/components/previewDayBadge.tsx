"use client";

import { useEffect, useState } from "react";
import {
  FEATURE_THRESHOLDS,
  clearPreviewDay,
  getPreviewDayOverride,
  setPreviewDayOverride,
} from "@/lib/userProgress";

/**
 * Stone Harbor — PreviewDayBadge.
 *
 * A small floating panel that ONLY appears when a preview-day
 * override is active. Lets the founder quickly step through the
 * progressive-disclosure milestones (Day 0 / 30 / 60 / 75 / 120)
 * to verify how the harbor looks at each one, without creating
 * backdated test users.
 *
 * To enter preview mode the first time, visit any page with
 * `?previewDay=30` (or any non-negative integer). The override is
 * persisted to localStorage so it survives navigation. To exit,
 * tap "Exit preview" or visit `?previewDay=clear`.
 *
 * Design rationale:
 *   - The badge is invisible by default. Normal members never see
 *     it because they have no reason to be in preview mode.
 *   - When active, the badge is honest about what's happening —
 *     "PREVIEWING DAY 60" — so the founder doesn't accidentally
 *     mistake the simulated experience for the real one.
 *   - Day chips at the bottom let one-tap switching, since the
 *     primary use case is "click through every milestone to
 *     verify each unlocks correctly."
 *   - Positioned bottom-left so it never collides with the anchor
 *     watermark (bottom-right) or the mobile tab bar.
 *
 * Refresh behavior:
 *   Changing the override calls window.location.reload() because
 *   most pages read created_at at mount and don't subscribe to
 *   updates. A reload guarantees the gated features re-evaluate
 *   their visibility correctly. This is heavier than a re-render
 *   but acceptable for a developer-facing testing tool.
 */

// The milestones we want one-tap switching between. Matches the
// thresholds in FEATURE_THRESHOLDS — adding a new threshold should
// also add it here so the founder can preview that day.
const PREVIEW_DAYS: { day: number; label: string }[] = [
  { day: 0, label: "Day 0" },
  { day: FEATURE_THRESHOLDS.bodyCheck, label: "Day 30" },
  { day: FEATURE_THRESHOLDS.subMoods, label: "Day 60" },
  { day: FEATURE_THRESHOLDS.smallThings, label: "Day 75" },
  { day: FEATURE_THRESHOLDS.lineage, label: "Day 90" },
  { day: FEATURE_THRESHOLDS.brotherhoodPairing, label: "Day 120" },
];

export function PreviewDayBadge() {
  // mounted gates the entire render — we only ever know the override
  // value client-side, and rendering null on the server avoids any
  // hydration mismatch.
  const [mounted, setMounted] = useState(false);
  const [activeDay, setActiveDay] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    // Read once on mount. If the URL has ?previewDay=N this also
    // persists it to localStorage as a side effect of the getter.
    setActiveDay(getPreviewDayOverride());
  }, []);

  if (!mounted || activeDay === null) return null;

  const handlePick = (day: number) => {
    setPreviewDayOverride(day);
    window.location.reload();
  };

  const handleExit = () => {
    clearPreviewDay();
    window.location.reload();
  };

  return (
    <div
      role="status"
      aria-label="Stone Harbor preview mode"
      className="pointer-events-auto fixed bottom-4 left-4 z-[60] max-w-[280px] border border-[var(--sh-accent-gold)] bg-[#1a1614] p-3 text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
      style={{ backdropFilter: "blur(6px)" }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-[var(--sh-accent-gold)]">
          Previewing Day {activeDay}
        </p>
        <button
          type="button"
          onClick={handleExit}
          className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/55 transition hover:text-white"
          aria-label="Exit preview mode"
        >
          Exit ×
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {PREVIEW_DAYS.map(({ day, label }) => {
          const active = day === activeDay;
          return (
            <button
              key={day}
              type="button"
              onClick={() => handlePick(day)}
              className={`border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] transition ${
                active
                  ? "border-[var(--sh-accent-gold)] bg-[var(--sh-accent-gold)] text-white"
                  : "border-white/15 bg-white/[0.04] text-white/55 hover:text-white"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-white/45">
        Reloads on switch. URL: <code className="text-white/65">?previewDay=N</code>
      </p>
    </div>
  );
}
