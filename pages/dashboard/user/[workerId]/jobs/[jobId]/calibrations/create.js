import PageHeader from '@/components/common/PageHeader';
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
            <CalibrationForm isAdmin={false} />
          </Card.Body>
        </Card>
      </div>
    </>
  );
};

export default CreateCalibration;
