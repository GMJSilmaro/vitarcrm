import ContentHeader from '@/components/dashboard/ContentHeader';
import AcrForm from '@/sub-components/dashboard/calibration-references/AcrForm';
import { GeeksSEO } from '@/widgets';
import { useRouter } from 'next/router';
import { Card } from 'react-bootstrap';
import {
  ArrowLeftShort,
  BoxSeamFill,
  HouseDoorFill,
  ListColumns,
  PlusCircleFill,
  Table,
} from 'react-bootstrap-icons';

const CreateACR = () => {
  const router = useRouter();

  return (
    <>
      <GeeksSEO title='Create Accuracy Class Reference - VITAR Group | Portal' />

      <ContentHeader
        title='Create Accuracy Class Reference'
        description='Create accuracy class reference data for your calibration'
        badgeText='Calibration References Data Management'
        badgeText2='New Reference Data'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' style={{ fontSize: '14px' }} />,
          },
          {
            text: 'Calibration References',
            link: '/calibration-references/mass/acr',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Mass',
            link: '/calibration-references/mass/acr',
            icon: <BoxSeamFill className='me-2' size={14} />,
          },
          {
            text: 'ACR',
            link: '/calibration-references/mass/acr',
            icon: <Table className='me-2' size={14} />,
          },
          ,
          {
            text: 'Create ACR',
            link: '/calibration-references/mass/acr/create',
            icon: <PlusCircleFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push('/calibration-references/mass/acr'),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <AcrForm />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateACR;
