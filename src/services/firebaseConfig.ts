import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
// @ts-expect-error - getReactNativePersistence exists at runtime but not in TS definitions
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// Copiá tus valores desde Firebase aquí
const firebaseConfig = {
  apiKey: "AIzaSyD0qT1ZSQt-ptQfOGOaifcLEz6FeXwjrr8",
  authDomain: "mens-analytics.firebaseapp.com",
  projectId: "mens-analytics",
  storageBucket: "mens-analytics.firebasestorage.app",
  messagingSenderId: "530801724482",
  appId: "1:530801724482:web:47fcc01993c9d7838e31db",
  measurementId: "G-NLZZYSFTLY"
};
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;