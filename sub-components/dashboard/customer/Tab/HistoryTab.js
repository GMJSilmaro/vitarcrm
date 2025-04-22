import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Dropdown, OverlayTrigger, Spinner, Tooltip } from 'react-bootstrap';
import {
  ArrowRepeat,
  ArrowReturnLeft,
  Building,
  CardList,
  CheckCircle,
  Eye,
  Flag,
  HandThumbsDown,
  Hourglass,
  PencilSquare,
  PersonFill,
  PersonLinesFill,
  ShieldCheck,
  ThreeDotsVertical,
  Trash,
  XCircle,
} from 'react-bootstrap-icons';
import DataTableViewOptions from '../../../../components/common/DataTableViewOptions';
import DataTable from '../../../../components/common/DataTable';
import DataTableColumnHeader from '../../../../components/common/DataTableColumnHeader';
import { useRouter } from 'next/router';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { dateFilter, dateSort, fuzzyFilter, globalSearchFilter } from '@/utils/datatable';
import DataTableSearch from '@/components/common/DataTableSearch';

import { format, formatDistanceStrict } from 'date-fns';
import DataTableFilter from '@/components/common/DataTableFilter';
import { TooltipContent } from '@/components/common/ToolTipContent';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export const HistoryTab = () => {
  const router = useRouter();
  const auth = useAuth();
  const { customerId } = router.query;

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
            rejected: 'danger',
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
      columnHelper.accessor('actions', {
        id: 'actions',
        size: 50,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Actions' />,
        enableSorting: false,
        cell: ({ row }) => {
          const [isLoading, setIsLoading] = useState(false);

          const { id, details } = row.original;

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

          const handleUpdateJobStatus = (id, status) => {
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

                  await updateDoc(jobHeaderRef, {
                    status,
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
                  <Dropdown.Item onClick={() => handleDeleteJob(id)}>
                    <Trash className='me-2' size={16} />
                    Delete Job
                  </Dropdown.Item>

                  <Dropdown.Item onClick={() => handleReturnEquipment(id, details)}>
                    <ArrowReturnLeft className='me-2' size={16} />
                    Return Equipment
                  </Dropdown.Item>

                  <OverlayTrigger
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
                        <Dropdown.Item onClick={() => handleUpdateJobStatus(id, 'rejected')}>
                          <HandThumbsDown className='me-2' size={16} />
                          Rejected
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
                  </OverlayTrigger>

                  <Dropdown.Item onClick={() => router.push(`/jobs/${id}/calibrations`)}>
                    <Eye className='me-2' size={16} />
                    View Calibrations
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => router.push(`/jobs/${id}/calibrations/create`)}>
                    <CardList className='me-2' size={16} />
                    Start Calibrate
                  </Dropdown.Item>
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
  }, []);

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
          { label: 'Created', value: 'created' },
          { label: 'Confirmed', value: 'confirmed' },
          { label: 'In Progress', value: 'in progress' },
          { label: 'Completed', value: 'completed' },
          { label: 'Cancelled', value: 'cancelled' },
        ],
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
      columnPinning: { right: ['actions'] },
    },
  });

  useEffect(() => {
    if (!customerId) return;

    const q = query(collection(db, 'jobHeaders'), where('customer.id', '==', customerId));

    const unsubscribe = onSnapshot(
      q,
      (snapshop) => {
        if (!snapshop.empty) {
          setJobs({
            data: snapshop.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })),
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
  }, [customerId]);

  return (
    <Card className='border-0 shadow-none'>
      <Card.Body className='p-4'>
        <DataTable table={table} isLoading={jobs.isLoading} isError={jobs.isError}>
          <div className='d-flex flex-column row-gap-3 flex-lg-row justify-content-lg-between'>
            <DataTableSearch table={table} />

            <div className='d-flex align-items-center gap-2'>
              <DataTableFilter table={table} filterFields={filterFields}></DataTableFilter>
              <DataTableViewOptions table={table} />
            </div>
          </div>
        </DataTable>
      </Card.Body>
    </Card>
  );
};

export default HistoryTab;
