import PageHeader from '@/components/common/PageHeader';
import { db } from '@/firebase';
import JobForm from '@/sub-components/dashboard/jobs/JobForm';
import { GeeksSEO } from '@/widgets';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Spinner } from 'react-bootstrap';
import { ArrowLeftShort } from 'react-bootstrap-icons';

const EditJob = () => {
  const router = useRouter();
  const { jobId, workerId } = router.query;

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
          <Button onClick={() => router.push(`/user/${workerId}`)}>Back to Dashboard</Button>
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
          <Link href={`/user/${workerId}`}>
            <Button variant='primary' className='mt-3'>
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO title={`Edit Job #${jobId} | VITAR Group | Portal`} />

      <div className='d-flex flex-column row-gap-4'>
        <PageHeader
          title={`Edit Job #${job.id}`}
          subtitle='Edit job details'
          action={
            <Button variant='light' onClick={() => router.back()}>
              <ArrowLeftShort size={20} className='me-2' />
              Go Back
            </Button>
          }
        />

        <Card className='shadow-sm'>
          <Card.Body>
            <JobForm data={job} isAdmin={false} />
          </Card.Body>
        </Card>
      </div>
    </>
  );
};

export default EditJob;
