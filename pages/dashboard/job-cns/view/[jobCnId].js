import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import ViewJobCnDetails from '@/sub-components/dashboard/job-cns/view/ViewJobCnDetails';
import { GeeksSEO } from '@/widgets';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Spinner } from 'react-bootstrap';
import {
  ArrowLeftShort,
  ChatLeftTextFill,
  EyeFill,
  HouseDoorFill,
  PencilSquare,
} from 'react-bootstrap-icons';

const JobCnDetails = () => {
  const router = useRouter();
  const { jobCnId } = router.query;

  const [jobCn, setJobCn] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [job, setJob] = useState({ data: null, isLoading: true, isError: false });
  const [customer, setCustomer] = useState({ data: null, isLoading: true, isError: false });
  const [customerEquipments, setCustomerEquipments] = useState({ data: [], isLoading: true, isError: false }); //prettier-ignore

  const customerId = useMemo(() => {
    if (!job.data?.customer?.id) return null;
    return job.data?.customer?.id;
  }, [JSON.stringify(job)]);

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

  //* query job
  useEffect(() => {
    if (jobCn?.jobId) {
      const jobHeaderRef = doc(db, 'jobHeaders', jobCn?.jobId);
      const jobDetailsRef = doc(db, 'jobDetails', jobCn?.jobId);

      Promise.all([getDoc(jobHeaderRef), getDoc(jobDetailsRef)])
        .then(([jobHeader, jobDetails]) => {
          if (jobHeader.exists() && jobDetails.exists()) {
            setJob({
              data: {
                id: jobHeader.id,
                ...jobHeader.data(),
                ...jobDetails.data(),
              },
              isLoading: false,
              isError: false,
            });

            return;
          }

          setJob({ data: {}, isLoading: false, isError: false });
        })
        .catch((err) => {
          console.error(error);
          setJob({ data: {}, isLoading: false, isError: true });
        });
    }
  }, [JSON.stringify(jobCn)]);

  //* query customer
  useEffect(() => {
    if (!customerId) {
      setCustomer({ data: null, isLoading: false, isError: false });
      return;
    }

    getDoc(doc(db, 'customers', customerId))
      .then((snapshot) => {
        if (snapshot.exists()) {
          setCustomer({
            data: {
              id: snapshot.id,
              ...snapshot.data(),
            },
            isLoading: false,
            isError: false,
          });

          return;
        }

        setCustomer({ data: {}, isLoading: false, isError: false });
      })
      .catch((err) => {
        console.error(err.message);
        setCustomer({ data: null, isLoading: false, isError: true });
      });
  }, [customerId]);

  //* query customer equipments
  useEffect(() => {
    if (!customerId) {
      setCustomerEquipments({ data: [], isLoading: false, isError: false });
      return;
    }

    const q = query(collection(db, 'customerEquipments'), where('customerId', '==', customerId));

    getDocs(q)
      .then((snapshot) => {
        if (snapshot.empty) {
          setCustomerEquipments({ data: [], isLoading: false, isError: false });
          return;
        }

        const ceDocs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setCustomerEquipments({
          data: ceDocs,
          isLoading: false,
          isError: false,
        });
      })
      .catch((err) => {
        console.error(err.message);
        setCustomerEquipments({ data: [], isLoading: false, isError: true });
      });
  }, [customerId]);

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

  if (isLoading) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
        <Spinner animation='border' variant='primary' />
        <span className='ms-3'>Loading Job Customer Notification Data...</span>
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
      <GeeksSEO
        title={`View Details for Job Customer Notification #${jobCn.id} - VITAR Group | Portal`}
      />

      <ContentHeader
        title={`View Details for Job CN #${jobCn.id}`}
        description='View comprehensive details about the job customer notification'
        badgeText='Job Customer Notification Management'
        badgeText2='View Job Customer Notification'
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
            text: `View #${jobCn.id}`,
            icon: <EyeFill className='me-2' size={14} />,
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
            label: 'Edit Job CN',
            icon: PencilSquare,
            onClick: () => router.push(`/job-cns/edit-job-cns/${jobCn.id}`),
          },
        ]}
      />

      <Card className='px-4'>
        <ViewJobCnDetails
          jobCn={jobCn}
          job={job}
          customer={customer}
          customerEquipments={customerEquipments}
        />
      </Card>
    </>
  );
};

export default JobCnDetails;
