# Connecter l'APK au backend Railway

Votre backend : **https://kwatta-production.up.railway.app/**

## Option A : Via GitHub Secrets (Recommandé)

### 1. Ajouter le secret sur GitHub

1. Allez sur votre repo GitHub : https://github.com/3Malaika/kwatta
2. Cliquez sur **Settings** (en haut)
3. Dans le menu gauche : **Secrets and variables** → **Actions**
4. Cliquez sur **New repository secret**
5. Remplissez :
   - **Name** : `BACKEND_URL`
   - **Secret** : `https://kwatta-production.up.railway.app`
6. Cliquez **Add secret**

### 2. Déclencher un nouveau build

Faites n'importe quel commit pour déclencher le build :

```bash
git commit --allow-empty -m "Connect APK to Railway backend"
git push
```

### 3. Télécharger l'APK

Une fois le build terminé (5-10 minutes) :
1. GitHub → **Actions**
2. Cliquez sur le dernier workflow ✅
3. Descendez à **Artifacts**
4. Téléchargez **app-debug.apk**

L'APK sera maintenant connecté à votre backend Railway ! 🎉

---

## Option B : Modifier directement le fichier (Plus rapide)

Si vous voulez tester rapidement sans attendre GitHub Actions.

### 1. Modifiez `capacitor.config.ts`

Ligne 4, changez :
```typescript
const BACKEND_URL = process.env.BACKEND_URL || 'https://kwatta-production.up.railway.app';
```

### 2. Commitez et pushez

```bash
git add capacitor.config.ts
git commit -m "Configure backend URL for Railway"
git push
```

GitHub Actions va générer l'APK automatiquement.

---

## Avant de tester l'APK : Initialiser la base de données

### Dans Railway :

1. Ouvrez votre service Kwatta
2. Cliquez sur l'onglet **Terminal** (en haut)
3. Lancez :
   ```bash
   npm run db:setup
   ```

Cela va :
- Créer les tables PostgreSQL
- Créer la zone (Bastos)
- Créer les tarifs
- Créer le compte admin

### Vérifier les variables d'environnement

Dans Railway → **Variables**, assurez-vous d'avoir :

```env
DATABASE_URL=postgresql://...  (automatique)
SESSION_SECRET=un-secret-aleatoire-ici
ADMIN_PHONE=+237600000000
ADMIN_PIN=1234
NODE_ENV=production
```

---

## Tester l'APK

1. **Téléchargez** `app-debug.apk` depuis GitHub Actions
2. **Transférez-le** sur votre téléphone
3. **Installez-le** (activez "Sources inconnues")
4. **Ouvrez l'app** - elle va charger votre backend Railway
5. **Connectez-vous** avec `ADMIN_PHONE` et `ADMIN_PIN`

L'app devrait fonctionner complètement ! 🚀

---

## Alternative : Utiliser la PWA (encore plus simple !)

Pas besoin d'APK ! Votre backend Railway fonctionne déjà comme PWA :

1. Sur votre téléphone, ouvrez : **https://kwatta-production.up.railway.app**
2. Chrome propose **"Ajouter à l'écran d'accueil"**
3. L'app s'ouvre comme une vraie application native

✅ Avantages PWA :
- Immédiat (pas d'APK à générer)
- Fonctionne sur iOS et Android
- Mises à jour automatiques
- Pas besoin du Play Store

---

## Notes importantes

⚠️ **Stockage des photos** : Railway utilise `/tmp` (temporaire). Les photos disparaissent au redémarrage. Pour la production, ajoutez Cloudflare R2 ou Supabase Storage.

✅ **Pour le MVP** : C'est suffisant pour tester le workflow complet.
