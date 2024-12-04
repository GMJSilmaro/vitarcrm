import { dataFetchers } from '@/utils/dataFetchers';

const updateAllCustomers = async () => {
  try {
    console.log('Starting customer search terms update...');
    const customersRef = collection(db, 'customers');
    const snapshot = await getDocs(customersRef);
    let count = 0;
    const batch = writeBatch(db);

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const searchTerms = new Set();

      // Add customerId
      if (data.customerId) {
        searchTerms.add(data.customerId.toUpperCase());
      }

      // Add customerName and its parts
      if (data.customerName) {
        const fullName = data.customerName.toUpperCase();
        searchTerms.add(fullName);
        
        // Split name into parts and add each part
        fullName.split(/[\s.,]+/).forEach(part => {
          if (part) searchTerms.add(part);
        });
      }

      // Add to batch
      batch.update(doc.ref, {
        searchTerms: Array.from(searchTerms),
        lastIndexed: serverTimestamp()
      });

      count++;

      // Commit every 500 documents
      if (count % 500 === 0) {
        await batch.commit();
        console.log(`Updated ${count} customers...`);
        batch = writeBatch(db);
      }
    }

    // Commit remaining
    if (count % 500 !== 0) {
      await batch.commit();
    }

    console.log(`Successfully updated ${count} customers`);
  } catch (error) {
    console.error('Error updating customers:', error);
  }
};

// Run the update
updateAllCustomers(); 