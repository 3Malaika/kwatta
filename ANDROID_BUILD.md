# Guide de build Android pour Kwatta

## Configuration initiale

### 1. Installer Capacitor (quand la connexion est meilleure)

```bash
npm install
```

Les dépendances Capacitor sont déjà dans `package.json`.

### 2. Initialiser le projet Android

```bash
# Ajouter la plateforme Android
npm run cap:add

# Ou directement avec npx
npx cap add android
```

Cela créera le dossier `android/` avec tous les fichiers nécessaires.

## Build local

### Build de développement (debug APK)

```bash
# 1. Build Next.js en mode statique
npm run build

# 2. Synchroniser avec Capacitor
npm run cap:sync

# 3. Build l'APK debug
npm run android:build-debug
```

L'APK sera dans : `android/app/build/outputs/apk/debug/app-debug.apk`

### Build de production (release APK)

```bash
# 1. Build Next.js
npm run build

# 2. Sync avec Capacitor
npm run cap:sync

# 3. Build l'APK release
npm run android:build
```

L'APK sera dans : `android/app/build/outputs/apk/release/app-release-unsigned.apk`

**Note** : L'APK release n'est pas signé. Pour le distribuer sur le Play Store, vous devrez le signer.

## Build automatique avec GitHub Actions

Le workflow `.github/workflows/build-android.yml` est déjà configuré.

### Déclenchement automatique

Le workflow se déclenche automatiquement sur :
- **Push** sur les branches `main` ou `develop`
- **Pull Request** vers `main`
- **Tag** commençant par `v` (ex: `v1.0.0`)
- **Manuellement** depuis l'onglet Actions de GitHub

### Récupérer les APK

Après chaque build :
1. Allez dans l'onglet **Actions** de votre repo GitHub
2. Cliquez sur le workflow terminé
3. Téléchargez les artifacts :
   - `app-debug` : APK de debug
   - `app-release-unsigned` : APK de release (non signé)

### Créer une release

Pour créer une release avec les APK attachés :

```bash
git tag v1.0.0
git push origin v1.0.0
```

Les APK seront automatiquement attachés à la release GitHub.

## Signer l'APK pour la production

### Créer une clé de signature

```bash
keytool -genkey -v -keystore kwatta-release-key.keystore \
  -alias kwatta -keyalg RSA -keysize 2048 -validity 10000
```

### Configurer dans GitHub Actions

Ajoutez ces secrets dans GitHub (Settings → Secrets and variables → Actions) :

- `KEYSTORE_FILE` : Le fichier .keystore encodé en base64
- `KEYSTORE_PASSWORD` : Mot de passe du keystore
- `KEY_ALIAS` : Alias de la clé (ex: kwatta)
- `KEY_PASSWORD` : Mot de passe de la clé

Pour encoder le keystore :

```bash
# Linux/Mac
base64 kwatta-release-key.keystore | tr -d '\n' > keystore_base64.txt

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("kwatta-release-key.keystore")) > keystore_base64.txt
```

## Prérequis locaux

Pour build localement, vous avez besoin de :

- **Node.js** 20.6+
- **Java JDK** 17+ (pour Gradle)
- **Android Studio** (optionnel, mais recommandé pour le SDK Android)
- **Android SDK** (installé avec Android Studio ou via `sdkmanager`)

### Variables d'environnement Android

```bash
# Linux/Mac (~/.bashrc ou ~/.zshrc)
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Windows (Variables d'environnement système)
ANDROID_HOME=C:\Users\<USER>\AppData\Local\Android\Sdk
```

## Personnalisation de l'app

### Icône et splash screen

Les icônes sont dans `public/` :
- `icon-192.png`
- `icon-512.png`

Pour mettre à jour l'icône Android :

```bash
npx capacitor-assets generate --android
```

### Nom de l'app et ID

Modifiez `capacitor.config.ts` :

```typescript
{
  appId: 'com.kwatta.app',      // ID unique (pour Play Store)
  appName: 'Kwatta',             // Nom affiché
  // ...
}
```

### Permissions Android

Les permissions sont dans `android/app/src/main/AndroidManifest.xml`.

Permissions déjà incluses (par défaut Capacitor) :
- `INTERNET`
- `ACCESS_NETWORK_STATE`
- `CAMERA` (pour les photos)
- `READ_EXTERNAL_STORAGE`
- `WRITE_EXTERNAL_STORAGE`

## Tester l'APK

### Sur un appareil physique

1. Activer le **mode développeur** sur votre téléphone
2. Activer **Installation depuis des sources inconnues**
3. Transférer l'APK et l'installer

### Sur un émulateur

```bash
# Avec Android Studio, créez un AVD puis :
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Problèmes courants

### "SDK location not found"

Définissez `ANDROID_HOME` dans vos variables d'environnement.

### "Gradle build failed"

Vérifiez que Java JDK 17 est installé :

```bash
java -version
```

### L'app ne se connecte pas au serveur

Dans l'APK, l'app est statique (export Next.js). Vous devez soit :
1. **Héberger le backend** séparément et configurer l'URL de l'API
2. **Utiliser un serveur de développement** et configurer `capacitor.config.ts` :

```typescript
server: {
  url: 'http://192.168.1.X:3000',  // IP locale de votre serveur
  cleartext: true
}
```

## Notes importantes

⚠️ **L'app Kwatta utilise des API Next.js côté serveur** (routes API dans `src/app/api/`). Un export statique ne fonctionnera pas pour toutes les fonctionnalités.

**Solutions possibles** :
1. Déployer le backend sur un serveur et pointer l'app mobile vers cette URL
2. Utiliser une architecture API séparée (FastAPI, Express, etc.)
3. Garder Next.js en mode serveur et utiliser Capacitor en mode dev (server.url)

Pour ce MVP, **option recommandée** : déployer le backend Next.js sur Vercel/Railway/etc. et configurer l'app mobile pour pointer vers cette URL.
