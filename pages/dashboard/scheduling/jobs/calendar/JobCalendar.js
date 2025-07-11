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
  Day,
  Week,
  Month,
  Agenda,
  ViewsDirective,
  ViewDirective,
} from '@syncfusion/ej2-react-schedule';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { collection, deleteDoc, doc, limit, onSnapshot, query } from 'firebase/firestore';
import _ from 'lodash';
import { auth, db } from '@/firebase';
import { format, isBefore, startOfDay, subDays } from 'date-fns';
import { Badge, Button, OverlayTrigger, Spinner, Tooltip } from 'react-bootstrap';
import { Eye, Pencil, Trash, X } from 'react-bootstrap-icons';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';
import { isProd } from '@/constants/environment';
import toast from 'react-hot-toast';
import { TooltipContent } from '@/components/common/ToolTipContent';
import { useAuth } from '@/contexts/AuthContext';
import { STATUS_COLOR } from '@/schema/job';

const JobCalendar = () => {
  const auth = useAuth();
  const router = useRouter();
  const calendarRef = useRef(null);

  const [jobs, setJobs] = useState({ data: [], isLoading: true, isError: false });
  const [isLoading, setIsLoading] = useState(false);

  const handleViewJob = (id) => {
    router.push(`/jobs/view/${id}`);
  };

  const handleEditJob = (id) => {
    router.push(`/jobs/edit-jobs/${id}`);
  };

  const handleDeleteJob = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove',
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
          const jobDetailsRef = doc(db, 'jobDetails', id);

          await Promise.all([await deleteDoc(jobHeaderRef), await deleteDoc(jobDetailsRef)]);

          toast.success('Job removed successfully', { position: 'top-right' });
          setIsLoading(false);
        } catch (error) {
          console.error('Error removing job:', error);
          toast.error('Error removing job: ' + error.message, { position: 'top-right' });
          setIsLoading(false);
        }
      }
    });
  };

  const monthWeekDayEventTemplate = (props) => {
    return (
      <div className='fs-5 h-100 w-100 d-flex justify-content-center align-items-center'>
        <span className='d-inline-block text-text-truncate'>#{props.Subject}</span>
      </div>
    );
  };

  const eventRendered = (args) => {
    const status = args.data.Job.status;
    args.element.classList.add(`bg-${STATUS_COLOR[status] || 'secondary'}`);
    args.element.style.borderRadius = '4px';
  };

  const handleCloseQuickInfoPopup = useCallback(() => {
    if (!calendarRef || !calendarRef.current) return;
    calendarRef.current.closeQuickInfoPopup();
  }, [calendarRef]);

  const quickInfoHeaderTemplate = (props) => {
    const elementType = props.elementType;
    const job = props.Job;

    if (elementType === 'cell') return null;

    const startDate = new Date(`${job.startDate}T${job.startTime}:00`);
    const endDate = new Date(`${job.endDate}T${job.endTime}:00`);

    return (
      <div className='fs-6 border-bottom border-primary pb-1 d-flex justify-content-between p-2'>
        <div className='d-flex justify-content-center align-items-center'>
          <span className='pe-1 fs-6'>Job ID: </span>
          <strong className='pe-2'>{job.id}</strong>
          <Badge
            className='text-capitalize mb-1'
            bg={`${job.priority === 'normal' ? 'success' : 'danger'}`}
          >
            {job.priority}
          </Badge>
        </div>

        <div className='d-flex flex-column justify-content-center'>
          <p className='mb-1'>
            <span className='pe-1 fs-6'>Start:</span>
            <strong className='text-capitalize'>{format(startDate, 'PP, p')}</strong>
          </p>
          <p className='mb-1'>
            <span className='pe-1 fs-6'>End:</span>
            <strong className='text-capitalize'>{format(endDate, 'PP, p')}</strong>
          </p>
        </div>
      </div>
    );
  };

  const quickInfoContentTemplate = (props) => {
    const elementType = props.elementType;
    const job = props.Job;

    if (elementType === 'cell') return null;

    const getStatusColor = (status) => {
      return STATUS_COLOR[status] || 'secondary';
    };

    return (
      <div className='fs-5 mt-2'>
        <p className='mb-1'>
          <span className='pe-1 fs-6'>Remark:</span>
          <strong className='text-capitalize'>{job?.remarks || 'N/A'}</strong>
        </p>
        <p className='mb-1'>
          <span className='pe-1 fs-6'>Assigned Worker/s:</span>
          <strong className='text-capitalize'>
            {job.workers?.length > 0 ? (
              <>
                {/* //* show the first 3 workers */}
                <span className='me-1'>
                  {job?.workers
                    ?.slice(0, 3)
                    .map((worker) => worker?.name)
                    .join(', ')}
                </span>

                {/* //* show the rest workers */}
                {job?.workers?.length > 3 && (
                  <OverlayTrigger
                    placement='right'
                    overlay={
                      <Tooltip>
                        <TooltipContent
                          title='Assigned workers'
                          info={job?.workers
                            ?.slice(3, job?.workers?.length)
                            .map((worker) => worker?.name || '')}
                        />
                      </Tooltip>
                    }
                  >
                    <Badge pill style={{ fontSize: '10px' }}>
                      + {job?.workers?.slice(3, job?.workers?.length).length}
                    </Badge>
                  </OverlayTrigger>
                )}
              </>
            ) : (
              'N/A'
            )}
          </strong>
        </p>
        <p className='mb-1'>
          <span className='pe-1 fs-6'>Customer:</span>
          <strong>{job?.customer?.name || 'N/A'}</strong>
        </p>
        <p className='mb-1'>
          <span className='pe-1 fs-6'>Location:</span>
          <strong>{job?.location?.name || 'N/A'}</strong>
        </p>
        <p className='mb-1'>
          <span className='pe-1 fs-6'>Scope:</span>
          <strong className='text-capitalize'>{job?.scope || 'N/A'}</strong>
        </p>
        <p className='mb-1'>
          <span className='pe-1 fs-6'>Tasks:</span>
          <strong className='text-capitalize'>{job?.tasks ? job?.tasks.length : 'N/A'}</strong>
        </p>
        <p className='mb-1'>
          <span className='pe-1 fs-6'>Status:</span>
          <Badge bg={getStatusColor(job?.status)}>{_.startCase(job?.status)}</Badge>
        </p>
        <p className='mb-1'>
          <span className='pe-1 fs-6'>Created:</span>
          <strong className='text-capitalize'>
            {format(job?.createdAt.toDate(), 'dd-MM-yyyy')}{' '}
          </strong>
          by <strong>{job?.createdBy?.displayName || 'N/A'}</strong>
        </p>
        <p className='mb-1'>
          <span className='pe-1 fs-6'>Updated:</span>
          <strong className='text-capitalize'>
            {format(job?.updatedAt.toDate(), 'dd-MM-yyyy')}{' '}
          </strong>
          by <strong>{job?.updatedBy?.displayName || 'N/A'}</strong>
        </p>
      </div>
    );
  };

  const quickInfoFooterTemplate = (props) => {
    const elementType = props.elementType;
    const job = props.Job;

    if (elementType === 'cell') return null;

    return (
      <div className='d-flex justify-content-between align-items-center gap-2 p-3 '>
        <Button className='p-2' variant='secondary' size='sm' onClick={handleCloseQuickInfoPopup}>
          <X size={18} />
        </Button>

        <div className='d-flex gap-2'>
          <Button className='p-2' variant='primary' size='sm' onClick={() => handleViewJob(job.id)}>
            <Eye size={18} />
          </Button>

          {(auth.role === 'admin' || auth.role === 'supervisor') && (
            <>
              <Button
                className='p-2'
                variant='danger'
                size='sm'
                onClick={() => handleDeleteJob(job.id)}
              >
                <Trash size={18} />
              </Button>
              <Button
                className='p-2'
                variant='warning'
                size='sm'
                onClick={() => handleEditJob(job.id)}
              >
                <Pencil size={18} />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  const handleEventDoubleClick = (args) => {
    args.cancel = true; //* prevent the default event editor from opening
  };

  const handlePopupOpen = (args) => {
    const type = args.type;

    if (args?.data && _.isEmpty(args?.data.Job) && type !== 'EventContainer') {
      args.cancel = true; //* prevent popup when selecting cell
      args.element.style.border = 'none'; //* remove border
      return;
    }

    args.cancel = false; //* show other popups
    args.element.style.border = 'solid 1px #3f51b5'; //* add border
  };

  const handleSelected = useCallback(
    (args) => {
      if (auth.role === 'sales') return;

      if (
        args &&
        args.requestType === 'cellSelect' &&
        args.data &&
        !args.showQuickPopup &&
        calendarRef &&
        calendarRef.current
      ) {
        const data = args.data;
        const startDate = data.StartTime;
        const endDate = data.EndTime;
        const isMonthView = calendarRef.current.currentView === 'Month';

        //* dates to compare without time, start of day 00:00:00
        const sd = startOfDay(startDate);
        const ed = startOfDay(isMonthView ? subDays(endDate, 1) : endDate);

        //* not allowed to create jobs in the past
        if (isBefore(sd, startOfDay(new Date())) || isBefore(ed, startOfDay(new Date()))) {
          Swal.fire({
            title: 'Job Creation Not Allowed',
            text: `You are not allowed to create a job in the past. Please select a date in the present or the future.`,
            icon: 'error',
            showCancelButton: false,
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK',
            customClass: {
              confirmButton: 'btn btn-primary rounded',
            },
          });
          return;
        }

        if (args.element.classList.contains('e-work-cells')) {
          const lessOneDayEndDate = isMonthView ? subDays(endDate, 1) : endDate;

          const formattedStartDate = format(startDate, 'yyyy-MM-dd');
          const formattedStartTime = format(startDate, 'kk:mm');
          const formattedEndDate = format(lessOneDayEndDate, 'yyyy-MM-dd');
          const formattedEndTime = format(lessOneDayEndDate, 'kk:mm');

          const startDateToDisplay = format(startDate, 'MMMM d, yyyy');
          const startTimeToDisplay = format(startDate, 'p');
          const endDateToDisplay = format(lessOneDayEndDate, 'MMMM d, yyyy');
          const endTimeToDisplay = format(lessOneDayEndDate, 'p');

          Swal.fire({
            title: 'Create a Job?',
            text: `Are you sure you want to create a new job starting on ${startDateToDisplay}${!isMonthView ? ' at ' + startTimeToDisplay : ''} and ending on ${endDateToDisplay}${!isMonthView ? ' at ' + endTimeToDisplay : ''}?`, // prettier-ignore
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, create job',
            customClass: {
              confirmButton: 'btn btn-primary rounded',
              cancelButton: 'btn btn-secondary rounded',
            },
          }).then((result) => {
            if (result.isConfirmed) {
              router.push({
                pathname: '/jobs/create',
                query: {
                  startDate: formattedStartDate,
                  startTime: isMonthView
                    ? undefined
                    : formattedStartTime === '24:00'
                    ? '00:00'
                    : formattedStartTime,
                  endDate: formattedEndDate,
                  endTime: isMonthView
                    ? undefined
                    : formattedEndTime === '24:00'
                    ? '00:00'
                    : formattedEndTime,
                },
              });
            }
          });
        }
      }
    },
    [router, calendarRef, auth.role]
  );

  const eventSettings = useMemo(() => {
    const jobsEvents = jobs.data.map((job) => {
      if (!job?.workers || job?.workers?.length < 1) return [];

      return job.workers.map((worker) => ({
        Id: job.id,
        Subject: job.id,
        Description: job.description,
        Location: job.location.name,
        StartTime: new Date(`${job.startDate}T${job.startTime}:00`),
        EndTime: new Date(`${job.endDate}T${job.endTime}:00`),
        WorkerId: worker.id,
        Job: job,
      }));
    });

    const jobsEventsFlat = jobsEvents.flat();

    //* remove duplicate events
    const uniqueEventIds = new Set();

    const uniqueEvents = jobsEventsFlat.filter((event) => {
      const duplicate = uniqueEventIds.has(event.Id);
      uniqueEventIds.add(event.Id);
      return !duplicate;
    });

    return { dataSource: uniqueEvents };
  }, [jobs]);

  //* query jobs
  useEffect(() => {
    const q = query(collection(db, 'jobHeaders'));

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
        } else {
          setJobs({ data: [], isLoading: false, isError: false });
        }
      },
      (err) => {
        console.error(err.message);
        setJobs({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  if (isLoading || jobs.isLoading) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '84vh' }}>
        <Spinner animation='border' variant='primary' />
        <span className='ms-3'>Loading Calendar...</span>
      </div>
    );
  }

  return (
    <div className='d-flex flex-column h-100 gap-3'>
      <div className='d-flex gap-4 flex-wrap align-align-items-center'>
        {Object.entries(STATUS_COLOR).map(([key, value], i) => (
          <div className='d-flex align-items-center gap-2 fs-5 fw-medium'>
            <div
              key={`${i}-${key}`}
              className={`bg-${value}`}
              style={{ width: '20px', height: '20px', borderRadius: '50%' }}
            ></div>

            <span>{_.startCase(key)}</span>
          </div>
        ))}
      </div>

      <ScheduleComponent
        ref={calendarRef}
        className='overflow-auto'
        width='100%'
        height='84vh'
        currentView='Month'
        startHour='00:00'
        endHour='24:00'
        selectedDate={new Date()}
        eventRendered={eventRendered}
        eventSettings={eventSettings}
        popupOpen={handlePopupOpen}
        eventDoubleClick={handleEventDoubleClick}
        select={handleSelected}
        quickInfoTemplates={{
          header: quickInfoHeaderTemplate,
          content: quickInfoContentTemplate,
          footer: quickInfoFooterTemplate,
        }}
        allowDragAndDrop={false}
        allowResizing={false}
        allowMultiDrag={false}
      >
        <ViewsDirective>
          <ViewDirective option='Month' eventTemplate={monthWeekDayEventTemplate} />
          <ViewDirective option='Week' eventTemplate={monthWeekDayEventTemplate} />
          <ViewDirective option='Day' eventTemplate={monthWeekDayEventTemplate} />
          <ViewDirective option='Agenda' />
        </ViewsDirective>

        <Inject services={[Month, Week, Day, Agenda]} />
      </ScheduleComponent>
    </div>
  );
};

export default JobCalendar;
