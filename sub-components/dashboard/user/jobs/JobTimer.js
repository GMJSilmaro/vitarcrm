import { db } from '@/firebase';
import { prependZero } from '@/utils/common';
import { add, intervalToDuration } from 'date-fns';
import { doc, getDoc, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import { abs } from 'mathjs';
import { useCallback, useEffect, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { StopFill } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export function JobTimer({ job, workerId, auth }) {
  const [elapse, setElapse] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  const startJob = async (id) => {
    if (!id) return;

    try {
      setIsLoading(true);

      //* update job header & details
      const jobHeaderRef = doc(db, 'jobHeaders', id);
      const jobDetailsRef = doc(db, 'jobDetails', id);

      await runTransaction(db, async (transaction) => {
        try {
          transaction.update(jobHeaderRef, {
            status: 'in progress',
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

      toast.success('Job has been started successfully.', { position: 'top-right' });
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error('Error stopping job', error);
      toast.error('Unexpected error occured while stopping job. Please try again later.');
    }
  };

  const stopJob = useCallback(
    async (e) => {
      Swal.fire({
        title: 'Finished Job?',
        text: 'Are you sure you want you want to mark the job as "completed"?',
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
          if (!workerId || !job || !job?.id) return;

          try {
            setIsLoading(true);
            e.stopPropagation();

            //* update job header & details
            const jobHeaderRef = doc(db, 'jobHeaders', job.id);
            const jobDetailsRef = doc(db, 'jobDetails', job.id);

            await runTransaction(db, async (transaction) => {
              try {
                transaction.update(jobHeaderRef, {
                  status: 'completed',
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

            toast.success('Job has been completed successfully.', { position: 'top-right' });
            setIsLoading(false);
          } catch (error) {
            setIsLoading(false);
            console.error('Error stopping job', error);
            toast.error('Unexpected error occured while stopping job. Please try again later.');
          }
        }
      });
    },
    [workerId, job]
  );

  //* re initialize the timer based on the startBy time
  useEffect(() => {
    if (!workerId || !job || !job?.id) return;

    let interval;
    const jobDetailsRef = doc(db, 'jobDetails', job.id);

    getDoc(jobDetailsRef)
      .then((doc) => {
        if (doc.exists()) {
          const jobData = { id: doc.id, ...doc.data() };
          const startByAt = jobData?.startByAt;
          const startByAtDate = startByAt.toDate(); // * by using toDate() from  timestamp UTC causes loss of precision since Date objects only support millisecond precision.

          if (startByAt) {
            interval = setInterval(() => {
              const now = add(new Date(), { minutes: 1, seconds: 23 });

              setElapse(
                intervalToDuration({
                  start: startByAtDate,
                  end: now,
                })
              );
            }, 1000);
          } else startJob(job?.id);
        }
      })
      .catch((err) => {
        console.error(err.message);
        toast.error('Failed to reinitialize the timer. Please try again later.');
      });

    return () => interval && clearInterval(interval);
  }, [workerId, job]);

  if (isLoading)
    return (
      <div className='d-flex justify-content-center align-items-center'>
        <Spinner animation='border' variant='primary' size='sm' className='me-2' /> Finishing Job...
      </div>
    );

  if (!elapse) return null;

  return (
    <div className='d-flex gap-2'>
      <span className='fw-bold py-1 px-2 rounded bg-primary-soft text-dark'>
        {prependZero(elapse?.days ?? 0)}
      </span>
      <span className='my-auto'>:</span>
      <span className='fw-bold py-1 px-2 rounded bg-primary-soft text-dark'>
        {prependZero(elapse?.hours ?? 0)}
      </span>
      <span className='my-auto'>:</span>
      <span className='fw-bold py-1 px-2 rounded bg-primary-soft text-dark'>
        {prependZero(elapse?.minutes ?? 0)}
      </span>
      <span className='my-auto'>:</span>
      <span className='fw-bold py-1 px-2 rounded bg-primary-soft text-dark'>
        {prependZero(elapse?.seconds ?? 0)}
      </span>

      <div className='border mx-2' style={{ width: 1 }} />

      <div className='d-flex align-items-center gap-2'>
        <Button className='py-1 px-2' variant='danger' onClick={stopJob}>
          <StopFill size={18} className='me-1' /> Stop
        </Button>
      </div>
    </div>
  );
}
