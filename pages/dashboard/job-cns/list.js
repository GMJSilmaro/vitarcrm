import DataTable from '@/components/common/DataTable';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import DataTableFilter from '@/components/common/DataTableFilter';
import DataTableSearch from '@/components/common/DataTableSearch';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import { dateFilter, dateSort, globalSearchFilter } from '@/utils/datatable';
import { GeeksSEO } from '@/widgets';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { collection, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import {
  ChatLeftTextFill,
  Eye,
  HouseDoorFill,
  PencilSquare,
  PersonFill,
  Plus,
  ThreeDotsVertical,
  Trash,
} from 'react-bootstrap-icons';
import { Button, Dropdown, OverlayTrigger, Spinner, Badge, Card } from 'react-bootstrap';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const JobCnList = () => {
  const router = useRouter();

  const [jobCns, setJobCns] = useState({ data: [], isLoading: true, isError: false });

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
      columnHelper.accessor('jobId', {
        id: 'job id',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Job ID' />,
        size: 100,
        cell: ({ row }) => {
          const jobId = row.original.jobId;

          return (
            <Link
              className='link-info link-offset-2 link-underline-opacity-0 link-underline-opacity-100-hover'
              href={`/jobs/view/${jobId}`}
            >
              {jobId}
            </Link>
          );
        },
      }),
      columnHelper.accessor((row) => format(row.createdAt.toDate(), 'dd-MM-yyyy hh:mm a'), {
        id: 'date',
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Date' />,
        cell: ({ row }) => {
          const createdAt = row.original.createdAt.toDate();
          return <div>{format(createdAt, 'dd-MM-yyyy hh:mm a')}</div>;
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
      columnHelper.accessor(
        (row) => {
          const calibrationItems = row?.calibrationItems || [];
          const count = calibrationItems.filter((item) => item.isSelected).length;
          return count;
        },
        {
          id: 'faulty instruments',
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Faulty Instruments' />
          ),
          cell: ({ row }) => {
            const calibrationItems = row.original?.calibrationItems || [];
            const count = calibrationItems.filter((item) => item.isSelected).length;

            if (count === 0) return null;

            return <Badge bg='primary'>{count}</Badge>;
          },
        }
      ),
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
        cell: ({ row }) => {
          const [isLoading, setIsLoading] = useState(false);

          const { id } = row.original;

          const handleViewJobCn = (id) => {
            router.push(`/job-cns/view/${id}`);
          };

          const handleEditJobCn = (id) => {
            router.push(`/job-cns/edit-job-cns/${id}`);
          };

          const handleDeleteJobCn = (id) => {
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

                  const jobCnDocRef = doc(db, 'jobCustomerNotifications', id);

                  await deleteDoc(jobCnDocRef);

                  toast.success('Job customer notification removed successfully', {
                    position: 'top-right',
                  });
                  setIsLoading(false);
                } catch (error) {
                  console.error('Error removing job customer notification:', error);
                  toast.error('Error removing job customer notification: ' + error.message, {
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
                  <Dropdown.Item onClick={() => handleViewJobCn(id)}>
                    <Eye className='me-2' size={16} />
                    View Data
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleEditJobCn(id)}>
                    <PencilSquare className='me-2' size={16} />
                    Edit Data
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleDeleteJobCn(id)}>
                    <Trash className='me-2' size={16} />
                    Delete Data
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
    data: jobCns.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFns: { globalSearch: globalSearchFilter },
    globalFilterFn: 'globalSearch',
    initialState: {
      columnPinning: { right: ['actions'] },
      sorting: [{ id: 'date', desc: true }],
    },
  });

  const filterFields = useMemo(() => {
    return [
      {
        label: 'ID',
        columnId: 'id',
        type: 'text',
        placeholder: 'Search by job cn id...',
      },
      {
        label: 'Job ID',
        columnId: 'job id',
        type: 'text',
        placeholder: 'Search by job id...',
      },
      {
        label: 'Date',
        columnId: 'date',
        type: 'date',
      },
      {
        label: 'Created By',
        columnId: 'created by',
        type: 'text',
        placeholder: 'Search by created by...',
      },
    ];
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'jobCustomerNotifications'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          setJobCns({
            data: snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })),
            isLoading: false,
            isError: false,
          });

          return;
        }

        setJobCns({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        setJobCns({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <>
      <GeeksSEO title='Job Customer Notifications - VITAR Group | Portal' />

      <ContentHeader
        title='Job CN List'
        description='Create, manage all your job customer notifications in one centralize dashboard'
        badgeText='Job customer notifications Management'
        badgeText2='Listing'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' style={{ fontSize: '14px' }} />,
          },
          {
            text: 'Jobs CN',
            icon: <ChatLeftTextFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: 'Create Job Customer Notification',
            icon: <Plus size={20} />,
            variant: 'light',
            onClick: () => router.push('/job-cns/create'),
          },
        ]}
      />

      <Card className='border-0 shadow-none'>
        <Card.Body className='p-4'>
          <DataTable table={table} isLoading={jobCns.isLoading} isError={jobCns.isError}>
            <div className='d-flex flex-column row-gap-3 flex-lg-row justify-content-lg-between'>
              <DataTableSearch table={table} />

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

export default JobCnList;
