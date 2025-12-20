import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
// @ts-expect-error - getReactNativePersistence exists at runtime but not in TS definitions
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// Copiá tus valores desde Firebase aquí
const firebaseConfig = {
  apiKey: "AIzaSyB4LsHJcapHaZNMxcdSnWOArTREq-f3lIw",
  authDomain: "mens-app-database.firebaseapp.com",
  projectId: "mens-app-database",
  storageBucket: "mens-app-database.firebasestorage.app",
  messagingSenderId: "189708988644",
  appId: "1:189708988644:web:5aecbbef9f93068236fcf1",
  measurementId: "G-YMPRF7KDBN"
};
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;