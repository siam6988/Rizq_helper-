import { getApp, getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  // Try to use application default credentials in production
  // We cannot bundle user's raw keys usually, so fallback logic is needed.
  try {
     // NOTE: This usually requires a service account JSON.
     const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
     if (Object.keys(serviceAccount).length > 0) {
        initializeApp({ credential: cert(serviceAccount) });
     } else {
       console.warn("Using default firebase-admin init (may fail without GOOGLE_APPLICATION_CREDENTIALS if not mocked)");
       initializeApp();
     }
  } catch (e) {
     console.error("Firebase admin init error:", e);
     initializeApp(); // ultimate fallback, often fails in GCP lacking ADC
  }
}

export const adminDb = getFirestore();
