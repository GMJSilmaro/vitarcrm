import { db } from '@/firebase';
import CustomerForm from '@/sub-components/dashboard/customer/CustomerForm';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';

const EditCustomer = () => {
  const router = useRouter();
  const { customerId } = router.query;
  const [customer, setCustomer] = useState();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      const customerDocRef = doc(db, 'customers', customerId);
      const contactsDocRef =  query(collection(db, 'contacts'), where('customerId', '==', customerId)); // prettier-ignore

      const [customerDoc, contactsDocs] = await Promise.all([
        getDoc(customerDocRef),
        getDocs(contactsDocRef),
      ]);

      const data = customerDoc.data();

      if (customerDoc.exists()) {
        const contacts = contactsDocs.empty
          ? []
          : contactsDocs.docs.map((doc) => ({
              id: doc.id,
              firstName: doc.data().firstName,
              lastName: doc.data().lastName,
              phone: doc.data().phone,
              email: doc.data().email,
              isDefault: doc.data().isDefault,
            }));

        setCustomer({
          customerId: data.customerId,
          customerName: data.customerName || '',
          tinNumber: data.tinNumber || '',
          brnNumber: data.brnNumber || '',
          status: data.status || 'active',
          contacts: contacts,
          contract: data.contract || { status: 'N', startDate: '', endDate: '' },
          locations: data?.locations || [],
        });
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      console.log('No customer found with the provided ID.');
    };

    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  if (isLoading) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
        <Spinner animation='border' variant='primary' />
        <span className='ms-3'>Loading Customer...</span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>Customer not found</h3>
          <Link href='/customers'>
            <Button variant='primary' className='mt-3'>
              Back to Customer List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <CustomerForm data={customer} />;
};

export default EditCustomer;
