"use client";
import Link from "next/link";
import { WASTE_LABELS } from "@/domain/labels";
import type { Report } from "@/domain/types";
import { formatFcfa } from "@/domain/validators";
import { useQuery } from "@/front/hooks/useQuery";
import { useSession } from "@/front/hooks/useSession";
import { Card } from "@/front/ui/Card";
import { Shell } from "@/front/ui/Shell";
import { StatusPill } from "@/front/ui/StatusPill";

function ReportCard({ r }: { r: Report }) {
  return (
    <Link href={`/collecteur/reports/${r.id}`} className="plain">
      <Card className="row">
        <div>
          <strong>{WASTE_LABELS[r.wasteType]}</strong>
          <div className="muted small">{r.addressHint}</div>
          <div className="small">{formatFcfa(r.price)}</div>
        </div>
        <StatusPill status={r.status} />
      </Card>
    </Link>
  );
}

export function CollectorHome() {
  const { user } = useSession("collector");
  const { data, loading } = useQuery<{ mine: Report[]; nearby: Report[] }>("/api/reports", { refreshMs: 10000 });
  const active = (data?.mine ?? []).filter((r) => r.status === "accepted" || r.status === "collected");
  const done = (data?.mine ?? []).filter((r) => r.status === "paid").length;

  return (
    <Shell role="collector" title="Mes missions">
      {user && !user.validated && (
        <Card className="warn">Votre compte est en attente de validation par l’équipe Kwatta. Vous verrez les demandes dès son activation.</Card>
      )}

      <h3 className="section">En cours</h3>
      {loading && <p className="muted">Chargement…</p>}
      {!loading && active.length === 0 && <p className="muted">Aucune mission en cours.</p>}
      <div className="stack">{active.map((r) => <ReportCard key={r.id} r={r} />)}</div>

      <h3 className="section">Demandes près de chez vous</h3>
      {!loading && (data?.nearby.length ?? 0) === 0 && <p className="muted">Pas de nouvelle demande pour le moment.</p>}
      <div className="stack">{data?.nearby.map((r) => <ReportCard key={r.id} r={r} />)}</div>

      <p className="muted small center-text">{done} collecte(s) payée(s) à ce jour</p>
    </Shell>
  );
}
