"use client";

import { useState } from "react";
import { useTheme } from "@/app/components/themeProvider";
import { serif } from "@/lib/fonts";

/**
 * Stone Harbor — LineageSection.
 *
 * The Lineage room in /welcome. Three optional textareas, framed
 * carefully, no required fields, no completion shaming. The
 * heaviest emotional invitation in the harbor — placed last on the
 * disclosure timeline (day 90) so significant trust has accumulated
 * before the man is asked these questions.
 *
 * Design rationale:
 *   "What did your father do with grief?" is a tear-trigger for many
 *   men. Asking it on day 1 would scare them off. By day 90 the
 *   harbor has earned the right to ask quietly. Even then, the
 *   section is opt-in to engage with — it sits in the profile, doesn't
 *   demand attention, and the man can leave it blank forever.
 *
 *   The "leave behind" question is the third and most generative —
 *   it shifts the focus from what was done TO him to what he chooses
 *   to do NEXT. This ordering (grief → anger → choose differently)
 *   moves the man from passive inheritance to active authorship.
 *
 * Saves:
 *   The parent component owns the form state and the saveProfile
 *   flow. This component is a controlled set of inputs; we don't
 *   auto-save here. That keeps the lineage write in the same
 *   transaction as the rest of the profile update.
 *
 * Theme awareness:
 *   Dark-glass on Dusk, cream on Sunlit, matching the other
 *   profile editor sections. Distinguished from the rest of the form
 *   by a quiet header treatment ("Lineage" eyebrow + serif sentence)
 *   so the man knows this is a different kind of section without
 *   needing an exclamation.
 */

type Props = {
  fatherGrief: string;
  fatherAnger: string;
  patternToLeave: string;
  onChangeFatherGrief: (value: string) => void;
  onChangeFatherAnger: (value: string) => void;
  onChangePatternToLeave: (value: string) => void;
};

export function LineageSection({
  fatherGrief,
  fatherAnger,
  patternToLeave,
  onChangeFatherGrief,
  onChangeFatherAnger,
  onChangePatternToLeave,
}: Props) {
  const { theme } = useTheme();
  const isDusk = theme === "dusk";

  return (
    <section
      className={`mt-12 border-t pt-10 ${
        isDusk ? "border-white/10" : "border-[var(--sh-border-subtle)]"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--sh-accent-gold)]">
        Lineage
      </p>
      <h3
        className={`${serif.className} mt-3 text-3xl font-medium leading-tight text-[var(--sh-text-primary)]`}
      >
        What you carry from before you.
      </h3>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--sh-text-secondary)]">
        Three quiet prompts about what your father did, and what you
        choose to do differently. Nothing here is required. Nothing
        is displayed anywhere. This page is for you.
      </p>

      <div className="mt-8 grid gap-6">
        <LineageField
          label="Something my father did with grief"
          help="Whether you want to remember it, or not repeat it."
          value={fatherGrief}
          onChange={onChangeFatherGrief}
          isDusk={isDusk}
        />
        <LineageField
          label="Something my father did with anger"
          help="Whether you want to remember it, or not repeat it."
          value={fatherAnger}
          onChange={onChangeFatherAnger}
          isDusk={isDusk}
        />
        <LineageField
          label="One pattern I'd like to leave behind"
          help="The line you cross when you cross it."
          value={patternToLeave}
          onChange={onChangePatternToLeave}
          isDusk={isDusk}
        />
      </div>
    </section>
  );
}

function LineageField({
  label,
  help,
  value,
  onChange,
  isDusk,
}: {
  label: string;
  help: string;
  value: string;
  onChange: (value: string) => void;
  isDusk: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-[var(--sh-text-tertiary)]">
        {label}
      </label>
      <p className="mb-3 text-[11px] italic text-[var(--sh-text-muted)]">
        {help}
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        // Generous padding + soft border. We deliberately keep this
        // styled like a writing surface rather than a form input —
        // these are reflective prompts, not data entry.
        className={`w-full resize-y border px-5 py-4 text-sm leading-relaxed transition focus:border-[var(--sh-accent-gold)] focus:outline-none ${
          isDusk
            ? "border-white/15 bg-black/40 text-stone-100 placeholder:text-stone-500"
            : "border-[var(--sh-border-medium)] bg-[#f8f4ed] text-[var(--sh-text-primary)]"
        }`}
        placeholder="Leave blank if not now."
      />
    </div>
  );
}
