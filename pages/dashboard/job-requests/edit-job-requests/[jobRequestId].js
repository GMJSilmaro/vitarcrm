import ContentHeader from '@/components/dashboard/ContentHeader';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { useNotifications } from '@/hooks/useNotifications';
import { STATUS_COLOR } from '@/schema/job-request';
import JobRequestForm from '@/sub-components/dashboard/job-requests/JobRequestForm';
import { GeeksSEO } from '@/widgets';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import _ from 'lodash';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import {
  ArrowLeftShort,
  CircleHalf,
  EnvelopePaperFill,
  Eye,
  HandThumbsDown,
  HandThumbsUp,
  HouseFill,
  Link,
  PencilFill,
} from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const EditJobRequest = () => {
  const router = useRouter();
  const { jobRequestId } = router.query;
  const auth = useAuth();
  const notifications = useNotifications();

  const [jobRequest, setJobRequest] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleUpdateJobRequestStatus = (id, status, setIsLoading) => {
    if (status === 'request-cancelled' || status === 'request-resubmit') {
      withReactContent(Swal)
        .fire({
          title: `Job Request Status Update - Job Request #${id}`,
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
              >{`Are you sure you want to update the job request status to "${_.startCase(
                status
              )}"?`}</div>

              <div>
                <Form.Control
                  id={`job-request-status-update-${id}`}
                  type='text'
                  as='textarea'
                  rows={4}
                  placeholder='Enter a message/reason'
                />
              </div>
            </div>
          ),
          preConfirm: () => {
            return document.getElementById(`job-request-status-update-${id}`).value;
          },
        })
        .then(async (data) => {
          const { value, isConfirmed } = data;
          if (isConfirmed) {
            try {
              setIsLoading(true);

              const jobRequestRef = doc(db, 'jobRequests', id);

              await Promise.all([
                updateDoc(jobRequestRef, {
                  status,
                  reasonMessage: value,
                  updatedAt: serverTimestamp(),
                  updatedBy: auth.currentUser,
                }),
                //* create notification for admin and supervisor when updated a job request status
                notifications.create({
                  module: 'job-request',
                  target: ['admin', 'supervisor', 'sales'],
                  title: 'Job request status updated',
                  message: `Job request (#${id}) status was updated by ${auth.currentUser.displayName} to "${_.startCase(status)}".`, //prettier-ignore
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
                window.location.reload();
              }, 1500);
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
      title: `Job Request Status Update - Job Request #${id}`,
      text: `Are you sure you want to update the job request status to "${_.startCase(status)}"?`,
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
              status,
              reasonMessage: null,
              updatedAt: serverTimestamp(),
              updatedBy: auth.currentUser,
            }),
            //* create notification for admin and supervisor when updated a job request status
            notifications.create({
              module: 'job-request',
              target: ['admin', 'supervisor', 'sales'],
              title: 'Job request status updated',
              message: `Job request (#${id}) status was updated by ${auth.currentUser.displayName} to "${_.startCase(status)}".`, //prettier-ignore
              data: {
                redirectUrl: `/job-requests/view/${id}`,
              },
            }),
          ]);

          toast.success('Job request status updated successfully', {
            position: 'top-right',
          });
          setIsLoading(false);

          if (status === 'request-approved') {
            setTimeout(() => {
              window.location.assign(`/jobs/create?jobRequestId=${id}`);
            }, 1500);
          }
        } catch (error) {
          console.error('Error updating job request status:', error);
          toast.error('Error updating job request status: ' + error.message, { position: 'top-right' }); //prettier-ignore
          setIsLoading(false);
        }
      }
    });
  };

  useEffect(() => {
    if (jobRequestId) {
      const jobRequestRef = doc(db, 'jobRequests', jobRequestId);

      getDoc(jobRequestRef)
        .then((doc) => {
          if (doc.exists()) {
            setJobRequest({
              id: doc.id,
              ...doc.data(),
            });
            setIsLoading(false);
          } else {
            setError('Job request not found');
            setIsLoading(false);
          }
        })
        .catch((err) => {
          setError(err.message || 'Error fetching job request');
          setIsLoading(false);
        });
    }
  }, [jobRequestId]);

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
          <Button onClick={() => router.push('/jobs-requests')}>Back to Job Requests List</Button>
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
          <h3>Job request not found</h3>
          <Link href='/jobs-requests'>
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
      <GeeksSEO title='Edit Job Request - VITAR Group | Portal' />

      <ContentHeader
        title='Edit Job Request'
        description='Update job request summary, customer equipment, and addional instructions'
        badgeText='Job Request Management'
        badgeText2='Edit Job Request'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/dashboard',
            icon: <HouseFill className='me-2' size={14} />,
          },
          {
            text: 'Jobs Requests',
            link: '/job-requests',
            icon: <EnvelopePaperFill className='me-2' size={14} />,
          },
          {
            text: jobRequest.id,
            icon: <PencilFill className='me-2' size={14} />,
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
            label: 'View Job Request',
            icon: Eye,
            onClick: () => router.push(`/job-requests/view/${jobRequestId}`),
          },
          // prettier-ignore
          ...((auth.role === 'admin' || auth.role === 'supervisor') && jobRequest?.status !== 'request-approved'
            ? [
                {
                  label: 'Request Approved',
                  icon: HandThumbsUp,
                  onClick: (args) => handleUpdateJobRequestStatus(jobRequestId, 'request-approved', args.setIsLoading),
                },
              ]
            : []),
          // prettier-ignore
          ...((auth.role === 'admin' || auth.role === 'supervisor') && jobRequest?.status !== 'request-cancelled'
          ? [
              {
                label: 'Request Cancelled',
                icon: HandThumbsDown,
                onClick: (args) => handleUpdateJobRequestStatus(jobRequestId, 'request-cancelled', args.setIsLoading),
              },
            ]
          : []),
          // prettier-ignore
          ...((auth.role === 'admin' || auth.role === 'supervisor') && jobRequest?.status !== 'request-resubmit'
            ? [
                {
                  label: 'Request Resubmit',
                  icon: CircleHalf,
                  onClick: (args) => handleUpdateJobRequestStatus(jobRequestId, 'request-resubmit', args.setIsLoading),
                },
              ]
            : []),
        ]}
      />

      <Row>
        <Col sm={12}>
          <Card className='shadow-sm'>
            <Card.Body>
              <JobRequestForm data={jobRequest} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default EditJobRequest;
