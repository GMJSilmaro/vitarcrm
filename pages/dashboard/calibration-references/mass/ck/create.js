import ContentHeader from '@/components/dashboard/ContentHeader';
import CkForm from '@/sub-components/dashboard/calibration-references/CkForm';
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

const CreateCk = () => {
  const router = useRouter();

  return (
    <>
      <GeeksSEO title='Create CK - VITAR Group | Portal' />

      <ContentHeader
        title='Create CK'
        description='Create CK reference data for your calibration'
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
            link: '/calibration-references/mass/ck',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Mass',
            link: '/calibration-references/mass/ck',
            icon: <BoxSeam className='me-2' size={14} />,
          },
          {
            text: 'CK',
            link: '/calibration-references/mass/ck',
            icon: <Table className='me-2' size={14} />,
          },
          ,
          {
            text: 'Create CK',
            link: '/calibration-references/mass/ck/create',
            icon: <Plus className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back to CK List`,
            icon: <ArrowLeftShort size={16} />,
            variant: 'light',
            onClick: () => router.push('/calibration-references/mass/MPE'),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <CkForm />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateCk;
