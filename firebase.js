import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app;
let analytics = null;
let db;
let storage;
let auth;

// Separate initialization for server-side
function initializeFirebaseServer() {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } else {
    app = getApps()[0];
    db = getFirestore(app);
    auth = getAuth(app);
  }
  return { app, db, auth };
}

// Client-side initialization
function initializeFirebaseClient() {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
  } else {
    app = getApps()[0];
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
    analytics = getAnalytics(app);
  }
  return { app, db, storage, analytics, auth };
}

// Initialize based on environment
if (typeof window !== "undefined") {
  // Client-side
  const firebaseClient = initializeFirebaseClient();
  app = firebaseClient.app;
  db = firebaseClient.db;
  storage = firebaseClient.storage;
  analytics = firebaseClient.analytics;
  auth = firebaseClient.auth;
} else {
  // Server-side
  const firebaseServer = initializeFirebaseServer();
  app = firebaseServer.app;
  db = firebaseServer.db;
  auth = firebaseServer.auth;
}

export { app, db, storage, analytics, auth, initializeFirebaseServer };