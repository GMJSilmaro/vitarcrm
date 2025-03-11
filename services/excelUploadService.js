import { db } from '../firebase';
import {
  collection,
  writeBatch,
  doc,
  getDocs,
  serverTimestamp,
  arrayUnion,
  documentId,
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
      startIndex = data.findIndex((row) => `${row.Tag_ID}` === startFromTemperature);
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

export const processExcelUploadCustomerEquipments = async ({
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  lastDataId,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    [`${dataKey}Success`]: 0,
    processed: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  if (!currentUser) return;

  try {
    onStats(stats);

    const BATCH_SIZE = 20; //* Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; //* 3 seconds delay

    let batch = writeBatch(db);
    let operationsInBatch = 0; //* Tracks number of operations in batch

    //* Find starting index
    let startIndex = 0;
    if (lastDataId) {
      startIndex = data.findIndex((row) => `${row.ID}-${row.Equipment_Name}` === lastDataId);
      if (startIndex === -1) startIndex = 0;
    }

    //* Get existing records
    const existingCustomerEquipments = new Map();

    const customerEquipmentsSnapshot = await getDocs(collection(db, dataKey));
    if (!customerEquipmentsSnapshot.empty) {
      customerEquipmentsSnapshot.forEach((doc) => {
        const data = doc.data();
        existingCustomerEquipments.set(`${data.customerId}-${data.description}`, data);
      });
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];

      try {
        if (!row.ID || !row.Customer_Name || !row.Equipment_Name || !row.Make || !row.Model) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        //* if id exist dont add otherwise add
        let customerEquipmentId = existingCustomerEquipments.get(`${row.ID}-${row.Equipment_Name}`);
        if (!customerEquipmentId) {
          customerEquipmentId = `${prefix}${String(existingCustomerEquipments.size + 1).padStart(
            6,
            '0'
          )}`;

          const customerEquipmentData = {
            equipmentId: customerEquipmentId,
            customerId: row.ID,
            customerName: row.Customer_Name || '',
            description: row.Equipment_Name || '',
            make: row.Make || '',
            model: row.Model || '',
            serialNumber: row.Serial_Number || '',
            rangeMin: row.Range_Min || '',
            rangeMax: row.Range_Max || '',
            uom: row.UOM || '',
            notes: row.Notes || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKey, customerEquipmentId), customerEquipmentData);
          existingCustomerEquipments.set(`${row.ID}-${row.Equipment_Name}`, customerEquipmentId);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        }

        stats.processed++;

        //* Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.ID}-${row.Equipment_Name}`,
        });

        //* Commit batch when limit reached
        if (operationsInBatch === BATCH_SIZE) {
          await batch.commit();

          //* log
          console.log(`Batch committed at row ${i + 1}. Waiting...`);

          //* Delay
          await delay(DELAY_BETWEEN_BATCHES);

          //* Reset batch
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        localStorage.setItem(`lastProcessed${dataKey}`, `${row.ID}-${row.Equipment_Name}`);
        stats.errors++;
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    //* Commit final batch
    if (stats.processed > 0) {
      console.log(`Committing final batch with No of operation: ${operationsInBatch}`);
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error('FATAL ERROR  IN PROCESS_EXCEL_UPLOADER_CUSTOMER_EQUIPMENTS:', error);
    throw error;
  }
};

export const processExcelUploadCalibrationCUSWD = async ({
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  lastDataId,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    [`${dataKey}Success`]: 0,
    processed: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  // if (!currentUser) return;

  try {
    onStats(stats);

    const BATCH_SIZE = 20; //* Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; //* 3 seconds delay

    let batch = writeBatch(db);
    let operationsInBatch = 0; //* Tracks number of operations in batch

    //* Find starting index
    let startIndex = 0;
    if (lastDataId) {
      startIndex = data.findIndex((row) => row.Guid === lastDataId);
      if (startIndex === -1) startIndex = 0;
    }

    const existingCK = new Map();

    const [dataKeyA, dataKeyB, dataKeyC] = dataKey.split('_');

    if ((!dataKeyA || !dataKeyB, !dataKeyC)) return;

    //* Get existing records
    const calibrationCUSWDSnapshot = await getDocs(collection(db, dataKeyA, dataKeyB, dataKeyC));

    if (!calibrationCUSWDSnapshot.empty) {
      calibrationCUSWDSnapshot.forEach((doc) => {
        const data = doc.data();
        existingCK.set(data.refId, data);
      });
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];

      try {
        //* if row is empty then continue otherwise store in db
        if (
          !row.TagId &&
          !row.Class &&
          !row.Nominal_Value_G &&
          !row.Current_Year_Error_MG &&
          !row.Current_Year_Actual_Value_G &&
          !row.E_Uncertainty_MG &&
          !row.U_Cert_G &&
          !row.U_Cert2_G2 &&
          !row.U_Cert4V_G4 &&
          !row.U_Inst_G &&
          !row.U_Inst2_G2 &&
          !row.U_Inst4V_G4 &&
          !row.Pr_KG_MN3 &&
          !row.U_Pr_KG_MN3 &&
          !row.Last_Year_Error_MG &&
          !row.Last_Year_Actual_Value_G &&
          !row.Drift_G
        ) {
          console.log('Skipping row due to being empty:', row);
          stats.errors++;
          continue;
        }

        let cuswdId = existingCUSWD.get(row?.Guid);
        if (!cuswdId) {
          cuswdId = `${prefix}${String(existingCUSWD.size + 1).padStart(6, '0')}`;

          const cuswdData = {
            refId: cuswdId,
            tagId: row?.TagId || '',
            class: row?.Class || '',
            nominalValue: row?.Nominal_Value_G || '',
            currentYearError: row?.Current_Year_Error_MG || '',
            currentYearActualValue: row?.Current_Year_Actual_Value_G || '',
            eUncertainty: row?.E_Uncertainty_MG || '',
            uCertg: row?.U_Cert_G || '',
            uCert2g2: row?.U_Cert2_G2 || '',
            uCert4vG4: row?.U_Cert4V_G4 || '',
            uInstg: row?.U_Inst_G || '',
            uInst2g2: row?.U_Inst2_G2 || '',
            uInst4vG4: row?.U_Inst4V_G4 || '',
            prKgMn3: row?.Pr_KG_MN3 || '',
            uPrKgMn3: row?.U_Pr_KG_MN3 || '',
            lastYearError: row?.Last_Year_Error_MG || '',
            lastYearActualValue: row?.Last_Year_Actual_Value_G || '',
            driftg: row?.Drift_G || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKeyA, dataKeyB, dataKeyC, cuswdId), cuswdData);
          existingCUSWD.set(row?.Guid, cuswdId);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        }

        stats.processed++;

        //* Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Guid}`,
        });

        //* Commit batch when limit reached
        if (operationsInBatch === BATCH_SIZE) {
          await batch.commit();

          //* log
          console.log(`Batch committed at row ${i + 1}. Waiting...`);

          //* Delay
          await delay(DELAY_BETWEEN_BATCHES);

          //* Reset batch
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        localStorage.setItem(`lastProcessed${dataKey}`, row.Guid);
        stats.errors++;
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    //* Commit final batch
    if (stats.processed > 0) {
      console.log(`Committing final batch with No of operation: ${operationsInBatch}`);
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error('FATAL ERROR  IN PROCESS_EXCEL_UPLOADER_CALIBRATION_CUSWD:', error);
    throw error;
  }
};

export const processExcelUploadCalibrationMPE = async ({
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  lastDataId,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    [`${dataKey}Success`]: 0,
    processed: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  // if (!currentUser) return;

  try {
    onStats(stats);

    const BATCH_SIZE = 20; //* Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; //* 3 seconds delay

    let batch = writeBatch(db);
    let operationsInBatch = 0; //* Tracks number of operations in batch

    //* Find starting index
    let startIndex = 0;
    if (lastDataId) {
      startIndex = data.findIndex((row) => row.Guid === lastDataId);
      if (startIndex === -1) startIndex = 0;
    }

    const [dataKeyA, dataKeyB, dataKeyC] = dataKey.split('_');

    if ((!dataKeyA || !dataKeyB, !dataKeyC)) return;

    const existingMPE = new Map();

    //* Get existing records
    const calibrationMPEsnapshot = await getDocs(collection(db, dataKeyA, dataKeyB, dataKeyC));

    if (!calibrationMPEsnapshot.empty) {
      calibrationMPEsnapshot.forEach((doc) => {
        const data = doc.data();
        existingMPE.set(data.refId, data);
      });
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];

      try {
        //* check if row has the required fields or not, if not skip
        if (!row.Code || !row.Weight || !row.MPE) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        let refId = existingMPE.get(row.Guid);
        if (!refId) {
          refId = `${prefix}${String(existingMPE.size + 1).padStart(6, '0')}`;

          const mpeData = {
            refId,
            code: row?.Code || '',
            weight: row?.Weight || '',
            mpe: row?.MPE || '',
            uncertainty: row?.Uncertainty || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKeyA, dataKeyB, dataKeyC, refId), mpeData);
          existingMPE.set(row?.Guid, refId);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        }

        stats.processed++;

        //* Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Guid}`,
        });

        //* Commit batch when limit reached
        if (operationsInBatch === BATCH_SIZE) {
          await batch.commit();

          //* log
          console.log(`Batch committed at row ${i + 1}. Waiting...`);

          //* Delay
          await delay(DELAY_BETWEEN_BATCHES);

          //* Reset batch
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        localStorage.setItem(`lastProcessed${dataKey}`, row.Guid);
        stats.errors++;
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    //* Commit final batch
    if (stats.processed > 0) {
      console.log(`Committing final batch with No of operation: ${operationsInBatch}`);
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error('FATAL ERROR  IN PROCESS_EXCEL_UPLOADER_CALIBRATION_MPE:', error);
    throw error;
  }
};

export const processExcelUploadCalibrationCK = async ({
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  lastDataId,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    [`${dataKey}Success`]: 0,
    processed: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  // if (!currentUser) return;

  try {
    onStats(stats);

    const BATCH_SIZE = 20; //* Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; //* 3 seconds delay

    let batch = writeBatch(db);
    let operationsInBatch = 0; //* Tracks number of operations in batch

    //* Find starting index
    let startIndex = 0;
    if (lastDataId) {
      startIndex = data.findIndex((row) => row.Guid === lastDataId);
      if (startIndex === -1) startIndex = 0;
    }

    const [dataKeyA, dataKeyB, dataKeyC] = dataKey.split('_');

    if ((!dataKeyA || !dataKeyB, !dataKeyC)) return;

    const existingCK = new Map();

    //* Get existing records
    const calibrationCKsnapshot = await getDocs(collection(db, dataKeyA, dataKeyB, dataKeyC));

    if (!calibrationCKsnapshot.empty) {
      calibrationCKsnapshot.forEach((doc) => {
        const data = doc.data();
        existingCK.set(data.refId, data);
      });
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];

      try {
        //* check if row has the required fields or not, if not skip
        if (!row.DOF || !row.Value) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        let refId = existingCK.get(row.Guid);
        if (!refId) {
          refId = `${prefix}${String(existingCK.size + 1).padStart(6, '0')}`;

          const ckData = {
            refId,
            dof: row?.DOF || -1,
            value: row?.Value || -1,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKeyA, dataKeyB, dataKeyC, refId), ckData);
          existingCK.set(row?.Guid, refId);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        }

        stats.processed++;

        //* Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Guid}`,
        });

        //* Commit batch when limit reached
        if (operationsInBatch === BATCH_SIZE) {
          await batch.commit();

          //* log
          console.log(`Batch committed at row ${i + 1}. Waiting...`);

          //* Delay
          await delay(DELAY_BETWEEN_BATCHES);

          //* Reset batch
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        localStorage.setItem(`lastProcessed${dataKey}`, row.Guid);
        stats.errors++;
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    //* Commit final batch
    if (stats.processed > 0) {
      console.log(`Committing final batch with No of operation: ${operationsInBatch}`);
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error('FATAL ERROR  IN PROCESS_EXCEL_UPLOADER_CALIBRATION_CK:', error);
    throw error;
  }
};

// Add resume function
export const resumeUpload = async (prefix, dataKey, data, onProgress, onStats) => {
  const lastData = localStorage.getItem(`lastProcessed${dataKey}`);
  if (!lastData) {
    throw new Error('No upload data available to resume');
  }
  return dataProcessExcelUploader[dataKey](prefix, dataKey, data, onProgress, onStats, lastData);
};
