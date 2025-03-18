import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import CustomerEquipmentForm from '@/sub-components/dashboard/customer/equipment/CustomerEquipmentForm';
import { GeeksSEO } from '@/widgets';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Spinner } from 'react-bootstrap';
import { HouseDoorFill, PencilFill, People, WrenchAdjustable } from 'react-bootstrap-icons';

const CreateCalibration = () => {
  const router = useRouter();
  const { customerId, equipmentId } = router.query;

  const [customerEquipment, setCustomerEquipment] = useState();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  //* query customer equipment
  useEffect(() => {
    if (customerId && equipmentId) {
      setIsLoading(true);

      const customerEquipmentRef = doc(db, 'customerEquipments', equipmentId);

      getDoc(customerEquipmentRef)
        .then((doc) => {
          if (doc.exists()) {
            setCustomerEquipment({ id: doc.id, ...doc.data() });
            setIsLoading(false);
          } else {
            setError('Customer Equipment not found');
            setIsLoading(false);
          }
        })
        .catch((err) => {
          setError(err.message || 'Error fetching customer equipment');
          setIsLoading(false);
        });
    }
  }, [customerId, equipmentId]);

  if (error) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3 className='text-danger'>Error</h3>
          <p className='text-muted'>{error}</p>
          <Button onClick={() => router.push('/customers')}>Back to Customer List</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
        <Spinner animation='border' variant='primary' />
        <span className='ms-3'>Loading Job...</span>
      </div>
    );
  }

  if (!customerEquipment) {
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

  return (
    <>
      <GeeksSEO title='Edit Customer Equipment - VITAR Group | Portal' />

      <ContentHeader
        title='Edit Customer Equipment'
        description='Update customer equipment infomation'
        badgeText='Customer Equipment Management'
        badgeText2='Edit Customer Equipment'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' />,
          },
          {
            text: 'Customers',
            link: '/customers',
            icon: <People className='me-2' size={14} />,
          },
          {
            text: `Customer #${customerId} Equipment`,
            icon: <WrenchAdjustable className='me-2' size={14} />,
          },
          {
            text: customerEquipment ? customerEquipment.id : 'Create',
            icon: <PencilFill className='me-2' size={14} />,
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <CustomerEquipmentForm data={customerEquipment} />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateCalibration;
