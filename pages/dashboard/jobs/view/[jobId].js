import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import CalibrationTab from '@/sub-components/dashboard/jobs/view/CalibrationsTab';
import CustomerEquipment from '@/sub-components/dashboard/jobs/view/CustomerEquipment';
import SchedulingTab from '@/sub-components/dashboard/jobs/view/SchedulingTab';
import SummaryTab from '@/sub-components/dashboard/jobs/view/SummaryTab';
import TaskTab from '@/sub-components/dashboard/jobs/view/TaskTab';
import { GeeksSEO } from '@/widgets';
import { collection, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Card, Spinner, Tab, Tabs } from 'react-bootstrap';
import { BriefcaseFill } from 'react-bootstrap-icons';
import { FaArrowLeft } from 'react-icons/fa';

const JobDetails = () => {
  const router = useRouter();
  const { jobId } = router.query;

  const [job, setJob] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('0');

  const [customer, setCustomer] = useState({ data: {}, isLoading: true, isError: false });
  const [contact, setContact] = useState();
  const [location, setLocation] = useState({ data: {}, isLoading: true, isError: false });
  const [equipments, setEquipments] = useState({ data: [], isLoading: true, isError: false });

  //* query job header & details
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

  //* query customer
  useEffect(() => {
    if (!job?.customer?.id) return;

    Promise.all([
      getDoc(doc(db, 'customers', job?.customer?.id)),
      job?.contact?.id ? getDoc(doc(db, 'contacts', job?.contact?.id)) : undefined,
      getDocs(
        query(collection(db, 'customerEquipments'), where('customerId', '==', job?.customer?.id))
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
          job?.contact &&
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
  }, [job]);

  //* query location
  useEffect(() => {
    if (!job?.location?.id) return;

    getDoc(doc(db, 'locations', job?.location?.id))
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
        }
      })
      .catch((err) => {
        console.error(err.message);
        setLocation({ data: [], isLoading: false, isError: true });
      });
  }, [job]);

  //* query equipments
  useEffect(() => {
    if (job?.equipments?.length < 1) return;

    const equipmentsIds = job?.equipments?.map((equipment) => equipment.id) || [''];

    Promise.all([...equipmentsIds.filter(Boolean).map((id) => getDoc(doc(db, 'equipments', id)))])
      .then(([...resultsSnapshot]) => {
        const data = [];

        for (const result of resultsSnapshot) {
          if (result.exists()) {
            data.push({ id: result.id, ...result.data() });
          }
        }

        setEquipments({
          data,
          isLoading: false,
          isError: false,
        });
      })
      .catch((err) => {
        console.error(err.message);
        setEquipments({ data: [], isLoading: false, isError: true });
      });
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
        title={`View Details for Job #${job.id}`}
        description='View comprehensive job details including job summary, tasks and schedules'
        badgeText='Job Management'
        badgeText2='Jobs'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <i className='fe fe-home' style={{ marginRight: '8px' }} />,
          },
          {
            text: 'Job List',
            link: '/jobs',
            icon: <BriefcaseFill className='me-2' size={14} />,
          },
          {
            text: `View ${job.id}`,
            icon: <i className='fe fe-user' style={{ marginRight: '8px' }} />,
          },
        ]}
        actionButtons={[
          {
            text: 'Back to Job List',
            icon: <FaArrowLeft size={16} />,
            variant: 'light',
            tooltip: 'Back to Job List',
            onClick: () => router.push('/jobs'),
          },
        ]}
      />

      <Card>
        <Card.Body>
          <Tabs className='mb-1' activeKey={activeTab} onSelect={setActiveTab}>
            <Tab eventKey='0' title='Summary'>
              <SummaryTab
                job={job}
                customer={customer}
                contact={contact}
                location={location}
                equipments={equipments}
              />
            </Tab>

            <Tab eventKey='1' title='Additional Instructions'>
              <TaskTab job={job} />
            </Tab>

            <Tab eventKey='3' title='Customer Equipment'>
              <CustomerEquipment job={job} customer={customer} />
            </Tab>

            <Tab eventKey='4' title='Schedule'>
              <SchedulingTab job={job} />
            </Tab>

            <Tab eventKey='5' title='Calibrations'>
              <CalibrationTab job={job} />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </>
  );
};

export default JobDetails;
