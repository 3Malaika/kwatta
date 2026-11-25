import type { CapacitorConfig } from '@capacitor/cli';

// 🔧 CONFIGURATION : Remplacez cette URL par votre backend Railway
const BACKEND_URL = process.env.BACKEND_URL || 'https://VOTRE-APP.up.railway.app';

const config: CapacitorConfig = {
  appId: 'com.kwatta.app',
  appName: 'Kwatta',
  webDir: 'www',
  server: {
    // L'app mobile chargera directement le backend déployé
    url: BACKEND_URL,
    cleartext: false,
    androidScheme: 'https'
  }
};

export default config;
