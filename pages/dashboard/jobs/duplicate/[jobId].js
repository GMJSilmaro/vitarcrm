'use client';

import { Container, Card, Spinner, Button } from 'react-bootstrap';
import { GeeksSEO } from 'widgets';
import ContentHeader from 'components/dashboard/ContentHeader';
import JobForm from '@/sub-components/dashboard/jobs/JobForm';
import { useRouter } from 'next/router';
import {
  BriefcaseFill,
  House,
  HouseDoorFill,
  PlusCircle,
  PlusCircleFill,
} from 'react-bootstrap-icons';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';

const CreateJobs = () => {
  const router = useRouter();
  const { jobId } = router.query;

  const [job, setJob] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
          <Button onClick={() => router.push('/jobs')}>Back to Jobs List</Button>
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
    <Container>
      <GeeksSEO title='Create Job | SAS&ME - SAP B1 | Portal' />

      <ContentHeader
        title='Create New Job'
        description='Streamline your workflow by creating detailed job assignments with tasks, schedules, and assigned workers'
        infoText='Complete all required fields including job details, scheduling, and worker assignments'
        badgeText='Job Management'
        badgeText2='New Job'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' size={14} />,
          },
          {
            text: 'Jobs',
            link: '/jobs',
            icon: <BriefcaseFill className='me-2' size={14} />,
          },
          {
            text: 'Create Job',
            icon: <PlusCircleFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: 'Back to Jobs',
            icon: <i className='fe fe-arrow-left' />,
            variant: 'light',
            tooltip: 'Return to jobs list',
            onClick: () => router.push('/jobs'),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <JobForm toDuplicateJob={job} />
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreateJobs;
