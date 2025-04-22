import ContentHeader from '@/components/dashboard/ContentHeader';
import CuswdForm from '@/sub-components/dashboard/calibration-references/CuswdForm';
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

const CreateCuswd = () => {
  const router = useRouter();

  return (
    <>
      <GeeksSEO title='Create Correction, Uncertainty of the Standard Weight & Drift - VITAR Group | Portal' />

      <ContentHeader
        title='Create Correction, Uncertainty of the Standard Weight & Drift'
        description='Create correction, uncertainty of the standard weight & drift reference data for your calibration'
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
            link: '/calibration-references/mass/cuswd',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Mass',
            link: '/calibration-references/mass/cuswd',
            icon: <BoxSeam className='me-2' size={14} />,
          },
          {
            text: 'CUSWD',
            link: '/calibration-references/mass/cuswd',
            icon: <Table className='me-2' size={14} />,
          },
          ,
          {
            text: 'Create CUSWD',
            link: '/calibration-references/mass/cuswd/create',
            icon: <Plus className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back to CUSWD List`,
            icon: <ArrowLeftShort size={16} />,
            variant: 'light',
            onClick: () => router.push('/calibration-references/mass/cuswd'),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <CuswdForm />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateCuswd;
