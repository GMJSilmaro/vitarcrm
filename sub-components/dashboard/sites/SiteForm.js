import { useAuth } from '@/contexts/AuthContext';
import {
  addressesSchema,
  basicInfoSchema,
  contactsSchema,
  locationSchema,
} from '@/schema/location';
import { getFormDefaultValues } from '@/utils/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Tab, Tabs } from 'react-bootstrap';
import { FormProvider, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import SiteBasicInfoForm from './tabs-form/SiteBasicInfoForm';
import SiteAddressForm from './tabs-form/SiteAddressForm';
import SiteContactForm from './tabs-form/SiteContactForm';
import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/firebase';

const SiteForm = ({ data }) => {
  const auth = useAuth();

  const router = useRouter();
  const [activeKey, setActiveKey] = useState('0');

  const tabsLength = 2;
  const tabSchema = [basicInfoSchema, addressesSchema, contactsSchema];

  const [isLoading, setIsLoading] = useState(false);
  const [latestContactId, setLatestContactId] = useState('CP000000');

  const schema = useMemo(() => {
    return tabSchema[Number(activeKey)] ?? basicInfoSchema;
  }, [activeKey]);

  const form = useForm({
    mode: 'onChange',
    defaultValues: { ...getFormDefaultValues(schema), ...data },
    resolver: zodResolver(schema),
  });

  const handleNext = useCallback(async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    if (Number(activeKey) <= tabSchema.length - 1) {
      const nextActiveKey = String(Number(activeKey) + 1);
      setActiveKey(nextActiveKey);

      if (Number(activeKey) === tabSchema.length - 1) {
        const parseData = locationSchema.safeParse(form.getValues());

        if (parseData.success) {
          handleSubmit(parseData.data);
        } else toast.error('Failed to parse data. Please try again later.');
      }
    }
  }, [activeKey]);

  const handleSubmit = useCallback(
    async (formData) => {
      console.log({ formData });

      try {
        setIsLoading(true);

        let currentId = latestContactId;
        const contacts = [];

        await runTransaction(db, async (transaction) => {
          try {
            //* write contacts
            for (const contact of formData.contacts) {
              if (!contact.id || contact.id === 'create') {
                contact.id = generateNextContactId(currentId);
                currentId = contact.contactId;

                const { id, ...contactData } = contact;

                transaction.set(
                  doc(db, 'contacts', id),
                  {
                    ...contactData,
                    customerId: formData.customer.id,
                    customerName: formData.customer.name,
                    status: 'active',
                    ...(!data && { createdAt: serverTimestamp(), createdBy: auth.currentUser }),
                    updatedAt: serverTimestamp(),
                    updatedBy: auth.currentUser,
                  },
                  { merge: true }
                );
              }

              contacts.push(contact.id);
            }

            //* write location
            transaction.set(
              doc(db, 'locations', formData.siteId),
              {
                siteId: formData.siteId,
                siteName: formData.siteName,
                customerId: formData.customer.id,
                customerName: formData.customer.name,
                contacts,
                addresses: formData.addresses,
                status: formData.status,
                ...(!data && { createdAt: serverTimestamp(), createdBy: auth.currentUser }),
                updatedAt: serverTimestamp(),
                updatedBy: auth.currentUser,
              },
              { merge: true }
            );

            if (contacts.length > 0) {
              //* update customer contacts
              transaction.update(doc(db, 'customers', formData.customer.id), {
                contacts: arrayUnion(...contacts),
              });
            }
          } catch (error) {
            throw error;
          }
        });

        router.push(`/sites/edit-site/${formData.siteId}`);
        toast.success(`Site ${data ? 'updated' : 'created'} successfully.`, {position: 'top-right'}); // prettier-ignore
        setIsLoading(false);
      } catch (error) {
        console.error('Error submitting site:', error);
        toast.error('Something went wrong. Please try again later.');
        setIsLoading(false);
        setActiveKey((prev) => prev - 1);
      }
    },
    [data, latestContactId]
  );

  const generateNextContactId = (currentId) => {
    const numericPart = parseInt(currentId.substring(2));
    const nextNumber = numericPart + 1;
    return `CP${String(nextNumber).padStart(5, '0')}`;
  };

  const handleOnSelect = async (key) => {
    const isValid = await form.trigger();
    if (!isValid && activeKey !== key) {
      toast.error('Please fix the errors in the form and try again.', { position: 'top-right' });
      return;
    }

    setActiveKey(key);
  };

  //* query latest contactId
  useEffect(() => {
    const q = query(collection(db, 'contacts'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const lastDocId = snapshot.docs.pop().id;
          setLatestContactId(lastDocId);
        }
      },
      (err) => {
        console.error(err.message);
        toast.error(err.message);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <>
      {/* <FormDebug /> */}

      <FormProvider {...form}>
        <Tabs
          id='site-tab'
          className='mb-4'
          activeKey={activeKey > tabsLength ? tabsLength : activeKey}
          onSelect={handleOnSelect}
        >
          <Tab eventKey='0' title='Basic Information'>
            <SiteBasicInfoForm data={data} isLoading={isLoading} handleNext={handleNext} />
          </Tab>

          <Tab eventKey='1' title='Address Details'>
            <SiteAddressForm data={data} isLoading={isLoading} handleNext={handleNext} />
          </Tab>

          <Tab eventKey='2' title='Site Contacts'>
            <SiteContactForm data={data} isLoading={isLoading} handleNext={handleNext} />
          </Tab>
        </Tabs>
      </FormProvider>
    </>
  );
};

export default SiteForm;
