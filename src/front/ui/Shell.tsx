"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { Role } from "@/domain/types";
import { useOfflineQueue } from "../hooks/useOfflineQueue";
import { useSession } from "../hooks/useSession";

const NAV: Record<Role, { href: string; label: string }[]> = {
  client: [
    { href: "/client", label: "Accueil" },
    { href: "/client/new", label: "Signaler" },
  ],
  collector: [{ href: "/collecteur", label: "Missions" }],
  admin: [{ href: "/admin", label: "Admin" }],
};

export function Shell({ role, title, back, children }: { role: Role; title: string; back?: string; children: ReactNode }) {
  const { user, ready, loading, logout } = useSession(role);
  const pathname = usePathname();
  const pending = useOfflineQueue();

  if (!ready || !user) return <div className="center muted">{loading ? "Chargement…" : "Redirection…"}</div>;

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          {back ? (
            <Link href={back} aria-label="Retour" className="back">
              ←
            </Link>
          ) : (
            <span className="logo">k</span>
          )}
          <div>
            <div className="brand-sub">Kwatta · Yaoundé propre</div>
            <h1>{title}</h1>
          </div>
        </div>
        <button className="link" onClick={logout}>
          Quitter
        </button>
      </header>

      {pending > 0 && <div className="banner">{pending} action(s) en attente de connexion…</div>}
      <main className="main">{children}</main>

      <nav className="nav">
        {NAV[role].map((n) => (
          <Link key={n.href} href={n.href} className={pathname === n.href ? "active" : ""}>
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
