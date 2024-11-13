import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp;
let adminDb;
let adminAuth;
let isInitialized = false;

export function initAdmin() {
  if (isInitialized) {
    return { adminDb, adminAuth };
  }

  try {
    // Check if any Firebase admin apps exist
    if (getApps().length === 0) {
      // Create service account credentials object
      const serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
      };

      // Initialize the admin app
      adminApp = initializeApp({
        credential: cert(serviceAccount)
      });

      // Initialize Firestore and Auth
      adminDb = getFirestore(adminApp);
      adminAuth = getAuth(adminApp);
      isInitialized = true;

      console.log('Firebase Admin initialized successfully');
    } else {
      adminApp = getApps()[0];
      adminDb = getFirestore(adminApp);
      adminAuth = getAuth(adminApp);
      isInitialized = true;
    }

    return { adminDb, adminAuth };
  } catch (error) {
    console.error('Firebase Admin initialization error:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    throw error;
  }
}

// Export individual instances with getter to ensure initialization
export const admin = {
  get db() {
    if (!isInitialized) {
      initAdmin();
    }
    return adminDb;
  },
  get auth() {
    if (!isInitialized) {
      initAdmin();
    }
    return adminAuth;
  }
};

export { adminDb, adminAuth };