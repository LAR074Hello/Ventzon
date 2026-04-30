import { registerPlugin } from "@capacitor/core";

export interface AppleSignInOptions {
  clientId: string;
  redirectURI: string;
  scopes?: string;
  state?: string;
  nonce?: string;
}

export interface AppleSignInResponse {
  response: {
    user?: string | null;
    email?: string | null;
    givenName?: string | null;
    familyName?: string | null;
    identityToken?: string | null;
    authorizationCode?: string | null;
  };
}

export interface AppleSignInPlugin {
  authorize(options: AppleSignInOptions): Promise<AppleSignInResponse>;
}

// Use Capacitor's registerPlugin directly so this resolves correctly
// in both web (Next.js/Vercel) and native (iOS) environments.
// The native Swift implementation handles the actual Apple Sign In flow.
export const SignInWithApple = registerPlugin<AppleSignInPlugin>(
  "SignInWithApple"
);
