import ContentHeader from '@/components/dashboard/ContentHeader';
import ReferenceEquipmentForm from '@/sub-components/dashboard/reference-equipment/ReferenceEquipmentForm';
import { GeeksSEO } from '@/widgets';
import _ from 'lodash';
import { useRouter } from 'next/router';
import { Card } from 'react-bootstrap';
import {
  ArrowLeftShort,
  BoxSeamFill,
  HouseDoorFill,
  PlusCircle,
  Tools,
} from 'react-bootstrap-icons';

const CreateReferenceEquipment = () => {
  const router = useRouter();
  const { category } = router.query;

  if (!category) return null;

  const categoryTitle =
    category
      ?.split(' ')
      ?.map((str) => _.capitalize(str))
      ?.join(' ') || '';

  return (
    <>
      <GeeksSEO title={`Create Reference Equipment for ${categoryTitle} - VITAR Group | Portal`} />

      <ContentHeader
        title={`Create Reference Equipment for ${categoryTitle}`}
        description='Create reference equipment which can be used for jobs and calibrations'
        badgeText='Reference Equipment Management'
        badgeText2='New Reference Equipment'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' style={{ fontSize: '14px' }} />,
          },
          {
            text: 'Reference Equipment',
            link: '/reference-equipment',
            icon: <Tools className='me-2' size={14} />,
          },
          {
            text: categoryTitle,
            link: `/reference-equipment/${String(category).toLowerCase()}`,
            icon: <BoxSeamFill className='me-2' size={14} />,
          },
          {
            text: 'Create Reference Equipment',
            link: `/reference-equipment/${String(category).toLowerCase()}/create`,
            icon: <PlusCircle className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push(`/reference-equipment/${String(category).toLowerCase()}`),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <ReferenceEquipmentForm />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateReferenceEquipment;
