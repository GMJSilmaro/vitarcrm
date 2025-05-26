import ContentHeader from '@/components/dashboard/ContentHeader';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { useNotifications } from '@/hooks/useNotifications';
import JobForm from '@/sub-components/dashboard/jobs/JobForm';
import { GeeksSEO } from '@/widgets';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Col, Row, Spinner } from 'react-bootstrap';
import { BriefcaseFill, House, PencilFill, ShieldCheck } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import { FaArrowLeft } from 'react-icons/fa';
import Swal from 'sweetalert2';

const EditJob = () => {
  const router = useRouter();
  const { jobId } = router.query;
  const auth = useAuth();
  const notifications = useNotifications();

  const [job, setJob] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleUpdateToValidated = async (id, setIsLoading) => {
    if (!id) return;

    Swal.fire({
      title: `Job Status Update - Job #${id}`,
      text: `Are you sure you want to update the job status to "Validated"?`,
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

          const jobHeaderRef = doc(db, 'jobHeaders', id);

          await Promise.all([
            updateDoc(jobHeaderRef, {
              status: 'validated',
              updatedAt: serverTimestamp(),
              updatedBy: auth.currentUser,
            }),
            //* create notification for admin and supervisor when updated a job status
            notifications.create({
              module: 'job',
              target: ['admin', 'supervisor'],
              title: 'Job status updated',
              message: `Job (#${id}) status was updated by ${auth.currentUser.displayName} to "Validated".`, //prettier-ignore
              data: {
                redirectUrl: `/jobs/view/${id}`,
              },
            }),
          ]);

          toast.success('Job status updated successfully', { position: 'top-right' });
          setIsLoading(false);

          //* reload page after 2 seconds
          setTimeout(() => {
            router.reload();
          }, 2000);
        } catch (error) {
          console.error('Error updating job status:', error);
          toast.error('Error updating job status: ' + error.message, { position: 'top-right' }); //prettier-ignore
          setIsLoading(false);
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
    <>
      <GeeksSEO title='Edit Job | VITAR Group' />

      <ContentHeader
        title='Edit Job'
        description='Update job summary, tasks, and schedules'
        badgeText='Job Management'
        badgeText2='Edit Job'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/dashboard',
            icon: <House className='me-2' size={14} />,
          },
          {
            text: 'Jobs',
            link: '/jobs',
            icon: <BriefcaseFill className='me-2' size={14} />,
          },
          {
            text: job ? job.id : 'Create',
            icon: <PencilFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: 'Back to Job List',
            icon: <FaArrowLeft size={16} />,
            variant:
              (auth.role === 'admin' || auth.role === 'supervisor') &&
              job &&
              job.status !== 'validated'
                ? 'outline-primary'
                : 'light',
            tooltip: 'Back to Job List',
            onClick: () => router.push('/jobs'),
          },
          ...(job && job.status !== 'validated'
            ? [
                {
                  text: 'Validate Job',
                  variant: 'light',
                  icon: <ShieldCheck size={14} />,
                  onClick: (args) => handleUpdateToValidated(jobId, args.setIsLoading),
                },
              ]
            : []),
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
