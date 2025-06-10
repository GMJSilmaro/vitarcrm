import ContentHeader from '@/components/dashboard/ContentHeader';
import UserForm from '@/sub-components/dashboard/worker/UserForm';
import { GeeksSEO } from '@/widgets';
import { useRouter } from 'next/router';
import { Card } from 'react-bootstrap';
import { ArrowLeftShort, HouseDoorFill, PeopleFill, PlusCircleFill } from 'react-bootstrap-icons';

const CreateUser = () => {
  const router = useRouter();

  return (
    <>
      <GeeksSEO title='Create User - VITAR Group | Portal' />

      <ContentHeader
        title='Create New Technician'
        description='Add a new technician to your team by filling out their personal, contact, and skill information'
        infoText='Complete all required fields across the three tabs: Personal, Contact, and Skills'
        badgeText='Technician Management'
        badgeText2='New Technician'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' size={14} />,
          },
          {
            text: 'Technicians',
            link: '/workers',
            icon: <PeopleFill className='me-2' size={14} />,
          },
          {
            text: 'Create Technician',
            icon: <PlusCircleFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push(`/workers`),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <UserForm />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateUser;
