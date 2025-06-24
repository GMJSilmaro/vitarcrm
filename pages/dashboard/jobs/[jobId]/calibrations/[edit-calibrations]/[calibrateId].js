import ContentHeader from '@/components/dashboard/ContentHeader';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { useNotifications } from '@/hooks/useNotifications';
import { PRINT_STATUS_COLOR, STATUS_COLOR } from '@/schema/calibration';
import CalibrationForm from '@/sub-components/dashboard/jobs/calibrations/CalibrationForm';
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
import _ from 'lodash';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import {
  ArrowLeftShort,
  BriefcaseFill,
  Eye,
  HandThumbsDown,
  HouseDoorFill,
  PencilFill,
  ShieldCheck,
  Speedometer,
} from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const EditCalibrations = () => {
  const router = useRouter();
  const auth = useAuth();
  const { calibrateId, jobId } = router.query;

  const [calibration, setCalibration] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [calibrations, setCalibrations] = useState({ data: [], isLoading: true, isError: false });

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

  //* query calibartion
  useEffect(() => {
    if (calibrateId) {
      const calibrationRef = doc(db, 'jobCalibrations', calibrateId);
      const certificateRef = doc(db, 'jobCertificates', calibrateId);

      Promise.all([getDoc(calibrationRef), getDoc(certificateRef)])
        .then(([calibrationSnapshot, certificateSnapshot]) => {
          if (calibrationSnapshot.exists() && certificateSnapshot.exists()) {
            setCalibration({
              id: calibrationSnapshot.id,
              ...calibrationSnapshot.data(),
              ...certificateSnapshot.data(),
            });
            setIsLoading(false);
          } else {
            setError('Calibration not found');
            setIsLoading(false);
          }
        })
        .catch((err) => {
          setError(err.message || 'Error fetching calibration');
          setIsLoading(false);
        });
    }
  }, [calibrateId]);

  //* query job calibrations for job
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
          return;
        }

        setCalibrations({
          data: [],
          isLoading: false,
          isError: false,
        });
      })
      .catch((err) => {
        console.error(err.message);
        setCalibrations({ data: [], isLoading: false, isError: true });
      });
  }, [jobId]);

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
          <button className='btn btn-primary' onClick={() => router.push('/jobs')}>
            Back to Job Calibration List
          </button>
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
              `Back to Job #{jobId} Calibrations List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO title='Edit Calibration | VITAR Group' />

      <ContentHeader
        title='Edit Calibration'
        description='Update calibration information'
        badgeText='Calibration Management'
        badgeText2='Edit Calibration'
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
            icon: <PencilFill className='me-2' size={14} />,
            text: calibration ? calibration.id : 'Create',
          },
        ]}
        customBadges={[
          {
            label: _.startCase(calibration?.status),
            color: STATUS_COLOR[calibration?.status] || 'secondary',
          },
          ...(calibration?.printStatus
            ? [
                {
                  label: _.startCase(calibration?.printStatus),
                  color: PRINT_STATUS_COLOR[calibration?.printStatus] || 'secondary',
                },
              ]
            : []),
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
            label: 'View Calibration',
            icon: Eye,
            onClick: () => router.push(`/jobs/${jobId}/calibrations/view/${calibrateId}`),
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

      <Row>
        <Col sm={12}>
          <Card className='shadow-sm'>
            <Card.Body>
              <CalibrationForm data={calibration} calibrations={calibrations} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default EditCalibrations;
