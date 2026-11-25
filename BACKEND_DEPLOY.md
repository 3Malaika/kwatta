# Déploiement du Backend pour l'app mobile

L'application Kwatta utilise des routes API Next.js côté serveur. Pour que l'app mobile fonctionne, vous devez déployer le backend sur un serveur.

## Option 1 : Vercel (Recommandé - Gratuit)

### Installation

```bash
npm install -g vercel
```

### Déploiement

```bash
# Se connecter
vercel login

# Premier déploiement (développement)
vercel

# Déploiement en production
vercel --prod
```

Vercel vous donnera une URL comme : `https://kwatta-mvp.vercel.app`

### Configuration de la base de données

Vercel ne fournit pas de base de données PostgreSQL. Options :

1. **Neon.tech** (gratuit) : https://neon.tech
2. **Supabase** (gratuit) : https://supabase.com
3. **Railway** (gratuit avec limites) : https://railway.app

Dans Vercel, ajoutez les variables d'environnement :
- `DATABASE_URL` : URL de connexion PostgreSQL
- `SESSION_SECRET` : Clé secrète aléatoire
- `ADMIN_PHONE` : Téléphone admin
- `ADMIN_PIN` : Code PIN admin

## Option 2 : Railway (Backend + Base de données)

Railway fournit à la fois l'hébergement et PostgreSQL gratuitement.

### Déploiement

1. Allez sur https://railway.app
2. Connectez-vous avec GitHub
3. Cliquez sur **"New Project"**
4. Sélectionnez **"Deploy from GitHub repo"**
5. Choisissez votre repo `kwatta-mvp`
6. Railway détecte automatiquement Next.js et déploie

### Ajouter PostgreSQL

1. Dans votre projet Railway, cliquez **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway créera automatiquement la variable `DATABASE_URL`
3. Ajoutez les autres variables d'environnement dans Settings → Variables

Railway vous donnera une URL comme : `https://kwatta-mvp-production.up.railway.app`

## Option 3 : Render (Gratuit)

1. Allez sur https://render.com
2. Créez un nouveau **Web Service**
3. Connectez votre repo GitHub
4. Configuration :
   - **Build Command** : `npm install && npm run db:migrate`
   - **Start Command** : `npm start`
   - **Environment** : Node

5. Ajoutez PostgreSQL :
   - Dans le dashboard, créez une nouvelle **PostgreSQL database**
   - Liez-la à votre Web Service

Render vous donnera une URL comme : `https://kwatta-mvp.onrender.com`

## Configurer l'app mobile avec l'URL du backend

### Dans GitHub Secrets

1. Allez dans votre repo GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Créez un nouveau secret :
   - **Name** : `API_URL`
   - **Value** : L'URL de votre backend déployé (ex: `https://kwatta-mvp.vercel.app`)

### Pour build local

Créez un fichier `.env.local` :

```env
NEXT_PUBLIC_API_URL=https://kwatta-mvp.vercel.app
```

Puis buildez :

```bash
npm install
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
```

## Tester l'app avec le backend

1. Déployez le backend sur une des plateformes ci-dessus
2. Configurez l'URL dans GitHub Secrets (`API_URL`)
3. Poussez un nouveau commit pour déclencher un build
4. Téléchargez l'APK généré
5. Installez-le sur votre téléphone

L'app devrait maintenant communiquer avec votre backend déployé !

## Variables d'environnement requises

Sur votre plateforme d'hébergement, configurez :

```env
# Base de données
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Session
SESSION_SECRET=your-random-secret-key-here

# Admin
ADMIN_PHONE=+237600000000
ADMIN_PIN=1234

# Optionnel (si vous voulez des valeurs par défaut différentes)
MVP_DISABLED_STATUSES=
BASTOS_LAT=3.8732
BASTOS_LON=11.5174
BASTOS_RADIUS=3000
```

## Vérifier le déploiement

Testez l'API déployée :

```bash
# Vérifier que l'API répond
curl https://votre-backend.com/api/auth/me

# Devrait retourner quelque chose comme :
# {"user":null} ou une erreur 401
```

Si ça fonctionne, votre backend est prêt pour l'app mobile !

## Coûts

- **Vercel** : Gratuit (avec limites : 100 GB bandwidth/mois, serverless functions)
- **Railway** : $5 de crédit gratuit/mois (suffisant pour un MVP)
- **Render** : Gratuit avec limitations (service s'endort après 15 min d'inactivité)
- **Neon/Supabase** : Gratuit pour PostgreSQL (1 GB de données)

Pour un MVP avec quelques utilisateurs, **Railway est recommandé** car il inclut tout (backend + base de données).
