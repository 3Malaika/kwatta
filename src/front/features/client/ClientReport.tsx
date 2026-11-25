"use client";
import { useState } from "react";
import { VOLUME_LABELS, WASTE_LABELS } from "@/domain/labels";
import { availableActions } from "@/domain/transitions";
import type { ReportDetail } from "@/domain/types";
import { formatFcfa } from "@/domain/validators";
import { useQuery } from "@/front/hooks/useQuery";
import { post } from "@/front/lib/api";
import { Button } from "@/front/ui/Button";
import { Card } from "@/front/ui/Card";
import { Shell } from "@/front/ui/Shell";
import { StatusPill } from "@/front/ui/StatusPill";
import { Timeline } from "@/front/ui/Timeline";

export function ClientReport({ id }: { id: string }) {
  const { data, refresh, loading } = useQuery<ReportDetail>(`/api/reports/${id}`, { refreshMs: 10000 });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [claimText, setClaimText] = useState("");
  const [claimSent, setClaimSent] = useState(false);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <Shell role="client" title="Ma demande" back="/client">
        <p className="muted">{loading ? "Chargement…" : "Demande introuvable."}</p>
      </Shell>
    );
  }

  const { report, photos, events, payment, collector, claims } = data;
  const actions = availableActions(report.status, "client");
  const canClaim = (report.status === "collected" || report.status === "paid") && claims.length === 0 && !claimSent;

  return (
    <Shell role="client" title="Ma demande" back="/client">
      <div className="stack">
        <Card className="stack">
          <div className="row">
            <h2>{WASTE_LABELS[report.wasteType]}</h2>
            <StatusPill status={report.status} />
          </div>
          <div className="muted small">
            Volume {VOLUME_LABELS[report.volume].title.toLowerCase()} · {report.addressHint}
          </div>
          <div className="photos">
            {photos.map((p) => (
              <figure key={p.id}>
                <img src={`/api/photos/${p.id}`} alt={p.kind === "initial" ? "Dépôt signalé" : "Après collecte"} />
                <figcaption className="muted small">{p.kind === "initial" ? "Avant" : "Après"}</figcaption>
              </figure>
            ))}
          </div>
          <div className="row">
            <span>Prix</span>
            <strong>{formatFcfa(report.price)}</strong>
          </div>
        </Card>

        {collector && (
          <Card className="row">
            <div>
              <div className="muted small">Votre collecteur</div>
              <strong>{collector.name}</strong>
            </div>
            <a className="btn btn-ghost" href={`tel:${collector.phone}`}>
              Appeler
            </a>
          </Card>
        )}

        {report.status === "collected" && (
          <Card>
            <strong>Collecte terminée.</strong> Réglez {formatFcfa(report.price)} en espèces au collecteur.
          </Card>
        )}
        {payment && <Card>✓ Payé en espèces le {new Date(payment.createdAt).toLocaleDateString("fr-FR")}. Merci !</Card>}

        <Card>
          <h3 className="section">Suivi</h3>
          <Timeline events={events} />
        </Card>

        {error && <p className="error">{error}</p>}
        {actions.map((a) => (
          <Button key={a.action} variant="ghost" busy={busy} onClick={() => run(() => post(`/api/reports/${id}/${a.action}`))}>
            {a.label} la demande
          </Button>
        ))}

        {canClaim && (
          <Card className="stack">
            <h3 className="section">Un problème ?</h3>
            <textarea className="textarea" rows={3} placeholder="Décrivez le problème (dépôt non collecté, montant demandé différent…)" value={claimText} onChange={(e) => setClaimText(e.target.value)} />
            <Button
              variant="ghost"
              busy={busy}
              onClick={() =>
                run(async () => {
                  await post(`/api/reports/${id}/claims`, { reason: claimText });
                  setClaimSent(true);
                })
              }
            >
              Envoyer une réclamation
            </Button>
          </Card>
        )}
        {(claims.length > 0 || claimSent) && <Card>Votre réclamation a été transmise à l’équipe Kwatta.</Card>}
      </div>
    </Shell>
  );
}
