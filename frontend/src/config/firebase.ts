import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD3t7nATvR5a2moh1JrRsMWanpjc1IWYiY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'sentra-bb1bf.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sentra-bb1bf',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'sentra-bb1bf.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '405594822833',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:405594822833:web:15a23a9d4190cce0a8aa90',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-P70W1C71GX',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;

