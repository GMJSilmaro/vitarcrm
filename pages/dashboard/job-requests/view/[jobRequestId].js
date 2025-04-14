import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import CustomerEquipment from '@/sub-components/dashboard/job-requests/view/CustomerEquipment';
import SummaryTab from '@/sub-components/dashboard/job-requests/view/SummaryTab';
import TaskTab from '@/sub-components/dashboard/job-requests/view/TaskTab';
import { GeeksSEO } from '@/widgets';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Card, Spinner, Tab, Tabs } from 'react-bootstrap';
import { BriefcaseFill } from 'react-bootstrap-icons';
import { FaArrowLeft } from 'react-icons/fa';

const JobRequestDetails = () => {
  const router = useRouter();
  const { jobRequestId } = router.query;

  const [jobRequest, setJobRequest] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('0');
  const [customer, setCustomer] = useState({ data: {}, isLoading: true, isError: false });
  const [contact, setContact] = useState();
  const [location, setLocation] = useState({ data: {}, isLoading: true, isError: false });

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
      jobRequest?.contact?.id ? getDoc(doc(db, 'contacts', jobRequest?.contact?.id)) : undefined,
      getDocs(
        query(
          collection(db, 'customerEquipments'),
          where('customerId', '==', jobRequest?.customer?.id)
        )
      ),
    ])
      .then(([customerSnapshot, contactSnapshot, customerEquipmentSnapshot]) => {
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
      })
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
          <button className='btn btn-primary' onClick={() => router.push('/jobs')}>
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
      <GeeksSEO title={`View Details for Job Request #${jobRequest.id} | VITAR Group`} />

      <ContentHeader
        title={`View Details for Job Request #${jobRequest.id}`}
        description='View comprehensive details about the job request'
        badgeText='Job Request Management'
        badgeText2='Job Requests'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <i className='fe fe-home' style={{ marginRight: '8px' }} />,
          },
          {
            text: 'Job Requests',
            link: '/job-requests',
            icon: <BriefcaseFill className='me-2' size={14} />,
          },
          {
            text: `View ${jobRequest.id}`,
            icon: <i className='fe fe-user' style={{ marginRight: '8px' }} />,
          },
        ]}
        actionButtons={[
          {
            text: 'Back to Job Requests List',
            icon: <FaArrowLeft size={16} />,
            variant: 'light',
            tooltip: 'Back to Job Requests List',
            onClick: () => router.push('/job-requests'),
          },
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
          </Tabs>
        </Card.Body>
      </Card>
    </>
  );
};

export default JobRequestDetails;
