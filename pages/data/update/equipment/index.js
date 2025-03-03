import { db } from '@/firebase';
import { getAuth } from 'firebase/auth';
import { collection, doc, onSnapshot, query, writeBatch } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const UpdateEquipments = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const handleUpdateEquipment = async () => {
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

    for (let i = 0; i < equipment.length; i++) {
      const row = equipment[i];

      try {
        const equipmentRef = doc(db, 'equipments', row.id);
        batch.update(equipmentRef, { qty: 1 });
        operationsInBatch++;
        stats.processed++;

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

    //* Commit final batch
    if (stats.processed > 0) {
      console.log(`Committing final batch with No of operation: ${operationsInBatch}`);
      await batch.commit();
    }

    setLoading(false);
    console.log('processing stats:', stats);
    console.log('error stats:', error);

    setStats(stats);
  };

  useEffect(() => {
    const q = query(collection(db, 'equipments'));

    const unsubscribe = onSnapshot(
      q,
      (snapshop) => {
        if (!snapshop.empty) {
          setEquipment(snapshop.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        }

        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        console.error(err.message);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className='d-flex justify-content-center align-items-center' style={{ height: '89vh' }}>
      <Button onClick={handleUpdateEquipment} variant='primary'>
        Update Equipment
      </Button>

      {stats && (
        <div className='ps-5 fs-5'>
          {stats.errors} errors, {stats.processed} processed
        </div>
      )}
    </div>
  );
};

export default UpdateEquipments;
