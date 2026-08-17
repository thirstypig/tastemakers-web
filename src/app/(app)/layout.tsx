import type { ReactNode } from "react";
import AppShell from "@/features/shell/AppShell";

/**
 * Route group for the merged app surface (v2). Screens land in here as they
 * are built; the dark `(public)` group is retired one screen at a time.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
