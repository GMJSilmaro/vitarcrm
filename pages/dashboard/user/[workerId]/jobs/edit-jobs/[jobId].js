import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { useNotifications } from '@/hooks/useNotifications';
import { STATUS_COLOR } from '@/schema/job';
import JobForm from '@/sub-components/dashboard/jobs/JobForm';
import { GeeksSEO } from '@/widgets';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import _ from 'lodash';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Spinner } from 'react-bootstrap';
import {
  ArrowLeftShort,
  CheckCircle,
  ExclamationTriangleFill,
  Eye,
  PencilSquare,
  PlusSquare,
  Stop,
} from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const EditJob = () => {
  const router = useRouter();
  const { jobId, workerId } = router.query;
  const auth = useAuth();
  const notifications = useNotifications();

  const [job, setJob] = useState();
  const [jobRequest, setJobRequest] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [jobCn, setJobCn] = useState({ data: null, isLoading: true, isError: false });

  const stopJob = async (id, setIsLoading, salesperson) => {
    if (!id) return;

    Swal.fire({
      title: 'Finished Job?',
      text: 'Are you sure you want you want to mark the job as "Job Validation"?',
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
                status: 'job-validation',
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
            target: ['admin', 'supervisor', ...(salesperson ? [salesperson] : [])],
            title: 'Job finished',
            message: `Job (#${id}) has been finished by ${auth.currentUser.displayName}.`,
            data: {
              redirectUrl: `/jobs/view/${id}`,
            },
          });

          toast.success('Job has been finished successfully.', { position: 'top-right' });
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

  //* query job, job headers & details and job request
  useEffect(() => {
    if (jobId) {
      const jobHeaderRef = doc(db, 'jobHeaders', jobId);

      getDoc(jobHeaderRef).then((jobDoc) => {
        if (jobDoc.exists()) {
          const jobData = { id: jobDoc.id, ...jobDoc.data() };

          const jobDetailsPromise = getDoc(doc(db, 'jobDetails', jobData.id));
          const jobRequestPromise = jobData?.jobRequestId
            ? getDoc(doc(db, 'jobRequests', jobData.jobRequestId))
            : Promise.resolve(null);

          Promise.all([jobDetailsPromise, jobRequestPromise])
            .then(([jobDetailsDoc, jobRequestDoc]) => {
              if (jobDetailsDoc.exists()) {
                setJob({
                  id: jobData.id,
                  ...jobData,
                  ...jobDetailsDoc.data(),
                });

                if (jobRequestDoc) setJobRequest({ id: jobRequestDoc.id, ...jobRequestDoc.data() });
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
      });
    }
  }, [jobId]);

  //* query job cn
  useEffect(() => {
    if (job) {
      const q = query(
        collection(db, 'jobCustomerNotifications'),
        where('jobId', '==', job.id),
        limit(1)
      );

      getDocs(q)
        .then((snapshot) => {
          if (!snapshot.empty) {
            const jobCnDoc = snapshot?.docs?.[0];

            if (jobCnDoc.exists()) {
              setJobCn({
                data: { id: jobCnDoc.id, ...jobCnDoc.data() },
                isLoading: false,
                isError: false,
              });
              return;
            }

            setJobCn({ data: null, isLoading: false, isError: false });
            return;
          }
        })
        .catch((err) => {
          console.error(err.message);
          setJobCn({ data: null, isLoading: false, isError: true });
        });
    }
  }, [job]);

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
          customBadges={[
            {
              label: _.startCase(job?.status),
              color: STATUS_COLOR[job?.status] || 'secondary',
            },
            {
              label: job?.isReturnedEquipment ? 'Returned' : 'Unreturned',
              color: job?.isReturnedEquipment ? 'success' : 'danger',
            },
            ...(jobCn.data
              ? [{ icon: ExclamationTriangleFill, label: 'Faulty', color: 'danger' }]
              : []),
          ]}
          actionButtons={[
            {
              text: 'Back',
              icon: <ArrowLeftShort size={20} />,
              variant: 'outline-primary',
              onClick: () => router.push(`/user/${workerId}`),
            },
          ]}
          dropdownItems={[
            {
              label: 'View Job',
              icon: Eye,
              onClick: () => router.push(`/user/${workerId}/jobs/view/${jobId}`),
            },
            ...(job?.status === 'job-in-progress'
              ? [
                  {
                    label: 'Close Job',
                    icon: Stop,
                    onClick: (args) =>
                      stopJob(jobId, args.setIsLoading, jobRequest?.createdBy?.uid),
                  },
                ]
              : []),

            // prettier-ignore
            ...(job && ['job-in-progress', 'job-validation', 'job-complete'].includes(job?.status)
          ? [
              ...(jobCn.data ? 
                  [
                    { label: 'View Job CN', icon: Eye, onClick: () => router.push(`/user/${workerId}/job-cns/view/${jobCn.data.id}`) },
                    { label: 'Edit Job CN', icon: PencilSquare, onClick: () => router.push(`/user/${workerId}/job-cns/edit-job-cns/${jobCn.data.id}`) }
                  ] 
                  : 
                  [
                    { label: 'Create Job CN', icon: PlusSquare, onClick: () => router.push(`/user/${workerId}/job-cns/create?jobId=${job.id}`) }
                  ]),
            ]
          : []),
          ]}
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
