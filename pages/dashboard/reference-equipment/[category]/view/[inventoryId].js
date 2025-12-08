import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import SummaryTab from '@/sub-components/dashboard/reference-equipment/view/SummaryTab';

import { GeeksSEO } from '@/widgets';
import { doc, getDoc } from 'firebase/firestore';
import _ from 'lodash';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Card, Spinner, Tab, Tabs } from 'react-bootstrap';
import {
  ArrowLeftShort,
  BoxSeamFill,
  EyeFill,
  HouseDoorFill,
  PencilSquare,
  Tools,
} from 'react-bootstrap-icons';

const ReferenceEquipmentDetails = () => {
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

  const [activeTab, setActiveTab] = useState('0');

  //* query ref equipment
  useEffect(() => {
    if (!inventoryId) {
      setRefEquipment({ data: {}, isLoading: false, isError: false });
      return;
    }

    getDoc(doc(db, 'equipments', inventoryId))
      .then((doc) => {
        console.log({ doc });

        if (doc.exists()) {
          setRefEquipment({
            id: doc.id,
            ...doc.data(),
          });
          setIsLoading(false);
        } else {
          setError('Reference Equipment not found');
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error(err.message);
        setError(err.message || 'Error fetching reference equipment');
        setIsLoading(false);
      });
  }, [inventoryId]);

  if (isLoading) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
        <Spinner animation='border' variant='primary' />
        <span className='ms-3'>Loading Reference Equipment Data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3 className='text-danger'>Error</h3>
          <p className='text-muted'>{error}</p>
          <button
            className='btn btn-primary'
            onClick={() => router.push(`/reference-equipment/${String(category).toLowerCase()}`)}
          >
            Back to Reference Equipment List for {categoryTitle}
          </button>
        </div>
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
          <h3>Reference Equipment not found</h3>
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
      <GeeksSEO title={`View Details for Reference Equipment #${refEquipment.id} | VITAR Group`} />

      <ContentHeader
        title={`View Details for Reference Equipment #${refEquipment.id}`}
        description='View comprehensive details about the reference equipment'
        badgeText='Reference Equipment Management'
        badgeText2='View Reference Equipment'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' size={14} />,
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
            text: `View ${refEquipment.id}`,
            icon: <EyeFill className='me-2' size={14} />,
          },
        ]}
        customBadges={[
          {
            label: refEquipment?.qty > 0 ? 'Available' : 'Unavailable',
            color: refEquipment?.qty > 0 ? 'success' : 'danger',
          },
        ]}
        actionButtons={[
          {
            text: 'Back',
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push(`/reference-equipment/${String(category).toLowerCase()}`),
          },
        ]}
        dropdownItems={[
          {
            label: 'Edit Equipment',
            icon: PencilSquare,
            onClick: () =>
              router.push(
                `/reference-equipment/${String(
                  category
                ).toLowerCase()}/edit-reference-equipment/${inventoryId}`
              ),
          },
        ]}
      />

      <Card>
        <Card.Body>
          <Tabs className='mb-1' activeKey={activeTab} onSelect={setActiveTab}>
            <Tab eventKey='0' title='Summary'>
              <SummaryTab refEquipment={refEquipment} />
            </Tab>

            <Tab eventKey='1' title='History'>
              <Card className='shadow-none'>
                <Card.Body className='text-center mt-5'>
                  <h4 className='mb-0'>History not yet suppoted</h4>
                  <p>Tab is under development</p>
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </>
  );
};

export default ReferenceEquipmentDetails;
