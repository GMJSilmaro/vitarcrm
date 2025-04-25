import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/firebase';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const auth = getAuth(app);
    const db = getFirestore(app);

    // First get Firebase Auth user
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;

    // Get user details from Firestore by matching UIDs
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '==', user.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(404).json({ message: 'User not found in database' });
    }

    // Get the first matching document
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // Use the workerId from userData instead of document ID
    const workerId = userData.workerId;
    const userRole = userData.role;
    const userFullName = userData.fullName;
    const userUid = userData.uid;

    console.log('Found user with matching UID:', user.uid);
    console.log('Using role from userData:', userRole);
    console.log('User Data:', userData);

    const customToken = await user.getIdToken();

    // Set secure cookies with proper configuration
    const cookieOptions = {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 60 * 1000, // 30 minutes
      httpOnly: true,
    };

    // update online status
    //TODO: change worker as uid
    await updateDoc(doc(db, 'users', user.uid), { isOnline: true });
    // await updateDoc(doc(db, 'users', workerId), { isOnline: true });

    // Set cookies using the workerId from userData
    res.setHeader('Set-Cookie', [
      `session=true; Path=/; ${cookieOptions.secure ? 'Secure;' : ''} SameSite=Lax; Max-Age=${ cookieOptions.maxAge}`,
      `customToken=${customToken}; Path=/; ${cookieOptions.secure ? 'Secure;' : '' } HttpOnly; SameSite=Lax; Max-Age=${cookieOptions.maxAge}`,
      `uid=${userUid}; Path=/; ${cookieOptions.secure ? 'Secure;' : ''} SameSite=Lax; Max-Age=${cookieOptions.maxAge }`,
      `email=${email}; Path=/; ${cookieOptions.secure ? 'Secure;' : ''} SameSite=Lax; Max-Age=${cookieOptions.maxAge}`,
      `displayName=${userFullName}; Path=/; ${cookieOptions.secure ? 'Secure;' : ''} SameSite=Lax; Max-Age=${cookieOptions.maxAge}`,
      `workerId=${workerId}; Path=/; ${cookieOptions.secure ? 'Secure;' : ''} SameSite=Lax; Max-Age=${cookieOptions.maxAge}`,
      `role=${userRole}; Path=/; ${cookieOptions.secure ? 'Secure;' : ''} SameSite=Lax; Max-Age=${cookieOptions.maxAge}`,
    ]); // prettier-ignore

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      user: {
        email,
        workerId,
        role: userRole,
        displayName: userFullName,
        uid: userUid,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    // Clear cookies on error
    res.setHeader('Set-Cookie', [
      'customToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'uid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'email=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'displayName=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'workerId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'role=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    ]);

    return res.status(401).json({
      message: 'Authentication failed',
      error: error.message,
    });
  }
}
