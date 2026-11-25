# Déploiement rapide sans installer les dépendances

## Pousser sur GitHub

```bash
# Remplacez VOTRE_USERNAME par votre nom d'utilisateur GitHub
git remote add origin https://github.com/VOTRE_USERNAME/kwatta-mvp.git
git branch -M main
git push -u origin main
```

## Ce qui va se passer

1. **Votre code sera poussé** sur GitHub (sans node_modules)
2. **GitHub Actions se déclenchera automatiquement**
3. **GitHub installera les dépendances** dans le cloud
4. **L'APK sera généré automatiquement**
5. **Vous pourrez télécharger l'APK** dans l'onglet Actions

## Télécharger l'APK généré

1. Allez sur votre repo GitHub
2. Cliquez sur l'onglet **Actions**
3. Cliquez sur le workflow en cours (Build Android APK)
4. Une fois terminé, descendez jusqu'à **Artifacts**
5. Téléchargez :
   - `app-debug` (pour tester)
   - `app-release-unsigned` (pour la production, à signer)

## Créer une release avec APK

Pour créer une release officielle :

```bash
git tag v1.0.0
git push origin v1.0.0
```

Les APK seront automatiquement attachés à la release dans l'onglet **Releases**.

## Builds suivants

À chaque push sur `main` ou `develop`, un nouvel APK sera généré automatiquement !

```bash
# Faire des modifications
git add .
git commit -m "Description des changements"
git push
```

GitHub Actions s'occupera du reste.

## Notes importantes

- ❌ Pas besoin d'installer les dépendances localement
- ❌ Pas besoin d'installer Android Studio
- ❌ Pas besoin d'avoir Java JDK
- ✅ Tout se passe dans le cloud avec GitHub Actions
- ✅ Vous récupérez juste l'APK prêt à l'emploi

## Si le build échoue

Vérifiez les logs dans Actions pour voir l'erreur. Les causes communes :
- Erreur TypeScript (vérifiez avec `npm run typecheck` localement)
- Dépendance manquante dans package.json
- Problème de configuration Capacitor

## Configuration du backend

L'app mobile aura besoin d'un backend déployé. Options :

### Option 1 : Vercel (gratuit)
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Option 2 : Railway (gratuit)
1. Allez sur https://railway.app
2. Connectez votre repo GitHub
3. Railway déploiera automatiquement

### Option 3 : Render (gratuit)
1. Allez sur https://render.com
2. Créez un nouveau Web Service
3. Connectez votre repo

Une fois déployé, configurez l'URL dans l'app mobile (voir ANDROID_BUILD.md).
