import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="px-6 py-12 max-w-2xl mx-auto">
      <h1 className="font-serif text-3xl mb-6">Welcome.</h1>
      <p className="font-serif text-lg text-[var(--text-secondary)] leading-relaxed">
        The light is here. So are you.
      </p>
      <p className="font-sans text-sm text-[var(--text-secondary)] mt-12 italic">
        This is the start. The journal, the reflections, and the Map will arrive in time.
        For now: you exist here. That&rsquo;s enough.
      </p>
    </main>
  );
}
