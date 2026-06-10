import type { ReactNode } from "react";

/**
 * Eidos Engine — /admin layout (EID-21).
 *
 * Pass-through wrapper. The login page and the protected pages each
 * own their own chrome (via app/admin/(protected)/layout.tsx for the
 * authed surfaces, and a standalone main element on /admin/login).
 *
 * Kept as an explicit file rather than deleted because the Linux sandbox
 * the build was scaffolded in can't remove files on the mounted volume.
 * Pass-through has no runtime cost.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
