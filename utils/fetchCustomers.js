// utils/fetchCustomers.js

import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase';

export const fetchCustomers = {
  search: async (searchTerm = '', pageSize = 10) => {
    try {
      console.log(' Starting customer search:', searchTerm);
      const customersRef = collection(db, 'customers');
      let baseQuery;

      if (searchTerm) {
        // Create a query that searches both name and ID
        baseQuery = query(
          customersRef,
          where('customerName', '>=', searchTerm),
          where('customerName', '<', searchTerm + '\uf8ff'),
          limit(pageSize)
        );
      } else {
        baseQuery = query(
          customersRef,
          orderBy('customerName'),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(baseQuery);
      console.log('Query results:', snapshot.size);

      // Process results
      const customers = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          customerId: data.customerId || '',
          customerName: data.customerName || '',
          status: data.status || 'inactive',
          contract: data.contract || 'Standard',
          locations: data.locations || [],
          matchType: 'name'
        };
      });

      // If no exact matches found, try case-insensitive search
      if (searchTerm && customers.length === 0) {
        const allCustomersQuery = query(
          customersRef,
          orderBy('customerName'),
          limit(pageSize * 2)
        );

        const allSnapshot = await getDocs(allCustomersQuery);
        const searchTermLower = searchTerm.toLowerCase();

        const filteredCustomers = allSnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              customerId: data.customerId || '',
              customerName: data.customerName || '',
              status: data.status || 'inactive',
              contract: data.contract || 'Standard',
              locations: data.locations || []
            };
          })
          .filter(customer => 
            customer.customerName.toLowerCase().includes(searchTermLower) ||
            customer.customerId.toLowerCase().includes(searchTermLower)
          )
          .slice(0, pageSize);

        return {
          customers: filteredCustomers,
          total: filteredCustomers.length
        };
      }

      return {
        customers,
        total: customers.length
      };

    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }
};