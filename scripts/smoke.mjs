// Test de bout en bout : node scripts/smoke.mjs [http://localhost:3000]
// Prérequis : app démarrée, base migrée + seed, ADMIN_PHONE / ADMIN_PIN dans l'environnement.
import { Buffer } from "node:buffer";

const BASE = process.argv[2] ?? "http://localhost:3000";
const stamp = String(Date.now()).slice(-7);
let failures = 0;

class Session {
  cookie = "";
  async call(method, path, body, form) {
    const res = await fetch(BASE + path, {
      method,
      headers: { ...(form ? {} : body ? { "Content-Type": "application/json" } : {}), cookie: this.cookie },
      body: form ?? (body ? JSON.stringify(body) : undefined),
    });
    const set = res.headers.get("set-cookie");
    if (set) this.cookie = set.split(";")[0];
    const json = await res.json().catch(() => ({}));
    return { status: res.status, data: json.data, error: json.error };
  }
}

function check(name, cond, extra = "") {
  console.log(`${cond ? "✔" : "✘"} ${name}${cond ? "" : ` ${extra}`}`);
  if (!cond) failures++;
}

// PNG 1x1 valide
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
const photoForm = (extra = {}) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(extra)) f.set(k, v);
  f.set("photo", new File([PNG], "p.png", { type: "image/png" }));
  return f;
};

const client = new Session();
const client2 = new Session();
const collA = new Session();
const collB = new Session();
const admin = new Session();

let r = await client.call("POST", "/api/auth/register", { phone: `6${stamp}0`, name: "Awa Client", pin: "1234", role: "client" });
check("inscription client", r.status === 201 && r.data.user.validated === true, JSON.stringify(r));
await client2.call("POST", "/api/auth/register", { phone: `6${stamp}1`, name: "Autre Client", pin: "1234", role: "client" });
await collA.call("POST", "/api/auth/register", { phone: `6${stamp}2`, name: "Jean-Paul", pin: "1234", role: "collector" });
await collB.call("POST", "/api/auth/register", { phone: `6${stamp}3`, name: "Paul", pin: "1234", role: "collector" });

r = await client.call("POST", "/api/auth/register", { phone: `6${stamp}0`, name: "Doublon", pin: "1234", role: "client" });
check("téléphone unique (CONFLICT)", r.status === 409);
r = await client.call("POST", "/api/auth/register", { phone: "671111111", name: "Pirate", pin: "1234", role: "admin" });
check("inscription admin refusée", r.status === 400);

r = await admin.call("POST", "/api/auth/login", { phone: process.env.ADMIN_PHONE ?? "670000000", pin: process.env.ADMIN_PIN ?? "123456" });
check("connexion admin", r.status === 200 && r.data.user.role === "admin", JSON.stringify(r));

r = await client.call("GET", "/api/pricing/quote?type=menagers&volume=2");
check("prix ménagers × 2 = 7 500", r.data?.price === 7500, JSON.stringify(r));

r = await client.call("POST", "/api/reports", undefined, photoForm({ wasteType: "menagers", volume: "2", addressHint: "Devant la quincaillerie, Bastos" }));
check("signalement créé, prix figé par le serveur", r.status === 201 && r.data.price === 7500 && r.data.status === "pending", JSON.stringify(r));
const id = r.data?.id;

r = await client.call("POST", "/api/reports", undefined, (() => { const f = new FormData(); f.set("wasteType", "menagers"); f.set("volume", "2"); f.set("addressHint", "Sans photo ici"); return f; })());
check("photo obligatoire à la création", r.status === 400);

r = await collA.call("GET", "/api/reports");
check("collecteur non validé : aucune demande visible", r.data.nearby.length === 0);
r = await collA.call("POST", `/api/reports/${id}/accept`);
check("collecteur non validé ne peut pas accepter", r.status === 403, JSON.stringify(r));

const pending = await admin.call("GET", "/api/admin/collectors");
for (const c of pending.data.filter((u) => u.phone.endsWith(`${stamp}2`) || u.phone.endsWith(`${stamp}3`))) {
  await admin.call("POST", `/api/admin/collectors/${c.id}/validate`);
}
r = await collA.call("GET", "/api/reports");
check("collecteur validé voit la demande", r.data.nearby.some((x) => x.id === id));

r = await client2.call("GET", `/api/reports/${id}`);
check("un autre client ne voit pas ce signalement", r.status === 403);

// Course : deux collecteurs acceptent en même temps, un seul gagne
const [a, b] = await Promise.all([collA.call("POST", `/api/reports/${id}/accept`), collB.call("POST", `/api/reports/${id}/accept`)]);
const codes = [a.status, b.status].sort();
check("le premier arrivé gagne (200 + 409)", codes[0] === 200 && codes[1] === 409, JSON.stringify([a, b]));
const winner = a.status === 200 ? collA : collB;
const loser = a.status === 200 ? collB : collA;

r = await loser.call("POST", `/api/reports/${id}/collect`, undefined, photoForm());
check("le perdant ne peut pas collecter", r.status === 403);
r = await winner.call("POST", `/api/reports/${id}/collect`, undefined, new FormData());
check("photo finale obligatoire pour collecter", r.status === 400, JSON.stringify(r));
r = await winner.call("POST", `/api/reports/${id}/pay`, {});
check("pas de paiement avant collecte", r.status === 409);

r = await winner.call("POST", `/api/reports/${id}/collect`, undefined, photoForm());
check("collecte avec photo", r.status === 200 && r.data.status === "collected", JSON.stringify(r));

r = await client.call("POST", `/api/reports/${id}/cancel`);
check("annulation impossible après collecte", r.status === 409);

r = await winner.call("POST", `/api/reports/${id}/pay`, { method: "cash" });
check("paiement espèces : 750 commission / 6 750 collecteur", r.status === 200 && r.data.commission === 750 && r.data.collectorAmount === 6750, JSON.stringify(r));
r = await winner.call("POST", `/api/reports/${id}/pay`, { method: "cash" });
check("paiement idempotent (rejouable hors ligne)", r.status === 200 && r.data.amount === 7500);

r = await client.call("GET", `/api/reports/${id}`);
check("détail client : paid, 2 photos, 4 événements", r.data.report.status === "paid" && r.data.photos.length === 2 && r.data.events.length === 4, JSON.stringify(r.data?.events?.length));
const photoId = r.data.photos[0].id;
const img = await fetch(`${BASE}/api/photos/${photoId}`, { headers: { cookie: client.cookie } });
check("photo servie au propriétaire", img.status === 200 && img.headers.get("content-type") === "image/png");
const img2 = await fetch(`${BASE}/api/photos/${photoId}`, { headers: { cookie: client2.cookie } });
check("photo refusée à un autre client", img2.status === 404);

r = await client.call("POST", `/api/reports/${id}/claims`, { reason: "Test de réclamation après collecte" });
check("réclamation après collecte", r.status === 200 && r.data.status === "open", JSON.stringify(r));
const claims = await admin.call("GET", "/api/admin/claims");
const mine = claims.data.find((c) => c.id === r.data.id);
r = await admin.call("POST", `/api/admin/claims/${mine.id}/resolve`, { resolution: "Nouvelle collecte planifiée" });
check("admin clôture la réclamation", r.status === 200 && r.data.status === "resolved");

r = await new Session().call("GET", "/api/reports");
check("API protégée sans session (401)", r.status === 401);

const bad = new Session();
let last;
for (let i = 0; i < 6; i++) last = await bad.call("POST", "/api/auth/login", { phone: `6${stamp}0`, pin: "9999" });
check("verrouillage après 5 codes faux", last.status === 403, JSON.stringify(last));

console.log(failures === 0 ? "\nTout est vert ✅" : `\n${failures} échec(s) ❌`);
process.exit(failures === 0 ? 0 : 1);
