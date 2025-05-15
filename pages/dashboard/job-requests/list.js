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
import { Badge, Button, Card, Dropdown, Form, OverlayTrigger, Spinner } from 'react-bootstrap';
import {
  ArrowRepeat,
  Building,
  CircleHalf,
  EnvelopePaperFill,
  Eye,
  HandThumbsDown,
  HandThumbsUp,
  HouseDoorFill,
  PencilSquare,
  PersonFill,
  Plus,
  ThreeDotsVertical,
  Trash,
} from 'react-bootstrap-icons';
import ContentHeader from '@/components/dashboard/ContentHeader';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import DataTable from '@/components/common/DataTable';
import { useRouter } from 'next/router';
import DataTableSearch from '@/components/common/DataTableSearch';
import DataTableFilter from '@/components/common/DataTableFilter';
import { useAuth } from '@/contexts/AuthContext';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import { dateFilter, dateSort } from '@/utils/datatable';
import { format } from 'date-fns';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import withReactContent from 'sweetalert2-react-content';
import { useNotifications } from '@/hooks/useNotifications';

const JobRequestList = () => {
  const router = useRouter();
  const auth = useAuth();
  const notifications = useNotifications();

  const [jobsRequests, setJobsRequests] = useState({ data: [], isLoading: true, isError: false });

  const columnHelper = createColumnHelper();

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

          const colors = {
            created: 'warning',
            approved: 'success',
            cancelled: 'danger',
            incomplete: 'secondary',
          };

          return (
            <div className='d-flex flex-column justify-content-center align-items-sm-center gap-2'>
              <Badge className='text-capitalize' bg={colors[status] || 'secondary'}>
                {status}
              </Badge>

              {(status === 'cancelled' || status === 'incomplete') && (
                <span className='fw-medium fst-italic'>
                  "{row.original.cancelledMessage || 'N/A'}"
                </span>
              )}
            </div>
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
      columnHelper.accessor((row) => row?.supervisor?.name || 'N/A', {
        id: 'supervisor',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Supervisor' />,
        cell: ({ row }) => {
          const name = row.original?.supervisor?.name || 'N/A';
          return (
            <div>
              <PersonFill size={14} className='text-primary me-2' />
              <span>{name}</span>
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
          const [cancelledMessage, setCancelledMessage] = useState('');

          const { id } = row.original;

          const handleViewJobRequest = (id) => {
            router.push(`/job-requests/view/${id}`);
          };

          const handleEditJobRequest = (id) => {
            router.push(`/job-requests/edit-job-requests/${id}`);
          };

          const handleDeleteJobRequest = (id) => {
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

                  const jobRequestRef = doc(db, 'jobRequests', id);

                  await Promise.all(
                    deleteDoc(jobRequestRef),
                    //* create notification when job request is removed
                    notifications.create({
                      module: 'job-request',
                      target: ['admin', 'supervisor', 'sales'],
                      title: 'Job request removed',
                      message: `Job request (#${id}) was removed by ${auth.currentUser.displayName}.`,
                      data: {
                        redirectUrl: `/job-requests`,
                      },
                    })
                  );

                  toast.success('Job request removed successfully', { position: 'top-right' });
                  setIsLoading(false);
                } catch (error) {
                  console.error('Error removing job request:', error);
                  toast.error('Error removing job request: ' + error.message, {
                    position: 'top-right',
                  });
                  setIsLoading(false);
                }
              }
            });
          };

          const handleUpdateJobRequestStatus = (id, status) => {
            if (status === 'cancelled' || status === 'incomplete') {
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
                          placeholder='Enter a message/reason for the cancelled job request..'
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
                          cancelledMessage: value,
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
              text: `Are you sure you want to update the job request status to "${_.startCase(
                status
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

                  const jobRequestRef = doc(db, 'jobRequests', id);

                  await Promise.all([
                    updateDoc(jobRequestRef, {
                      status,
                      cancelledMessage: null,
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

                  if (status === 'approved') {
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

          return (
            <OverlayTrigger
              rootClose
              trigger='click'
              placement='left-start'
              overlay={
                <Dropdown.Menu show style={{ zIndex: 999 }}>
                  <Dropdown.Item onClick={() => handleViewJobRequest(id)}>
                    <Eye className='me-2' size={16} />
                    View Job Request
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleEditJobRequest(id)}>
                    <PencilSquare className='me-2' size={16} />
                    Edit Job Request
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleDeleteJobRequest(id)}>
                    <Trash className='me-2' size={16} />
                    Delete Job Request
                  </Dropdown.Item>

                  {(auth.role === 'admin' || auth.role === 'supervisor') && (
                    <OverlayTrigger
                      rootClose
                      trigger='click'
                      placement='right-end'
                      overlay={
                        <Dropdown.Menu show style={{ zIndex: 999 }}>
                          <Dropdown.Item
                            onClick={() => handleUpdateJobRequestStatus(id, 'approved')}
                          >
                            <HandThumbsUp className='me-2' size={16} />
                            Approved
                          </Dropdown.Item>
                          <Dropdown.Item
                            onClick={() => handleUpdateJobRequestStatus(id, 'cancelled')}
                          >
                            <HandThumbsDown className='me-2' size={16} />
                            Cancelled
                          </Dropdown.Item>
                          <Dropdown.Item
                            onClick={() => handleUpdateJobRequestStatus(id, 'incomplete')}
                          >
                            <CircleHalf className='me-2' size={16} />
                            Incomplete
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      }
                    >
                      <Dropdown.Item>
                        <ArrowRepeat className='me-2' size={16} />
                        Update Status
                      </Dropdown.Item>
                    </OverlayTrigger>
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
        label: 'Job Request ID',
        columnId: 'id',
        type: 'text',
        placeholder: 'Search by job request id...',
      },
      {
        label: 'Status',
        columnId: 'status',
        type: 'select',
        options: [
          { label: 'All Status', value: '' },
          { label: 'Created', value: 'created' },
          { label: 'Cancelled', value: 'cancelled' },
          { label: 'Incomplete', value: 'incomplete' },
        ],
      },

      {
        label: 'Created By',
        columnId: 'created by',
        type: 'text',
        placeholder: 'Search by created by...',
      },
      {
        label: 'Supervisor',
        columnId: 'supervisor',
        type: 'text',
        placeholder: 'Search by supervisor...',
      },
      {
        label: 'Date',
        columnId: 'date',
        type: 'date',
      },
    ];
  }, []);

  const table = useReactTable({
    data: jobsRequests.data,
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
    const q = query(
      collection(db, 'jobRequests'),
      where('status', 'not-in', ['approved', 'cancelled'])
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshop) => {
        if (!snapshop.empty) {
          setJobsRequests({
            data: snapshop.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })),
            isLoading: false,
            isError: false,
          });

          return;
        }

        setJobsRequests({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        setJobsRequests({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <>
      <GeeksSEO title='Job Requests - VITAR Group | Portal' />

      <ContentHeader
        title='Job Request List'
        description='Create, manage and tract all your jobs requests in one centralize dashboard'
        infoText='Manage job requests, view job request and update status'
        badgeText='Job Requests Management'
        badgeText2='Job Requests'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' style={{ fontSize: '14px' }} />,
          },
          {
            text: 'Job Requests',
            link: '/job-requests',
            icon: <EnvelopePaperFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: 'Create Job Request',
            icon: <Plus size={20} />,
            variant: 'light',
            onClick: () => router.push('/job-requests/create'),
          },
        ]}
      />

      <Card className='border-0 shadow-none'>
        <Card.Body className='p-4'>
          <DataTable
            table={table}
            isLoading={jobsRequests.isLoading}
            isError={jobsRequests.isError}
          >
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

export default JobRequestList;
