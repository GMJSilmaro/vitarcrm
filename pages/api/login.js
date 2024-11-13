process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { auth } from '../../firebase'; // Adjust path as needed
import { signInWithEmailAndPassword } from 'firebase/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // Attempt Firebase authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get the ID token
    const idToken = await user.getIdToken();

    // Set secure cookie with the token
    res.setHeader('Set-Cookie', [
      `authToken=${idToken}; HttpOnly; Secure; SameSite=Strict; Path=/`,
      // Add other necessary cookies here
    ]);

    return res.status(200).json({ 
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        // Add other necessary user data
      }
    });

  } catch (error) {
    console.error('Login error:', error);

    // Handle specific Firebase auth errors
    const errorMessage = (() => {
      switch (error.code) {
        case 'auth/user-not-found':
          return 'No account found with this email';
        case 'auth/wrong-password':
          return 'Invalid password';
        case 'auth/invalid-email':
          return 'Invalid email format';
        case 'auth/too-many-requests':
          return 'Too many failed attempts. Please try again later';
        default:
          return 'Authentication failed. Please try again';
      }
    })();

    return res.status(401).json({ 
      success: false,
      message: errorMessage,
      error: error.code
    });
  }
}
