import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import JobForm from '@/sub-components/dashboard/jobs/JobForm';
import { GeeksSEO } from '@/widgets';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Container, Row, Spinner } from 'react-bootstrap';
import { House, PencilFill, People } from 'react-bootstrap-icons';

const EditJob = () => {
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
        title='Edit Job'
        description='Update job summary, tasks, and schedules'
        badgeText='Job Management'
        badgeText2='Edit Job'
        breadcrumbItems={[
          {
            icon: <House className='me-2' size={14} />,
            text: 'Dashboard',
            link: '/dashboard',
          },
          {
            icon: <People className='me-2' size={14} />,
            text: 'Jobs',
            link: '/dashboard/jobs',
          },
          {
            icon: <PencilFill className='me-2' size={14} />,
            text: job ? job.id : 'Create',
          },
        ]}
      />

      <Row>
        <Col sm={12}>
          <Card className='shadow-sm'>
            <Card.Body>
              <JobForm data={job} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default EditJob;
