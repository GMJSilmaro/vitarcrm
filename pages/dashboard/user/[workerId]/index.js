import { useRouter } from 'next/router';
import {
  Row,
  Col,
  Container,
  Button,
  Card,
  Badge,
  OverlayTrigger,
  Dropdown,
  Spinner,
} from 'react-bootstrap';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import DefaultLayout from '../../../../layouts/marketing/DefaultLayout';
import { RouteGuard } from '../../../../components/RouteGuard';
import {
  WorkerStatsData,
  CalibrationPerformanceData,
  RecentCalibrationsData,
} from 'data/marketing/calibration/WorkerProfileData';
import UserLayout from '@/layouts/UserLayout';
import {
  ArrowRepeat,
  ArrowReturnLeft,
  Bell,
  Briefcase,
  Building,
  Calendar,
  CalendarX,
  CardHeading,
  CardList,
  CheckCircle,
  ClipboardCheck,
  Clock,
  ClockHistory,
  ExclamationCircle,
  ExclamationTriangle,
  Eye,
  FileText,
  Flag,
  Gear,
  Hourglass,
  House,
  Pause,
  PauseFill,
  PencilSquare,
  PersonFill,
  PersonLinesFill,
  Play,
  PlayCircle,
  PlayFill,
  ShieldCheck,
  Stop,
  StopFill,
  Thermometer,
  ThreeDotsVertical,
  Trash,
  XCircle,
} from 'react-bootstrap-icons';
import {
  format,
  formatDistanceStrict,
  getUnixTime,
  hoursToSeconds,
  isAfter,
  isBefore,
  isEqual,
  minutesToSeconds,
  sub,
} from 'date-fns';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import DataTable from '@/components/common/DataTable';
import DataTableSearch from '@/components/common/DataTableSearch';
import DataTableFilter from '@/components/common/DataTableFilter';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { dateFilter, dateSort } from '@/utils/datatable';
import { v4 as uuidV4 } from 'uuid';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import _, { over } from 'lodash';
import { GeeksSEO } from '@/widgets';
import { useStopwatch } from 'react-timer-hook';
import { JobTimer } from '@/sub-components/dashboard/user/jobs/JobTimer';

function WorkerDashboard() {
  const router = useRouter();
  const auth = useAuth();
  const { workerId } = router.query;

  const [activeFilterId, setActiveFilterId] = useState('');
  const [columnFilters, setColumnFilters] = useState([]);
  const [jobs, setJobs] = useState({ data: [], isLoading: true, isError: false });

  const stopWatch = useStopwatch({ autoStart: false });

  const columnHelper = createColumnHelper();

  const stats = useMemo(() => {
    const total = jobs.data.length;
    const upcomingJobs = jobs.data.filter((job) => {
      const startDate = job.startDate;
      const startTime = job.startTime;
      const endDate = job.endDate;
      const endTime = job.endTime;
      const start = new Date(`${startDate}T${startTime}:00`);
      const end = new Date(`${endDate}T${endTime}:00`);
      const pending = job.status !== 'completed' && job.status !== 'validated';

      return (isEqual(start, new Date()) || isAfter(start, new Date()) || isEqual(end, new Date()) || isAfter(end, new Date())) && pending; //prettier-ignore
    }).length;
    const onSiteJobs = jobs.data.filter((job) => job.scope === 'site').length;
    const onLabJobs = jobs.data.filter((job) => job.scope === 'lab').length;
    const urgentJobs = jobs.data.filter((job) => job.priority === 'urgent').length;
    const overdueJobs = jobs.data.filter((job) => {
      const endDate = job.endDate;
      const endTime = job.endTime;
      const end = new Date(`${endDate}T${endTime}:00`);
      const pending = job.status === 'create' || job.status === 'confirmed' || job.status === 'cancelled'; //prettier-ignore

      return isBefore(end, new Date()) && pending;
    }).length;
    const confirmedJobs = jobs.data.filter((job) => job.status === 'confirmed').length;
    const completedJobs = jobs.data.filter((job) => job.status === 'completed').length;
    const cancelledJobs = jobs.data.filter((job) => job.status === 'cancelled').length;
    const validatedJobs = jobs.data.filter((job) => job.status === 'validated').length;
    const currentJob = jobs.data.find((job) => job.status === 'in progress');

    return [
      {
        id: 'all',
        value: total,
        title: 'Total Jobs',
        icon: Briefcase,
        color: 'secondary',
        width: 3,
        filter: 'all',
        filterValue: '',
      },
      {
        id: 'upcoming-jobs',
        value: upcomingJobs,
        title: 'Upcoming Jobs',
        icon: Clock,
        color: 'secondary',
        width: 3,
        filter: 'startDate',
        filterValue: null,
      },
      {
        id: 'on-site',
        value: onSiteJobs,
        title: 'On Site',
        icon: Building,
        color: 'secondary',
        width: 3,
        filter: 'scope',
        filterValue: 'site',
      },
      {
        id: 'on-lab',
        value: onLabJobs,
        title: 'On Laboratory',
        icon: Thermometer,
        color: 'secondary',
        width: 3,
        filter: 'scope',
        filterValue: 'lab',
      },
      {
        id: 'urgent-jobs',
        value: urgentJobs,
        title: 'Urgent Jobs',
        icon: ExclamationCircle,
        color: 'danger',
        width: 3,
        filter: 'priority',
        filterValue: 'urgent',
      },
      {
        id: 'overdue-jobs',
        value: overdueJobs,
        title: 'Overdue Jobs',
        icon: CalendarX,
        color: 'danger',
        width: 3,
        filter: 'endDate',
        filterValue: null,
      },
      {
        id: 'confirmed-jobs',
        value: confirmedJobs,
        title: 'Confirmed',
        icon: ClipboardCheck,
        color: 'info',
        width: 3,
        filter: 'status',
        filterValue: 'confirmed',
      },
      {
        id: 'completed-jobs',
        value: completedJobs,
        title: 'Completed Jobs',
        icon: CheckCircle,
        color: 'success',
        width: 3,
        filter: 'status',
        filterValue: 'completed',
      },
      {
        id: 'cancelled-jobs',
        value: cancelledJobs,
        title: 'Cancelled Jobs',
        icon: XCircle,
        color: 'danger',
        width: 3,
        filter: 'status',
        filterValue: 'cancelled',
      },
      {
        id: 'validated-jobs',
        value: validatedJobs,
        title: 'Validated',
        icon: ShieldCheck,
        color: 'purple',
        width: 3,
        filter: 'status',
        filterValue: 'validated',
      },
      {
        id: 'current-job',
        value: currentJob
          ? `${currentJob?.jobId || ''} ${currentJob?.customer?.name || ''}`
          : 'N/A',
        title: 'Current Job',
        icon: ClockHistory,
        color: 'primary',
        subtitle: currentJob ? 'In Progress' : '',
        width: 6,
        filter: 'status',
        filterValue: 'in progress',
        job: currentJob,
        workerId,
      },
    ];
  }, [JSON.stringify(jobs), workerId]);

  const getStartEnd = (startDate, endDate, startTime, endTime) => {
    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(`${endDate}T${endTime}:00`);
    return { duration: formatDistanceStrict(start, end), start, end };
  };

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('index', {
        id: 'index',
        header: ({ column }) => <DataTableColumnHeader column={column} title='#' />,
        enableSorting: false,
        size: 50,
        cell: (info) => {
          const rowIndex = info.row.index;
          const pageIndex = table.getState().pagination.pageIndex;
          const pageSize = table.getState().pagination.pageSize;
          const displayIndex = rowIndex + pageIndex * pageSize + 1;
          return <div>{displayIndex}</div>;
        },
      }),
      columnHelper.accessor('id', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='ID' />,
        size: 100,
      }),
      columnHelper.accessor((row) => format(row.createdAt.toDate(), 'dd-MM-yyyy'), {
        id: 'date',
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Date' />,
        cell: ({ row }) => {
          const createdAt = row.original.createdAt.toDate();
          return <div>{format(createdAt, 'dd-MM-yyyy')}</div>;
        },
        filterFn: (row, columnId, filterValue, addMeta) => {
          const createdAt = row.original.createdAt.toDate();
          const filterDateValue = new Date(filterValue);
          return dateFilter(createdAt, filterDateValue);
        },
        sortingFn: (rowA, rowB, columnId) => {
          const rowACreatedAt = rowA.original.createdAt.toDate();
          const rowBCreatedAt = rowB.original.createdAt.toDate();
          return dateSort(rowACreatedAt, rowBCreatedAt);
        },
      }),
      columnHelper.accessor('scope', {
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Scope' />,
        cell: ({ row }) => {
          const colors = {
            lab: 'info',
            site: 'warning',
          };

          return (
            <Badge className='text-capitalize' bg={colors[row.original.scope] || 'secondary'}>
              {row.original.scope}
            </Badge>
          );
        },
      }),
      columnHelper.accessor('priority', {
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Priority' />,
        cell: ({ row }) => {
          const colors = {
            normal: 'secondary',
            urgent: 'warning',
          };

          return (
            <Badge className='text-capitalize' bg={colors[row.original.priority] || 'secondary'}>
              {row.original.priority}
            </Badge>
          );
        },
      }),
      columnHelper.accessor((row) => `${row.customer.name} - ${row.location.name}`, {
        id: 'customer',
        filterFn: 'includesString',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Customer' />,
        cell: ({ row }) => (
          <div className='d-flex flex-column justify-content-center row-gap-1'>
            <div>
              <PersonFill size={14} className='text-primary me-2' /> {row.original.customer.name}
            </div>
            <div>
              <Building size={14} className='text-primary me-2' /> {row.original.location.name}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('status', {
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
        cell: ({ row }) => {
          const colors = {
            confirmed: 'info',
            completed: 'success',
            created: 'warning',
            'in progress': 'primary',
            cancelled: 'danger',
            validated: 'purple',
          };
          return (
            <Badge className='text-capitalize' bg={colors[row.original.status] || 'secondary'}>
              {row.original.status}
            </Badge>
          );
        },
      }),
      columnHelper.accessor(
        (row) => {
          return row?.workers?.length > 0
            ? row.workers.map((worker) => worker.name).join(', ')
            : 'N/A';
        },
        {
          id: 'workers',
          header: ({ column }) => <DataTableColumnHeader column={column} title='Technician/s' />,
          cell: ({ row }) => {
            const { workers } = row.original;

            if (!workers || workers.length < 1) return 'N/A';

            return (
              <div>
                <PersonLinesFill size={14} className='text-primary me-2' />

                {/* //* show the first 3 workers */}
                <span className='me-1'>
                  {workers
                    ?.slice(0, 3)
                    .map((worker) => worker?.name)
                    .join(', ')}
                </span>

                {/* //* show the rest workers */}
                {workers?.length > 3 && (
                  <OverlayTrigger
                    placement='right'
                    overlay={
                      <Tooltip>
                        <TooltipContent
                          title='Assigned workers'
                          info={workers
                            ?.slice(3, workers?.length)
                            .map((worker) => worker?.name || '')}
                        />
                      </Tooltip>
                    }
                  >
                    <Badge pill style={{ fontSize: '10px' }}>
                      + {workers?.slice(3, workers?.length).length}
                    </Badge>
                  </OverlayTrigger>
                )}
              </div>
            );
          },
        }
      ),
      columnHelper.accessor(
        (row) => {
          //TODO: filtering & sorting logic
          const { startDate, endDate, startTime, endTime } = row;
          return getStartEnd(startDate, endDate, startTime, endTime);
        },
        {
          id: 'Schedule',
          size: 180,
          header: ({ column }) => <DataTableColumnHeader column={column} title='Schedule' />,
          cell: ({ row }) => {
            const { startDate, endDate, startTime, endTime } = row.original;
            const startEnd = getStartEnd(startDate, endDate, startTime, endTime);
            return (
              <div className='d-flex flex-column gap-2 justify-content-center'>
                <div className='d-flex flex-column justify-content-center'>
                  <div className='fw-bold'>Start</div>
                  <div>{format(startEnd.start, 'dd-MM-yyyy HH:mm')}</div>
                </div>
                <div className='d-flex flex-column justify-content-center'>
                  <div className='fw-bold'>End</div>
                  <div>{format(startEnd.end, 'dd-MM-yyyy HH:mm')}</div>
                </div>
                <div className='d-flex flex-column justify-content-center'>
                  <div className='fw-bold'>Duration:</div> <div>{startEnd.duration}</div>
                </div>
              </div>
            );
          },
        }
      ),
      columnHelper.accessor(
        (row) => {
          //TODO: filtering & sorting logic
          const { startDate, endDate, startTime, endTime } = row;
          return getStartEnd(startDate, endDate, startTime, endTime);
        },
        {
          id: 'Start / End',
          size: 180,
          header: ({ column }) => <DataTableColumnHeader column={column} title='Stard / End' />,
          cell: ({ row }) => {
            const startBy = row.original?.details?.startBy?.displayName;
            const startByAt = row.original?.details?.startByAt?.toDate();

            const endBy = row.original?.details?.endBy?.displayName;
            const endByAt = row.original?.details?.endByAt?.toDate();

            return (
              <div className='d-flex flex-column gap-2 justify-content-center'>
                <div className='d-flex flex-column justify-content-center'>
                  <div className='fw-bold'>Start:</div>
                  <div>{startBy || 'N/A'}</div>
                  <div>{startByAt ? format(startByAt, 'dd-MM-yyyy HH:mm') : 'N/A'}</div>
                </div>
                <div className='d-flex flex-column justify-content-center'>
                  <div className='fw-bold'>Completed:</div>
                  <div>{endBy || 'N/A'}</div>
                  <div>{endByAt ? format(endByAt, 'dd-MM-yyyy HH:mm') : 'N/A'}</div>
                </div>
              </div>
            );
          },
        }
      ),

      columnHelper.accessor((row) => row?.details?.isReturnedEquipment, {
        id: 'equipment status',
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Equipment Status' />,
        cell: ({ row }) => {
          const status = row.original?.details?.isReturnedEquipment;

          return (
            <Badge className='text-capitalize' bg={status ? 'success' : 'danger'}>
              {status ? 'Returned' : 'Unreturned'}
            </Badge>
          );
        },
      }),
      columnHelper.accessor((row) => row.createdBy?.displayName || 'N/A', {
        id: 'created by',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Created By' />,
        cell: ({ row }) => {
          const displayName = row.original.createdBy?.displayName || 'N/A';
          return (
            <div>
              <PersonFill size={14} className='text-primary me-2' />
              <span>{displayName}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor('startDate', {
        filterFn: (row, columnId, filterValue, addMeta) => {
          const startDate = row.original.startDate;
          const startTime = row.original.startTime;
          const endDate = row.original.endDate;
          const endTime = row.original.endTime;
          const start = new Date(`${startDate}T${startTime}:00`);
          const end = new Date(`${endDate}T${endTime}:00`);

          const pending = row.original.status !== 'completed' && row.original.status !== 'validated'; //prettier-ignore

          return (
            (isEqual(start, filterValue) ||
              isAfter(start, filterValue) ||
              isEqual(end, filterValue) ||
              isAfter(end, filterValue)) &&
            pending
          );
        },
      }),
      columnHelper.accessor('endDate', {
        filterFn: (row, columnId, filterValue, addMeta) => {
          const endDate = row.original.endDate;
          const endTime = row.original.endTime;
          const end = new Date(`${endDate}T${endTime}:00`);
          const pending = row.original.status === 'create' || row.original.status === 'confirmed' || row.original.status === 'cancelled'; //prettier-ignore

          return isBefore(end, filterValue) && pending;
        },
      }),
      columnHelper.accessor('actions', {
        id: 'actions',
        size: 50,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Actions' />,
        enableSorting: false,
        cell: ({ row }) => {
          const [isLoading, setIsLoading] = useState(false);

          const { id, details, status } = row.original;

          const handleViewJob = (id) => {
            router.push(`/user/${workerId}/jobs/view/${id}`);
          };

          const handleEditJob = (id) => {
            router.push(`/user/${workerId}/jobs/${id}`);
          };

          const handleDeleteJob = (id) => {
            Swal.fire({
              title: 'Are you sure?',
              text: 'This action cannot be undone.',
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

                  const jobHeaderRef = doc(db, 'jobHeaders', id);
                  const jobDetailsRef = doc(db, 'jobDetails', id);

                  await Promise.all([
                    await deleteDoc(jobHeaderRef),
                    await deleteDoc(jobDetailsRef),
                  ]);

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

          const handleUpdateJobStatus = (id, jobStatus) => {
            Swal.fire({
              title: `Job Status Update - Job #${id}`,
              text: `Are you sure you want to update the job status to "${_.startCase(
                jobStatus
              )}"?`,
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

                  const jobHeaderRef = doc(db, 'jobHeaders', id);

                  //* if job status is in progress, check if there is any job in progress
                  //* if there is in progress job, throw error you cannot update job to in progress if there is any job in progress
                  if (jobStatus === 'in progress') {
                    const jobCollectionInProgressRef = query(
                      collection(db, 'jobHeaders'),
                      where('status', '==', 'in progress'),
                      where('workers', 'array-contains', {
                        id: workerId,
                        name: auth.currentUser.displayName,
                      }),
                      where('startDate', '>=', format(new Date(), 'yyyy-MM-dd'))
                    );

                    const jobInProgressSnapshot = await getDocs(jobCollectionInProgressRef);
                    const inProgressJobCount = jobInProgressSnapshot.empty
                      ? 0
                      : jobInProgressSnapshot.docs.length;

                    if (inProgressJobCount > 0) {
                      toast.error('You cannot start a job while there is a job in progress', {
                        position: 'top-right',
                      });
                      setIsLoading(false);
                      return;
                    }
                  }

                  await updateDoc(jobHeaderRef, {
                    status: jobStatus,
                    updatedAt: serverTimestamp(),
                    updatedBy: auth.currentUser,
                  });

                  toast.success('Job status updated successfully', { position: 'top-right' });
                  setIsLoading(false);
                } catch (error) {
                  console.error('Error updating job status:', error);
                  toast.error('Error updating job status: ' + error.message, { position: 'top-right' }); //prettier-ignore
                  setIsLoading(false);
                }
              }
            });
          };

          const handleReturnEquipment = (id, details) => {
            if (!details || !details.equipments) {
              toast.error('Job details not found');
              return;
            }

            Swal.fire({
              title: 'Are you sure?',
              text: 'Are you sure you want to return all the equipment related to this job?',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#1e40a6',
              cancelButtonColor: '#6c757d',
              confirmButtonText: 'Confirm',
              cancelButtonText: 'Cancel',
            }).then(async (data) => {
              if (data.isConfirmed) {
                try {
                  setIsLoading(true);

                  await runTransaction(db, async (transaction) => {
                    try {
                      //* update equipment qty
                      details.equipments.map((eq) => {
                        transaction.update(doc(db, 'equipments', eq.id), { qty: increment(1) });
                      });

                      //* update job header
                      const jobDetails = doc(db, 'jobDetails', id);
                      transaction.update(jobDetails, {
                        isReturnedEquipment: true,
                        updatedAt: serverTimestamp(),
                        updatedBy: auth.currentUser,
                      });

                      //* update job header
                      const jobHeader = doc(db, 'jobHeaders', id);
                      transaction.update(jobHeader, {
                        updatedAt: serverTimestamp(),
                        updatedBy: auth.currentUser,
                      });
                    } catch (error) {
                      throw error;
                    }
                  });

                  toast.success('Equipment returned successfully', { position: 'top-right' });
                  setIsLoading(false);
                } catch (error) {
                  console.error('Error returning equipment:', error);
                  toast.error('Error returning equipment: ' + error.message, {
                    position: 'top-right',
                  });
                  setIsLoading(false);
                }
              }
            });
          };

          if (!workerId) return null;

          return (
            <OverlayTrigger
              rootClose
              trigger='click'
              placement='left'
              offset={[0, 20]}
              overlay={
                <Dropdown.Menu show style={{ zIndex: 999 }}>
                  <Dropdown.Item onClick={() => handleViewJob(id)}>
                    <Eye className='me-2' size={16} />
                    View Job
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleEditJob(id)}>
                    <PencilSquare className='me-2' size={16} />
                    Edit Job
                  </Dropdown.Item>

                  {/* <Dropdown.Item onClick={() => handleDeleteJob(id)}>
                    <Trash className='me-2' size={16} />
                    Delete Job
                  </Dropdown.Item> */}

                  <Dropdown.Item onClick={() => handleReturnEquipment(id, details)}>
                    <ArrowReturnLeft className='me-2' size={16} />
                    Return Equipment
                  </Dropdown.Item>

                  {/* <OverlayTrigger
                    rootClose
                    trigger='click'
                    placement='right-end'
                    overlay={
                      <Dropdown.Menu show style={{ zIndex: 999 }}>
                        <Dropdown.Item onClick={() => handleUpdateJobStatus(id, 'in progress')}>
                          <Hourglass className='me-2' size={16} />
                          In Progress
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleUpdateJobStatus(id, 'confirmed')}>
                          <Flag className='me-2' size={16} />
                          Confirmed
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleUpdateJobStatus(id, 'completed')}>
                          <CheckCircle className='me-2' size={16} />
                          Completed
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleUpdateJobStatus(id, 'cancelled')}>
                          <XCircle className='me-2' size={16} />
                          Cancelled
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleUpdateJobStatus(id, 'validated')}>
                          <ShieldCheck className='me-2' size={16} />
                          Validated
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    }
                  >
                    <Dropdown.Item>
                      <ArrowRepeat className='me-2' size={16} />
                      Update Status
                    </Dropdown.Item>
                  </OverlayTrigger> */}

                  {status !== 'in progress' && status !== 'completed' && status === 'confirmed' && (
                    <Dropdown.Item onClick={() => startJob(id, setIsLoading)}>
                      <Play className='me-2' size={18} /> Start Job
                    </Dropdown.Item>
                  )}

                  {status === 'in progress' && (
                    <>
                      <Dropdown.Item onClick={() => stopJob(id, setIsLoading)}>
                        <Stop className='me-2' size={18} /> Complete Job
                      </Dropdown.Item>
                      {/* 
                      <Dropdown.Item onClick={() => handleUpdateJobStatus(id, 'cancelled')}>
                        <XCircle className='me-2' size={18} /> Cancel Job
                      </Dropdown.Item> */}
                    </>
                  )}

                  <Dropdown.Item
                    onClick={() => router.push(`/user/${workerId}/jobs/${id}/calibrations`)}
                  >
                    <Eye className='me-2' size={16} />
                    View Calibrations
                  </Dropdown.Item>

                  {status === 'in progress' && (
                    <Dropdown.Item
                      onClick={() =>
                        router.push(`/user/${workerId}/jobs/${id}/calibrations/create`)
                      }
                    >
                      <CardList className='me-2' size={16} />
                      Create Calibrate
                    </Dropdown.Item>
                  )}
                </Dropdown.Menu>
              }
            >
              <Button variant='light' className='p-2' size='sm'>
                {isLoading ? (
                  <Spinner animation='border' size='sm' />
                ) : (
                  <ThreeDotsVertical size={16} />
                )}
              </Button>
            </OverlayTrigger>
          );
        },
      }),
    ];
  }, [workerId]);

  const filterFields = useMemo(() => {
    return [
      {
        label: 'ID',
        columnId: 'id',
        type: 'text',
        placeholder: 'Search by job id...',
      },
      {
        label: 'Technician',
        columnId: 'workers',
        type: 'text',
        placeholder: 'Search by technician...',
      },
      {
        label: 'Created By',
        columnId: 'created by',
        type: 'text',
        placeholder: 'Search by created by...',
      },
      {
        label: 'Date',
        columnId: 'date',
        type: 'date',
      },
    ];
  }, []);

  const table = useReactTable({
    data: jobs.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      columnVisibility: { startDate: false, endDate: false },
      columnPinning: { right: ['actions'] },
    },
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
  });

  const setFilterBasedOnStat = (stat) => {
    switch (stat.filter) {
      case 'all':
        table.resetColumnFilters();
        setActiveFilterId('all');
        break;

      case 'status':
        setColumnFilters([{ id: 'status', value: stat.filterValue }]);
        setActiveFilterId(stat.id);
        break;

      case 'scope':
        setColumnFilters([{ id: 'scope', value: stat.filterValue }]);
        setActiveFilterId(stat.id);
        break;

      case 'priority':
        setColumnFilters([{ id: 'priority', value: stat.filterValue }]);
        setActiveFilterId(stat.id);
        break;

      case 'startDate':
        setColumnFilters([{ id: 'startDate', value: new Date() }]);
        setActiveFilterId(stat.id);
        break;

      case 'endDate':
        setColumnFilters([{ id: 'endDate', value: new Date() }]);
        setActiveFilterId(stat.id);
        break;

      default:
        table.resetColumnFilters();
        setActiveFilterId('');
        break;
    }
  };

  const startJob = async (id, setIsLoading) => {
    if (!id) return;

    Swal.fire({
      title: 'Start Job?',
      text: 'Are you sure you want to mark the job as "in progress"?',
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
          console.log('start timer..');
        } catch (error) {
          setIsLoading(false);
          console.error('Error stopping job', error);
          toast.error('Unexpected error occured while stopping job. Please try again later.');
        }
      }
    });
  };

  const stopJob = useCallback(async (id, setIsLoading) => {
    if (!id) return;

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
        try {
          setIsLoading(true);

          stopWatch.reset(undefined, false);

          //* update job header & details
          const jobHeaderRef = doc(db, 'jobHeaders', id);
          const jobDetailsRef = doc(db, 'jobDetails', id);

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
          console.log('stop timer..');
        } catch (error) {
          setIsLoading(false);
          console.error('Error stopping job', error);
          toast.error('Unexpected error occured while stopping job. Please try again later.');
        }
      }
    });
  });

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

  //* set default filtert
  useEffect(() => {
    if (!jobs.isLoading) {
      setFilterBasedOnStat({ filter: 'startDate', id: 'upcoming-jobs' });
    }
  }, [JSON.stringify(jobs)]);

  return (
    <>
      <GeeksSEO title='Technician Dashboard | VITAR Group | Portal' />

      <div className='d-flex flex-column row-gap-4'>
        <div className='d-flex justify-content-between align-items-center my-2'>
          <div>
            <h2 className='mb-0'>Dashboard Overview</h2>
            <p className='text-muted mb-0'>Welcome back! Here's what's happening with your work.</p>
          </div>
        </div>

        {/* //* notifications */}
        {/* <div className='bg-white rounded p-4'>
        <h5 className='mb-3'>Recent Notifications</h5>
        <div className='list-group list-group-flush'>
          <div className='list-group-item d-flex align-items-center border-0 px-0'>
            <div className='bg-info-soft p-2 rounded me-3'>
              <Bell size={16} className='text-info' />
            </div>
            <div className='flex-grow-1'>
              <p className='mb-0'>New job has been assigned</p>
              <small className='text-muted'>2 hours ago</small>
            </div>
            <button className='btn btn-sm btn-light'>View</button>
          </div>

          <div className='list-group-item d-flex align-items-center border-0 px-0'>
            <div className='bg-success-soft p-2 rounded me-3'>
              <Bell size={16} className='text-success' />
            </div>

            <div className='flex-grow-1'>
              <p className='mb-0'>Job has been completed</p>
              <small className='text-muted'>1 hour ago</small>
            </div>
            <button className='btn btn-sm btn-light'>View</button>
          </div>
        </div>
      </div> */}

        <Row className='row-gap-4'>
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Col
                md={stat.width}
                key={`${stat.id}-${stat.title}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setFilterBasedOnStat(stat)}
              >
                <div
                  className={`bg-white rounded p-4 h-100 border border-transaparent ${
                    activeFilterId === stat.id ? 'border-primary' : 'hover-item'
                  }`}
                >
                  <div className='d-flex justify-content-between align-items-center mb-3'>
                    <div className='d-flex align-items-center'>
                      <Icon size={18} className={`text-${stat.color} me-2`} />
                      <span className='text-muted small'>{stat.title}</span>
                    </div>

                    <div>
                      {stat.id == 'current-job' && stat.value && stat.value !== 'N/A' && (
                        <JobTimer
                          stopWatch={stopWatch}
                          job={stat.job}
                          workerId={stat.workerId}
                          auth={auth}
                        />
                      )}
                    </div>
                  </div>

                  {jobs.isLoading ? (
                    <Spinner style={{ width: 20, height: 20 }} animation='border' size='sm' />
                  ) : (
                    <>
                      <h3 className='mb-1'>{stat.value}</h3>
                      <small className='text-muted'>{stat.subtitle}</small>
                    </>
                  )}
                </div>
              </Col>
            );
          })}
        </Row>

        <Card className='border-0 shadow-sm'>
          <Card.Body className='p-4'>
            <DataTable table={table} pageSize={5} isLoading={jobs.isLoading} isError={jobs.isError}>
              <div className='d-flex justify-content-between'>
                <DataTableSearch table={table} isGlobalSearch={false} columnId='customer' />

                <div className='d-flex align-items-center gap-2'>
                  <DataTableFilter table={table} filterFields={filterFields} />
                  <DataTableViewOptions table={table} />
                </div>
              </div>
            </DataTable>
          </Card.Body>
        </Card>
      </div>
    </>
  );
}

export default function ProtectedWorkerProfile() {
  return (
    <RouteGuard>
      <WorkerDashboard />
    </RouteGuard>
  );
}

ProtectedWorkerProfile.Layout = DefaultLayout;
