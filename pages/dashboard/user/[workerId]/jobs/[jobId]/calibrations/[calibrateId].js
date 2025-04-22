import PageHeader from '@/components/common/PageHeader';
import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import CalibrationForm from '@/sub-components/dashboard/jobs/calibrations/CalibrationForm';
import CurrentJobCard from '@/sub-components/dashboard/user/jobs/CurrentJobCard';
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
  const { workerId, calibrateId, jobId } = router.query;

  const [calibration, setCalibration] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (calibrateId) {
      const calibrationRef = doc(db, 'jobCalibrations', calibrateId);
      const certificateRef = doc(db, 'jobCertificates', calibrateId);

      Promise.all([getDoc(calibrationRef), getDoc(certificateRef)])
        .then(([calibrationSnapshot, certificateSnapshot]) => {
          if (calibrationSnapshot.exists() && certificateSnapshot.exists()) {
            setCalibration({
              id: calibrationSnapshot.id,
              ...calibrationSnapshot.data(),
              ...certificateSnapshot.data(),
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
          <button
            className='btn btn-primary'
            onClick={() => router.push(`/user/${workerId}/jobs/${jobId}/calibrations`)}
          >
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
          <h3>Calibration not found</h3>
          <Link href={`/user/${workerId}/jobs/${jobId}/calibrations`}>
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
      <GeeksSEO
        title={`Edit Calibration #${calibrateId} for Job #${jobId} | VITAR Group | Portal`}
      />

      <div className='d-flex flex-column row-gap-4'>
        <PageHeader
          title={`Edit Calibration #${calibrateId} for Job #${jobId}`}
          subtitle='Edit calibration details'
          action={
            <Button variant='light' onClick={() => router.back()}>
              <ArrowLeftShort size={20} className='me-2' />
              Go Back
            </Button>
          }
        />

        <CurrentJobCard />

        <Card className='shadow-sm'>
          <Card.Body>
            <CalibrationForm data={calibration} isAdmin={false} />
          </Card.Body>
        </Card>
      </div>
    </>
  );
};

export default EditCalibrations;
