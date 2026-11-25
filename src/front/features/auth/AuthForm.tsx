"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { User } from "@/domain/types";
import { homeOf } from "@/front/hooks/useSession";
import { clearCache } from "@/front/hooks/useQuery";
import { post } from "@/front/lib/api";
import { Button } from "@/front/ui/Button";
import { Card } from "@/front/ui/Card";
import { Field } from "@/front/ui/Field";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<"client" | "collector">("client");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = mode === "login" ? { phone, pin } : { phone, pin, name, role };
      const { user } = await post<{ user: User }>(`/api/auth/${mode}`, body);
      clearCache();
      router.replace(homeOf(user.role));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <div className="hero-auth">
        <span className="logo big">k</span>
        <h1>kwatta</h1>
        <p>Un dépôt sauvage ? On s’en occupe.</p>
      </div>
      <main className="main">
        <Card>
          <div className="tabs">
            <button className={mode === "login" ? "on" : ""} onClick={() => setMode("login")} type="button">
              Connexion
            </button>
            <button className={mode === "register" ? "on" : ""} onClick={() => setMode("register")} type="button">
              Inscription
            </button>
          </div>

          <form onSubmit={submit} className="stack">
            {mode === "register" && (
              <>
                <Field label="Votre nom" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
                <div className="tabs">
                  <button className={role === "client" ? "on" : ""} onClick={() => setRole("client")} type="button">
                    Je signale
                  </button>
                  <button className={role === "collector" ? "on" : ""} onClick={() => setRole("collector")} type="button">
                    Je collecte
                  </button>
                </div>
              </>
            )}
            <Field label="Téléphone" type="tel" inputMode="tel" placeholder="6 71 23 45 67" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" required />
            <Field label="Code secret (4 à 6 chiffres)" type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} required />
            {error && <p className="error">{error}</p>}
            <Button type="submit" busy={busy}>
              {mode === "login" ? "Se connecter" : "Créer mon compte"}
            </Button>
            {mode === "register" && role === "collector" && (
              <p className="muted small">Un compte collecteur est activé après validation par l’équipe Kwatta.</p>
            )}
          </form>
        </Card>
      </main>
    </div>
  );
}
