"use client";
import Link from "next/link";
import { WASTE_LABELS } from "@/domain/labels";
import type { Report } from "@/domain/types";
import { formatFcfa } from "@/domain/validators";
import { useQuery } from "@/front/hooks/useQuery";
import { Card } from "@/front/ui/Card";
import { Shell } from "@/front/ui/Shell";
import { StatusPill } from "@/front/ui/StatusPill";

export function ClientHome() {
  const { data, loading } = useQuery<{ mine: Report[] }>("/api/reports", { refreshMs: 15000 });
  const reports = data?.mine ?? [];

  return (
    <Shell role="client" title="Bonjour !">
      <section className="hero">
        <span className="eyebrow">Un quartier plus propre, ensemble</span>
        <h2>Un dépôt sauvage ? On s’en occupe.</h2>
        <p>Signalez-le en quelques étapes. Le prix est affiché avant l’envoi.</p>
        <Link href="/client/new" className="btn btn-secondary">
          Signaler un dépôt
        </Link>
      </section>

      <h3 className="section">Vos demandes</h3>
      {loading && <p className="muted">Chargement…</p>}
      {!loading && reports.length === 0 && <p className="muted">Aucune demande pour l’instant.</p>}
      <div className="stack">
        {reports.map((r) => (
          <Link key={r.id} href={`/client/reports/${r.id}`} className="plain">
            <Card className="row">
              <div>
                <strong>{WASTE_LABELS[r.wasteType]}</strong>
                <div className="muted small">
                  {new Date(r.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })} · {formatFcfa(r.price)}
                </div>
              </div>
              <StatusPill status={r.status} />
            </Card>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
