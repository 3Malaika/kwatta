# Guide de génération APK pour Kwatta

## 🎯 Approche actuelle : APK Placeholder

Le workflow GitHub Actions génère maintenant un **APK de base** qui s'installe correctement.

Cet APK affiche une page d'accueil simple mais **ne contient pas encore l'application complète** car Kwatta utilise Next.js avec des routes API côté serveur.

## 📱 Deux approches possibles :

### Approche 1 : Application connectée à un backend déployé ⭐ Recommandé

Cette approche permet de garder toute la logique côté serveur.

**Étapes :**

1. **Déployer le backend** sur Railway/Vercel/Render (voir `BACKEND_DEPLOY.md`)
   
2. **Modifier `capacitor.config.ts`** :
   ```typescript
   server: {
     url: 'https://votre-backend.com',  // Votre URL déployée
     cleartext: true,
   }
   ```

3. **Pousser** et l'APK sera régénéré avec la connexion au backend

**Avantages :**
- ✅ Toutes les fonctionnalités de l'app
- ✅ Mises à jour du backend sans rebuilder l'APK
- ✅ Authentification et base de données fonctionnelles

**Inconvénients :**
- ❌ Nécessite un backend déployé et accessible
- ❌ Dépend de la connexion internet

### Approche 2 : Application hybride (React Native / Expo) 

Réécrire l'application en React Native pour avoir une vraie app native avec stockage local.

**Avantages :**
- ✅ App 100% native
- ✅ Fonctionne offline
- ✅ Meilleures performances

**Inconvénients :**
- ❌ Nécessite de réécrire le frontend
- ❌ Plus de travail de développement

## 🚀 Solution rapide recommandée

**Pour le MVP, utilisez l'Approche 1 :**

1. Déployez sur **Railway** (gratuit + simple) :
   - https://railway.app
   - Connectez votre repo GitHub
   - Ajoutez PostgreSQL
   - Copiez l'URL générée

2. Modifiez `capacitor.config.ts` avec votre URL

3. Poussez sur GitHub

4. Téléchargez l'APK généré dans Actions

## 📦 APK actuel

L'APK actuel est un **placeholder** qui :
- ✅ S'installe correctement
- ✅ S'ouvre sans crash
- ❌ N'a pas les fonctionnalités complètes
- ❌ Affiche juste une page d'accueil

C'est normal ! C'est une première étape pour valider que le build fonctionne.

## 🔧 Prochaine étape

Choisissez votre approche et suivez le guide correspondant :
- **Approche 1** → `BACKEND_DEPLOY.md`
- **Approche 2** → Contactez-moi pour de l'aide sur la migration React Native

## 💡 Alternative : PWA (Progressive Web App)

Kwatta est déjà une PWA ! Vous pouvez :
1. Déployer le site sur Vercel/Railway
2. Ouvrir l'URL sur mobile
3. Ajouter à l'écran d'accueil

L'app fonctionnera comme une application native (mais dans le navigateur).

**Avantages de la PWA :**
- ✅ Pas besoin de Play Store
- ✅ Mises à jour instantanées
- ✅ Fonctionne sur iOS et Android
- ✅ Déjà configurée (voir `public/manifest.webmanifest`)

**Pour tester la PWA :**
```bash
# Déployez sur Vercel
vercel --prod

# Ouvrez l'URL sur votre téléphone
# Chrome vous proposera "Ajouter à l'écran d'accueil"
```

C'est peut-être la solution la plus simple pour votre MVP ! 🎉
