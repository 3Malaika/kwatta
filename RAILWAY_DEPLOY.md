# Déploiement sur Railway (Recommandé)

Railway est **plus simple que Vercel** pour Kwatta car il inclut PostgreSQL.

## Pourquoi Railway plutôt que Vercel ?

| Besoin | Vercel | Railway |
|--------|--------|---------|
| Backend Next.js | ✅ | ✅ |
| PostgreSQL | ❌ (externe requis) | ✅ Inclus |
| Stockage fichiers | ❌ (S3 requis) | ⚠️ Temporaire |
| Configuration | Complexe | Simple |

## Déploiement Railway en 5 minutes

### 1. Créer un compte Railway

Allez sur https://railway.app et connectez-vous avec GitHub

### 2. Créer un nouveau projet

1. Cliquez **"New Project"**
2. Choisissez **"Deploy from GitHub repo"**
3. Sélectionnez votre repo `kwatta`
4. Railway détecte automatiquement Next.js

### 3. Ajouter PostgreSQL

1. Dans votre projet, cliquez **"New"**
2. Choisissez **"Database"**
3. Sélectionnez **"Add PostgreSQL"**
4. Railway crée automatiquement la variable `DATABASE_URL`

### 4. Configurer les variables d'environnement

Dans **Variables** de votre service, ajoutez :

```env
# Déjà présent automatiquement :
DATABASE_URL=postgresql://...

# À ajouter manuellement :
SESSION_SECRET=un-secret-aleatoire-tres-long-ici
ADMIN_PHONE=+237600000000
ADMIN_PIN=1234
NODE_ENV=production
```

### 5. Déployer

Railway déploie automatiquement ! Attendez 2-3 minutes.

Vous obtiendrez une URL comme : `https://kwatta-production.up.railway.app`

### 6. Initialiser la base de données

Une fois déployé, ouvrez le **Terminal** dans Railway et lancez :

```bash
npm run db:setup
```

Cela créera les tables et le compte admin.

## Tester le déploiement

Ouvrez l'URL dans votre navigateur. Vous devriez voir la page de connexion Kwatta.

Testez la connexion avec :
- **Phone** : Le numéro défini dans `ADMIN_PHONE`
- **PIN** : Le code défini dans `ADMIN_PIN`

## Utiliser l'URL pour l'app mobile

### Option A : PWA (le plus simple)

1. Ouvrez l'URL Railway sur votre téléphone
2. Chrome propose "Ajouter à l'écran d'accueil"
3. L'app fonctionne comme une application native

### Option B : APK Capacitor

1. Modifiez `capacitor.config.ts` :
   ```typescript
   server: {
     url: 'https://kwatta-production.up.railway.app',
     cleartext: false,
     androidScheme: 'https'
   }
   ```

2. Push sur GitHub → L'APK se régénère automatiquement

3. Téléchargez l'APK dans Actions → Il sera connecté à votre backend Railway

## Coûts Railway

- **$5 de crédit gratuit/mois**
- Suffisant pour :
  - Backend Next.js
  - PostgreSQL (1 GB)
  - ~100 000 requêtes/mois

Largement suffisant pour un MVP avec 20-50 utilisateurs !

## Problème de stockage de photos

⚠️ **Railway ne persiste pas les fichiers uploadés** (comme Vercel).

Les photos sont stockées en **mémoire temporaire** et disparaissent au redémarrage.

### Solutions :

**Pour le MVP (test rapide)** : Acceptez que les photos soient temporaires

**Pour la production** : Ajoutez un stockage externe :
- **Cloudflare R2** (gratuit 10 GB)
- **Supabase Storage** (gratuit 1 GB)
- **AWS S3** (payant)

Le code est déjà structuré pour faciliter le changement (voir `src/data/storage/files.ts`).

## Alternative : Supabase (tout-en-un)

Si vous voulez **PostgreSQL + Stockage de fichiers** gratuits :

1. Créez un compte sur https://supabase.com
2. Créez un projet
3. Utilisez l'URL PostgreSQL dans Railway
4. Utilisez Supabase Storage pour les photos

## Prochaines étapes

Une fois Railway déployé avec succès :

1. ✅ Testez l'URL dans votre navigateur
2. ✅ Ajoutez-la à l'écran d'accueil (PWA)
3. ✅ Ou générez un APK connecté
4. ✅ Testez le workflow complet (signalement → collecte → paiement)

Besoin d'aide ? Consultez les logs Railway pour débugger les erreurs.
