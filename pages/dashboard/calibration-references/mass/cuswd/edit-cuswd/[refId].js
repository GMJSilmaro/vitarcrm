import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import CuswdForm from '@/sub-components/dashboard/calibration-references/CuswdForm';
import { GeeksSEO } from '@/widgets';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Spinner } from 'react-bootstrap';
import {
  ArrowLeftShort,
  BoxSeam,
  HouseDoorFill,
  ListColumns,
  PencilFill,
  Table,
} from 'react-bootstrap-icons';

function EditCuswd() {
  const router = useRouter();
  const { refId } = router.query;

  const [cuswd, setCuswd] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  //* query cuswd
  useEffect(() => {
    if (refId) {
      const cuswdDocRef = doc(db, 'jobCalibrationReferences', 'CR000001', 'data', refId);

      getDoc(cuswdDocRef)
        .then((doc) => {
          if (doc.exists()) {
            setCuswd({ id: doc.id, ...doc.data() });
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
          <Button onClick={() => router.push('/calibration-references/mass/cuswd')}>
            Back to CUSWD List
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

  if (!cuswd) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>Reference Data not found</h3>
          <Link href='/calibration-references/mass/cuswd'>
            <Button variant='primary' className='mt-3'>
              Back to CUSWD List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO title='Edit Correction, Uncertainty of the Standard Weight & Drift - VITAR Group | Portal' />

      <ContentHeader
        title='Edit Correction, Uncertainty of the Standard Weight & Drift'
        description='Edit correction, uncertainty of the standard weight & drift information'
        badgeText='Reference Data Management'
        badgeText2='Edit References Data'
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
            text: cuswd ? cuswd.id : 'Create',
            link: `/calibration-references/mass/cuswd/edit-cuswd/${refId}`,
            icon: <PencilFill className='me-2' size={14} />,
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
          <CuswdForm data={cuswd} />
        </Card.Body>
      </Card>
    </>
  );
}

export default EditCuswd;
