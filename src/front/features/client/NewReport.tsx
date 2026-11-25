"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { VOLUME_LABELS, WASTE_LABELS } from "@/domain/labels";
import { VOLUMES, WASTE_TYPES, type Report, type Volume, type WasteType } from "@/domain/types";
import { formatFcfa } from "@/domain/validators";
import { useDraft } from "@/front/hooks/useDraft";
import { useQuery } from "@/front/hooks/useQuery";
import { postForm } from "@/front/lib/api";
import { compressImage } from "@/front/lib/image";
import { Button } from "@/front/ui/Button";
import { Card } from "@/front/ui/Card";
import { Shell } from "@/front/ui/Shell";

const TAGS = ["À côté du transformateur Eneo", "Devant la quincaillerie", "Carrefour avec poteau jaune"];

interface Draft {
  wasteType: WasteType;
  volume: Volume;
  addressHint: string;
  lat: number | null;
  lng: number | null;
}

export function NewReport() {
  const router = useRouter();
  const [draft, update, clearDraft] = useDraft<Draft>("kw_new_report", { wasteType: "menagers", volume: 2, addressHint: "", lat: null, lng: null });
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Le prix est calculé par le serveur : une seule source de vérité.
  const { data: quote } = useQuery<{ price: number }>(`/api/pricing/quote?type=${draft.wasteType}&volume=${draft.volume}`);

  async function pick(file: File | undefined) {
    if (!file) return;
    const small = await compressImage(file);
    setPhoto(small);
    setPreview(URL.createObjectURL(small));
  }

  function locate() {
    navigator.geolocation?.getCurrentPosition(
      (p) => update({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setError("Position indisponible. Décrivez le lieu avec un repère."),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function submit() {
    setError(null);
    if (!photo) return setError("Ajoutez une photo du dépôt.");
    if (draft.addressHint.trim().length < 5) return setError("Décrivez un repère visuel pour guider le collecteur.");
    setBusy(true);
    try {
      const form = new FormData();
      form.set("wasteType", draft.wasteType);
      form.set("volume", String(draft.volume));
      form.set("addressHint", draft.addressHint);
      if (draft.lat !== null && draft.lng !== null) {
        form.set("lat", String(draft.lat));
        form.set("lng", String(draft.lng));
      }
      form.set("photo", photo);
      const report = await postForm<Report>("/api/reports", form);
      clearDraft();
      router.replace(`/client/reports/${report.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <Shell role="client" title="Signaler un dépôt" back="/client">
      <div className="stack">
        <Card className="stack">
          <h3 className="section">1 · Photo</h3>
          <label className="photo-drop">
            {preview ? <img src={preview} alt="Aperçu du dépôt" /> : <span>📷 Prendre ou choisir une photo</span>}
            <input type="file" accept="image/*" capture="environment" onChange={(e) => void pick(e.target.files?.[0])} hidden />
          </label>
        </Card>

        <Card className="stack">
          <h3 className="section">2 · Type de déchet</h3>
          <div className="chips">
            {WASTE_TYPES.map((t) => (
              <button key={t} type="button" className={`chip ${draft.wasteType === t ? "on" : ""}`} onClick={() => update({ wasteType: t })}>
                {WASTE_LABELS[t]}
              </button>
            ))}
          </div>
          <h3 className="section">Volume estimé</h3>
          <div className="grid3">
            {VOLUMES.map((v) => (
              <button key={v} type="button" className={`choice ${draft.volume === v ? "on" : ""}`} onClick={() => update({ volume: v })}>
                <strong>{VOLUME_LABELS[v].title}</strong>
                <span className="muted small">{VOLUME_LABELS[v].hint}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="stack">
          <h3 className="section">3 · Repère visuel</h3>
          <textarea
            className="textarea"
            rows={3}
            placeholder="Ex : en face de la boulangerie du rond-point, près du grand manguier…"
            value={draft.addressHint}
            onChange={(e) => update({ addressHint: e.target.value })}
          />
          <div className="chips">
            {TAGS.map((t) => (
              <button key={t} type="button" className="chip" onClick={() => update({ addressHint: `${draft.addressHint} ${t}`.trim() })}>
                + {t}
              </button>
            ))}
          </div>
          <Button variant="ghost" type="button" onClick={locate}>
            {draft.lat !== null ? "✓ Position enregistrée" : "📍 Ajouter ma position GPS (facultatif)"}
          </Button>
        </Card>

        <Card className="price">
          <span className="muted small">Prix de la collecte</span>
          <strong className="price-value">{quote ? formatFcfa(quote.price) : "…"}</strong>
          <span className="muted small">À régler en espèces au collecteur après la collecte.</span>
        </Card>

        {error && <p className="error">{error}</p>}
        <Button variant="secondary" onClick={submit} busy={busy}>
          Envoyer le signalement
        </Button>
      </div>
    </Shell>
  );
}
