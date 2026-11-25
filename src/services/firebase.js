import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider
} from 'firebase/app-check';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(config.apiKey && config.projectId);
export const firebaseApp = firebaseConfigured ? (getApps()[0] || initializeApp(config)) : null;
// Firebase App Check
let appCheck = null;

if (firebaseApp) {
  // Local development only.
  // Firebase will print a debug token in the browser console.
  if (import.meta.env.DEV) {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  appCheck = initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaEnterpriseProvider(
      import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY
    ),
    isTokenAutoRefreshEnabled: true
  });
}

export { appCheck };
export const auth = firebaseApp ? getAuth(firebaseApp) : null;

export async function googleLogin() {
  if (!auth) throw new Error('Firebase Auth is not configured yet.');
  return signInWithPopup(auth, new GoogleAuthProvider());
}
export async function firebaseLogout(){ if(auth) await signOut(auth); }
