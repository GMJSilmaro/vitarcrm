import ContentHeader from '@/components/dashboard/ContentHeader';
import MpeForm from '@/sub-components/dashboard/calibration-references/MpeForm';
import { GeeksSEO } from '@/widgets';
import { useRouter } from 'next/router';
import { Card } from 'react-bootstrap';
import {
  ArrowLeftShort,
  BoxSeam,
  BoxSeamFill,
  HouseDoorFill,
  ListColumns,
  Plus,
  PlusCircleFill,
  Table,
} from 'react-bootstrap-icons';

const CreateMpe = () => {
  const router = useRouter();

  return (
    <>
      <GeeksSEO title='Create MPE - VITAR Group | Portal' />

      <ContentHeader
        title='Create MPE'
        description='Create MPE reference data for your calibration'
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
            link: '/calibration-references/mass/mpe',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Mass',
            link: '/calibration-references/mass/mpe',
            icon: <BoxSeamFill className='me-2' size={14} />,
          },
          {
            text: 'MPE',
            link: '/calibration-references/mass/mpe',
            icon: <Table className='me-2' size={14} />,
          },
          ,
          {
            text: 'Create MPE',
            link: '/calibration-references/mass/mpe/create',
            icon: <PlusCircleFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push('/calibration-references/mass/mpe'),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <MpeForm />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateMpe;
