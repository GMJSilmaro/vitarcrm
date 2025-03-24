import CalibrationForm from '@/sub-components/dashboard/jobs/calibrations/CalibrationForm';
import CurrentJobCard from '@/sub-components/dashboard/user/jobs/CurrentJobCard';
import { GeeksSEO } from '@/widgets';
import { useRouter } from 'next/router';
import { Button, Card } from 'react-bootstrap';
import { ArrowLeftShort, Plus } from 'react-bootstrap-icons';

const CreateCalibration = () => {
  const router = useRouter();
  const { jobId } = router.query;

  return (
    <>
      <GeeksSEO title='Create Calibration | VITAR Group | Portal' />

      <div className='d-flex flex-column row-gap-4'>
        <div className='d-flex justify-content-between align-items-start my-2'>
          <div>
            <h2 className='mb-0'>Create Calibration For Job #{jobId}</h2>
            <p className='text-muted mb-0'>Create calibration for your job assignment</p>
          </div>

          <Button variant='light' onClick={() => router.back()}>
            <ArrowLeftShort size={20} className='me-2' />
            Go Back
          </Button>
        </div>

        <CurrentJobCard />

        <Card className='shadow-sm'>
          <Card.Body>
            <CalibrationForm isAdmin={false} />
          </Card.Body>
        </Card>
      </div>
    </>
  );
};

export default CreateCalibration;
