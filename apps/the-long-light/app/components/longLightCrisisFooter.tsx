import Link from "next/link";

export function LongLightCrisisFooter() {
  return (
    <footer className="border-t border-[var(--background-recessed)] bg-[var(--background-base)] py-6 px-6 text-center">
      <p className="font-sans text-sm text-[var(--text-secondary)] max-w-3xl mx-auto leading-relaxed">
        If tonight is harder than it should be: call or text{" "}
        <a href="tel:988" className="text-[var(--primary)] underline underline-offset-2">
          988
        </a>
        . The light is here for as long as you need it.{" "}
        <Link href="/crisis-resources" className="text-[var(--primary)] underline underline-offset-2">
          More resources
        </Link>
        .
      </p>
    </footer>
  );
}
