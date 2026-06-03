import Link from "next/link";
import { LongLightMark } from "@/app/components/longLightMark";

export default function HomePage() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
           style={{ background: "var(--long-light-glow)" }} />

      <div className="relative z-10 w-full max-w-2xl text-center">
        <LongLightMark className="mx-auto h-16 w-16 mb-12" />

        <h1 className="font-serif text-5xl md:text-6xl leading-tight mb-8 text-[var(--primary)]">
          The Long Light is patient.
        </h1>

        <p className="font-serif text-xl md:text-2xl mb-6 text-[var(--text-primary)] leading-relaxed">
          The day's edge has come, and the light is still here.
          <br />
          So are you.
        </p>

        <p className="font-sans text-base mb-12 text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
          A private place to think, when the day has been long.
          Whatever you carried into this evening, you can set it down here.
          Or you can keep carrying it. The light will stay.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="px-8 py-3 bg-[var(--primary)] text-[var(--background-base)] font-sans tracking-wide hover:bg-[var(--text-primary)] transition-colors"
          >
            Begin
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 border border-[var(--accent-base)] text-[var(--primary)] font-sans tracking-wide hover:bg-[var(--background-recessed)] transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
