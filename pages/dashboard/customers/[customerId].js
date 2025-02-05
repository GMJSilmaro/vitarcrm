import { db } from '@/firebase';
import CustomerForm from '@/sub-components/customer/CustomerForm';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-bootstrap-icons';

const EditCustomer = () => {
  const router = useRouter();
  const { customerId } = router.query;
  const [customer, setCustomer] = useState();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      const docRef = doc(db, 'customers', customerId);
      const customerDoc = await getDoc(docRef);
      const data = customerDoc.data();
      if (customerDoc.exists()) {
        setCustomer({
          customerId: data.customerId,
          customerName: data.customerName || '',
          tinNumber: data.tinNumber || '',
          brnNumber: data.brnNumber || '',
          status: data.status || 'active',
          customerContact: data.customerContact || [],
          contract: data.contract || { status: 'N', startDate: '', endDate: '' },
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
