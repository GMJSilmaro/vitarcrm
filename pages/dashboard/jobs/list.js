import { GeeksSEO } from '@/widgets';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Dropdown,
  Form,
  OverlayTrigger,
  Spinner,
  Tooltip,
} from 'react-bootstrap';
import {
  ArrowRepeat,
  ArrowReturnLeft,
  BriefcaseFill,
  Building,
  CalendarWeek,
  CardList,
  CheckCircle,
  Copy,
  Eye,
  Flag,
  HandThumbsDown,
  Hourglass,
  HouseDoorFill,
  PencilSquare,
  PersonFill,
  PersonLinesFill,
  Plus,
  PlusSquare,
  ShieldCheck,
  ThreeDotsVertical,
  Trash,
  XCircle,
} from 'react-bootstrap-icons';
import ContentHeader from '@/components/dashboard/ContentHeader';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
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
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, storage } from '@/firebase';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import DataTable from '@/components/common/DataTable';
import { format, formatDistanceStrict } from 'date-fns';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';
import DataTableSearch from '@/components/common/DataTableSearch';
import { dateFilter, dateSort } from '@/utils/datatable';
import DataTableFilter from '@/components/common/DataTableFilter';
import { TooltipContent } from '@/components/common/ToolTipContent';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import _, { set } from 'lodash';
import { useNotifications } from '@/hooks/useNotifications';
import { deleteObject, listAll, ref } from 'firebase/storage';
import { PRIORITY_LEVELS_COLOR, SCOPE_TYPE_COLOR, STATUS, STATUS_COLOR } from '@/schema/job';
import withReactContent from 'sweetalert2-react-content';

const JobList = () => {
  const router = useRouter();
  const auth = useAuth();
  const notifications = useNotifications();

  const [jobs, setJobs] = useState({ data: [], isLoading: true, isError: false });

  const columnHelper = createColumnHelper();

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
        cell: ({ row, table }) => (
          <div>
            {(table.getSortedRowModel()?.flatRows?.findIndex((flatRow) => flatRow.id === row.id) ||
              0) + 1}
          </div>
        ),
      }),
      columnHelper.accessor((row) => `${row.id} - ${row.jobRequestId || ''}`, {
        id: 'id',
        header: ({ column }) => <DataTableColumnHeader column={column} title='ID' />,
        size: 100,
        cell: ({ row }) => {
          const { id, jobRequestId } = row.original;
          return (
            <div className='d-flex flex-column gap-2 justify-content-center'>
              <div className='d-flex flex-column justify-content-center'>
                <div className='fw-bold'>ID:</div> <div>{id}</div>
              </div>

              {jobRequestId && (
                <div className='d-flex flex-column justify-content-center'>
                  <div className='fw-bold'>Request ID:</div> <div>{jobRequestId}</div>
                </div>
              )}
            </div>
          );
        },
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
          const scope = row?.original?.scope;

          return (
            <Badge className='text-capitalize' bg={SCOPE_TYPE_COLOR[scope] || 'secondary'}>
              {scope}
            </Badge>
          );
        },
      }),
      columnHelper.accessor('priority', {
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Priority' />,
        cell: ({ row }) => {
          const priority = row?.original?.priority;

          return (
            <Badge className='text-capitalize' bg={PRIORITY_LEVELS_COLOR[priority] || 'secondary'}>
              {priority}
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
          const status = row?.original?.status;

          return (
            <div className='d-flex flex-column justify-content-center align-items-center gap-2'>
              <Badge bg={STATUS_COLOR[status] || 'secondary'}>{_.startCase(status)}</Badge>

              {status === 'job-cancel' && (
                <span className='fw-medium fst-italic'>
                  "{row?.original?.reasonMessage || 'N/A'}"
                </span>
              )}
            </div>
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
                  <div>{format(startEnd.start, 'dd-MM-yyyy HH:mm a')}</div>
                </div>
                <div className='d-flex flex-column justify-content-center'>
                  <div className='fw-bold'>End</div>
                  <div>{format(startEnd.end, 'dd-MM-yyyy HH:mm a')}</div>
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
      columnHelper.accessor((row) => row.jobRequest?.createdBy?.displayName || '', {
        id: 'sales person',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Sales Person' />,
        cell: ({ row }) => {
          const salesPerson = row.original.jobRequest?.createdBy?.displayName || '';
          return <div>{salesPerson}</div>;
        },
      }),
      columnHelper.accessor((row) => row.createdBy?.displayName || 'N/A', {
        id: 'created by',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Created By' />,
        cell: ({ row }) => {
          const displayName = row.original.createdBy?.displayName || 'N/A';
          const createdAt = row.original.createdAt.toDate();

          return (
            <div className='d-flex flex-column justify-content-center align-items-center gap-2'>
              <span>{displayName}</span>
              <span>{format(createdAt, 'dd-MM-yyyy')}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor('actions', {
        id: 'actions',
        size: 50,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Actions' />,
        enableSorting: false,
        cell: ({ row }) => {
          const [isLoading, setIsLoading] = useState(false);

          const { id, details, status, workers } = row.original;

          const handleViewJob = (id) => {
            router.push(`/jobs/view/${id}`);
          };

          const handleEditJob = (id) => {
            router.push(`/jobs/edit-jobs/${id}`);
          };

          const handleDuplicateJob = (id) => {
            router.push(`/jobs/duplicate/${id}`);
          };

          const handleRescheduleJob = async (id, status, workers) => {
            Swal.fire({
              title: `Reschedule Job - Job #${id}`,
              text: `Are you sure you want to reschedule this job?`,
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

                  if (status !== 'job-reschedule') {
                    const jobHeaderRef = doc(db, 'jobHeaders', id);

                    const workerIds = workers.map((worker) => worker?.id).filter(Boolean);

                    const workerSnapshot = await getDocs(
                      query(collection(db, 'users'), where('workerId', 'in', workerIds))
                    );

                    const workerUids = workerSnapshot.empty
                      ? []
                      : workerSnapshot.docs.map((doc) => doc.id);

                    await Promise.all([
                      updateDoc(jobHeaderRef, {
                        status: 'job-reschedule',
                        updatedAt: serverTimestamp(),
                        updatedBy: auth.currentUser,
                      }),
                      //* create notification for admin and supervisor when updated a job status
                      notifications.create({
                        module: 'job',
                        target: ['admin', 'supervisor', ...workerUids],
                        title: 'Job rescheduled',
                        message: `Job (#${id}) status was updated by ${auth.currentUser.displayName} to "${_.startCase('job-reschedule')}".`, //prettier-ignore
                        data: {
                          redirectUrl: `/jobs/view/${id}`,
                        },
                      }),
                    ]);
                  }

                  setIsLoading(false);
                  toast.success('Job rescheduled successfully', { position: 'top-right' });

                  setTimeout(() => {
                    router.push(`/jobs/edit-jobs/${id}?tab=4`);
                  }, 1000);
                } catch (error) {
                  console.error('Error rescheduling job:', error);
                  toast.error('Error rescheduling job: ' + error.message, { position: 'top-right' }); //prettier-ignore
                  setIsLoading(false);
                }
              }
            });
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

                  const deleteFiles = async () => {
                    try {
                      const storageRef = ref(storage, `jobs/${id}/documents`);
                      const res = await listAll(storageRef);

                      //* delete all files
                      const deletePromises = res.items.map((itemRef) => deleteObject(itemRef));

                      await Promise.all(deletePromises);

                      console.log('deleted files from path: ', `job/${id}/documents`);
                    } catch (error) {
                      console.error(err, 'Failed to delete related documents/files:');
                    }
                  };

                  await Promise.all([
                    deleteDoc(jobHeaderRef),
                    deleteDoc(jobDetailsRef),
                    deleteFiles(),
                    //* create notification when job is removed
                    notifications.create({
                      module: 'job',
                      target: ['admin', 'supervisor'],
                      title: 'Job removed',
                      message: `Job (#${id}) was removed by ${auth.currentUser.displayName}.`,
                      data: {
                        redirectUrl: `/jobs`,
                      },
                    }),
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

          const handleUpdateJobStatus = (id, status) => {
            if (status === 'job-cancel') {
              withReactContent(Swal)
                .fire({
                  title: `Job Status Update - Job #${id}`,
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
                      >{`Are you sure you want to update the job status to "${_.startCase(
                        status
                      )}"?`}</div>

                      <div>
                        <Form.Control
                          id={`job-status-update-${id}`}
                          type='text'
                          as='textarea'
                          rows={4}
                          placeholder='Enter a message/reason'
                        />
                      </div>
                    </div>
                  ),
                  preConfirm: () => {
                    return document.getElementById(`job-status-update-${id}`).value;
                  },
                })
                .then(async ({ value, isConfirmed }) => {
                  if (isConfirmed) {
                    try {
                      setIsLoading(true);

                      const jobHeaderRef = doc(db, 'jobHeaders', id);

                      await Promise.all([
                        updateDoc(jobHeaderRef, {
                          status,
                          reasonMessage: value,
                          updatedAt: serverTimestamp(),
                          updatedBy: auth.currentUser,
                        }),
                        //* create notification for admin and supervisor when updated a job status
                        notifications.create({
                          module: 'job',
                          target: ['admin', 'supervisor'],
                          title: 'Job status updated',
                          message: `Job (#${id}) status was updated by ${auth.currentUser.displayName} to "${_.startCase(status)}".`, //prettier-ignore
                          data: {
                            redirectUrl: `/jobs/view/${id}`,
                          },
                        }),
                      ]);

                      toast.success('Job status updated successfully', { position: 'top-right' });
                      setIsLoading(false);
                    } catch (error) {
                      console.error('Error updating job status:', error);
                      toast.error('Error updating job status: ' + error.message, { position: 'top-right' }); //prettier-ignore
                      setIsLoading(false);
                    }
                  }
                });
              return;
            }

            Swal.fire({
              title: `Job Status Update - Job #${id}`,
              text: `Are you sure you want to update the job status to "${_.startCase(status)}"?`,
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

                  await Promise.all([
                    updateDoc(jobHeaderRef, {
                      status,
                      reasonMessage: null,
                      updatedAt: serverTimestamp(),
                      updatedBy: auth.currentUser,
                    }),
                    //* create notification for admin and supervisor when updated a job status
                    notifications.create({
                      module: 'job',
                      target: ['admin', 'supervisor'],
                      title: 'Job status updated',
                      message: `Job (#${id}) status was updated by ${auth.currentUser.displayName} to "${_.startCase(status)}".`, //prettier-ignore
                      data: {
                        redirectUrl: `/jobs/view/${id}`,
                      },
                    }),
                  ]);

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

                  //* create notification when equipment is returned
                  await notifications.create({
                    module: 'job',
                    target: ['admin', 'supervisor'],
                    title: 'Equipment returned',
                    message: `Job (#${id}) equipment was returned by ${auth.currentUser.displayName}.`,
                    data: {
                      redirectUrl: `/jobs/view/${id}`,
                    },
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

          return (
            <OverlayTrigger
              rootClose
              trigger='click'
              placement='left-start'
              overlay={
                <Dropdown.Menu show style={{ zIndex: 999 }}>
                  <Dropdown.Item onClick={() => handleViewJob(id)}>
                    <Eye className='me-2' size={16} />
                    View Job
                  </Dropdown.Item>

                  {(auth.role === 'admin' || auth.role === 'supervisor') && (
                    <>
                      <Dropdown.Item onClick={() => handleEditJob(id)}>
                        <PencilSquare className='me-2' size={16} />
                        Edit Job
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleDeleteJob(id)}>
                        <Trash className='me-2' size={16} />
                        Delete Job
                      </Dropdown.Item>

                      <Dropdown.Item onClick={() => handleDuplicateJob(id)}>
                        <Copy className='me-2' size={16} />
                        Duplicate Job
                      </Dropdown.Item>

                      {(status === 'job-confirm' || status === 'job-in-progress') && (
                        <Dropdown.Item onClick={() => handleRescheduleJob(id, status, workers)}>
                          <CalendarWeek className='me-2' size={16} />
                          Reschedule Job
                        </Dropdown.Item>
                      )}

                      <Dropdown.Item onClick={() => handleReturnEquipment(id, details)}>
                        <ArrowReturnLeft className='me-2' size={16} />
                        Return Equipment
                      </Dropdown.Item>

                      <OverlayTrigger
                        rootClose
                        trigger='click'
                        placement='left'
                        overlay={
                          <Dropdown.Menu show style={{ zIndex: 999 }}>
                            <Dropdown.Item onClick={() => handleUpdateJobStatus(id, 'job-confirm')}>
                              <Flag className='me-2' size={16} />
                              Job Confirm
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={() => handleUpdateJobStatus(id, 'job-validation')}
                            >
                              <CheckCircle className='me-2' size={16} />
                              Job Validation
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => handleUpdateJobStatus(id, 'job-cancel')}>
                              <XCircle className='me-2' size={16} />
                              Job Cancel
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={() => handleUpdateJobStatus(id, 'job-complete')}
                            >
                              <ShieldCheck className='me-2' size={16} />
                              Job Complete
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        }
                      >
                        <Dropdown.Item>
                          <ArrowRepeat className='me-2' size={16} />
                          Update Status
                        </Dropdown.Item>
                      </OverlayTrigger>

                      {status !== 'job-confirm' && (
                        <Dropdown.Item onClick={() => router.push(`/jobs/${id}/calibrations`)}>
                          <Eye className='me-2' size={16} />
                          View Calibrations
                        </Dropdown.Item>
                      )}

                      <Dropdown.Item onClick={() => router.push(`/jobs/${id}/calibrations/create`)}>
                        <PlusSquare className='me-2' size={16} />
                        Start Calibration
                      </Dropdown.Item>
                    </>
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
  }, [auth.role]);

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
        label: 'Scope',
        columnId: 'scope',
        type: 'select',
        options: [
          { label: 'All Scope', value: '' },
          { label: 'Lab', value: 'lab' },
          { label: 'Site', value: 'site' },
        ],
        placeholder: 'Search by Scope...',
      },
      {
        label: 'Priority',
        columnId: 'priority',
        type: 'select',
        options: [
          { label: 'All Priority', value: '' },
          { label: 'Normal', value: 'normal' },
          { label: 'Urgent', value: 'urgent' },
        ],
        placeholder: 'Search by Priority...',
      },
      {
        label: 'Status',
        columnId: 'status',
        type: 'select',
        options: [
          { label: 'All Status', value: '' },
          ...STATUS.map((s) => ({ label: _.startCase(s), value: s })),
        ],
      },
      {
        label: 'Created By',
        columnId: 'created by',
        type: 'text',
        placeholder: 'Search by created by...',
      },
      {
        label: 'Sales Person',
        columnId: 'sales person',
        type: 'text',
        placeholder: 'Search by sales person...',
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
      columnVisibility: { date: false },
      columnPinning: { right: ['actions'] },
      sorting: [{ id: 'date', desc: true }],
    },
  });

  useEffect(() => {
    const q = query(collection(db, 'jobHeaders'));

    //TODO: Optimize query
    const unsubscribe = onSnapshot(
      q,
      async (snapshop) => {
        if (!snapshop.empty) {
          let rows = [];
          for (const jobDoc of snapshop.docs) {
            const id = jobDoc.id;
            const data = jobDoc.data();
            const jobRequestId = data?.jobRequestId;

            const jobDetailsDocPromise = getDoc(doc(db, 'jobDetails', id));
            const jobRequestDocPromise = jobRequestId ?  getDoc(doc(db, 'jobRequests', jobRequestId)) : null; // prettier-ignore

            const [jobDetailsDoc, jobRequestDoc] = await Promise.all([
              jobDetailsDocPromise,
              jobRequestDocPromise,
            ]);

            const jobDetailsData = jobDetailsDoc.exists() ? jobDetailsDoc.data() : null; // prettier-ignore
            const jobRequestData = jobRequestDoc && jobRequestDoc.exists() ? jobRequestDoc.data() : null; // prettier-ignore

            rows.push({
              id,
              ...data,
              details: jobDetailsData,
              jobRequest: jobRequestData,
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
  }, []);

  //* Optimize idea query
  // useEffect(() => {
  //   const q = query(collection(db, 'jobHeaders'));

  //   const unsubscribe = onSnapshot(
  //     q,
  //     async (snapshot) => {
  //       if (snapshot.empty) {
  //         setJobs({ data: [], isLoading: false, isError: false });
  //         return;
  //       }

  //       const jobDocs = snapshot.docs.map((doc) => ({
  //         id: doc.id,
  //         ...doc.data(),
  //       }));

  //       const promises = jobDocs.map(async (job) => {
  //         try {
  //           const jobDetailsPromise = getDoc(doc(db, 'jobDetails', job.id));
  //           const jobRequestPromise = job.jobRequestId
  //             ? getDoc(doc(db, 'jobRequests', job.jobRequestId))
  //             : Promise.resolve(null);

  //           const [jobDetailsDoc, jobRequestDoc] = await Promise.all([
  //             jobDetailsPromise,
  //             jobRequestPromise,
  //           ]);

  //           return {
  //             ...job,
  //             details: jobDetailsDoc.exists() ? jobDetailsDoc.data() : null,
  //             jobRequest: jobRequestDoc?.exists() ? jobRequestDoc.data() : null,
  //           };
  //         } catch (err) {
  //           console.warn(`Failed to fetch details for job ${job.id}:`, err);
  //           return null; // Skip this job
  //         }
  //       });

  //       const settledResults = await Promise.allSettled(promises);

  //       const validJobs = settledResults
  //         .filter((result) => result.status === 'fulfilled' && result.value !== null)
  //         .map((result) => result.value);

  //       setJobs({ data: validJobs, isLoading: false, isError: false });
  //     },
  //     (err) => {
  //       console.error(err.message);
  //       setJobs({ data: [], isLoading: false, isError: true });
  //     }
  //   );

  //   return () => unsubscribe();
  // }, []);

  return (
    <>
      <GeeksSEO title='Jobs- VITAR Group | Portal' />

      <ContentHeader
        title='Job List'
        description='Create, manage and tract all your jobs assignments in one centralize dashboard'
        infoText='Manage job assignment and track progress updates'
        badgeText='Job Management'
        badgeText2='Listing'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' style={{ fontSize: '14px' }} />,
          },
          {
            text: 'Jobs',
            link: '/jobs',
            icon: <BriefcaseFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          ...(auth.role === 'admin' || auth.role === 'supervisor'
            ? [
                {
                  text: 'Create Job',
                  icon: <Plus size={20} />,
                  variant: 'light',
                  onClick: () => router.push('/jobs/create'),
                },
              ]
            : []),
        ]}
      />

      <Card className='border-0 shadow-none'>
        <Card.Body className='p-4'>
          <DataTable table={table} isLoading={jobs.isLoading} isError={jobs.isError}>
            <div className='d-flex flex-column row-gap-3 flex-lg-row justify-content-lg-between'>
              <DataTableSearch table={table} isGlobalSearch={false} columnId='customer' />

              <div className='d-flex align-items-center gap-2'>
                <DataTableFilter table={table} filterFields={filterFields} />
                <DataTableViewOptions table={table} />
              </div>
            </div>
          </DataTable>
        </Card.Body>
      </Card>
    </>
  );
};

export default JobList;
