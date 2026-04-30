import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB_-PefTn0NVzSJpkAS0o71zfPCb5Yhkr4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "divine-rizq.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "divine-rizq",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "divine-rizq.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "864023029515",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:864023029515:web:9f1dc6e02d259910c6a40e",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-33XFBDN1L6"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
