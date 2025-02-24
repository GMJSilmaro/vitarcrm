import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import CalibrationForm from '@/sub-components/dashboard/jobs/calibrations/CalibrationForm';
import { GeeksSEO } from '@/widgets';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Col, Row, Spinner } from 'react-bootstrap';
import {
  ArrowLeftShort,
  BriefcaseFill,
  HouseDoorFill,
  PencilFill,
  Speedometer,
} from 'react-bootstrap-icons';

const EditCalibrations = () => {
  const router = useRouter();
  const { calibrateId, jobId } = router.query;

  const [calibration, setCalibration] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (calibrateId) {
      const calibrationRef = doc(db, 'jobCalibrations', calibrateId);
      const certificateRef = query(
        collection(db, 'jobCertificates'),
        where('calibrateId', '==', calibrateId),
        limit(1)
      );

      Promise.all([getDoc(calibrationRef), getDocs(certificateRef)])
        .then(([calibrationSnapshot, certificateSnapshot]) => {
          if (calibrationSnapshot.exists() && !certificateSnapshot.empty) {
            setCalibration({
              id: calibrationSnapshot.id,
              ...calibrationSnapshot.data(),
              ...certificateSnapshot.docs[0].data(),
            });
            setIsLoading(false);
          } else {
            setError('Calibration not found');
            setIsLoading(false);
          }
        })
        .catch((err) => {
          setError(err.message || 'Error fetching calibration');
          setIsLoading(false);
        });
    }
  }, [calibrateId]);

  if (isLoading) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
        <Spinner animation='border' variant='primary' />
        <span className='ms-3'>Loading Calibration...</span>
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
          <button className='btn btn-primary' onClick={() => router.push('/jobs')}>
            Back to Job Calibration List
          </button>
        </div>
      </div>
    );
  }

  if (!calibration) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>calibration not found</h3>
          <Link href='/jobs'>
            <Button variant='primary' className='mt-3'>
              Back to Job Calibration List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO title='Edit Calibration | VITAR Group' />

      <ContentHeader
        title='Edit Calibration'
        description='Update calibration information'
        badgeText='Calibration Management'
        badgeText2='Edit Calibration'
        breadcrumbItems={[
          {
            icon: <HouseDoorFill className='me-2' size={14} />,
            text: 'Dashboard',
            link: '/dashboard',
          },
          {
            text: 'Jobs',
            link: '/jobs',
            icon: <BriefcaseFill className='me-2' size={14} />,
          },
          {
            text: `Job #${jobId} Calibrations`,
            link: `/jobs/${jobId}/calibrations`,
            icon: <Speedometer className='me-2' size={14} />,
          },
          {
            icon: <PencilFill className='me-2' size={14} />,
            text: calibration ? calibration.id : 'Create',
          },
        ]}
        actionButtons={[
          {
            text: `Back to Job #${jobId} Calibrations List`,
            icon: <ArrowLeftShort size={16} />,
            variant: 'light',
            onClick: () => router.push(`/jobs/${jobId}/calibrations`),
          },
        ]}
      />

      <Row>
        <Col sm={12}>
          <Card className='shadow-sm'>
            <Card.Body>
              <CalibrationForm data={calibration} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default EditCalibrations;
