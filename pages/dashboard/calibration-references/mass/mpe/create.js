import ContentHeader from '@/components/dashboard/ContentHeader';
import MpeForm from '@/sub-components/dashboard/calibration-references/MpeForm';
import { GeeksSEO } from '@/widgets';
import { useRouter } from 'next/router';
import { Card } from 'react-bootstrap';
import {
  ArrowLeftShort,
  BoxSeam,
  HouseDoorFill,
  ListColumns,
  Plus,
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
        badgeText='Reference Data Management'
        badgeText2='New References Data'
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
            icon: <BoxSeam className='me-2' size={14} />,
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
            icon: <Plus className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back to MPE List`,
            icon: <ArrowLeftShort size={16} />,
            variant: 'light',
            onClick: () => router.push('/calibration-references/mass/MPE'),
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
