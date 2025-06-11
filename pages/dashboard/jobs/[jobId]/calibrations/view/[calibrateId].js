import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import Calibration from '@/sub-components/dashboard/jobs/calibrations/view/Calibration';
import SummaryTab from '@/sub-components/dashboard/jobs/calibrations/view/SummaryTab';
import Result from '@/sub-components/dashboard/jobs/calibrations/view/Result';
import Measurements from '@/sub-components/dashboard/jobs/calibrations/view/Measurements';
import ReferenceInstruments from '@/sub-components/dashboard/jobs/calibrations/view/ReferenceInstruments';
import { GeeksSEO } from '@/widgets';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Form, Spinner, Tab, Tabs } from 'react-bootstrap';
import {
  ArrowLeftShort,
  BriefcaseFill,
  HandThumbsDown,
  HouseDoorFill,
  InfoSquareFill,
  PencilSquare,
  ShieldCheck,
  Speedometer,
} from 'react-bootstrap-icons';
import CertificateOfCalibration from '@/sub-components/dashboard/jobs/calibrations/view/CertificateOfCalibration';
import { PDFViewer } from '@react-pdf/renderer';
import CertificateOfCalibrationPDF1 from '@/components/pdf/CertificateOfCalibrationPDF1';
import CertificateOfCalibrationPDF2 from '@/components/pdf/CertificateOfCalibrationPDF2';
import { STATUS_COLOR } from '@/schema/calibration';
import _ from 'lodash';
import { useNotifications } from '@/hooks/useNotifications';
import withReactContent from 'sweetalert2-react-content';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

const CalibrationDetails = () => {
  const router = useRouter();
  const auth = useAuth();
  const { calibrateId, jobId } = router.query;

  const [calibration, setCalibration] = useState();
  const [instruments, setInstruments] = useState({ data: [], isLoading: true, isError: false });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('0');

  const notifications = useNotifications();

  const notifyCalibratedBy = async (status, calibration) => {
    if (!calibration) return;

    try {
      const workerId = calibration?.calibratedBy?.id || '';
      const snapshots = await getDocs(
        query(collection(db, 'users'), where('workerId', '==', workerId))
      );

      if (!snapshots.empty) {
        const snapshot = snapshots.docs[0];
        const user = { id: snapshot.id, ...snapshot.data() };

        if (user && user.id) {
          await notifications.create({
            module: 'calibration',
            target: [user.id],
            title: 'Calibration status updated',
            message: `Calibration (#${calibrateId}) status was updated by ${auth.currentUser.displayName} to "${_.startCase(status)}".`, //prettier-ignore
            data: {
              redirectUrl: `/jobs/${jobId}/calibrations/view/${calibrateId}`,
            },
          });

          //* reload page after 2 seconds
          setTimeout(() => {
            router.reload();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Failed to notify technician:', error);
    }
  };

  const handleUpdateCalibrationStatus = (id, status, setIsLoading) => {
    if (status === 'data-rejected') {
      withReactContent(Swal)
        .fire({
          title: `Calibration Status Update - Calibration #${id}`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Confirm',
          cancelButtonText: 'Cancel',
          customClass: {
            confirmButton: 'btn btn-primary rounded',
            cancelButton: 'btn btn-secondary rounded',
          },
          html: (
            <div className='d-flex flex-column gap-4'>
              <div
                style={{ color: '#545454' }}
              >{`Are you sure you want to update the calibration status to "${_.startCase(
                status
              )}"?`}</div>

              <div>
                <Form.Control
                  id={`calibration-status-update-${id}`}
                  type='text'
                  as='textarea'
                  rows={4}
                  placeholder='Enter a message/reason'
                />
              </div>
            </div>
          ),
          preConfirm: () => {
            return document.getElementById(`calibration-status-update-${id}`).value;
          },
        })
        .then(async (data) => {
          const { value, isConfirmed } = data;
          if (isConfirmed) {
            try {
              setIsLoading(true);

              const calibrationRef = doc(db, 'jobCalibrations', id);

              await Promise.all([
                updateDoc(calibrationRef, {
                  status,
                  reasonMessage: value,
                  updatedAt: serverTimestamp(),
                  updatedBy: auth.currentUser,
                }),
                //* create notification for admin and supervisor when updated a calibration status
                notifications.create({
                  module: 'calibration',
                  target: ['admin', 'supervisor'],
                  title: 'Calibration status updated',
                  message: `Calibration (#${id}) status was updated by ${auth.currentUser.displayName} to "${_.startCase(status)}".`, //prettier-ignore
                  data: {
                    redirectUrl: `/jobs/${jobId}/calibrations/view/${id}`,
                  },
                }),

                notifyCalibratedBy(status, calibration),
              ]);

              toast.success('Job request status updated successfully', {
                position: 'top-right',
              });
              setIsLoading(false);
            } catch (error) {
              console.error('Error updating job request status:', error);
              toast.error('Error updating job request status: ' + error.message, { position: 'top-right' }); //prettier-ignore
              setIsLoading(false);
            }
          }
        });
      return;
    }

    Swal.fire({
      title: `Calibration Status Update - Calibration #${id}`,
      text: `Are you sure you want to update the calibration status to "${_.startCase(status)}"?`,
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

          const jobCalibrationRef = doc(db, 'jobCalibrations', id);

          await Promise.all([
            updateDoc(jobCalibrationRef, {
              status,
              reasonMessage: null,
              updatedAt: serverTimestamp(),
              updatedBy: auth.currentUser,
            }),

            //* create notification for admin and supervisor when updated a calibration status
            notifications.create({
              module: 'calibration',
              target: ['admin', 'supervisor'],
              title: 'Calibration status updated',
              message: `Calibration (#${id}) status was updated by ${auth.currentUser.displayName} to "${_.startCase(status)}".`, //prettier-ignore
              data: {
                redirectUrl: `/jobs/${jobId}/calibrations/view/${id}`,
              },
            }),

            notifyCalibratedBy(status, calibration),
          ]);

          toast.success('Calibration status updated successfully', {
            position: 'top-right',
          });
          setIsLoading(false);
        } catch (error) {
          console.error('Error updating calibration status:', error);
          toast.error('Error updating calibration status: ' + error.message, { position: 'top-right' }); //prettier-ignore
          setIsLoading(false);
        }
      }
    });
  };

  //* query calibration & job header
  useEffect(() => {
    if (calibrateId) {
      const jobHeaderRef = doc(db, 'jobHeaders', jobId);
      const calibrationRef = doc(db, 'jobCalibrations', calibrateId);
      const certificateRef = doc(db, 'jobCertificates', calibrateId);

      Promise.all([getDoc(calibrationRef), getDoc(certificateRef), getDoc(jobHeaderRef)])
        .then(async ([calibrationSnapshot, certificateSnapshot, jobHeaderSnapshot]) => {
          if (
            calibrationSnapshot.exists() &&
            certificateSnapshot.exists() &&
            jobHeaderSnapshot.exists()
          ) {
            const calibrationData = calibrationSnapshot.data();
            const certificateData = certificateSnapshot.data();
            const jobHeaderData = { jobId: jobHeaderSnapshot.id, ...jobHeaderSnapshot.data() };

            const locationSnapshot = jobHeaderData.location.id
              ? await getDoc(doc(db, 'locations', jobHeaderData.location.id))
              : undefined;

            const customerEquipmentSnapshot = calibrationData.description.id
              ? await getDoc(doc(db, 'customerEquipments', calibrationData.description.id))
              : undefined;

            const resolvedData = calibrationData?.data ? JSON.parse(calibrationData.data) : null;

            setCalibration({
              id: calibrationSnapshot.id,
              ...calibrationData,
              data: resolvedData,
              ...certificateData,
              location: locationSnapshot?.exists() ? {id: locationSnapshot.id, ...locationSnapshot.data()} : undefined, //prettier-ignore
              description: customerEquipmentSnapshot?.exists() ? { id: customerEquipmentSnapshot.id, ...customerEquipmentSnapshot.data()} : undefined, //prettier-ignore
              job: { id: jobHeaderSnapshot.id, ...jobHeaderData }, //prettier-ignore
            });
            setIsLoading(false);
          } else {
            setError('Calibration not found');
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.log(err);
          setError(err.message || 'Error fetching calibration');
          setIsLoading(false);
        });
    }
  }, [calibrateId]);

  //* query equipments
  useEffect(() => {
    if (calibration) {
      getDocs(collection(db, 'equipments'))
        .then((snapshot) => {
          if (!snapshot.empty) {
            const instruments = snapshot.docs
              .filter((instrument) => calibration.instruments?.includes(instrument.id))
              .map((doc) => {
                const data = doc.data();

                return {
                  id: doc.id,
                  tagId: data.tagId,
                  description: data.description,
                  category: data.category?.toLowerCase() || '',
                  make: data.make,
                  model: data.model,
                  serialNumber: data.serialNumber,
                  traceability: data.traceability,
                  certificateNo: data.certificateNo,
                  dueDate: undefined, //TODO: due date not yet available in the equipment's property
                };
              });

            setInstruments({ data: instruments, isLoading: false, isError: false });
          } else setInstruments({ data: [], isLoading: false, isError: false });
        })
        .catch((err) => {
          console.error(err.message);
          setInstruments({ data: [], isLoading: false, isError: true });
        });
    }
  }, [calibration]);

  if (isLoading) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
        <Spinner animation='border' variant='primary' />
        <span className='ms-3'>Loading Calibration...</span>
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
          <Button className='btn btn-primary' onClick={() => router.push('/jobs')}>
            Back to Job Calibration List
          </Button>
        </div>
      </div>
    );
  }

  if (!calibration) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>calibration not found</h3>
          <Link href='/jobs'>
            <Button variant='primary' className='mt-3'>
              Back to Job Calibration List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO title={`View Job #${jobId} Calibration | VITAR Group`} />

      <ContentHeader
        title={`View Details for Job #${jobId} Calibration #${calibrateId}`}
        description='View comprehensive job calibration details including calibration info, measurements, reference instruments & calibration test & data'
        badgeText='Calibration Management'
        badgeText2='View Calibration'
        breadcrumbItems={[
          {
            icon: <HouseDoorFill className='me-2' size={14} />,
            text: 'Dashboard',
            link: '/dashboard',
          },
          {
            text: 'Jobs',
            link: '/jobs',
            icon: <BriefcaseFill className='me-2' size={14} />,
          },
          {
            text: `Job #${jobId} Calibrations`,
            link: `/jobs/${jobId}/calibrations`,
            icon: <Speedometer className='me-2' size={14} />,
          },
          {
            icon: <InfoSquareFill className='me-2' size={14} />,
            text: calibrateId,
          },
        ]}
        customBadges={[
          {
            label: _.startCase(calibration?.status),
            color: STATUS_COLOR[calibration?.status] || 'secondary',
          },
        ]}
        actionButtons={[
          {
            text: `Back to Job #${jobId} Calibrations`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push(`/jobs/${jobId}/calibrations`),
          },
        ]}
        dropdownItems={[
          {
            label: 'Edit Calibration',
            icon: PencilSquare,
            onClick: () =>
              router.push(`/jobs/${jobId}/calibrations/edit-calibrations/${calibrateId}`),
          },
          // prettier-ignore
          ...((auth.role === 'admin' || auth.role === 'supervisor') && calibration && calibration?.status !== 'data-rejected'
            ? [
                {
                  label: 'Data Rejected',
                  icon: HandThumbsDown,
                  onClick: (args) => handleUpdateCalibrationStatus(calibrateId, 'data-rejected', args.setIsLoading),
                },
              ]
            : []),
          // prettier-ignore
          ...((auth.role === 'admin' || auth.role === 'supervisor') && calibration && calibration?.status !== 'cert-complete'
          ? [
              {
                label: 'Cert Complete',
                icon: ShieldCheck,
                onClick: (args) => handleUpdateCalibrationStatus(calibrateId, 'cert-complete', args.setIsLoading),
              },
            ]
          : []),
        ]}
      />

      <Card>
        <Card.Body>
          <Tabs activeKey={activeTab} onSelect={setActiveTab}>
            <Tab eventKey='0' title='Summary'>
              <SummaryTab calibration={calibration} />
            </Tab>

            <Tab eventKey='1' title='Measurements'>
              <Measurements calibration={calibration} />
            </Tab>

            <Tab eventKey='2' title='Referece Instruments'>
              <ReferenceInstruments calibration={calibration} instruments={instruments} />
            </Tab>

            <Tab eventKey='3' title='Calibration'>
              <Calibration calibration={calibration} />
            </Tab>

            <Tab eventKey='4' title='Result'>
              <Result calibration={calibration} />
            </Tab>

            <Tab eventKey='6' title='COC'>
              <CertificateOfCalibration calibration={calibration} instruments={instruments} />
            </Tab>

            {/* <Tab eventKey='7' title='PDF COC'>
              <Card className='border-0 shadow-none'>
                <Card.Body>
                  <PDFViewer height={800} width='100%'>
                    <CertificateOfCalibrationPDF2
                      calibration={calibration}
                      instruments={instruments}
                    />
                  </PDFViewer>
                </Card.Body>
              </Card>
            </Tab> */}
          </Tabs>
        </Card.Body>
      </Card>
    </>
  );
};

export default CalibrationDetails;
