import { db } from '../firebase';
import { 
  collection, 
  doc,
  getDocs,
  query,
  where,
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const generateLocationId = async () => {
  try {
    const locationsRef = collection(db, 'locations');
    const snapshot = await getDocs(
      query(locationsRef, where('locationId', '>=', 'L'), where('locationId', '<=', 'L\uf8ff'))
    );
    
    let maxId = 0;
    snapshot.forEach(doc => {
      const currentId = parseInt(doc.data().locationId.substring(1));
      if (currentId > maxId) maxId = currentId;
    });

    return `L${String(maxId + 1).padStart(6, '0')}`;
  } catch (error) {
    console.error('Error generating location ID:', error);
    throw error;
  }
};

export const createLocation = async (locationData) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const locationId = await generateLocationId();
  
  const finalLocationData = {
    ...locationData,
    locationId,
    createdBy: {
      uid: currentUser?.uid || 'unknown',
      email: currentUser?.email || 'unknown',
      displayName: currentUser?.displayName || 'unknown'
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(doc(db, 'locations', locationId), finalLocationData);
  return locationId;
}; 