import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/firebase';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password, username } = req.body;
    
    if (!email || !password || !username) {
      return res.status(400).json({ message: 'Email, password, and username are required' });
    }

    const auth = getAuth(app);
    const db = getFirestore(app);

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;

    // Create user document in Firestore
    const userDoc = {
      uid: user.uid,
      email: user.email,
      username,
      workerId: `W${Date.now().toString(36)}`, // Generate a simple worker ID
      role: 'user',
      createdAt: new Date().toISOString()
    };

    await addDoc(collection(db, 'users'), userDoc);

    return res.status(200).json({
      success: true,
      message: 'Account created successfully',
      user: {
        email: user.email,
        uid: user.uid,
        username
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(400).json({
      message: 'Failed to create account',
      error: error.message
    });
  }
} 