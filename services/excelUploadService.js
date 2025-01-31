import { db } from '../firebase';
import {
  collection,
  writeBatch,
  doc,
  getDocs,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { dataProcessExcelUploader } from '@/components/Uploader';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const processExcelUploadLocations = async (
  data,
  onProgress,
  onStats,
  startFromCustomer = ''
) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) return;

  try {
    let stats = {
      total: data.length,
      processed: 0,
      customersSuccess: 0,
      locationsSuccess: 0,
      errors: 0,
      currentItem: '',
      status: 'processing',
    };

    onStats(stats);
    let batch = writeBatch(db);

    // Find starting index
    let startIndex = 0;
    if (startFromCustomer) {
      startIndex = data.findIndex((row) => row.Customer_name === startFromCustomer);
      if (startIndex === -1) startIndex = 0;
    }

    // Get existing records
    const existingCustomers = new Map();
    const existingLocations = new Map();

    const customersSnapshot = await getDocs(collection(db, 'customers'));
    customersSnapshot.forEach((doc) => {
      const data = doc.data();
      existingCustomers.set(data.customerName, data.customerId);
    });

    const locationsSnapshot = await getDocs(collection(db, 'locations'));
    locationsSnapshot.forEach((doc) => {
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
            updatedAt: serverTimestamp(),
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
              country: row.Country || '',
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          // Update customer's locations array with minimal data
          if (operationsInBatch < BATCH_SIZE) {
            const customerRef = doc(db, 'customers', customerId);
            batch.update(customerRef, {
              locations: arrayUnion({
                siteId: siteId,
                siteName: row.Site_name,
              }),
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
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Customer_name} - ${row.Site_name}`,
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

//* dataKey - firebase collection name
//* prefix - character to prefix equipment ID
//* data - excel data
//* onProgress - callback to update progress
//* onStats - callback to update stats
//* startFromLastData - start from last data

export const processExcelUploadEquipment = async (
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  startFromTemperature = ''
) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    processed: 0,
    [`${dataKey}Success`]: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  if (!currentUser) return;

  try {
    onStats(stats);
    let batch = writeBatch(db);

    // Find starting index
    let startIndex = 0;
    if (startFromTemperature) {
      startIndex = data.findIndex((row) => `${row.Inventory_ID}` === startFromTemperature);
      if (startIndex === -1) startIndex = 0;
    }

    // Get existing records
    const existingEquipments = new Map();

    const temperaturesSnapshot = await getDocs(collection(db, dataKey));
    temperaturesSnapshot.forEach((doc) => {
      const data = doc.data();
      existingEquipments.set(data.inventoryId, data);
    });

    const BATCH_SIZE = 20; // Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; // 3 seconds delay

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];

      try {
        if (!row.Category || !row.Description || !row.Tag_ID) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        let operationsInBatch = 0;

        // Create or get temperature
        let tempHumidId = existingEquipments.get(`${row.Category}-${row.Tag_ID}`);
        if (!tempHumidId) {
          tempHumidId = `${prefix}${String(existingEquipments.size + 1).padStart(6, '0')}`;

          // Simplified temperature data structure
          const temperatureData = {
            inventoryId: tempHumidId,
            category: row.Category || '',
            description: row.Description || '',
            tagId: row.Tag_ID || '',
            make: row.Make || '',
            model: row.Model || '',
            serialNumber: row.Serial_Number || '',
            type: row.Type || '',
            rangeMin: row['Range_(Min)'] || '',
            rangeMax: row['Range_(Max)'] || '',
            rangeMinPercent: row['Range_(Min%)'] || '',
            rangeMaxPercent: row['Range_(Max%)'] || '',
            certificateNo: row.Certificate_No || '',
            traceability: row.Traceability || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKey, tempHumidId), temperatureData);
          existingEquipments.set(`${row.Category}-${row.Tag_ID}`, tempHumidId);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        }

        stats.processed++;

        // Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Description}-${row.Tag_ID}-${row.Category}`,
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
        localStorage.setItem(`lastProcessed${dataKey}`, row.Tag_ID);
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    // Commit final batch
    if (stats.processed > 0) {
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error('Fatal error in processExcelUpload:', error);
    throw error;
  }
};

// Add resume function
export const resumeUpload = async (data, onProgress, onStats, key) => {
  const lastData = localStorage.getItem(`lastProcessed${dataKey}`);
  if (!lastData) {
    throw new Error('No upload data available to resume');
  }
  return dataProcessExcelUploader[key](data, onProgress, onStats, lastData);
};
