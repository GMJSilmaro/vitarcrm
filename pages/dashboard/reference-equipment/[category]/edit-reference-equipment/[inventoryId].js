import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import ReferenceEquipmentForm from '@/sub-components/dashboard/reference-equipment/ReferenceEquipmentForm';
import { GeeksSEO } from '@/widgets';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Spinner } from 'react-bootstrap';
import {
  ArrowLeftShort,
  BoxSeamFill,
  Eye,
  HouseDoorFill,
  PencilFill,
  Tools,
} from 'react-bootstrap-icons';

function EditReferenceEquipment() {
  const router = useRouter();
  const { inventoryId, category } = router.query;

  const categoryTitle =
    category
      ?.split(' ')
      ?.map((str) => _.capitalize(str))
      ?.join(' ') || '';

  const [refEquipment, setRefEquipment] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  //* query ref equipment
  useEffect(() => {
    if (!inventoryId) {
      setRefEquipment({ data: {}, isLoading: false, isError: false });
      return;
    }

    const refEquipmentDocRef = doc(db, 'equipments', inventoryId);

    getDoc(refEquipmentDocRef)
      .then((doc) => {
        if (doc.exists()) {
          setRefEquipment({ id: doc.id, ...doc.data() });
          setIsLoading(false);
        } else {
          setError('Reference equipment data not found');
          setIsLoading(false);
        }
      })
      .catch((err) => {
        setError(err.message || 'Error fetching reference equipment data');
        setIsLoading(false);
      });
  }, [inventoryId]);

  if (error) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3 className='text-danger'>Error</h3>
          <p className='text-muted'>{error}</p>
          <Button
            onClick={() => router.push(`/reference-equipment/${String(category).toLowerCase()}`)}
          >
            Back to Reference Equipment List for {categoryTitle}
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
        <Spinner animation='border' variant='primary' />
        <span className='ms-3'>Loading Reference Equipment Data...</span>
      </div>
    );
  }

  if (!refEquipment) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>Reference Data not found</h3>
          <Link href={`/reference-equipment/${String(category).toLowerCase()}`}>
            <Button variant='primary' className='mt-3'>
              Back to Reference Equipment List for {categoryTitle}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO title={`Edit Reference Equipment for ${categoryTitle} - VITAR Group | Portal`} />

      <ContentHeader
        title={`Edit Reference Equipment for ${categoryTitle}`}
        description='Edit reference equipment information'
        badgeText='Reference Equipment Management'
        badgeText2='Edit Reference Equipment Data'
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
            text: refEquipment ? refEquipment.id : 'Create',
            link: `/reference-equipment/${String(category ).toLowerCase()}/edit-reference-equipment/${inventoryId}`, // prettier-ignore
            icon: <PencilFill className='me-2' size={14} />,
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
        dropdownItems={[
          {
            label: 'View Equipment',
            icon: Eye,
            onClick: () =>
              router.push(
                `/reference-equipment/${String(category).toLowerCase()}/view/${inventoryId}`
              ),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <ReferenceEquipmentForm data={refEquipment} />
        </Card.Body>
      </Card>
    </>
  );
}

export default EditReferenceEquipment;
