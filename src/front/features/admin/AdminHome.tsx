"use client";
import { useState } from "react";
import { WASTE_LABELS } from "@/domain/labels";
import type { Claim, Report, User } from "@/domain/types";
import { formatFcfa } from "@/domain/validators";
import { useQuery } from "@/front/hooks/useQuery";
import { post } from "@/front/lib/api";
import { Button } from "@/front/ui/Button";
import { Card } from "@/front/ui/Card";
import { Shell } from "@/front/ui/Shell";
import { StatusPill } from "@/front/ui/StatusPill";

export function AdminHome() {
  const collectors = useQuery<User[]>("/api/admin/collectors", { refreshMs: 20000 });
  const claims = useQuery<Claim[]>("/api/admin/claims", { refreshMs: 20000 });
  const reports = useQuery<{ mine: Report[] }>("/api/reports", { refreshMs: 20000 });
  const [decision, setDecision] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function act(path: string, body?: unknown) {
    setError(null);
    try {
      await post(path, body);
      await Promise.all([collectors.refresh(), claims.refresh()]);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const all = reports.data?.mine ?? [];
  const paid = all.filter((r) => r.status === "paid");
  const toValidate = (collectors.data ?? []).filter((c) => !c.validated).length;

  return (
    <Shell role="admin" title="Administration">
      <div className="stack">
        <div className="grid3">
          <Card className="stat"><strong>{all.length}</strong><span className="muted small">signalements</span></Card>
          <Card className="stat"><strong>{paid.length}</strong><span className="muted small">payés / 20</span></Card>
          <Card className="stat"><strong>{formatFcfa(paid.reduce((s, r) => s + r.price, 0)).replace(" FCFA", "")}</strong><span className="muted small">FCFA</span></Card>
        </div>

        {error && <p className="error">{error}</p>}

        <h3 className="section">
          Collecteurs {toValidate > 0 && <span className="pill pill-pending">{toValidate} à valider</span>}
        </h3>
        {collectors.error && <p className="error">Impossible de charger les collecteurs : {collectors.error.message}</p>}
        {collectors.loading && <p className="muted">Chargement…</p>}
        {!collectors.loading && !collectors.error && (collectors.data?.length ?? 0) === 0 && (
          <p className="muted">Aucun collecteur inscrit pour l’instant. Ils apparaissent ici dès leur inscription.</p>
        )}
        {collectors.data?.map((c) => (
          <Card key={c.id} className="row">
            <div>
              <strong>{c.name}</strong>
              <div className="muted small">{c.phone}</div>
              <span className={`pill ${c.validated ? "pill-collected" : "pill-pending"}`}>{c.validated ? "Actif" : "À valider"}</span>
            </div>
            {c.validated ? (
              <Button variant="ghost" onClick={() => act(`/api/admin/collectors/${c.id}/suspend`)}>Suspendre</Button>
            ) : (
              <Button onClick={() => act(`/api/admin/collectors/${c.id}/validate`)}>Valider</Button>
            )}
          </Card>
        ))}

        <h3 className="section">Réclamations ouvertes</h3>
        {claims.error && <p className="error">{claims.error.message}</p>}
        {(claims.data?.length ?? 0) === 0 && !claims.error && <p className="muted">Aucune réclamation.</p>}
        {claims.data?.map((c) => (
          <Card key={c.id} className="stack">
            <div className="small">{c.reason}</div>
            <input className="input" placeholder="Décision (ex. remboursement, nouvelle collecte…)" value={decision[c.id] ?? ""} onChange={(e) => setDecision({ ...decision, [c.id]: e.target.value })} />
            <Button variant="ghost" onClick={() => act(`/api/admin/claims/${c.id}/resolve`, { resolution: decision[c.id] ?? "" })}>
              Clôturer
            </Button>
          </Card>
        ))}

        <h3 className="section">Derniers signalements</h3>
        {all.slice(0, 15).map((r) => (
          <Card key={r.id} className="row">
            <div>
              <strong>{WASTE_LABELS[r.wasteType]}</strong>
              <div className="muted small">{r.addressHint}</div>
            </div>
            <StatusPill status={r.status} />
          </Card>
        ))}
      </div>
    </Shell>
  );
}
