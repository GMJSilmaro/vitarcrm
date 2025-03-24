import { db } from '@/firebase';
import {
  differenceInSeconds,
  hoursToSeconds,
  intervalToDuration,
  minutesToSeconds,
} from 'date-fns';
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { StopFill } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export function JobTimer({ stopWatch, job, workerId, auth }) {
  const { hours, minutes, seconds, isRunning, start, pause, reset} = stopWatch; // prettier-ignore

  const [isLoading, setIsLoading] = useState(false);

  const formatTime = (num) => String(num).padStart(2, '0');

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

            reset(undefined, false);

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

    const jobDetailsRef = doc(db, 'jobDetails', job.id);

    getDoc(jobDetailsRef)
      .then((doc) => {
        if (doc.exists()) {
          const jobData = { id: doc.id, ...doc.data() };
          const startAt = jobData?.startByAt?.toDate();
          const timeNow = new Date();

          if (startAt) {
            const differerenceInSeconds = differenceInSeconds(timeNow, startAt);
            const elapseSeconds = differerenceInSeconds + 60;

            console.log({ startAt, timeNow });

            timeNow.setSeconds(elapseSeconds);
            reset(timeNow, true);
          } else startJob(job?.id);
        }
      })
      .catch((err) => {
        console.error(err.message);
        toast.error('Failed to reinitialize the timer. Please try again later.');
      });
  }, [workerId, job]);

  if (isLoading)
    return (
      <div className='d-flex justify-content-center align-items-center'>
        <Spinner animation='border' variant='primary' size='sm' className='me-2' /> Finishing Job...
      </div>
    );

  return (
    <div className='d-flex gap-2'>
      <span className='fw-bold py-1 px-2 rounded bg-primary-soft text-dark'>
        {formatTime(hours)}
      </span>
      <span>:</span>
      <span className='fw-bold py-1 px-2 rounded bg-primary-soft text-dark'>
        {formatTime(minutes)}
      </span>
      <span>:</span>
      <span className='fw-bold py-1 px-2 rounded bg-primary-soft text-dark'>
        {formatTime(seconds)}
      </span>

      {isRunning && <div className='border mx-2' style={{ width: 1 }} />}

      <div className='d-flex align-items-center gap-2'>
        {/* {!isRunning && !isStop && (
          <Button className='py-1 px-2' variant='primary' onClick={handleStart}>
            <PlayFill size={18} className='me-1' />
            {hours > 0 || minutes > 0 || seconds > 0 ? 'Resume' : 'Start'}
          </Button>
        )} */}

        {isRunning && (
          <>
            <Button className='py-1 px-2' variant='danger' onClick={stopJob}>
              <StopFill size={18} className='me-1' /> Stop
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
