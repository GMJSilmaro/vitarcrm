import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { useNotifications } from '@/hooks/useNotifications';
import JobForm from '@/sub-components/dashboard/jobs/JobForm';
import { GeeksSEO } from '@/widgets';
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Spinner } from 'react-bootstrap';
import { ArrowLeftShort, CheckCircle } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const EditJob = () => {
  const router = useRouter();
  const { jobId, workerId } = router.query;
  const auth = useAuth();
  const notifications = useNotifications();

  const [job, setJob] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isStoppingJob, setIsStoppingJob] = useState(false);

  const stopJob = async (id, setIsLoading) => {
    if (!id) return;

    Swal.fire({
      title: 'Finished Job?',
      text: 'Are you sure you want you want to mark the job as "Completed"?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'btn btn-primary rounded',
        cancelButton: 'btn btn-secondary rounded',
      },
    }).then(async (data) => {
      if (data.isConfirmed) {
        try {
          setIsLoading(true);

          //* update job header & details
          const jobHeaderRef = doc(db, 'jobHeaders', id);
          const jobDetailsRef = doc(db, 'jobDetails', id);

          await runTransaction(db, async (transaction) => {
            try {
              transaction.update(jobHeaderRef, {
                status: 'completed',
                updatedAt: serverTimestamp(),
                updatedBy: auth.currentUser,
              });

              transaction.update(jobDetailsRef, {
                endByAt: serverTimestamp(),
                endBy: auth.currentUser,
                updatedAt: serverTimestamp(),
                updatedBy: auth.currentUser,
              });
            } catch (error) {
              throw error;
            }
          });

          //* create notification for admin and supervisor when updated a job status
          await notifications.create({
            module: 'job',
            target: ['admin', 'supervisor'],
            title: 'Job completed',
            message: `Job (#${id}) has been marked as "Completed" by ${auth.currentUser.displayName}.`,
            data: {
              redirectUrl: `/jobs/view/${id}`,
            },
          });

          toast.success('Job has been completed successfully.', { position: 'top-right' });
          setIsLoading(false);

          //* reload page after 2 seconds
          setTimeout(() => {
            router.reload();
          }, 2000);
        } catch (error) {
          setIsLoading(false);
          console.error('Error stopping job', error);
          toast.error('Unexpected error occured while stopping job. Please try again later.');
        }
      }
    });
  };

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
            <div className='d-flex align-items-center gap-2'>
              <Button
                variant={job.status === 'in progress' ? 'outline-light' : 'light'}
                onClick={() => router.push(`/user/${workerId}`)}
              >
                <ArrowLeftShort size={20} className='me-2' />
                Go Back
              </Button>

              {job.status === 'in progress' && (
                <Button
                  disabled={isStoppingJob}
                  variant='light'
                  onClick={() => stopJob(jobId, setIsStoppingJob)}
                >
                  {isStoppingJob ? (
                    <Spinner animation='border' size='sm' className='me-2' />
                  ) : (
                    <CheckCircle size={20} className='me-2' />
                  )}
                  Close Job
                </Button>
              )}
            </div>
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
