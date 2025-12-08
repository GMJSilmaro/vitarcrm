import ContentHeader from '@/components/dashboard/ContentHeader';
import RscmcForm from '@/sub-components/dashboard/calibration-references/RscmcForm';
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

const CreateRSCMC = () => {
  const router = useRouter();

  return (
    <>
      <GeeksSEO title='Create Reported Scope CMC (g) - VITAR Group | Portal' />

      <ContentHeader
        title='Create Reported Scope CMC (g)'
        description='Create reported scope CMC (g) data for your calibration'
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
            link: '/calibration-references/mass/rscmc',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Mass',
            link: '/calibration-references/mass/rscmc',
            icon: <BoxSeamFill className='me-2' size={14} />,
          },
          {
            text: 'RSCMC',
            link: '/calibration-references/mass/rscmc',
            icon: <Table className='me-2' size={14} />,
          },
          ,
          {
            text: 'Create RSCMC',
            link: '/calibration-references/mass/rscmc/create',
            icon: <PlusCircleFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push('/calibration-references/mass/rscmc'),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <RscmcForm />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateRSCMC;
