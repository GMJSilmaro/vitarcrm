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
  ResourceDirective,
  ResourcesDirective,
  ScheduleComponent,
  TimelineMonth,
  TimelineViews,
  ViewDirective,
  ViewsDirective,
} from '@syncfusion/ej2-react-schedule';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import _, { orderBy } from 'lodash';
import { collection, deleteDoc, doc, limit, onSnapshot, query, where } from 'firebase/firestore';
import { isProd } from '@/constants/environment';
import { db } from '@/firebase';
import { format, subDays } from 'date-fns';
import { Badge, Button, Image, Spinner } from 'react-bootstrap';
import { Eye, Pencil, Trash, X } from 'react-bootstrap-icons';
import Swal from 'sweetalert2';
import { BsCircleFill } from 'react-icons/bs';
import { toast } from 'react-toastify';

const JobWorkerTimelineCalendar = () => {
  const router = useRouter();
  const calendarRef = useRef(null);

  const [jobs, setJobs] = useState({ data: [], isLoading: true, isError: false });
  const [workers, setWorkers] = useState({ data: [], isLoading: true, isError: false });
  const [isLoading, setIsLoading] = useState(false);

  const [resourceWorkers, setResourceWorkers] = useState({
    data: [],
    isLoading: true,
    isError: false,
  });

  //* query jobs
  useEffect(() => {
    const constraints = [];

    if (!isProd) {
      const devQueryConstraint = [limit(10)];
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

  //* query workers
  useEffect(() => {
    const constraints = [orderBy('workerId', 'asc'), where('role', '==', 'Worker')];

    if (!isProd) {
      const devQueryConstraint = [limit(10)];
      devQueryConstraint.forEach((constraint) => constraints.push(constraint));
    }

    const q = query(collection(db, 'users'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          setWorkers({
            data: snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })),
            isLoading: false,
            isError: false,
          });

          setResourceWorkers({
            data: snapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                workerId: data.workerId,
                text: data.fullName.trim(),
                worker: {
                  ...data,
                  jobs: jobs.data.filter((job) => job.worker.id === data.workerId),
                },
              };
            }),
            isLoading: false,
            isError: false,
          });
        } else {
          setWorkers({ data: [], isLoading: false, isError: false });
          setResourceWorkers({ data: [], isLoading: false, isError: false });
        }
      },
      (err) => {
        console.error(err.message);
        setWorkers({ data: [], isLoading: false, isError: true });
        setResourceWorkers({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, [jobs]);

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
      confirmButtonColor: '#1e40a6',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel',
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

  const timelineEventTemnplate = (props) => {
    return (
      <div className='fs-6 w-100 d-flex flex-column'>
        <span className='d-inline-block text-text-truncate' style={{ width: '85%' }}>
          {props.Subject} - {props.Location}
        </span>
        <div className='d-flex mt-n1'>
          <span className='d-none d-md-inline-block'>{format(props.StartTime, 'p')}</span>
          <span className='px-2'>-</span>
          <spann className='d-none d-md-inline-block'>{format(props.EndTime, 'p')}</spann>
        </div>
      </div>
    );
  };

  const eventRendered = (args) => {
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
      const statusMap = {
        pending: 'warning',
        'in progress': 'primary',
        completed: 'success',
      };

      return statusMap[status] || 'secondary';
    };

    return (
      <div className='fs-5 mt-2'>
        <p className='mb-1'>
          <span className='pe-1 fs-6'>Job Description:</span>
          <strong className='text-capitalize'>{job?.worker?.name}</strong>
        </p>
        <p className='mb-1'>
          <span className='pe-1 fs-6'>Assigned Worker:</span>
          <strong className='text-capitalize'>{job?.worker?.name}</strong>
        </p>
        <p className='mb-1'>
          <span className='pe-1 fs-6'>Customer:</span>
          <strong>{job?.customer?.name}</strong>
        </p>
        <p className='mb-1'>
          <span className='pe-1 fs-6'>Location:</span>
          <strong>{job?.location?.name}</strong>
        </p>
        <p className='mb-1'>
          <span className='pe-1 fs-6'>Scope:</span>
          <strong className='text-capitalize'>{job?.scope}</strong>
        </p>
        <p className='mb-1'>
          <span className='pe-1 fs-6'>Tasks:</span>
          <strong className='text-capitalize'>{job?.tasks ? job?.tasks.length : 'N/A'}</strong>
        </p>
        <p className='mb-1'>
          <span className='pe-1 fs-6'>Team:</span>
          <strong className='text-capitalize'>{job?.team}</strong>
        </p>
        <p className='mb-1'>
          <span className='pe-1 fs-6'>Status:</span>
          <Badge bg={getStatusColor(job?.status)} className='text-capitalize'>
            {job?.status}
          </Badge>
        </p>
      </div>
    );
  };

  const quickInfoFooterTemplate = (props) => {
    const elementType = props.elementType;
    const job = props.Job;

    console.log('quick-info-footer', { props });

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
          <Button
            className='p-2'
            variant='danger'
            size='sm'
            onClick={() => handleDeleteJob(job.id)}
          >
            <Trash size={18} />
          </Button>
          <Button className='p-2' variant='warning' size='sm' onClick={() => handleEditJob(job.id)}>
            <Pencil size={18} />
          </Button>
        </div>
      </div>
    );
  };

  const resourceHeaderTemplate = (props) => {
    const worker = props.resourceData.worker;
    const resourceData = props.resourceData;
    const hasJob = worker?.jobs?.length > 0;

    return (
      <div className='d-flex flex-column p-2 row-gap-2'>
        <div className='d-flex align-items-center gap-1'>
          <div className='position-relative'>
            <Image
              src={worker?.profilePicture || '/images/avatar/default-avatar.png'}
              alt={resourceData?.text}
              width={28}
              height={28}
              className='rounded-circle'
            />

            <BsCircleFill
              className='position-absolute bottom-0 end-0 flex-shrink-0'
              size={8}
              color={worker?.isOnline ? '#00d17a' : '#757575'}
            />
          </div>

          <span
            className='fs-6 fw-semibold text-truncate'
            title={resourceData?.text ?? 'technician'}
          >
            {resourceData?.text}
          </span>
        </div>
        <div className='d-flex gap-2 align-content-center'>
          <Badge style={{ fontSize: '10px' }} bg='primary'>
            {worker?.role === 'Worker' ? 'Technician' : worker?.role || 'N/A'}
          </Badge>

          <Badge style={{ fontSize: '12px' }} bg='warning'>
            {worker?.jobs?.length || 0} Task
            {hasJob ? 's' : ''}
          </Badge>
        </div>
      </div>
    );
  };

  const handleEventDoubleClick = (args) => {
    args.cancel = true; //* prevent the default event editor from opening
  };

  const handlePopupOpen = (args) => {
    if (args?.data && _.isEmpty(args?.data.Job)) {
      args.cancel = true; //* prevent popup when selecting cell
      args.element.style.border = 'none'; //* remove border
      return;
    }

    args.cancel = false; //* show other popups
    args.element.style.border = 'solid 1px #3f51b5'; //* add border
  };

  const handleCreateJob = useCallback(
    ({ args, startDate, endDate, groupIndex, worker, calendarRef }) => {
      if (calendarRef) {
        const isSlotAvailable = calendarRef?.current?.isSlotAvailable(startDate, endDate, groupIndex) // prettier-ignore

        if (!isSlotAvailable) {
          Swal.fire({
            title: 'Slot Unavailable',
            text: `This slot is unavailable ${
              worker ? 'for ' + worker.text : ''
            }. Please choose another slot.`,
            icon: 'error',
            showCancelButton: true,
            showCancelButton: false,
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK',
          });
          return;
        }
      }

      if (args.element.classList.contains('e-work-cells') && calendarRef && calendarRef.current) {
        const isTimelineMonthView = calendarRef.current.currentView === 'TimelineMonth';

        const lessOneDayEndDate = isTimelineMonthView ? subDays(endDate, 1) : endDate;

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
          text: `Are you sure you want to create a new job starting on ${startDateToDisplay}${!isTimelineMonthView ? ' at ' + startTimeToDisplay : ''} and ending on ${endDateToDisplay}${!isTimelineMonthView ? ' at ' + endTimeToDisplay : ''}${
            worker ? ' for ' + worker.text : ''
          }?`, // prettier-ignore
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, create job',
        }).then((result) => {
          if (result.isConfirmed) {
            router.push({
              pathname: '/jobs/create',
              query: {
                startDate: formattedStartDate,
                startTime: isTimelineMonthView ? undefined : formattedStartTime,
                endDate: formattedEndDate,
                endTime: isTimelineMonthView ? undefined : formattedEndTime,
                workerId: worker.workerId,
              },
            });
          }
        });
      }
    },
    [router, resourceWorkers, calendarRef]
  );

  const handleSelected = useCallback(
    (args) => {
      if (args && args.requestType === 'cellSelect' && !args.showQuickPopup) {
        const data = args.data;
        const startDate = data.StartTime;
        const endDate = data.EndTime;
        const groupIndex = resourceWorkers.data.map((worker) => worker.id).indexOf(data.WorkerId);
        const worker = resourceWorkers.data[groupIndex];

        handleCreateJob({ args, startDate, endDate, groupIndex, worker, calendarRef });
      }
    },
    [router, resourceWorkers, calendarRef]
  );

  const eventSettings = useMemo(() => {
    const jobsEvents = jobs.data.map((job) => ({
      Id: job.id,
      Subject: job.id,
      Description: job.description,
      Location: job.location.name,
      StartTime: new Date(`${job.startDate}T${job.startTime}:00`),
      EndTime: new Date(`${job.endDate}T${job.endTime}:00`),
      WorkerId: job.worker.id,
      Job: job,
    }));

    return { dataSource: jobsEvents, template: timelineEventTemnplate };
  }, [jobs]);

  if (isLoading || jobs.isLoading || workers.isLoading || resourceWorkers.isLoading) {
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
      timezone='Asia/Taipei'
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
      resourceHeaderTemplate={resourceHeaderTemplate}
      allowDragAndDrop={false}
      allowResizing={false}
      allowMultiDrag={false}
      group={{
        byGroupID: false,
        resources: ['Workers'],
        headerHeight: 'auto', // Allows header to adjust height
        allowGroupDragAndDrop: false,
      }}
    >
      <ResourcesDirective>
        <ResourceDirective
          field='WorkerId'
          title='Technicians'
          name='Workers'
          textField='text'
          idField='id'
          allowMultiple={false}
          dataSource={resourceWorkers.data}
        />
      </ResourcesDirective>
      <ViewsDirective>
        <ViewDirective option='TimelineDay' allowVirtualScrolling={true} />
        <ViewDirective option='TimelineWeek' allowVirtualScrolling={true} />
        <ViewDirective option='TimelineWorkWeek' allowVirtualScrolling={true} />
        <ViewDirective option='TimelineMonth' allowVirtualScrolling={true} />
      </ViewsDirective>
      <Inject services={[TimelineViews, TimelineMonth]} />
    </ScheduleComponent>
  );
};

export default JobWorkerTimelineCalendar;
