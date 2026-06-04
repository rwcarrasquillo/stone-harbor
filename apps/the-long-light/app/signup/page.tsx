"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Phase 2 consumer-aware signup: this lands in
        // auth.users.raw_user_meta_data->>'consumer', which the
        // enforce_registration_open() and handle_new_user() triggers read to
        // gate against the long_light row of consumer_settings and to stamp
        // profiles.consumer = 'long_light' (healing_stage NULL).
        data: {
          consumer: "long_light",
        },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // If email confirmation is required, there's no active session yet.
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setNotice(
      "Check your email for a link to confirm your account. The light will wait."
    );
    setLoading(false);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-3xl md:text-4xl leading-tight mb-3 text-[var(--primary)]">
          Welcome. Make a place to think.
        </h1>
        <p className="font-sans text-base text-[var(--text-secondary)] mb-10 leading-relaxed">
          A private journal, a few patient prompts, and a way of being noticed
          without being watched. Whatever you&rsquo;re carrying, you can set it
          down here.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block font-sans text-sm text-[var(--text-secondary)] mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[var(--accent-base)] bg-[var(--background-recessed)] px-4 py-3 font-sans text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-long-light)]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block font-sans text-sm text-[var(--text-secondary)] mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[var(--accent-base)] bg-[var(--background-recessed)] px-4 py-3 font-sans text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-long-light)]"
            />
          </div>

          {error && (
            <p className="font-sans text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          )}

          {notice && (
            <p className="font-sans text-sm text-[var(--secondary)]" role="status">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-8 py-3 bg-[var(--primary)] text-[var(--background-base)] font-sans tracking-wide hover:bg-[var(--text-primary)] transition-colors disabled:opacity-60"
          >
            {loading ? "One moment…" : "Begin"}
          </button>
        </form>

        <p className="font-sans text-sm text-[var(--text-secondary)] mt-8 text-center">
          Already have a place here?{" "}
          <Link href="/login" className="text-[var(--primary)] underline underline-offset-2">
            Sign in
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
