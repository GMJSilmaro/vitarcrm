import '../../../../../node_modules/@syncfusion/ej2-base/styles/material.css';
import '../../../../../node_modules/@syncfusion/ej2-buttons/styles/material.css';
import '../../../../../node_modules/@syncfusion/ej2-calendars/styles/material.css';
import '../../../../../node_modules/@syncfusion/ej2-dropdowns/styles/material.css';
import '../../../../../node_modules/@syncfusion/ej2-inputs/styles/material.css';
import '../../../../../node_modules/@syncfusion/ej2-lists/styles/material.css';
import '../../../../../node_modules/@syncfusion/ej2-navigations/styles/material.css';
import '../../../../../node_modules/@syncfusion/ej2-popups/styles/material.css';
import '../../../../../node_modules/@syncfusion/ej2-splitbuttons/styles/material.css';
import '../../../../../node_modules/@syncfusion/ej2-react-schedule/styles/material.css';

import {
  Inject,
  ScheduleComponent,
  TimelineMonth,
  TimelineViews,
  ViewDirective,
  ViewsDirective,
} from '@syncfusion/ej2-react-schedule';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { orderBy } from 'lodash';
import { collection, limit, onSnapshot, query } from 'firebase/firestore';
import { isProd } from '@/constants/environment';
import { db } from '@/firebase';
import { format } from 'date-fns';

const JobWorkerTimelineCalendar = () => {
  const router = useRouter();
  const calendarRef = useRef(null);

  const [workers, setWorkers] = useState({ data: [], isLoading: true, isError: false });
  const [jobs, setJobs] = useState({ data: [], isLoading: true, isError: false });
  const [isLoading, setIsLoading] = useState(false);

  const data = [
    {
      Id: 1,
      Subject: 'Job: 000001',
      Description: 'Job 000001 Description',
      Location: 'A & T INGREDIENTS SDN. BHD.',
      StartTime: new Date(2025, 1, 4, 9, 36),
      EndTime: new Date(2025, 1, 7, 11, 36),
    },
    {
      Id: 2,
      Subject: 'Job: 000002',
      Description: 'Job 000001 Description',
      Location: 'Xenova Solutions Sdn. Bhd.',
      StartTime: new Date(2025, 1, 4, 9, 36),
      EndTime: new Date(2025, 1, 7, 11, 36),
    },
    {
      Id: 3,
      Subject: 'Job: 000003',
      Description: 'Job 000001 Description',
      Location: 'PrimeTech Ingredients Sdn. Bhd.',
      StartTime: new Date(2025, 1, 4, 9, 36),
      EndTime: new Date(2025, 1, 7, 11, 36),
    },
    {
      Id: 4,
      Subject: 'Job: 000004',
      Description: 'Job 000001 Description',
      Location: 'EverGrow Manufacturing Sdn. Bhd.',
      StartTime: new Date(2025, 1, 4, 9, 36),
      EndTime: new Date(2025, 1, 7, 11, 36),
    },
    {
      Id: 5,
      Subject: 'Job: 000005',
      Description: 'Job 000001 Description',
      Location: 'FusionChem Resources Sdn. Bhd.',
      StartTime: new Date(2025, 1, 4, 9, 36),
      EndTime: new Date(2025, 1, 7, 11, 36),
    },
  ];

  //* query jobs
  useEffect(() => {
    const constraints = [orderBy('jobId', 'asc')];

    if (!isProd) {
      const devQueryConstraint = [limit(2)];
      devQueryConstraint.forEach((constraint) => constraints.push(constraint));
    }

    const q = query(collection(db, 'jobHeaders'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          setJobs({
            data: snapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
              };
            }),
            isLoading: false,
            isError: false,
          });
        }
      },
      (err) => {
        console.error(err.message);
        setJobs({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  const timelineEventTemnplate = (props) => {
    return (
      <div className='rounded fs-6 w-100 flex flex-column'>
        <span className='d-inline-block text-text-truncate' style={{ width: '85%' }}>
          {props.Subject} - {props.Location}
        </span>
        <div className='d-flex'>
          <span className='d-none d-md-inline-block'>{format(props.StartTime, 'p')}</span> -
          <spann className='d-none d-md-inline-block'>{format(props.EndTime, 'p')}</spann>
        </div>
      </div>
    );
  };

  const eventSettings = useMemo(() => {
    const jobsEvents = jobs.data.map((job) => ({
      Id: job.id,
      Subject: 'Job: ' + job.id,
      Description: job.description,
      Location: job.location.name,
      StartTime: new Date(`${job.startDate}T${job.startTime}:00`),
      EndTime: new Date(`${job.endDate}T${job.endTime}:00`),
      Job: job,
    }));

    return { dataSource: jobsEvents, template: timelineEventTemnplate };
  }, [jobs]);

  if (isLoading) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '84vh' }}>
        <Spinner animation='border' variant='primary' />
        <span className='ms-3'>Loading Calendar...</span>
      </div>
    );
  }

  return (
    <ScheduleComponent
      ref={calendarRef}
      className='overflow-auto'
      width='100%'
      height='84vh'
      currentView='TimelineDay'
      selectedDate={new Date()}
      startHour='00:00'
      endHour='24:00'
      eventSettings={eventSettings}
    >
      <ViewsDirective>
        <ViewDirective option='TimelineDay' />
        <ViewDirective option='TimelineWeek' />
        <ViewDirective option='TimelineWorkWeek' />
        <ViewDirective option='TimelineMonth' />
      </ViewsDirective>
      <Inject services={[TimelineViews, TimelineMonth]} />
    </ScheduleComponent>
  );
};

export default JobWorkerTimelineCalendar;
