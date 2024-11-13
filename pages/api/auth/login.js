process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/firebase';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { serialize } from 'cookie';

const COOKIE_OPTIONS = {
  secure: true,
  sameSite: 'lax',
  maxAge: 30 * 60, // 30 minutes
  httpOnly: true
};

// Add CORS headers
export const config = {
  api: {
    externalResolver: true,
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  // Add CORS headers with specific origin instead of wildcard
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Ensure method is POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let workerId = null;
  
  try {
    const { email, password } = req.body;
    
    // Enhanced input validation
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Invalid password format' });
    }

    const auth = getAuth(app);
    const db = getFirestore(app);

    // Firebase Authentication with proper error handling
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    } catch (firebaseError) {
      console.error('Firebase Auth Error:', firebaseError);
      return res.status(401).json({
        message: getFirebaseErrorMessage(firebaseError.code)
      });
    }

    const { user } = userCredential;

    // Firestore user data fetch with proper error handling
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(404).json({ message: 'User not found in database' });
    }

    const userData = querySnapshot.docs[0].data();
    workerId = userData.workerId;

    // SAP B1 Login with proper error handling
    let sapLoginResponse;
    try {
      sapLoginResponse = await fetch(`${process.env.SAP_SERVICE_LAYER_BASE_URL}Login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          CompanyDB: process.env.SAP_B1_COMPANY_DB,
          UserName: process.env.SAP_B1_USERNAME,
          Password: process.env.SAP_B1_PASSWORD
        })
      });

      if (!sapLoginResponse.ok) {
        throw new Error(`SAP B1 login failed with status: ${sapLoginResponse.status}`);
      }
    } catch (sapError) {
      console.error('SAP B1 Login Error:', sapError);
      
      return res.status(503).json({ message: 'SAP service unavailable' });
    }

    const sapLoginData = await sapLoginResponse.json();
    
    if (!sapLoginData.SessionId) {
      throw new Error('Invalid SAP B1 session response');
    }

    const sessionId = sapLoginData.SessionId;
    const sessionExpiryTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    const customToken = await user.getIdToken();

    // Set cookies with proper security settings
    const cookies = [
      `B1SESSION=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${30 * 60}`,
      `B1SESSION_EXPIRY=${sessionExpiryTime.toISOString()}; Path=/; Secure; SameSite=Strict; Max-Age=${30 * 60}`,
      `ROUTEID=.node4; Path=/; Secure; SameSite=Strict; Max-Age=${30 * 60}`,
      `customToken=${customToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${30 * 60}`,
      `uid=${user.uid}; Path=/; Secure; SameSite=Strict; Max-Age=${30 * 60}`,
      `email=${email}; Path=/; Secure; SameSite=Strict; Max-Age=${30 * 60}`,
      `workerId=${userData.workerId}; Path=/; Secure; SameSite=Strict; Max-Age=${30 * 60}`,
      `isAdmin=${userData.role === 'admin'}; Path=/; Secure; SameSite=Strict; Max-Age=${30 * 60}`,
      `LAST_ACTIVITY=${Date.now()}; Path=/; Secure; SameSite=Strict; Max-Age=${30 * 60}`
    ];

    res.setHeader('Set-Cookie', cookies);

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      user: {
        email,
        workerId: userData.workerId,
        uid: user.uid,
        isAdmin: userData.role === 'admin'
      }
    });

  } catch (error) {
    console.error('Authentication Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });

    // Log error
    await serverLogActivity(workerId || 'SYSTEM', 'LOGIN_FAILED', {
      email: req.body?.email,
      timestamp: new Date().toISOString(),
      error: error.message,
      errorCode: error.code
    });

    // Clear cookies on error
    const clearCookies = [
      'B1SESSION',
      'B1SESSION_EXPIRY',
      'ROUTEID',
      'customToken',
      'uid',
      'email',
      'workerId',
      'isAdmin',
      'LAST_ACTIVITY'
    ].map(name => `${name}=; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);

    res.setHeader('Set-Cookie', clearCookies);

    return res.status(401).json({
      message: 'Authentication failed',
      error: error.message
    });
  }
}

// Helper function to convert Firebase error codes to user-friendly messages
function getFirebaseErrorMessage(errorCode) {
  const errorMessages = {
    'auth/user-not-found': 'Invalid email or password',
    'auth/wrong-password': 'Invalid email or password',
    'auth/invalid-email': 'Invalid email format',
    'auth/user-disabled': 'This account has been disabled',
    'auth/too-many-requests': 'Too many failed login attempts. Please try again later.',
    // Add more error codes as needed
    'default': 'Authentication failed. Please try again.'
  };
  
  return errorMessages[errorCode] || errorMessages.default;
}