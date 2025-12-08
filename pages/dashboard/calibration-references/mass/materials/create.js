import ContentHeader from '@/components/dashboard/ContentHeader';
import MaterialForm from '@/sub-components/dashboard/calibration-references/MaterialsForm';
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

const CreateMaterial = () => {
  const router = useRouter();

  return (
    <>
      <GeeksSEO title='Create Material - VITAR Group | Portal' />

      <ContentHeader
        title='Create Material'
        description='Create material data for your calibration'
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
            link: '/calibration-references/mass/materials',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Mass',
            link: '/calibration-references/mass/materials',
            icon: <BoxSeamFill className='me-2' size={14} />,
          },
          {
            text: 'Materials',
            link: '/calibration-references/mass/materials',
            icon: <Table className='me-2' size={14} />,
          },
          ,
          {
            text: 'Create Materials',
            link: '/calibration-references/mass/materials/create',
            icon: <PlusCircleFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push('/calibration-references/mass/materials'),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <MaterialForm />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateMaterial;
