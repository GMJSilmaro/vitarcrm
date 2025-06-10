import ContentHeader from '@/components/dashboard/ContentHeader';
import SiteForm from '@/sub-components/dashboard/sites/SiteForm';
import { GeeksSEO } from '@/widgets';
import { useRouter } from 'next/router';
import { Card } from 'react-bootstrap';
import { ArrowLeftShort, BuildingFill, PlusCircleFill } from 'react-bootstrap-icons';
import { FaHome } from 'react-icons/fa';

const CreateLocation = () => {
  const router = useRouter();

  return (
    <>
      <GeeksSEO title='Create Site | VITAR- GROUP | CRM & Calibration | Portal' />

      <ContentHeader
        title='Create New Site'
        description='Add a new site or location to your network'
        infoText='Fill in site details including basic information, address details and site contacts.'
        badgeText='Site Management'
        badgeText2='New Site'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <FaHome className='me-2' style={{ fontSize: '14px' }} />,
          },
          {
            text: 'Sites',
            link: '/sites',
            icon: <BuildingFill className='me-2' style={{ fontSize: '14px' }} />,
          },
          {
            text: 'Create',
            link: '/sites/create',
            icon: <PlusCircleFill className='me-2' style={{ fontSize: '14px' }} />,
          },
        ]}
        actionButtons={[
          {
            text: 'Back',
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push('/sites'),
          },
        ]}
      />

      <Card>
        <Card.Body>
          <SiteForm />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateLocation;
