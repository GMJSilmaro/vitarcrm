import ContentHeader from '@/components/dashboard/ContentHeader';
import CalibrationForm from '@/sub-components/dashboard/jobs/calibrations/CalibrationForm';
import { GeeksSEO } from '@/widgets';
import { useRouter } from 'next/router';
import { Card } from 'react-bootstrap';
import {
  ArrowLeftShort,
  BriefcaseFill,
  HouseDoorFill,
  PlusCircle,
  Speedometer,
} from 'react-bootstrap-icons';

const CreateCalibration = () => {
  const router = useRouter();
  const { jobId } = router.query;

  return (
    <>
      <GeeksSEO title='Create Calibration - VITAR Group | Portal' />

      <ContentHeader
        title='Create Calibration'
        description='Create calibration for your job assignment'
        infoText='Complete all the required fields to create a calibration'
        badgeText='Calibration Management'
        badgeText2='New Calibration'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' />,
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
            text: 'Create Calibration',
            link: `/jobs/${jobId}/calibrations/create`,
            icon: <PlusCircle className='me-2' size={14} />,
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

      <Card className='shadow-sm'>
        <Card.Body>
          <CalibrationForm />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateCalibration;
