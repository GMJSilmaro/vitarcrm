import PageHeader from '@/components/common/PageHeader';
import { db } from '@/firebase';
import { STATUS_COLOR } from '@/schema/calibration';
import CalibrationForm from '@/sub-components/dashboard/jobs/calibrations/CalibrationForm';
import { GeeksSEO } from '@/widgets';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import _ from 'lodash';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Spinner } from 'react-bootstrap';
import { ArrowLeftShort, Eye } from 'react-bootstrap-icons';

const EditCalibrations = () => {
  const router = useRouter();
  const { workerId, calibrateId, jobId } = router.query;

  const [calibration, setCalibration] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [calibrations, setCalibrations] = useState({ data: [], isLoading: true, isError: false });

  //* query calibartion
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

  //* query job calibrations for job
  useEffect(() => {
    if (!jobId) {
      setCalibrations({ data: [], isLoading: false, isError: false });
      return;
    }
    const q = query(collection(db, 'jobCalibrations'), where('jobId', '==', jobId));

    getDocs(q)
      .then((snapshot) => {
        if (!snapshot.empty) {
          const calibrationData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

          setCalibrations({
            data: calibrationData,
            isLoading: false,
            isError: false,
          });
          return;
        }

        setCalibrations({
          data: [],
          isLoading: false,
          isError: false,
        });
      })
      .catch((err) => {
        console.error(err.message);
        setCalibrations({ data: [], isLoading: false, isError: true });
      });
  }, [jobId]);

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
          customBadges={[
            {
              label: _.startCase(calibration?.status),
              color: STATUS_COLOR[calibration?.status] || 'secondary',
            },
          ]}
          actionButtons={[
            {
              text: 'Back',
              icon: <ArrowLeftShort size={20} />,
              variant: 'outline-primary',
              onClick: () => router.push(`/user/${workerId}/jobs/${jobId}/calibrations`),
            },
          ]}
          dropdownItems={[
            {
              label: 'View Calibration',
              icon: Eye,
              onClick: () =>
                router.push(`/user/${workerId}/jobs/${jobId}/calibrations/view/${calibrateId}`),
            },
          ]}
        />

        {/* <CurrentJobCard /> */}

        <Card className='shadow-sm'>
          <Card.Body>
            <CalibrationForm data={calibration} isAdmin={false} calibrations={calibrations} />
          </Card.Body>
        </Card>
      </div>
    </>
  );
};

export default EditCalibrations;
