import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { customerCacheHelpers, CUSTOMER_CACHE_KEYS } from './cacheHelpers';

// Store active listeners
const customerListeners = new Map();

export const customerDataFetchers = {
  setupRealtimeListeners: () => {
    // Setup customer list listener
    if (!customerListeners.has(CUSTOMER_CACHE_KEYS.LIST)) {
      const customersRef = collection(db, 'customers');
      const unsubscribe = onSnapshot(customersRef, (snapshot) => {
        const customersList = snapshot.docs.map(doc => ({
          id: doc.id,
          customerId: doc.data().customerId,
          customerName: doc.data().customerName,
          locations: doc.data().locations?.map(location => ({
            siteName: location.siteName,
            mainAddress: location.mainAddress,
            isDefault: location.isDefault,
            siteId: location.siteId
          })) || [],
          customerContact: doc.data().customerContact,
          contract: doc.data().contract
        }));
        
        // Update cache with new data
        customerCacheHelpers.set(CUSTOMER_CACHE_KEYS.LIST, customersList);
      //  console.log('Customers list cache updated from real-time listener');
      });
      
      customerListeners.set(CUSTOMER_CACHE_KEYS.LIST, unsubscribe);
    }
  },

  cleanupListeners: () => {
    customerListeners.forEach((unsubscribe) => unsubscribe());
    customerListeners.clear();
  },

  fetchCustomers: async () => {
    try {
      // Check cache first
      const cachedData = await customerCacheHelpers.get(CUSTOMER_CACHE_KEYS.LIST);
      if (cachedData) {
        console.log('Using cached customer list data');
        return cachedData;
      }

      // If no cache, fetch from Firebase
      const customersRef = collection(db, 'customers');
      const snapshot = await getDocs(customersRef);
      const customersList = snapshot.docs.map(doc => ({
        id: doc.id,
        customerId: doc.data().customerId,
        customerName: doc.data().customerName,
        type: doc.data().type || 'Standard',
        locations: doc.data().locations?.map(location => ({
          siteName: location.siteName,
          mainAddress: location.mainAddress,
          isDefault: location.isDefault,
          siteId: location.siteId
        })) || [],
        customerContact: doc.data().customerContact,
        contract: doc.data().contract
      }));

      // Update cache
      customerCacheHelpers.set(CUSTOMER_CACHE_KEYS.LIST, customersList);
      return customersList;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },

  getNextCustomerId: async () => {
    try {
      const customersRef = collection(db, 'customers');
      const snapshot = await getDocs(
        query(customersRef, where('customerId', '>=', 'C'), where('customerId', '<=', 'C\uf8ff'))
      );
      
      let maxId = 0;
      snapshot.forEach(doc => {
        const currentId = parseInt(doc.data().customerId.substring(1));
        if (!isNaN(currentId) && currentId > maxId) {
          maxId = currentId;
        }
      });

      return `C${String(maxId + 1).padStart(6, '0')}`;
    } catch (error) {
      console.error('Error generating customer ID:', error);
      return 'C000001'; // Fallback ID
    }
  },

  refreshCustomersCache: async () => {
    try {
      // Clear existing cache
      customerCacheHelpers.clear(CUSTOMER_CACHE_KEYS.LIST);
      
      // Fetch fresh data
      return await customerDataFetchers.fetchCustomers();
    } catch (error) {
      console.error('Error refreshing customers cache:', error);
      throw error;
    }
  }
}; 