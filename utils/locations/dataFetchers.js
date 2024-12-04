import { collection, getDocs, query, where, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { locationCacheHelpers, CACHE_KEYS } from './cacheHelpers';

export const dataFetchers = {
    // Fetch locations with caching
    fetchLocations: async () => {
        try {
          // Check cache first
          const cachedData = locationCacheHelpers.get(CACHE_KEYS.LOCATIONS);
          if (cachedData) {
            return cachedData || [];
          }
    
          // Fetch from Firebase if no cache
          const locationsRef = collection(db, 'locations');
          const snapshot = await getDocs(locationsRef);
          const locationsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
    
          // Update cache
          locationCacheHelpers.set(CACHE_KEYS.LOCATIONS, locationsList);
          return locationsList || [];
        } catch (error) {
          console.error('Error fetching locations:', error);
          return []; // Return empty array instead of throwing
        }
      },
    

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
  
  // Add new real-time listener functions
  setupRealtimeListeners: (onUpdate) => {
    // Create a reference to the locations collection
    const locationsRef = collection(db, 'locations');
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(locationsRef, (snapshot) => {
      const locationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Update cache with new data
      locationCacheHelpers.set(CACHE_KEYS.LOCATIONS, locationsList);
      
      // Call the callback if provided
      if (onUpdate) {
        onUpdate(locationsList);
      }
    }, (error) => {
      console.error('Error in real-time listener:', error);
    });

    // Return unsubscribe function
    return unsubscribe;
  },

  cleanupListeners: () => {
    // This is a placeholder function that will be populated with the unsubscribe function
    // when setupRealtimeListeners is called
    return () => {};
  },

  fetchCustomerContacts: async (customerId) => {
    try {
      // Check cache first
      const cacheKey = `${CACHE_KEYS.CUSTOMERS}_${customerId}_contacts`;
      const cachedData = await locationCacheHelpers.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Fetch from Firebase if no cache
      const customerRef = doc(db, 'customers', customerId);
      const customerDoc = await getDoc(customerRef);
      
      if (!customerDoc.exists()) {
        return [];
      }

      const customerData = customerDoc.data();
      const contacts = customerData.customerContact || [];

      // Cache the contacts
      locationCacheHelpers.set(cacheKey, contacts);
      
      return contacts;
    } catch (error) {
      console.error('Error fetching customer contacts:', error);
      return [];
    }
  }
}; 
