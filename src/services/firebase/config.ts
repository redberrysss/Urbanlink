/**
 * Firebase configuration is read exclusively from Vite environment variables.
 * When the required variables are missing the application falls back to the
 * fully interactive local demo mode — no credentials are ever hardcoded.
 */

const env = import.meta.env;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: env.VITE_FIREBASE_APP_ID ?? '',
};

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

/** Force the local demo repository even when Firebase credentials exist. */
export const demoForced = env.VITE_FORCE_DEMO_MODE === 'true';

export const useFirebaseBackend = firebaseConfigured && !demoForced;
