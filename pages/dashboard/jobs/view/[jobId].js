import ContentHeader from '@/components/dashboard/ContentHeader';
import CmrPDF from '@/components/pdf/CmrPDF';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { useNotifications } from '@/hooks/useNotifications';
import CalibrationChecklist from '@/sub-components/dashboard/jobs/view/CalibrationChecklist';
import CalibrationTab from '@/sub-components/dashboard/jobs/view/CalibrationsTab';
import Cmr from '@/sub-components/dashboard/jobs/view/Cmr';
import CustomerEquipment from '@/sub-components/dashboard/jobs/view/CustomerEquipment';
import Documents from '@/sub-components/dashboard/jobs/view/Documents';
import ReferenceEquipment from '@/sub-components/dashboard/jobs/view/ReferenceEquipment';
import SchedulingTab from '@/sub-components/dashboard/jobs/view/SchedulingTab';
import SummaryTab from '@/sub-components/dashboard/jobs/view/SummaryTab';
import TaskTab from '@/sub-components/dashboard/jobs/view/TaskTab';
import { GeeksSEO } from '@/widgets';
import { PDFViewer } from '@react-pdf/renderer';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Card, Spinner, Tab, Tabs } from 'react-bootstrap';
import { BriefcaseFill, ShieldCheck } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import { FaArrowLeft } from 'react-icons/fa';
import Swal from 'sweetalert2';

const JobDetails = () => {
  const router = useRouter();
  const { jobId } = router.query;
  const auth = useAuth();
  const notifications = useNotifications();

  const [job, setJob] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('0');

  const [customer, setCustomer] = useState({ data: {}, isLoading: true, isError: false });
  const [jobRequest, setJobRequest] = useState({ data: {}, isLoading: true, isError: false });
  const [contact, setContact] = useState();
  const [location, setLocation] = useState({ data: {}, isLoading: true, isError: false });
  const [equipments, setEquipments] = useState({ data: [], isLoading: true, isError: false });
  const [customerEquipments, setCustomerEquipments] = useState({ data: [], isLoading: true, isError: false }); //prettier-ignore
  const [calibrations, setCalibrations] = useState({ data: [], isLoading: true, isError: false });
  const [users, setUsers] = useState({ data: [], isLoading: true, isError: false });

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
    if (!job?.customer?.id) {
      setCustomer({ data: {}, isLoading: false, isError: false });
      return;
    }

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
    if (!job?.location?.id) {
      setLocation({
        data: {},
        isLoading: false,
        isError: false,
      });
      return;
    }

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
  }, [job]);

  //* query job request
  useEffect(() => {
    if (!job?.jobRequestId) {
      setJobRequest({ data: {}, isLoading: false, isError: false });
      return;
    }

    getDoc(doc(db, 'jobRequests', job?.jobRequestId))
      .then((doc) => {
        if (doc.exists()) {
          setJobRequest({
            data: {
              id: doc.id,
              ...doc.data(),
            },
            isLoading: false,
            isError: false,
          });
        } else {
          setJobRequest({
            data: {},
            isLoading: false,
            isError: false,
          });
        }
      })
      .catch((err) => {
        console.error(err.message);
        setJobRequest({
          data: {},
          isLoading: false,
          isError: true,
        });
      });
  }, [job]);

  //* query equipments
  useEffect(() => {
    if (job?.equipments?.length < 1) {
      setEquipments({ data: [], isLoading: false, isError: false });
      return;
    }

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

  //* query customer equipments
  useEffect(() => {
    if (job?.customerEquipments?.length < 1 || !job?.customer?.id) {
      setCustomerEquipments({ data: [], isLoading: false, isError: false });
      return;
    }

    const customerEquipmentsIds = job?.customerEquipments?.map((ce) => ce.id) || [''];

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
  }, [job]);

  //* query job calibration
  useEffect(() => {
    if (!jobId) {
      setCalibrations({ data: [], isLoading: false, isError: false });
      return;
    }

    const q = query(collection(db, 'jobCalibrations'), where('jobId', '==', jobId));

    getDocs(q)
      .then((snapshot) => {
        if (!snapshot.empty) {
          const calibrationData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

          setCalibrations({
            data: calibrationData,
            isLoading: false,
            isError: false,
          });
        } else {
          setCalibrations({
            data: [],
            isLoading: false,
            isError: false,
          });
        }
      })
      .catch((err) => {
        console.error(err.message);
        setCalibrations({ data: [], isLoading: false, isError: true });
      });
  }, [jobId]);

  //* query users
  useEffect(() => {
    const q = query(collection(db, 'users'));

    getDocs(q)
      .then((snapshot) => {
        if (!snapshot.empty) {
          const userData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

          setUsers({
            data: userData,
            isLoading: false,
            isError: false,
          });
          return;
        }

        setUsers({
          data: [],
          isLoading: false,
          isError: false,
        });
      })
      .catch((err) => {
        console.error(err.message);
        setUsers({ data: [], isLoading: false, isError: true });
      });
  }, []);

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
      <GeeksSEO title={`View Details for Job #${job.id} | VITAR Group`} />
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
            variant:
              (auth.role === 'admin' || auth.role === 'supervisor') &&
              job &&
              job.status !== 'validated'
                ? 'outline-primary'
                : 'light',
            tooltip: 'Back to Job List',
            onClick: () => router.push('/jobs'),
          },
          ...((auth.role === 'admin' || auth.role === 'supervisor') &&
          job &&
          job.status !== 'validated'
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

      <Card>
        <Card.Body>
          <Tabs className='mb-1' activeKey={activeTab} onSelect={setActiveTab}>
            <Tab eventKey='0' title='Summary'>
              <SummaryTab
                job={job}
                customer={customer}
                contact={contact}
                location={location}
                jobRequest={jobRequest}
              />
            </Tab>

            <Tab eventKey='1' title='Calibration Items'>
              <CustomerEquipment job={job} customer={customer} />
            </Tab>

            <Tab eventKey='2' title='Additional Instructions'>
              <TaskTab job={job} />
            </Tab>

            <Tab eventKey='3' title='Reference Equipment'>
              <ReferenceEquipment job={job} equipments={equipments} />
            </Tab>

            <Tab eventKey='4' title='Schedule'>
              <SchedulingTab job={job} />
            </Tab>

            <Tab eventKey='5' title='Calibration Checklist'>
              <CalibrationChecklist job={job} customer={customer} users={users} />
            </Tab>

            <Tab eventKey='6' title='Calibrations'>
              <CalibrationTab job={job} />
            </Tab>

            <Tab eventKey='7' title='Documents'>
              <Documents job={job} />
            </Tab>

            {calibrations.data.length > 0 && (
              <Tab eventKey='8' title='CMR'>
                <Cmr
                  job={job}
                  customer={customer}
                  contact={contact}
                  location={location}
                  customerEquipments={customerEquipments}
                  calibrations={calibrations}
                />
              </Tab>
            )}

            {/* {calibrations.data.length > 0 && (
              <Tab eventKey='7' title='PDF CMR'>
                <Card className='border-0 shadow-none'>
                  <Card.Body>
                    <PDFViewer height={800} width='100%'>
                      <CmrPDF
                        job={job}
                        customer={customer}
                        contact={contact}
                        location={location}
                        customerEquipments={customerEquipments}
                        calibrations={calibrations}
                      />
                    </PDFViewer>
                  </Card.Body>
                </Card>
              </Tab>
            )} */}
          </Tabs>
        </Card.Body>
      </Card>
    </>
  );
};

export default JobDetails;
