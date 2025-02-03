import { db } from '@/firebase';
import { getAuth } from 'firebase/auth';
import { collection, deleteField, doc, onSnapshot, query, writeBatch } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const UpdateCustomer = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'customers'));

    const unsubscribe = onSnapshot(
      q,
      (snapshop) => {
        if (!snapshop.empty) {
          setCustomers(snapshop.docs.map((doc) => doc.data()));
          setLoading(false);
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        console.error(err.message);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleUpdateCustomerContract = useCallback(async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    const BATCH_SIZE = 20; // Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; // 3 seconds delay
    let operationsInBatch = 0;

    let batch = writeBatch(db);

    if (!currentUser) return;

    let stats = {
      errors: 0,
      processed: 0,
    };

    for (let i = 0; i < customers.length; i++) {
      const row = customers[i];

      try {
        if (
          (row.contract?.contract && Object.keys(row.contract?.contract).length > 0) ||
          !row?.contract
        ) {
          const oldContract = row?.contract?.contract;
          const newContract = {
            startDate: oldContract?.startDate || null,
            endDate: oldContract?.endDate || null,
            status: oldContract?.status === 'active' ? 'Y' : 'N',
          };
          const docRef = doc(db, 'customers', row.customerId);
          batch.update(docRef, { contract: newContract });
          operationsInBatch++;
          stats.processed++;
        }

        if (operationsInBatch >= BATCH_SIZE) {
          setLoading(true);
          await batch.commit();
          console.log(`Batch committed at row ${i + 1}. Waiting...`);
          await delay(DELAY_BETWEEN_BATCHES);
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error('Error updating customer:', error);
        stats.errors++;
      }
    }

    setLoading(false);
    console.log('processing stats:', stats);
    console.log('error stats:', error);

    setStats(stats);
  }, [customers]);

  const handleUpdateCustomerContact = useCallback(async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    const BATCH_SIZE = 20; // Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; // 3 seconds delay
    let operationsInBatch = 0;

    let batch = writeBatch(db);

    if (!currentUser) return;

    let stats = {
      errors: 0,
      processed: 0,
    };

    for (let i = 0; i < customers.length; i++) {
      const row = customers[i];

      try {
        if (!row.contacts || row.contacts?.length < 0) {
          const docRef = doc(db, 'customers', row.customerId);
          batch.update(docRef, { contacts: deleteField(), customerContact: [] });
          operationsInBatch++;
          stats.processed++;
        }

        if (operationsInBatch >= BATCH_SIZE) {
          setLoading(true);
          await batch.commit();
          console.log(`Batch committed at row ${i + 1}. Waiting...`);
          await delay(DELAY_BETWEEN_BATCHES);
          batch = writeBatch(db);
          setLoading(false);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error('Error updating customer:', error);
        stats.errors++;
      }
    }
  }, [customers]);

  if (loading) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
        <Spinner animation='border' variant='primary' />
      </div>
    );
  }

  return (
    <div className='d-flex justify-content-center align-items-center' style={{ height: '89vh' }}>
      {/* <Button disabled className='me-2' onClick={() => {}}>
        Update Customer Contacts
      </Button> */}
      <Button onClick={handleUpdateCustomerContract} variant='primary'>
        Update Customer Contract
      </Button>

      {stats && (
        <div className='ps-5 fs-5'>
          {stats.errors} errors, {stats.processed} processed
        </div>
      )}
    </div>
  );
};

export default UpdateCustomer;
