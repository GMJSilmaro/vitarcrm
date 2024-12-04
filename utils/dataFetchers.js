import { collection, getDocs, query, where, doc, getDoc, limit, startAfter, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';

export const dataFetchers = {
  // Get next location ID
  getNextLocationId: async () => {
    try {
      const locationsRef = collection(db, 'locations');
      const snapshot = await getDocs(
        query(locationsRef, where('siteId', '>=', 'S'), where('siteId', '<=', 'S\uf8ff'))
      );
      
      let maxId = 0;
      snapshot.forEach(doc => {
        const currentId = parseInt(doc.data().siteId.substring(1));
        if (!isNaN(currentId) && currentId > maxId) {
          maxId = currentId;
        }
      });

      return `S${String(maxId + 1).padStart(6, '0')}`;
    } catch (error) {
      console.error('Error generating location ID:', error);
      return 'S000001'; // Fallback ID
    }
  },

  // Fetch customer contacts
  fetchCustomerContacts: async (customerId) => {
    try {
      console.log('Fetching contacts for customer:', customerId);
      const customerRef = doc(db, 'customers', customerId);
      const customerDoc = await getDoc(customerRef);
      
      if (!customerDoc.exists()) {
        console.log('No customer found');
        return [];
      }

      const customerData = customerDoc.data();
      const contacts = customerData.customerContact || [];
      console.log('Found contacts:', contacts.length);
      
      return Array.isArray(contacts) ? contacts : [];
    } catch (error) {
      console.error('Error fetching customer contacts:', error);
      return [];
    }
  }
}; 