import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { ClockHistory } from 'react-bootstrap-icons';
import { JobTimer } from './JobTimer';
import { Spinner } from 'react-bootstrap';
import { useRouter } from 'next/router';

const CurrentJobCard = () => {
  const auth = useAuth();

  const router = useRouter();
  const { workerId } = router.query;

  const [jobs, setJobs] = useState({ data: [], isLoading: true, isError: false });

  const currentJobStat = useMemo(() => {
    const currentJob = jobs.data.find((job) => job.status === 'in progress');

    return {
      value: currentJob ? `${currentJob?.jobId || ''} ${currentJob?.customer?.name || ''}` : 'N/A',
      title: 'Current Job',
      subtitle: currentJob ? 'In Progress' : '',
      filter: 'status',
      filterValue: 'in progress',
      job: currentJob,
      workerId,
    };
  }, [JSON.stringify(jobs), workerId]);

  //* query jobs header
  useEffect(() => {
    if (!workerId || !auth) {
      setJobs({ data: [], isLoading: false, isError: false });
      return;
    }

    const q = query(
      collection(db, 'jobHeaders'),
      where('workers', 'array-contains', {
        id: workerId,
        name: auth.currentUser.displayName,
      })
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshop) => {
        if (!snapshop.empty) {
          let rows = [];
          for (const jobDoc of snapshop.docs) {
            const id = jobDoc.id;
            const data = jobDoc.data();

            const jobDetailsDoc = await getDoc(doc(db, 'jobDetails', id));
            const jobDetailsData = jobDetailsDoc.exists() ? jobDetailsDoc.data() : null;

            rows.push({
              id,
              ...data,
              details: jobDetailsData,
            });
          }

          setJobs({ data: rows, isLoading: false, isError: false });
          return;
        }

        setJobs({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        setJobs({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, [workerId, auth]);

  if (currentJobStat.value === 'N/A') return null;

  return (
    <div className='bg-white rounded p-4 h-100 border border-transaparent'>
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <div className='d-flex align-items-center'>
          <ClockHistory size={18} className={`text-${currentJobStat.color} me-2`} />
          <span className='text-muted small'>{currentJobStat.title}</span>
        </div>

        <div>
          {/* <JobTimer job={currentJobStat.job} workerId={currentJobStat.workerId} auth={auth} /> */}
        </div>
      </div>

      {jobs.isLoading ? (
        <Spinner style={{ width: 20, height: 20 }} animation='border' size='sm' />
      ) : (
        <>
          <h3 className='mb-1'>{currentJobStat.value}</h3>
          <small className='text-muted'>{currentJobStat.subtitle}</small>
        </>
      )}
    </div>
  );
};

export default CurrentJobCard;
