import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import CalibrationForm from '@/sub-components/dashboard/jobs/calibrations/CalibrationForm';
import { GeeksSEO } from '@/widgets';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Card } from 'react-bootstrap';
import {
  ArrowLeftShort,
  BriefcaseFill,
  HouseDoorFill,
  PlusCircleFill,
  Speedometer,
} from 'react-bootstrap-icons';

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
            icon: <PlusCircleFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back to Job #${jobId} Calibrations`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push(`/jobs/${jobId}/calibrations`),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <CalibrationForm calibrations={calibrations} />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateCalibration;
