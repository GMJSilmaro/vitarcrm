import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import MpeForm from '@/sub-components/dashboard/calibration-references/MpeForm';
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

function EditMpe() {
  const router = useRouter();
  const { refId } = router.query;

  const [mpe, setMpe] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  //* query mpe
  useEffect(() => {
    if (refId) {
      const mpeDocRef = doc(db, 'jobCalibrationReferences', 'CR000002', 'data', refId);

      getDoc(mpeDocRef)
        .then((doc) => {
          if (doc.exists()) {
            setMpe({ id: doc.id, ...doc.data() });
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
          <Button onClick={() => router.push('/calibration-references/mass/mpe')}>
            Back to MPE List
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

  if (!mpe) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>Reference Data not found</h3>
          <Link href='/calibration-references/mass/mpe'>
            <Button variant='primary' className='mt-3'>
              Back to MPE List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO title='Edit MPE - VITAR Group | Portal' />

      <ContentHeader
        title='Edit MPE'
        description='Edit MPE information'
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
            text: mpe ? mpe.id : 'Create',
            link: `/calibration-references/mass/mpe/edit-mpe/${refId}`,
            icon: <PencilFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back to MPE List`,
            icon: <ArrowLeftShort size={16} />,
            variant: 'light',
            onClick: () => router.push('/calibration-references/mass/mpe'),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <MpeForm data={mpe} />
        </Card.Body>
      </Card>
    </>
  );
}

export default EditMpe;
