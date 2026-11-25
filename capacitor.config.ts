import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kwatta.app',
  appName: 'Kwatta',
  webDir: 'www',
  server: {
    // Pour connecter à un backend déployé, décommentez et configurez l'URL :
    // url: 'https://votre-backend.com',
    // cleartext: true,
    androidScheme: 'https'
  }
};

export default config;
