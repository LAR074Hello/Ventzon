import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ventzon.app',
  appName: 'Ventzon',
  webDir: 'out',
  server: {
    url: 'https://www.ventzon.com/customer',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#000000',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false,
    },
    StatusBar: {
      style: 'Light',
      backgroundColor: '#000000',
    },
  },
};

export default config;
