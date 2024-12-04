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

export const generateCustomerId = async () => {
  try {
    const customersRef = collection(db, 'customers');
    const snapshot = await getDocs(
      query(customersRef, where('customerId', '>=', 'C'), where('customerId', '<=', 'C\uf8ff'))
    );
    
    let maxId = 0;
    snapshot.forEach(doc => {
      const currentId = parseInt(doc.data().customerId.substring(1));
      if (currentId > maxId) maxId = currentId;
    });

    return `C${String(maxId + 1).padStart(6, '0')}`;
  } catch (error) {
    console.error('Error generating customer ID:', error);
    throw error;
  }
};

export const createCustomer = async (customerName) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const customerId = await generateCustomerId();
  
  const customerData = {
    customerId,
    customerName,
    createdBy: {
      uid: currentUser?.uid || 'unknown',
      email: currentUser?.email || 'unknown',
      displayName: currentUser?.displayName || 'unknown'
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(doc(db, 'customers', customerId), customerData);
  return customerId;
}; 