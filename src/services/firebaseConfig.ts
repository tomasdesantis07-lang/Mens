import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Copiá tus valores desde Firebase aquí
const firebaseConfig = {
  apiKey: "AIzaSyCSb4W-S0DO4fuNfm9C3lHp5eaAlV_bScw",
  authDomain: "mens-app-19d42.firebaseapp.com",
  projectId: "mens-app-19d42",
  storageBucket: "mens-app-19d42.firebasestorage.app",
  messagingSenderId: "632055478450",
  appId: "1:632055478450:web:e1b5e6c921113a0d8871ab",
  measurementId: "G-0P4J9LV1RB"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;