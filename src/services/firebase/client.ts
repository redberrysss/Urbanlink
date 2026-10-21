import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { firebaseConfig, useFirebaseBackend } from './config';

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

function ensureApp(): FirebaseApp {
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(ensureApp());
    void setPersistence(authInstance, browserLocalPersistence).catch(() => undefined);
  }
  return authInstance;
}

export function getFirestoreDb(): Firestore {
  if (!firestoreInstance) firestoreInstance = getFirestore(ensureApp());
  return firestoreInstance;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storageInstance) storageInstance = getStorage(ensureApp());
  return storageInstance;
}

export const firebaseEnabled = useFirebaseBackend;
