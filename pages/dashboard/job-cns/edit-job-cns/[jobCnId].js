import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import JobCnForm from '@/sub-components/dashboard/job-cns/JobCnForm';
import { GeeksSEO } from '@/widgets';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Spinner } from 'react-bootstrap';
import {
  ArrowLeftShort,
  ChatLeftTextFill,
  Eye,
  HouseDoorFill,
  PencilFill,
} from 'react-bootstrap-icons';

const EditJobCn = () => {
  const router = useRouter();
  const { jobCnId } = router.query;

  const [jobCn, setJobCn] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  //* query job cn
  useEffect(() => {
    if (jobCnId) {
      const jobCnRef = doc(db, 'jobCustomerNotifications', jobCnId);

      getDoc(jobCnRef)
        .then((doc) => {
          if (doc.exists()) {
            setJobCn({ id: doc.id, ...doc.data() });
            setIsLoading(false);
            return;
          }

          setError('Job cn not found');
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Error fetching job cn');
          setIsLoading(false);
        });
    }
  }, [jobCnId]);

  if (isLoading) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
        <Spinner animation='border' variant='primary' />
        <span className='ms-3'>Loading Job Customer Notification Data...</span>
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
          <Button onClick={() => router.push('/job-cns')}>
            Back to Job Customer Notification List
          </Button>
        </div>
      </div>
    );
  }

  if (!jobCn) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>Job customer notification not found</h3>
          <Link href='/job-cns'>
            <Button variant='primary' className='mt-3'>
              Back to Job Customer Notification List
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
        title='Edit Job CN'
        description='Edit job Customer Notification information'
        badgeText='Job Customer Notification Management'
        badgeText2='Edit Job Customer Notification'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' style={{ fontSize: '14px' }} />,
          },
          {
            text: 'Jobs CN',
            link: '/job-cns',
            icon: <ChatLeftTextFill className='me-2' size={14} />,
          },
          {
            text: jobCn.id,
            icon: <PencilFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back to Job`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push(`/jobs/view/${jobCn.jobId}`),
          },
        ]}
        dropdownItems={[
          {
            label: 'View Job CN',
            icon: Eye,
            onClick: () => router.push(`/job-cns/view/${jobCn.cnId}`),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <JobCnForm data={jobCn} />
        </Card.Body>
      </Card>
    </>
  );
};

export default EditJobCn;
