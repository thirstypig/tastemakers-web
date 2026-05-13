import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-roboto), system-ui, sans-serif",
        background: "#1A1038",
        minHeight: "100vh",
        color: "#fff",
      }}
    >
      {children}
    </div>
  );
}
