import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

/**
 * Firebase Configuration
 * Reads from environment variables (.env) or falls back to demo configuration.
 * Fully compatible with Google Firebase Authentication (Email/Password, OAuth, Password Reset).
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoPlaceholderKeyForLocalTesting123",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "shiplink-maritime.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "shiplink-maritime",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "shiplink-maritime.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1029384756",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1029384756:web:abcdef123456"
};

// Check if valid Firebase credentials are provided
export const isRealFirebaseConfigured = (): boolean => {
  const key = import.meta.env.VITE_FIREBASE_API_KEY;
  return Boolean(key && !key.includes('Placeholder') && !key.includes('Demo'));
};

let app: FirebaseApp;
let auth: Auth;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (error) {
  console.warn("Firebase initialization warning (using local fallback mode):", error);
  // Re-initialize with minimal safe config
  app = initializeApp(firebaseConfig, "ShipLinkAuthFallback");
  auth = getAuth(app);
}

export { app, auth };
