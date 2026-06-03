"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-3xl md:text-4xl leading-tight mb-3 text-[var(--primary)]">
          Welcome back. The light is patient.
        </h1>
        <p className="font-sans text-base text-[var(--text-secondary)] mb-10 leading-relaxed">
          It kept your place. Pick up where you set things down.
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
              autoComplete="current-password"
              required
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

          <button
            type="submit"
            disabled={loading}
            className="w-full px-8 py-3 bg-[var(--primary)] text-[var(--background-base)] font-sans tracking-wide hover:bg-[var(--text-primary)] transition-colors disabled:opacity-60"
          >
            {loading ? "One moment…" : "Sign in"}
          </button>
        </form>

        <p className="font-sans text-sm text-[var(--text-secondary)] mt-8 text-center">
          New here?{" "}
          <Link href="/signup" className="text-[var(--primary)] underline underline-offset-2">
            Make a place to think
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
