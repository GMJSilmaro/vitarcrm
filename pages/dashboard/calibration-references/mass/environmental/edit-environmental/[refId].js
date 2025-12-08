import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import EnvironmentalForm from '@/sub-components/dashboard/calibration-references/EnvironmentalForm';
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
  ListColumns,
  PencilFill,
  Table,
} from 'react-bootstrap-icons';

function EditEnvironmental() {
  const router = useRouter();
  const { refId } = router.query;

  const [environmental, setEnvironmental] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  //* query environmental
  useEffect(() => {
    if (refId) {
      const environmentalDocRef = doc(db, 'jobCalibrationReferences', 'CR000007', 'data', refId);

      getDoc(environmentalDocRef)
        .then((doc) => {
          if (doc.exists()) {
            setEnvironmental({ id: doc.id, ...doc.data() });
            setIsLoading(false);
          } else {
            setError('Reference Data not found');
            setIsLoading(false);
          }
        })
        .catch((err) => {
          setError(err.message || 'Error fetching reference data');
          setIsLoading(false);
        });
    }
  }, [refId]);

  if (error) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3 className='text-danger'>Error</h3>
          <p className='text-muted'>{error}</p>
          <Button onClick={() => router.push('/calibration-references/mass/environmental')}>
            Back to Environmental List
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
        <Spinner animation='border' variant='primary' />
        <span className='ms-3'>Loading Reference Data...</span>
      </div>
    );
  }

  if (!environmental) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>Reference Data not found</h3>
          <Link href='/calibration-references/mass/environmental'>
            <Button variant='primary' className='mt-3'>
              Back to Environmental List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO title='Edit Environmental - VITAR Group | Portal' />

      <ContentHeader
        title='Edit Environmental'
        description='Edit environmental information'
        badgeText='Calibration References Data Management'
        badgeText2='Edit Reference Data'
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
            text: environmental ? environmental.id : 'Create',
            link: `/calibration-references/mass/environmental/edit-environmental/${refId}`,
            icon: <PencilFill className='me-2' size={14} />,
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
        dropdownItems={[
          {
            label: 'View Environmental',
            icon: Eye,
            onClick: () => router.push(`/calibration-references/mass/environmental/view/${refId}`),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <EnvironmentalForm data={environmental} />
        </Card.Body>
      </Card>
    </>
  );
}

export default EditEnvironmental;
