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
import { Badge, Button, Card, Dropdown, OverlayTrigger, Popover, Spinner } from 'react-bootstrap';
import {
  BriefcaseFill,
  CardList,
  Eye,
  HouseDoorFill,
  PencilSquare,
  PersonFill,
  PersonLinesFill,
  ThreeDotsVertical,
  Trash,
} from 'react-bootstrap-icons';
import ContentHeader from '@/components/dashboard/ContentHeader';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import { collection, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/firebase';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import DataTable from '@/components/common/DataTable';
import { format, formatDistanceStrict } from 'date-fns';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';
import { FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import DataTableSearch from '@/components/common/DataTableSearch';
import { fuzzyFilter } from '@/utils/datatable';

const JobList = () => {
  const router = useRouter();

  const [jobs, setJobs] = useState({ data: [], isLoading: true, isError: false });

  const columnHelper = createColumnHelper();

  const getDurationText = (startDate, endDate, startTime, endTime) => {
    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(`${endDate}T${endTime}:00`);
    return formatDistanceStrict(start, end);
  };

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('id', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='ID' />,
        size: 100,
      }),
      columnHelper.accessor((row) => format(row.createdAt.toDate(), 'yyyy-MM-dd'), {
        id: 'Date',
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Date' />,
        cell: ({ row }) => {
          const createdAt = row.original.createdAt.toDate();
          return <div>{format(createdAt, 'yyyy-MM-dd')}</div>;
        },
      }),
      columnHelper.accessor('scope', {
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Scope' />,
        cell: ({ row }) => {
          const colors = {
            lab: 'info',
            onsite: 'warning',
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
        header: ({ column }) => <DataTableColumnHeader column={column} title='Scope' />,
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
      columnHelper.accessor((row) => `${row.customer.name}`, {
        id: 'customer',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Customer' />,
        cell: ({ row }) => {
          return <div>{row.original.customer.name}</div>;
        },
      }),
      columnHelper.accessor((row) => `${row.location.name}`, {
        id: 'location',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Location' />,
        cell: ({ row }) => {
          return <div>{row.original.location.name}</div>;
        },
      }),
      columnHelper.accessor('description', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Description' />,
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
          };
          return (
            <Badge className='text-capitalize' bg={colors[row.original.status] || 'secondary'}>
              {row.original.status}
            </Badge>
          );
        },
      }),
      columnHelper.accessor((row) => `${row.worker.name}`, {
        id: 'worker',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Technician' />,
        cell: ({ row }) => {
          const { worker } = row.original;

          if (!worker) return 'N/A';

          return (
            <div>
              <PersonLinesFill size={14} className='text-primary me-2' />
              <span>{worker.name}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor(
        (row) => {
          const { startDate, endDate, startTime, endTime } = row;
          return getDurationText(startDate, endDate, startTime, endTime);
        },
        {
          id: 'duration',
          size: 100,
          header: ({ column }) => <DataTableColumnHeader column={column} title='Duration' />,
          cell: ({ row }) => {
            const { startDate, endDate, startTime, endTime } = row.original;
            const duration = getDurationText(startDate, endDate, startTime, endTime);
            return <div>{duration}</div>;
          },
        }
      ),
      columnHelper.accessor((row) => format(row.updatedAt.toDate(), 'yyyy-MM-dd'), {
        id: 'last updated',
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Last Updated' />,
        cell: ({ row }) => {
          const updatedAt = row.original.updatedAt.toDate();
          return <div>{`${format(updatedAt, 'yyyy-MM-dd')} at ${format(updatedAt, 'p')}`}</div>;
        },
      }),
      columnHelper.accessor((row) => row.createdBy?.displayName || 'N/A', {
        id: 'created By',
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
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Action' />,
        enableSorting: false,
        cell: ({ row }) => {
          const [isLoading, setIsLoading] = useState(false);

          const { id } = row.original;

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
              confirmButtonText: 'Confirm',
              cancelButtonText: 'Cancel',
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
                  <Dropdown.Item onClick={() => handleEditJob(id)}>
                    <PencilSquare className='me-2' size={16} />
                    Edit Job
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleDeleteJob(id)}>
                    <Trash className='me-2' size={16} />
                    Delete Job
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => {}}>
                    <CardList className='me-2' size={16} />
                    Create Calibrate
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

  const table = useReactTable({
    data: jobs.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFns: { fuzzy: fuzzyFilter },
    globalFilterFn: 'fuzzy',
  });

  useEffect(() => {
    const q = query(collection(db, 'jobHeaders'));

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
  }, []);

  return (
    <>
      <GeeksSEO title='Jobs- VITAR Group | Portal' />

      <ContentHeader
        title='Job List'
        description='Create, manage and tract all your jobs assignments in once centralize dashboard'
        infoText='Manage job assignment and track progress updates'
        badgeText='Job Management'
        badgeText2='Scheduling'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' style={{ fontSize: '14px' }} />,
          },
          {
            text: 'Job List',
            link: '/jobs',
            icon: <BriefcaseFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: 'Create Job',
            icon: <FaPlus size={16} />,
            variant: 'light',
            onClick: () => router.push('/jobs/create'),
          },
        ]}
      />

      <Card className='border-0 shadow-none'>
        <Card.Body className='p-4'>
          <DataTable table={table} isLoading={jobs.isLoading} isError={jobs.isError}>
            <div className='d-flex justify-content-between'>
              <DataTableSearch table={table} />
              <DataTableViewOptions table={table} />
            </div>
          </DataTable>
        </Card.Body>
      </Card>
    </>
  );
};

export default JobList;
