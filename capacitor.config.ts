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
    // 'automatic' let iOS apply the safe-area inset to the webview's scroll
    // view natively, which SHRANK the web content and left a gap that the
    // native backgroundColor showed through — the black bar at the top of the
    // screen, plus the app not filling the viewport. Those were two bugs
    // compounding: this one opened the gap, backgroundColor coloured it black.
    // 'never' hands inset handling to the web layer, which does it with
    // env(safe-area-inset-*) — and that only works with viewport-fit=cover,
    // so this change is meaningless unless the web side ships alongside it.
    contentInset: 'never',
    backgroundColor: '#F7F7F4',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      // Was #000000 against a light app: a black flash on every launch.
      backgroundColor: '#F7F7F4',
      showSpinner: false,
    },
    StatusBar: {
      // Capacitor's 'Light' means LIGHT TEXT, for dark backgrounds. On a light
      // app that rendered white glyphs on a near-white bar — which is why only
      // the battery percentage was legible, and only over the black region.
      // 'Dark' = dark text.
      style: 'Dark',
      backgroundColor: '#F7F7F4',
    },
  },
};

export default config;
