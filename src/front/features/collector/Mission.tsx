"use client";
import { useState } from "react";
import { VOLUME_LABELS, WASTE_LABELS } from "@/domain/labels";
import { availableActions } from "@/domain/transitions";
import type { ReportDetail } from "@/domain/types";
import { formatFcfa } from "@/domain/validators";
import { useQuery } from "@/front/hooks/useQuery";
import { ApiError, post, postForm } from "@/front/lib/api";
import { compressImage } from "@/front/lib/image";
import { enqueue } from "@/front/lib/offlineQueue";
import { Button } from "@/front/ui/Button";
import { Card } from "@/front/ui/Card";
import { Shell } from "@/front/ui/Shell";
import { StatusPill } from "@/front/ui/StatusPill";
import { Timeline } from "@/front/ui/Timeline";

export function Mission({ id }: { id: string }) {
  const { data, refresh, loading } = useQuery<ReportDetail>(`/api/reports/${id}`, { refreshMs: 10000 });
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError((e as Error).message);
      await refresh(); // ex. CONFLIT : la demande a été prise, on remet l'écran à jour
    } finally {
      setBusy(false);
    }
  }

  async function pick(file: File | undefined) {
    if (!file) return;
    const small = await compressImage(file);
    setPhoto(small);
    setPreview(URL.createObjectURL(small));
  }

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      await post(`/api/reports/${id}/pay`, { method: "cash" });
      await refresh();
    } catch (e) {
      if (e instanceof ApiError && e.code === "NETWORK") {
        enqueue(`/api/reports/${id}/pay`, { method: "cash" });
        setNotice("Pas de réseau : l’encaissement sera envoyé dès le retour de la connexion.");
      } else setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <Shell role="collector" title="Mission" back="/collecteur">
        <p className="muted">{loading ? "Chargement…" : "Mission introuvable."}</p>
      </Shell>
    );
  }

  const { report, photos, events, client, payment } = data;
  const actions = availableActions(report.status, "collector").map((a) => a.action);

  return (
    <Shell role="collector" title="Mission" back="/collecteur">
      <div className="stack">
        <Card className="stack">
          <div className="row">
            <h2>{WASTE_LABELS[report.wasteType]}</h2>
            <StatusPill status={report.status} />
          </div>
          <div className="small">📍 {report.addressHint}</div>
          <div className="muted small">Volume {VOLUME_LABELS[report.volume].title.toLowerCase()} · {VOLUME_LABELS[report.volume].hint}</div>
          {report.lat !== null && report.lng !== null && (
            <a className="btn btn-ghost" href={`https://www.google.com/maps?q=${report.lat},${report.lng}`} target="_blank" rel="noreferrer">
              Ouvrir dans Maps
            </a>
          )}
          <div className="photos">
            {photos.map((p) => (
              <figure key={p.id}>
                <img src={`/api/photos/${p.id}`} alt={p.kind === "initial" ? "Dépôt signalé" : "Après collecte"} />
                <figcaption className="muted small">{p.kind === "initial" ? "Avant" : "Après"}</figcaption>
              </figure>
            ))}
          </div>
          <div className="row">
            <span>À encaisser</span>
            <strong className="price-value">{formatFcfa(report.price)}</strong>
          </div>
        </Card>

        {client && (
          <Card className="row">
            <div>
              <div className="muted small">Client</div>
              <strong>{client.name}</strong>
            </div>
            <a className="btn btn-ghost" href={`tel:${client.phone}`}>
              Appeler
            </a>
          </Card>
        )}

        {error && <p className="error">{error}</p>}
        {notice && <p className="banner">{notice}</p>}

        {actions.includes("accept") && (
          <Button variant="secondary" busy={busy} onClick={() => run(() => post(`/api/reports/${id}/accept`))}>
            Accepter cette demande
          </Button>
        )}

        {actions.includes("collect") && (
          <Card className="stack">
            <h3 className="section">Photo après collecte (obligatoire)</h3>
            <label className="photo-drop">
              {preview ? <img src={preview} alt="Aperçu" /> : <span>📷 Prendre la photo</span>}
              <input type="file" accept="image/*" capture="environment" onChange={(e) => void pick(e.target.files?.[0])} hidden />
            </label>
            <Button
              variant="secondary"
              busy={busy}
              disabled={!photo}
              onClick={() =>
                run(async () => {
                  const form = new FormData();
                  form.set("photo", photo!);
                  await postForm(`/api/reports/${id}/collect`, form);
                  setPhoto(null);
                  setPreview(null);
                })
              }
            >
              Confirmer la collecte
            </Button>
          </Card>
        )}

        {actions.includes("pay") && (
          <Button variant="secondary" busy={busy} onClick={pay}>
            J’ai encaissé {formatFcfa(report.price)} en espèces
          </Button>
        )}

        {payment && (
          <Card>
            ✓ Payé. Votre part : <strong>{formatFcfa(payment.collectorAmount)}</strong>
            <div className="muted small">Commission Kwatta : {formatFcfa(payment.commission)}</div>
          </Card>
        )}

        <Card>
          <h3 className="section">Historique</h3>
          <Timeline events={events} />
        </Card>
      </div>
    </Shell>
  );
}
