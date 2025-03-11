import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import Calibration from '@/sub-components/dashboard/jobs/calibrations/view/Calibration';
import InfoTab from '@/sub-components/dashboard/jobs/calibrations/view/InfoTab';
import Result from '@/sub-components/dashboard/jobs/calibrations/view/Result';
import Measurements from '@/sub-components/dashboard/jobs/calibrations/view/Measurements';
import ReferenceInstruments from '@/sub-components/dashboard/jobs/calibrations/view/ReferenceInstruments';
import { GeeksSEO } from '@/widgets';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Spinner, Tab, Tabs } from 'react-bootstrap';
import {
  ArrowLeftShort,
  BriefcaseFill,
  HouseDoorFill,
  InfoSquareFill,
  Speedometer,
} from 'react-bootstrap-icons';

const CalibrationDetails = () => {
  const router = useRouter();
  const { calibrateId, jobId } = router.query;

  const [calibration, setCalibration] = useState();
  const [instruments, setInstruments] = useState({ data: [], isLoading: true, isError: false });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('0');

  //* query calibration & job header
  useEffect(() => {
    if (calibrateId) {
      const jobHeaderRef = doc(db, 'jobHeaders', jobId);
      const calibrationRef = doc(db, 'jobCalibrations', calibrateId);
      const certificateRef = query(
        collection(db, 'jobCertificates'),
        where('calibrateId', '==', calibrateId),
        limit(1)
      );

      Promise.all([getDoc(calibrationRef), getDocs(certificateRef), getDoc(jobHeaderRef)])
        .then(async ([calibrationSnapshot, certificateSnapshot, jobHeaderSnapshot]) => {
          if (
            calibrationSnapshot.exists() &&
            !certificateSnapshot.empty &&
            jobHeaderSnapshot.exists()
          ) {
            const calibrationData = calibrationSnapshot.data();
            const certificateData = certificateSnapshot?.docs[0]?.data();
            const jobHeaderData = { jobId: jobHeaderSnapshot.id, ...jobHeaderSnapshot.data() };

            const locationSnapshot = jobHeaderData.location.id
              ? await getDoc(doc(db, 'locations', jobHeaderData.location.id))
              : undefined;

            const customerEquipmentSnapshot = calibrationData.description.id
              ? await getDoc(doc(db, 'customerEquipments', calibrationData.description.id))
              : undefined;

            const resolvedData = calibrationData?.data ? JSON.parse(calibrationData.data) : null;

            setCalibration({
              id: calibrationSnapshot.id,
              ...calibrationData,
              data: resolvedData,
              ...certificateData,
              location: locationSnapshot?.exists() ? {id: locationSnapshot.id, ...locationSnapshot.data()} : undefined, //prettier-ignore
              description: customerEquipmentSnapshot?.exists() ? { id: customerEquipmentSnapshot.id, ...customerEquipmentSnapshot.data()} : undefined, //prettier-ignore
              job: { id: jobHeaderSnapshot.id, ...jobHeaderData }, //prettier-ignore
            });
            setIsLoading(false);
          } else {
            setError('Calibration not found');
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.log(err);
          setError(err.message || 'Error fetching calibration');
          setIsLoading(false);
        });
    }
  }, [calibrateId]);

  //* query equipments
  useEffect(() => {
    if (calibration) {
      getDocs(collection(db, 'equipments'))
        .then((snapshot) => {
          if (!snapshot.empty) {
            const instruments = snapshot.docs
              .filter((instrument) => calibration.instruments?.includes(instrument.id))
              .map((doc) => {
                const data = doc.data();

                return {
                  id: doc.id,
                  tagId: data.tagId,
                  description: data.description,
                  category: data.category?.toLowerCase() || '',
                  make: data.make,
                  model: data.model,
                  serialNumber: data.serialNumber,
                  traceability: data.traceability,
                  certificateNo: data.certificateNo,
                  dueDate: undefined, //TODO: due date not yet available in the equipment's property
                };
              });

            setInstruments({ data: instruments, isLoading: false, isError: false });
          } else setInstruments({ data: [], isLoading: false, isError: false });
        })
        .catch((err) => {
          console.error(err.message);
          setInstruments({ data: [], isLoading: false, isError: true });
        });
    }
  }, [calibration]);

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
          <Button className='btn btn-primary' onClick={() => router.push('/jobs')}>
            Back to Job Calibration List
          </Button>
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
      <GeeksSEO title={`View Job #${jobId} Calibration | VITAR Group`} />

      <ContentHeader
        title={`View Details for Job #${jobId} Calibration #${calibrateId}`}
        description='View comprehensive job calibration details including calibration info, measurements, reference instruments & calibration test & data'
        badgeText='Calibration Management'
        badgeText2='Calibration'
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
            icon: <InfoSquareFill className='me-2' size={14} />,
            text: calibrateId,
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

      <Card>
        <Card.Body>
          <Tabs activeKey={activeTab} onSelect={setActiveTab}>
            <Tab eventKey='0' title='Summary'>
              <InfoTab calibration={calibration} />
            </Tab>

            <Tab eventKey='1' title='Measurements'>
              <Measurements calibration={calibration} />
            </Tab>

            <Tab eventKey='2' title='Referece Instruments'>
              <ReferenceInstruments instruments={instruments} />
            </Tab>

            <Tab eventKey='3' title='Calibration'>
              <Calibration calibration={calibration} />
            </Tab>

            <Tab eventKey='4' title='Result'>
              <Result calibration={calibration} />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </>
  );
};

export default CalibrationDetails;
