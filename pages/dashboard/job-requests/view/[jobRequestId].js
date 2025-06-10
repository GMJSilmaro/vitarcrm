import ContentHeader from '@/components/dashboard/ContentHeader';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { useNotifications } from '@/hooks/useNotifications';
import { STATUS_COLOR } from '@/schema/job-request';
import CmrSummary from '@/sub-components/dashboard/job-requests/view/CmrSummary';
import CustomerEquipment from '@/sub-components/dashboard/job-requests/view/CustomerEquipment';
import Documents from '@/sub-components/dashboard/job-requests/view/Documents';
import SummaryTab from '@/sub-components/dashboard/job-requests/view/SummaryTab';
import TaskTab from '@/sub-components/dashboard/job-requests/view/TaskTab';
import { GeeksSEO } from '@/widgets';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import _ from 'lodash';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Card, Spinner, Tab, Tabs } from 'react-bootstrap';
import {
  ArrowLeftShort,
  BriefcaseFill,
  EyeFill,
  HandThumbsUp,
  HouseFill,
  PencilSquare,
} from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const JobRequestDetails = () => {
  const router = useRouter();
  const { jobRequestId } = router.query;
  const auth = useAuth();
  const notifications = useNotifications();

  const [jobRequest, setJobRequest] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('0');
  const [customer, setCustomer] = useState({
    data: {},
    isLoading: true,
    isError: false,
  });
  const [contact, setContact] = useState();
  const [location, setLocation] = useState({
    data: {},
    isLoading: true,
    isError: false,
  });
  const [customerEquipments, setCustomerEquipments] = useState({ data: [], isLoading: true, isError: false }); //prettier-ignore

  const handleApprovedJobRequest = (id, setIsLoading) => {
    try {
      Swal.fire({
        title: `Job Request Status Update - Job Request #${id}`,
        text: `Are you sure you want to update the job request status to "Approved"?`,
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

            const jobRequestRef = doc(db, 'jobRequests', id);

            await Promise.all([
              updateDoc(jobRequestRef, {
                status: 'request-approved',
                reasonMessage: null,
                updatedAt: serverTimestamp(),
                updatedBy: auth.currentUser,
              }),
              //* create notification for admin and supervisor when updated a job request status
              notifications.create({
                module: 'job-request',
                target: ['admin', 'supervisor', 'sales'],
                title: 'Job request status updated',
                message: `Job request (#${id}) status was updated by ${auth.currentUser.displayName} to "Approved".`, //prettier-ignore
                data: {
                  redirectUrl: `/job-requests/view/${id}`,
                },
              }),
            ]);

            toast.success('Job request status updated successfully', {
              position: 'top-right',
            });
            setIsLoading(false);

            setTimeout(() => {
              window.location.assign(`/jobs/create?jobRequestId=${id}`);
            }, 1500);
          } catch (error) {
            console.error('Error updating job request status:', error);
            toast.error('Error updating job request status: ' + error.message, { position: 'top-right' }); //prettier-ignore
            setIsLoading(false);
          }
        }
      });
    } catch (error) {
      console.error('Error updating job request status:', error);
      toast.error('Error updating job request status: ' + error.message, { position: 'top-right' }); //prettier-ignore
      setIsLoading(false);
    }
  };

  //* query job request
  useEffect(() => {
    if (!jobRequestId) {
      setJobRequest({ data: {}, isLoading: false, isError: false });
      return;
    }

    getDoc(doc(db, 'jobRequests', jobRequestId))
      .then((doc) => {
        if (doc.exists()) {
          setJobRequest({
            id: doc.id,
            ...doc.data(),
          });
          setIsLoading(false);
        } else {
          setError('Job Request not found');
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error(err.message);
        setError(err.message || 'Error fetching job');
        setIsLoading(false);
      });
  }, [jobRequestId]);

  //* query customer
  useEffect(() => {
    if (!jobRequest?.customer?.id) {
      setCustomer({ data: {}, isLoading: false, isError: false });
      return;
    }

    Promise.all([
      getDoc(doc(db, 'customers', jobRequest?.customer?.id)),
      jobRequest?.contact?.id
        ? getDoc(doc(db, 'contacts', jobRequest?.contact?.id))
        : undefined,
      getDocs(
        query(
          collection(db, 'customerEquipments'),
          where('customerId', '==', jobRequest?.customer?.id)
        )
      ),
    ])
      .then(
        ([customerSnapshot, contactSnapshot, customerEquipmentSnapshot]) => {
          const customerData = customerSnapshot.data();
          const customerEquipmentSnapshotData = !customerEquipmentSnapshot.empty ? customerEquipmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) : []; // prettier-ignore

          if (customerSnapshot.exists) {
            setCustomer({
              data: {
                id: customerSnapshot.id,
                ...customerData,
                equipments: customerEquipmentSnapshotData,
              },
              isLoading: false,
              isError: false,
            });
          } else setCustomer({ data: {}, isLoading: false, isError: false });

          if (
            jobRequest?.contact &&
            Array.isArray(customerData.contacts) &&
            customerData.contacts.length > 0 &&
            contactSnapshot.exists()
          ) {
            const contactData = contactSnapshot.data();
            setContact(contactData);
          }
        }
      )
      .catch((err) => {
        console.error(err.message);
        setCustomer({ data: {}, isLoading: false, isError: true });
      });
  }, [jobRequest]);

  //* query location
  useEffect(() => {
    if (!jobRequest?.location?.id) {
      setLocation({
        data: {},
        isLoading: false,
        isError: false,
      });
      return;
    }

    getDoc(doc(db, 'locations', jobRequest?.location?.id))
      .then((doc) => {
        const data = doc.data();

        if (doc.exists()) {
          setLocation({
            data: {
              id: doc.id,
              ...data,
            },
            isLoading: false,
            isError: false,
          });
        } else {
          setLocation({
            data: {},
            isLoading: false,
            isError: false,
          });
        }
      })
      .catch((err) => {
        console.error(err.message);
        setLocation({ data: {}, isLoading: false, isError: true });
      });
  }, [jobRequest]);

  //* query customer equipments
  useEffect(() => {
    if (
      jobRequest?.customerEquipments?.length < 1 ||
      !jobRequest?.customer?.id
    ) {
      setCustomerEquipments({ data: [], isLoading: false, isError: false });
      return;
    }

    const customerEquipmentsIds = jobRequest?.customerEquipments?.map(
      (ce) => ce.id
    ) || [''];

    Promise.all([
      ...customerEquipmentsIds
        .filter(Boolean)
        .map((id) => getDoc(doc(db, 'customerEquipments', id))),
    ])
      .then(([...resultsSnapshot]) => {
        const data = [];

        for (const result of resultsSnapshot) {
          if (result.exists()) {
            data.push({ id: result.id, ...result.data() });
          }
        }

        setCustomerEquipments({
          data,
          isLoading: false,
          isError: false,
        });
      })
      .catch((err) => {
        console.error(err.message);
        setCustomerEquipments({ data: [], isLoading: false, isError: true });
      });
  }, [jobRequest]);

  if (isLoading) {
    return (
      <div
        className='d-flex justify-content-center align-items-center'
        style={{ height: '100vh' }}
      >
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
          <button
            className='btn btn-primary'
            onClick={() => router.push('/jobs')}
          >
            Back to Jobs Request List
          </button>
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
          <h3>Job Request not found</h3>
          <Link href='/job-requests'>
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
      <GeeksSEO
        title={`View Details for Job Request #${jobRequest.id} | VITAR Group`}
      />

      <ContentHeader
        title={`View Details for Job Request #${jobRequest.id}`}
        description='View comprehensive details about the job request'
        badgeText='Job Request Management'
        badgeText2='View Job Request'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseFill className='me-2' size={14} />,
          },
          {
            text: 'Job Requests',
            link: '/job-requests',
            icon: <BriefcaseFill className='me-2' size={14} />,
          },
          {
            text: `View ${jobRequest.id}`,
            icon: <EyeFill className='me-2' size={14} />,
          },
        ]}
        customBadges={[
          {
            label: _.startCase(jobRequest?.status),
            color: STATUS_COLOR[jobRequest?.status] || 'secondary',
          },
        ]}
        actionButtons={[
          {
            text: 'Back',
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push(`/job-requests`),
          },
        ]}
        dropdownItems={[
          {
            label: 'Edit Job Request',
            icon: PencilSquare,
            onClick: () =>
              router.push(`/job-requests/edit-job-requests/${jobRequestId}`),
          },
          // prettier-ignore
          ...((auth.role === 'admin' || auth.role === 'supervisor') && jobRequest?.status !== 'request-approved'
            ? [
                {
                  label: 'Approved Job Request',
                  icon: HandThumbsUp,
                  onClick: (args) => handleApprovedJobRequest(jobRequestId, args.setIsLoading),
                },
              ]
            : []),
        ]}
      />

      <Card>
        <Card.Body>
          <Tabs className='mb-1' activeKey={activeTab} onSelect={setActiveTab}>
            <Tab eventKey='0' title='Summary'>
              <SummaryTab
                customer={customer}
                contact={contact}
                location={location}
                jobRequest={jobRequest}
              />
            </Tab>

            <Tab eventKey='1' title='Calibration Items'>
              <CustomerEquipment jobRequest={jobRequest} customer={customer} />
            </Tab>

            <Tab eventKey='2' title='Additional Instructions'>
              <TaskTab job={jobRequest} />
            </Tab>

            <Tab eventKey='3' title='Documents'>
              <Documents jobRequest={jobRequest} />
            </Tab>

            <Tab eventKey='4' title='CMR'>
              <CmrSummary
                jobRequest={jobRequest}
                customer={customer}
                contact={contact}
                location={location}
                customerEquipments={customerEquipments}
              />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </>
  );
};

export default JobRequestDetails;
