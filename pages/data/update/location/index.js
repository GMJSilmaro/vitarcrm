import { db } from '@/firebase';
import { getAuth } from 'firebase/auth';
import { collection, deleteField, doc, onSnapshot, query, writeBatch } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const UpdateLocation = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'locations'));

    const unsubscribe = onSnapshot(
      q,
      (snapshop) => {
        if (!snapshop.empty) {
          setLocations(snapshop.docs.map((doc) => doc.data()));
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

  const handleUpdateLocationAddresses = useCallback(async () => {
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

    let locationHasAddressProperty = 0;
    let locationNoAddressProperty = 0;
    let locationHasAdditionalInformation = 0;
    let locationHasAddressAndAddresses = 0;
    let locationHasAddresses = [];
    let locationHasContacts = [];
    let locationHasAdditionalLocations = [];

    for (let i = 0; i < locations.length; i++) {
      const row = locations[i];

      try {
        const hasAddresses = row?.addresses && row?.addresses?.length > 0;

        if (row.addresses) {
          locationHasAddresses.push(row);
        }

        if (row.contacts) {
          locationHasContacts.push(row);
        }

        if (row.additionalLocations) {
          locationHasAdditionalLocations.push(row);
        }

        if (row.additionalInformation) {
          locationHasAdditionalInformation++;
        }

        if (row.address && row.addresses) {
          locationHasAddressAndAddresses++;
        }

        if (row.address) {
          const defaultAddress = {
            street1: row.address.street1 || '',
            street2: row.address.street2 || '',
            street3: row.address.street3 || '',
            province: row.address.province || '',
            city: row.address.city || '',
            postalCode: row.address.postcode || '',
            country: row.address.country || '',
            isDefault: true,
            longitude: '',
            latitude: '',
          };

          const docRef = doc(db, 'locations', row.siteId);
          batch.update(docRef, { addresses: [defaultAddress] });
          operationsInBatch++;
          stats.processed++;

          locationHasAddressProperty++;
        } else {
          const defaultAddress = {
            street1: row.streetAddress1 || '',
            street2: row.streetAddress2 || '',
            street3: row.streetAddress3 || '',
            province: row.province || '',
            city: row.city || '',
            postalCode: row.postalCode || '',
            country: row.country || '',
            isDefault: !hasAddresses,
            longitude: '',
            latitude: '',
          };

          const docRef = doc(db, 'locations', row.siteId);
          batch.update(docRef, { addresses: [defaultAddress] });
          operationsInBatch++;
          stats.processed++;

          locationNoAddressProperty++;
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

    console.log({
      //   locations,
      locationHasAddressProperty,
      locationNoAddressProperty,
      locationHasAdditionalInformation,
      locationHasAddressAndAddresses,
      locationHasAddresses,
      locationHasContacts,
      locationHasAdditionalLocations,
    });

    setLoading(false);
    console.log('processing stats:', stats.processed);
    console.log('error stats:', error);
    setStats(stats);
  }, [locations]);

  const handleDeleteUnnecessaryFields = useCallback(async () => {
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

    for (let i = 0; i < locations.length; i++) {
      const row = locations[i];

      try {
        const docRef = doc(db, 'locations', row.siteId);

        batch.update(docRef, {
          address: deleteField(),
          additionalLocations: deleteField(),
          streetAddress1: deleteField(),
          streetAddress2: deleteField(),
          streetAddress3: deleteField(),
          province: deleteField(),
          country: deleteField(),
          city: deleteField(),
          postalCode: deleteField(),
          customer: deleteField(),
        });

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

    setLoading(false);
    console.log('processing stats:', stats.processed);
    console.log('error stats:', error);
    setStats(stats);
  }, [locations]);

  const handleUpdateContacts = useCallback(async () => {
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

    let locationHasContacts = [];
    let locationHasStringArrayContacts = [];
    let locationNotStringArrayContacts = [];

    for (let i = 0; i < locations.length; i++) {
      const row = locations[i];

      try {
        if (row.contacts) {
          const stringArray = row.contacts.some((c) => typeof c === 'string');

          if (stringArray) {
            locationHasStringArrayContacts.push(row);
            continue;
          } else {
            locationNotStringArrayContacts.push(row);

            const stringArrayContacts = row.contacts.map((c) => c.contactId);

            const docRef = doc(db, 'locations', row.siteId);
            batch.update(docRef, { contacts: stringArrayContacts });

            operationsInBatch++;
            stats.processed++;
          }
        } else {
          const docRef = doc(db, 'locations', row.siteId);
          batch.update(docRef, { contacts: [] });
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

    console.log({
      locationHasContacts,
      locationHasStringArrayContacts,
      locationNotStringArrayContacts,
    });

    setLoading(false);
    console.log('processing stats:', stats.processed);
    console.log('error stats:', error);
    setStats(stats);
  }, [locations]);

  if (loading) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
        <Spinner animation='border' variant='primary' />
      </div>
    );
  }

  return (
    <div className='d-flex justify-content-center align-items-center' style={{ height: '89vh' }}>
      {/* <Button variant='primary' onClick={handleUpdateLocationAddresses}>
        Update Update Location
      </Button> */}

      {/* <Button variant='primary' onClick={handleDeleteUnnecessaryFields}>
        Delete Unnecessary Fields from Locations
      </Button> */}

      <Button variant='primary' onClick={handleUpdateContacts} disabled>
        Update Location Contacts
      </Button>

      {stats && (
        <div className='ps-5 fs-5'>
          {stats.errors} errors, {stats.processed} processed
        </div>
      )}
    </div>
  );
};

export default UpdateLocation;
