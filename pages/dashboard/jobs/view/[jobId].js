import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import CalibrationTab from '@/sub-components/dashboard/jobs/view/CalibrationsTab';
import SchedulingTab from '@/sub-components/dashboard/jobs/view/SchedulingTab';
import SummaryTab from '@/sub-components/dashboard/jobs/view/SummaryTab';
import TaskTab from '@/sub-components/dashboard/jobs/view/TaskTab';
import { GeeksSEO } from '@/widgets';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Card, Spinner, Tab, Tabs } from 'react-bootstrap';
import { BriefcaseFill } from 'react-bootstrap-icons';
import { FaArrowLeft } from 'react-icons/fa';

const JobDetails = () => {
  const router = useRouter();
  const { jobId } = router.query;

  const [job, setJob] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('0');

  useEffect(() => {
    if (jobId) {
      const jobHeaderRef = doc(db, 'jobHeaders', jobId);
      const jobDetailsRef = doc(db, 'jobDetails', jobId);

      Promise.all([getDoc(jobHeaderRef), getDoc(jobDetailsRef)])
        .then(([jobHeader, jobDetails]) => {
          if (jobHeader.exists() && jobDetails.exists()) {
            setJob({
              id: jobHeader.id,
              ...jobHeader.data(),
              ...jobDetails.data(),
            });
            setIsLoading(false);
          } else {
            setError('Job not found');
            setIsLoading(false);
          }
        })
        .catch((err) => {
          setError(err.message || 'Error fetching job');
          setIsLoading(false);
        });
    }
  }, [jobId]);

  if (isLoading) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
        <Spinner animation='border' variant='primary' />
        <span className='ms-3'>Loading Job...</span>
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
            Back to Jobs List
          </button>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>Job not found</h3>
          <Link href='/jobs'>
            <Button variant='primary' className='mt-3'>
              Back to Job List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO title='Create Customer | VITAR Group' />

      <ContentHeader
        title={`View Details for Job #${job.id}`}
        description='View comprehensive job details including job summary, tasks and schedules'
        badgeText='Job Management'
        badgeText2='Jobs'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <i className='fe fe-home' style={{ marginRight: '8px' }} />,
          },
          {
            text: 'Job List',
            link: '/jobs',
            icon: <BriefcaseFill className='me-2' size={14} />,
          },
          {
            text: `View ${job.id}`,
            icon: <i className='fe fe-user' style={{ marginRight: '8px' }} />,
          },
        ]}
        actionButtons={[
          {
            text: 'Back to Job List',
            icon: <FaArrowLeft size={16} />,
            variant: 'light',
            tooltip: 'Back to Job List',
            onClick: () => router.push('/jobs'),
          },
        ]}
      />

      <Card>
        <Card.Body>
          <Tabs className='mb-1' activeKey={activeTab} onSelect={setActiveTab}>
            <Tab eventKey='0' title='Summary'>
              <SummaryTab job={job} />
            </Tab>

            <Tab eventKey='1' title='Job Task'>
              <TaskTab job={job} />
            </Tab>

            <Tab eventKey='2' title='Schedule'>
              <SchedulingTab job={job} />
            </Tab>

            <Tab eventKey='3' title='Calibrations'>
              <CalibrationTab job={job} />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </>
  );
};

export default JobDetails;
