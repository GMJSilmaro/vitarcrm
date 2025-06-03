import PageHeader from '@/components/common/PageHeader';
import { db } from '@/firebase';
import CalibrationForm from '@/sub-components/dashboard/jobs/calibrations/CalibrationForm';
import CurrentJobCard from '@/sub-components/dashboard/user/jobs/CurrentJobCard';
import { GeeksSEO } from '@/widgets';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card } from 'react-bootstrap';
import { ArrowLeftShort, Plus } from 'react-bootstrap-icons';

const CreateCalibration = () => {
  const router = useRouter();
  const { jobId } = router.query;

  const [calibrations, setCalibrations] = useState({ data: [], isLoading: true, isError: false });

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

  return (
    <>
      <GeeksSEO title='Create Calibration | VITAR Group | Portal' />

      <div className='d-flex flex-column row-gap-4'>
        <PageHeader
          title={`Create Calibration For Job #${jobId}`}
          subtitle='Create calibration for your job assignment'
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
            <CalibrationForm isAdmin={false} calibrations={calibrations} />
          </Card.Body>
        </Card>
      </div>
    </>
  );
};

export default CreateCalibration;
