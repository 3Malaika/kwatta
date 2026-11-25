import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kwatta.app',
  appName: 'Kwatta',
  webDir: '.next',
  server: {
    // En mode développement, pointez vers votre serveur local
    // En production, configurez l'URL de votre backend déployé
    url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    cleartext: true,
    androidScheme: 'http'
  }
};

export default config;
