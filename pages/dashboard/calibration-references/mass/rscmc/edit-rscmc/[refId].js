import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import RscmcForm from '@/sub-components/dashboard/calibration-references/RscmcForm';
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

function EditRscmc() {
  const router = useRouter();
  const { refId } = router.query;

  const [rscmc, setRscmc] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  //* query rscmc
  useEffect(() => {
    if (refId) {
      const rscmcDocRef = doc(db, 'jobCalibrationReferences', 'CR000006', 'data', refId);

      getDoc(rscmcDocRef)
        .then((doc) => {
          if (doc.exists()) {
            setRscmc({ id: doc.id, ...doc.data() });
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
          <Button onClick={() => router.push('/calibration-references/mass/rscmc')}>
            Back to RSCMC List
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

  if (!rscmc) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>Reference Data not found</h3>
          <Link href='/calibration-references/mass/rscmc'>
            <Button variant='primary' className='mt-3'>
              Back to RSCMC List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO title='Edit Reported Scope CMC (g) - VITAR Group | Portal' />

      <ContentHeader
        title='Edit Reported Scope CMC (g)'
        description='Edit reported scope CMC (g) information'
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
            text: rscmc ? rscmc.id : 'Create',
            link: `/calibration-references/mass/rscmc/edit-rscmc/${refId}`,
            icon: <PencilFill className='me-2' size={14} />,
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
        dropdownItems={[
          {
            label: 'View RSCMC',
            icon: Eye,
            onClick: () => router.push(`/calibration-references/mass/rscmc/view/${refId}`),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <RscmcForm data={rscmc} />
        </Card.Body>
      </Card>
    </>
  );
}

export default EditRscmc;
