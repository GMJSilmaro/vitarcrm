import ContentHeader from '@/components/dashboard/ContentHeader';
import CustomerEquipmentForm from '@/sub-components/dashboard/customer/equipment/CustomerEquipmentForm';
import { GeeksSEO } from '@/widgets';
import { useRouter } from 'next/router';
import { Card } from 'react-bootstrap';
import { HouseDoorFill, People, PlusCircle, WrenchAdjustable } from 'react-bootstrap-icons';

const CreateCalibration = () => {
  const router = useRouter();
  const { customerId } = router.query;

  return (
    <>
      <GeeksSEO title='Create Customer Equipment - VITAR Group | Portal' />

      <ContentHeader
        title='Create Customer Equipment'
        description='Create Customer Equipment for your customer'
        infoText='Complete all the required fields to create a Customer Equipment'
        badgeText='Customer Equipment Management'
        badgeText2='New Customer Equipment'
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
            link: `#`,
            icon: <WrenchAdjustable className='me-2' size={14} />,
          },
          {
            text: 'Create Equipment',
            link: `/customers/${customerId}/equipment/create`,
            icon: <PlusCircle className='me-2' size={14} />,
          },
        ]}
      />

      <Card className='shadow-none'>
        <Card.Body>
          <CustomerEquipmentForm />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateCalibration;
