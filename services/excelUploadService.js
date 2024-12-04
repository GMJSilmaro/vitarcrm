import { db } from '../firebase';
import { 
  collection, 
  writeBatch,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const processExcelUpload = async (data, onProgress, onStats, startFromCustomer = '') => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  try {
    let stats = {
      total: data.length,
      processed: 0,
      customersSuccess: 0,
      locationsSuccess: 0,
      errors: 0,
      currentItem: '',
      status: 'processing'
    };

    onStats(stats);
    let batch = writeBatch(db);

    // Find starting index
    let startIndex = 0;
    if (startFromCustomer) {
      startIndex = data.findIndex(row => row.Customer_name === startFromCustomer);
      if (startIndex === -1) startIndex = 0;
    }

    // Get existing records
    const existingCustomers = new Map();
    const existingLocations = new Map();

    const customersSnapshot = await getDocs(collection(db, 'customers'));
    customersSnapshot.forEach(doc => {
      const data = doc.data();
      existingCustomers.set(data.customerName, data.customerId);
    });

    const locationsSnapshot = await getDocs(collection(db, 'locations'));
    locationsSnapshot.forEach(doc => {
      const data = doc.data();
      existingLocations.set(data.siteName, data.siteId);
    });

    const BATCH_SIZE = 20; // Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; // 3 seconds delay

    // Process each row
    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.Customer_name || !row.Site_name) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        let operationsInBatch = 0;

        // Create or get customer
        let customerId = existingCustomers.get(row.Customer_name);
        if (!customerId) {
          customerId = `C${String(existingCustomers.size + 1).padStart(6, '0')}`;
          
          // Simplified customer data structure
          const customerData = {
            customerId: customerId,
            customerName: row.Customer_name || '',
            status: 'active',
            locations: [], // Only store references to locations
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          batch.set(doc(db, 'customers', customerId), customerData);
          existingCustomers.set(row.Customer_name, customerId);
          stats.customersSuccess++;
          operationsInBatch++;
        }

        // Create location if doesn't exist
        let siteId = existingLocations.get(row.Site_name);
        if (!siteId) {
          siteId = `S${String(existingLocations.size + 1).padStart(6, '0')}`;
          
          // Simplified location data structure
          const locationData = {
            siteId: siteId,
            siteName: row.Site_name || '',
            customerId: customerId,
            customerName: row.Customer_name || '',
            address: {
              street1: row.Street_1 || '',
              street2: row.Street_2 || '',
              street3: row.Street_3 || '',
              city: row.City || '',
              postcode: row.Postcode || '',
              province: row.Province || '',
              country: row.Country || ''
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          // Update customer's locations array with minimal data
          if (operationsInBatch < BATCH_SIZE) {
            const customerRef = doc(db, 'customers', customerId);
            batch.update(customerRef, {
              locations: arrayUnion({
                siteId: siteId,
                siteName: row.Site_name
              })
            });
            operationsInBatch++;
          }

          if (operationsInBatch < BATCH_SIZE) {
            batch.set(doc(db, 'locations', siteId), locationData);
            existingLocations.set(row.Site_name, siteId);
            stats.locationsSuccess++;
            operationsInBatch++;
          }
        }

        stats.processed++;

        // Update progress
        onProgress(Math.round((i + 1 - startIndex) / (data.length - startIndex) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Customer_name} - ${row.Site_name}`
        });

        // Commit batch when limit reached
        if (operationsInBatch >= BATCH_SIZE) {
          await batch.commit();
          console.log(`Batch committed at row ${i + 1}. Waiting...`);
          await delay(DELAY_BETWEEN_BATCHES);
          batch = writeBatch(db);
          operationsInBatch = 0;
        }

      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        stats.errors++;
        localStorage.setItem('lastProcessedCustomer', row.Customer_name);
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    // Commit final batch
    if (stats.processed > 0) {
      await batch.commit();
    }

    localStorage.removeItem('lastProcessedCustomer');
    stats.status = 'completed';
    onStats(stats);
    return stats;

  } catch (error) {
    console.error('Fatal error in processExcelUpload:', error);
    throw error;
  }
};

// Add resume function
export const resumeUpload = async (data, onProgress, onStats) => {
  const lastCustomer = localStorage.getItem('lastProcessedCustomer');
  if (!lastCustomer) {
    throw new Error('No upload data available to resume');
  }
  return processExcelUpload(data, onProgress, onStats, lastCustomer);
}; 