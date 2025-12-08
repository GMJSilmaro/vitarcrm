import ContentHeader from '@/components/dashboard/ContentHeader';
import EnvironmentalForm from '@/sub-components/dashboard/calibration-references/EnvironmentalForm';
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

const CreateEnvironmental = () => {
  const router = useRouter();

  return (
    <>
      <GeeksSEO title='Create Environmental - VITAR Group | Portal' />

      <ContentHeader
        title='Create Environmental'
        description='Create environmental data for your calibration'
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
            link: '/calibration-references/mass/environmental',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Mass',
            link: '/calibration-references/mass/environmental',
            icon: <BoxSeamFill className='me-2' size={14} />,
          },
          {
            text: 'Environmental',
            link: '/calibration-references/mass/environmental',
            icon: <Table className='me-2' size={14} />,
          },
          ,
          {
            text: 'Create Environmental',
            link: '/calibration-references/mass/environmental/create',
            icon: <PlusCircleFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push('/calibration-references/mass/environmental'),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <EnvironmentalForm />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateEnvironmental;
