import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import JobRequestForm from '@/sub-components/dashboard/job-requests/JobRequestForm';
import { GeeksSEO } from '@/widgets';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Row, Spinner } from 'react-bootstrap';
import {
  ArrowLeftShort,
  EnvelopePaperFill,
  House,
  HouseFill,
  Link,
  PencilFill,
} from 'react-bootstrap-icons';

const EditJobRequest = () => {
  const router = useRouter();
  const { jobRequestId } = router.query;

  const [jobRequest, setJobRequest] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (jobRequestId) {
      const jobRequestRef = doc(db, 'jobRequests', jobRequestId);

      getDoc(jobRequestRef)
        .then((doc) => {
          if (doc.exists()) {
            setJobRequest({
              id: doc.id,
              ...doc.data(),
            });
            setIsLoading(false);
          } else {
            setError('Job request not found');
            setIsLoading(false);
          }
        })
        .catch((err) => {
          setError(err.message || 'Error fetching job request');
          setIsLoading(false);
        });
    }
  }, [jobRequestId]);

  if (isLoading) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
        <Spinner animation='border' variant='primary' />
        <span className='ms-3'>Loading Job Request...</span>
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
          <Button onClick={() => router.push('/jobs-requests')}>Back to Job Requests List</Button>
        </div>
      </div>
    );
  }

  if (!jobRequest) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>Job request not found</h3>
          <Link href='/jobs-requests'>
            <Button variant='primary' className='mt-3'>
              Back to Job Requests List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO title='Edit Job Request - VITAR Group | Portal' />

      <ContentHeader
        title='Edit Job Request'
        description='Update job request summary, customer equipment, and addional instructions'
        badgeText='Job Request Management'
        badgeText2='Edit Job Request'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/dashboard',
            icon: <HouseFill className='me-2' size={14} />,
          },
          {
            text: 'Jobs Requests',
            link: '/job-requests',
            icon: <EnvelopePaperFill className='me-2' size={14} />,
          },
          {
            text: jobRequest.id,
            icon: <PencilFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: 'Back to Job Request List',
            icon: <ArrowLeftShort size={16} />,
            variant: 'light',
            onClick: () => router.push(`/job-requests`),
          },
        ]}
      />

      <Row>
        <Col sm={12}>
          <Card className='shadow-sm'>
            <Card.Body>
              <JobRequestForm data={jobRequest} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default EditJobRequest;
