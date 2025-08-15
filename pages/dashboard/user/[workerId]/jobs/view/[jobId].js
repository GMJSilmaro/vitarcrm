import PageHeader from '@/components/common/PageHeader';
import ContentHeader from '@/components/dashboard/ContentHeader';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { useNotifications } from '@/hooks/useNotifications';
import { STATUS_COLOR } from '@/schema/job';
import CalibrationChecklist from '@/sub-components/dashboard/jobs/view/CalibrationChecklist';
import CalibrationTab from '@/sub-components/dashboard/jobs/view/CalibrationsTab';
import Cmr from '@/sub-components/dashboard/jobs/view/Cmr';
import CustomerEquipment from '@/sub-components/dashboard/jobs/view/CustomerEquipment';
import CustomerNotification from '@/sub-components/dashboard/jobs/view/CustomerNotification';
import Documents from '@/sub-components/dashboard/jobs/view/Documents';
import OnSiteCalibrationSurvey from '@/sub-components/dashboard/jobs/view/OnSiteCalibrationSurvey';
import ReferenceEquipment from '@/sub-components/dashboard/jobs/view/ReferenceEquipment';
import SchedulingTab from '@/sub-components/dashboard/jobs/view/SchedulingTab';
import SummaryTab from '@/sub-components/dashboard/jobs/view/SummaryTab';
import TaskTab from '@/sub-components/dashboard/jobs/view/TaskTab';
import { GeeksSEO } from '@/widgets';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import _ from 'lodash';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Spinner, Tab, Tabs } from 'react-bootstrap';
import {
  ArrowLeftShort,
  BriefcaseFill,
  CheckCircle,
  ExclamationTriangleFill,
  PencilSquare,
  Play,
  PlusSquare,
  Stop,
} from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import { FaArrowLeft } from 'react-icons/fa';
import Swal from 'sweetalert2';

const JobDetails = () => {
  const router = useRouter();
  const { jobId, workerId } = router.query;
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
  const [surveyQuestions, setSurveyQuestions] = useState({ data: [],isLoading: true,isError: false }); //prettier-ignore

  const [isStartingJob, setIsStartingJob] = useState(false);
  const [isStoppingJob, setIsStoppingJob] = useState(false);

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

  const startJob = async (id, setIsLoading, salesperson) => {
    if (!id) return;

    Swal.fire({
      title: 'Initiate Job?',
      text: 'Are you sure you want to mark the job as "Job In Progress?',
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
                status: 'job-in-progress',
                updatedAt: serverTimestamp(),
                updatedBy: auth.currentUser,
              });

              transaction.update(jobDetailsRef, {
                startByAt: serverTimestamp(),
                startBy: auth.currentUser,
                endByAt: null,
                endBy: null,
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
            title: 'Job started',
            message: `Job (#${id}) has been started by ${auth.currentUser.displayName}.`,
            data: {
              redirectUrl: `/jobs/view/${id}`,
            },
          });

          toast.success('Job has been started successfully.', { position: 'top-right' });
          setIsLoading(false);

          //* redirect to job calibrations
          setTimeout(() => {
            router.push(`/user/${workerId}/jobs/${jobId}/calibrations`);
          }, 2000);
        } catch (error) {
          setIsLoading(false);
          console.error('Error stopping job', error);
          toast.error('Unexpected error occured while stopping job. Please try again later.');
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

  //* query customer equipments (job calibration items)
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

  //* query survey questions
  useEffect(() => {
    if (!job?.jobId) {
      setSurveyQuestions({ data: [], isLoading: false, isError: false });
      return;
    }

    const q = query(
      collection(db, 'surveyQuestions'),
      where('category', '==', 'on-site-calibration-survey')
    );

    getDocs(q)
      .then((snapshot) => {
        if (!snapshot.empty) {
          const surveyQuestionsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setSurveyQuestions({
            data: surveyQuestionsData,
            isLoading: false,
            isError: false,
          });
          return;
        }

        setSurveyQuestions({
          data: [],
          isLoading: false,
          isError: false,
        });
      })
      .catch((err) => {
        console.error(err.message);
        setSurveyQuestions({ data: [], isLoading: false, isError: true });
      });
  }, [job]);

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
          <button className='btn btn-primary' onClick={() => router.push(`/user/${workerId}`)}>
            Back to Dashboard
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
      <GeeksSEO title={`View Job #${jobId} | VITAR Group | Portal`} />

      <div className='d-flex flex-column row-gap-4'>
        <PageHeader
          title={`View Job #${jobId}`}
          subtitle='View job details'
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
              ? [{ icon: ExclamationTriangleFill, label: 'CN', color: 'danger' }]
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
            ...(job?.status !== 'job-complete'
              ? [
                  {
                    label: 'Edit Job',
                    icon: PencilSquare,
                    onClick: () => router.push(`/user/${workerId}/jobs/edit-jobs/${jobId}`),
                  },
                ]
              : []),
            ...(job?.status === 'job-confirm' || job?.status === 'job-reschedule'
              ? [
                  {
                    label: 'Initiate Job',
                    icon: Play,
                    onClick: (args) =>
                      startJob(jobId, args.setIsLoading, jobRequest.data?.createdBy?.uid),
                  },
                ]
              : []),
            ...(job?.status === 'job-in-progress'
              ? [
                  {
                    label: 'Close Job',
                    icon: Stop,
                    onClick: (args) =>
                      stopJob(jobId, args.setIsLoading, jobRequest.data?.createdBy?.uid),
                  },
                ]
              : []),

            // prettier-ignore
            ...(job && ['job-in-progress', 'job-validation', 'job-complete'].includes(job?.status)
              ? [
                  ...(jobCn.data ? 
                      [
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

              {calibrations.data.length > 0 && (
                <Tab eventKey='9' title='On-Site Calibration Survey'>
                  <OnSiteCalibrationSurvey
                    job={job}
                    customer={customer}
                    surveyQuestions={surveyQuestions}
                  />
                </Tab>
              )}

              {jobCn?.data && (
                <Tab eventKey='10' title='CN'>
                  <CustomerNotification
                    jobCn={jobCn?.data}
                    job={{ data: job, isLoading, isError: error }}
                    customer={customer}
                  />
                </Tab>
              )}
            </Tabs>
          </Card.Body>
        </Card>
      </div>
    </>
  );
};

export default JobDetails;
