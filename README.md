# Kwatta — MVP

Signalement de dépôts sauvages à Yaoundé. **Une boucle** : le client signale et voit le prix → le collecteur accepte, collecte, photographie → paiement en espèces.

Périmètre du MVP réduit : un seul quartier (Bastos par défaut), connexion par téléphone + code, espèces uniquement, 4 statuts (En attente → Acceptée → Collectée → Payée, + Annulée). Objectif : 20 collectes payées en deux semaines.

## Démarrer

```bash
cp .env.example .env            # puis changez SESSION_SECRET
docker compose up -d            # PostgreSQL local (ou votre propre base)
npm install
npm run db:setup                # migrations + zone, tarifs, compte admin
npm run dev                     # http://localhost:3000
```

Prérequis : Node 20.6+.

Vérifications :

```bash
npm test            # 30 tests : prix, statuts, droits, validateurs, architecture
npm run typecheck
npm run smoke       # test de bout en bout (app démarrée) : 26 scénarios, dont la course entre 2 collecteurs
```

Comptes : l'admin est créé par le seed (`ADMIN_PHONE` / `ADMIN_PIN` du `.env`). Clients et collecteurs s'inscrivent eux-mêmes ; **un collecteur doit être validé par l'admin** (écran `/admin`) avant de voir des demandes.

## Architecture

```
src/
├─ domain/    ne dépend de rien : statuts, prix, droits, validateurs, types
├─ data/      repos (un par table), stockage de fichiers
├─ back/      handler (auth, erreurs), services (règles métier), routes, payments/
├─ front/     features/ (client, collecteur, admin), ui/, hooks/, lib/
└─ app/       fichiers fins exigés par Next.js : routes API et pages qui délèguent à back/ et front/
db/           migrations SQL, seed
tests/        domain d'abord, + test d'architecture
```

Règles, vérifiées par `tests/architecture.test.ts` : le front n'importe jamais `back` ni `data` (il parle au serveur en HTTP), le back n'importe pas le front, `domain` n'importe rien. Toute écriture passe par le serveur.

**Étendre sans modifier :**

| Je veux… | Je touche… |
|---|---|
| Autoriser une transition de plus | une ligne dans `domain/transitions.ts` |
| Réactiver « En route » | vider `MVP_DISABLED_STATUSES` |
| Changer qui peut quoi | une ligne dans `domain/policies.ts` |
| Ajouter MTN MoMo / Orange | implémenter `back/payments/mtn.ts` puis l'ajouter à `ENABLED_METHODS` |
| Changer un prix | table `tariffs` / `settings` (pas le code) |
| Passer le stockage sur S3 / R2 | `data/storage/files.ts` (2 fonctions) |

## Points clés de conception

- **Prix** `P = arrondi50(B[type] × V + F × (V > 1))` calculé uniquement par le serveur (`domain/pricing.ts`), figé dans `reports.price` à la création. Le front l'affiche via `/api/pricing/quote`.
- **Le premier arrivé gagne** : `UPDATE … WHERE status = 'pending'` (écriture conditionnelle). Le perdant reçoit `CONFLICT` (409).
- **Photo exigée** : à la création (dépôt) et avant « collecté » (preuve).
- **Transactions** : statut + historique + photo + paiement réussissent ensemble.
- **Paiement idempotent** : rejouer « encaissé » ne crée pas de doublon (utile pour la file hors ligne).
- **Réseau faible** : photos compressées côté client (1280 px, JPEG 70 %), brouillon de signalement en `localStorage`, file hors ligne pour « encaissé », cache client avec rafraîchissement, PWA installable.
- **Sécurité** : PIN haché (scrypt), session signée en cookie HttpOnly, blocage 15 min après 5 codes faux, droits vérifiés côté serveur, photos servies seulement aux personnes autorisées, coordonnées partagées seulement après acceptation.

## API

| Route | Qui | Rôle |
|---|---|---|
| `POST /api/auth/register · login · logout`, `GET /api/auth/me` | public / connecté | session |
| `GET /api/pricing/quote?type=&volume=` | connecté | prix serveur |
| `GET /api/reports` | tous | mes signalements (+ demandes proches pour un collecteur validé) |
| `POST /api/reports` (multipart, photo) | client | créer |
| `GET /api/reports/:id` | selon droits | détail, photos, historique |
| `POST /api/reports/:id/accept` | collecteur | accepter |
| `POST /api/reports/:id/collect` (multipart, photo) | collecteur | collecter |
| `POST /api/reports/:id/pay` | collecteur | encaisser |
| `POST /api/reports/:id/cancel` | client / admin | annuler |
| `POST /api/reports/:id/claims` | client | réclamation |
| `GET /api/photos/:id` | selon droits | image |
| `GET /api/admin/collectors`, `POST …/:id/validate` | admin | valider un collecteur |
| `GET /api/admin/claims`, `POST …/:id/resolve` | admin | litiges |

Erreurs : `{ "error": { "code": "CONFLICT", "message": "…" } }` avec les codes `VALIDATION`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `NOT_IMPLEMENTED`.

## Ce qui est volontairement hors MVP

Carte en direct et suivi GPS du collecteur, MTN MoMo / Orange Money (adaptateurs en stub), notation, portefeuille, tournées multi-arrêts et pesée, messagerie, partage de suivi. Le champ GPS du signalement est facultatif et la formule de prix GPS est prête (désactivée tant que `gps_per_km = 0`).

## À faire avant le pilote

1. **Calibrer les tarifs.** Les prix de `db/seed.sql` sont des **placeholders**. B, F et la commission doivent venir de l'enquête de coûts (transport + décharge + temps).
2. **Décider comment récupérer la commission de 10 %** : en espèces, le collecteur encaisse tout (ex. solde reversé chaque semaine).
3. **Production** : hébergeur Postgres, stockage de photos hors du disque du serveur, HTTPS, sauvegardes, `SESSION_SECRET` aléatoire, limitation de débit sur `/api/auth/*` (le blocage par compte existe, pas encore par IP).
4. **Connexion** : téléphone + code, sans SMS. Une vérification OTP par SMS pourra s'ajouter plus tard.
5. Tester sur un téléphone modeste en 3G.

## Maquettes

Les pages reprennent l'identité des maquettes (vert `#00431E`, terracotta `#A53C00`, crème `#F6F4EE`, DM Sans) mais en version simplifiée : sans carte, sans notes, sans Material Symbols ni Tailwind CDN. Le style est dans `src/app/globals.css`.
