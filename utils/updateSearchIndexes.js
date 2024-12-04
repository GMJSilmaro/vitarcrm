import { dataFetchers } from './dataFetchers';

export const updateAllCustomerIndexes = async () => {
  try {
    console.log('Starting customer search index update...');
    const count = await dataFetchers.updateCustomerSearchIndexes();
    console.log(`Successfully updated ${count} customer documents`);
  } catch (error) {
    console.error('Failed to update customer search indexes:', error);
  }
};

// Add a function to update a single customer's search index
export const updateCustomerIndex = async (customerId, customerData) => {
  try {
    const searchTerms = new Set();

    // Add customerId
    if (customerData.customerId) {
      searchTerms.add(customerData.customerId.toUpperCase());
    }

    // Add customerName terms
    if (customerData.customerName) {
      searchTerms.add(customerData.customerName.toUpperCase());
      customerData.customerName.split(/[\s.,]+/).forEach(term => {
        if (term) searchTerms.add(term.toUpperCase());
      });
    }

    const searchIndex = Array.from(searchTerms).filter(term => term.length > 0);

    const customerRef = doc(db, 'customers', customerId);
    await updateDoc(customerRef, {
      searchIndex,
      lastIndexed: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Error updating customer search index:', error);
    return false;
  }
}; 