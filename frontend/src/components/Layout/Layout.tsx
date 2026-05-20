import type { ReactNode } from "react";
import { Navbar } from "./Navbar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <Navbar />
      <main className="page">{children}</main>
    </div>
  );
}
