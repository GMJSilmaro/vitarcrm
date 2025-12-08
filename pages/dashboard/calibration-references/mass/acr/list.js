import DataTable from '@/components/common/DataTable';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import DataTableFilter from '@/components/common/DataTableFilter';
import DataTableSearch from '@/components/common/DataTableSearch';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import ContentHeader from '@/components/dashboard/ContentHeader';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { globalSearchFilter } from '@/utils/datatable';
import { GeeksSEO } from '@/widgets';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { collection, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Dropdown, OverlayTrigger, Spinner } from 'react-bootstrap';
import {
  Eye,
  HouseDoorFill,
  ListColumns,
  PencilSquare,
  Plus,
  ThreeDotsVertical,
  Trash,
  Table,
  Gear,
  GearFill,
  BoxSeamFill,
} from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const ACRList = () => {
  const router = useRouter();
  const auth = useAuth();

  const [acr, setAcr] = useState({ data: [], isLoading: true, isError: false });

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
      columnHelper.accessor('code', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Code' />,
      }),
      columnHelper.accessor('e1', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='E1' />,
      }),
      columnHelper.accessor('e2', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='E2' />,
      }),
      columnHelper.accessor('f1', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='F1' />,
      }),
      columnHelper.accessor('f2', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='F2' />,
      }),
      columnHelper.accessor('m1', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='M1' />,
      }),
      columnHelper.accessor('m2', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='M2' />,
      }),
      columnHelper.accessor('m3', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='M3' />,
      }),
      columnHelper.accessor('actions', {
        id: 'actions',
        size: 50,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Actions' />,
        cell: ({ row }) => {
          const [isLoading, setIsLoading] = useState(false);

          const { id } = row.original;

          const handleViewData = (id) => {
            router.push(`/calibration-references/mass/acr/view/${id}`);
          };

          const handleEditData = (id) => {
            router.push(`/calibration-references/mass/acr/edit-acr/${id}`);
          };

          const handleDeleteData = (id) => {
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

                  const acrDocRef = doc(db, 'jobCalibrationReferences', 'CR000004', 'data', id);

                  await deleteDoc(acrDocRef);

                  toast.success('Refence data removed successfully', { position: 'top-right' });
                  setIsLoading(false);
                } catch (error) {
                  console.error('Error removing refence data:', error);
                  toast.error('Error removing refence data: ' + error.message, {
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
                  <Dropdown.Item onClick={() => handleViewData(id)}>
                    <Eye className='me-2' size={16} />
                    View Data
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleEditData(id)}>
                    <PencilSquare className='me-2' size={16} />
                    Edit Data
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleDeleteData(id)}>
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

  const filterFields = useMemo(() => {
    return [
      {
        label: 'Code',
        columnId: 'code',
        type: 'text',
        placeholder: 'Search by code...',
      },
      {
        label: 'E1',
        columnId: 'e1',
        type: 'text',
        placeholder: 'Search by e1...',
      },
      {
        label: 'E2',
        columnId: 'e2',
        type: 'text',
        placeholder: 'Search by e2...',
      },
      {
        label: 'F1',
        columnId: 'f1',
        type: 'text',
        placeholder: 'Search by f1...',
      },
      {
        label: 'F2',
        columnId: 'f2',
        type: 'text',
        placeholder: 'Search by f2...',
      },
      {
        label: 'M1',
        columnId: 'm1',
        type: 'text',
        placeholder: 'Search by m1...',
      },
      {
        label: 'M2',
        columnId: 'm2',
        type: 'text',
        placeholder: 'Search by m2...',
      },
      {
        label: 'M3',
        columnId: 'm3',
        type: 'text',
        placeholder: 'Search by m3...',
      },
    ];
  }, []);

  const table = useReactTable({
    data: acr.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFns: { globalSearch: globalSearchFilter },
    globalFilterFn: 'globalSearch',
    initialState: {
      columnPinning: { right: ['actions'] },
    },
  });

  useEffect(() => {
    const q = query(collection(db, 'jobCalibrationReferences', 'CR000004', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          setAcr({
            data: snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })),
            isLoading: false,
            isError: false,
          });

          return;
        }

        setAcr({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        setAcr({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <>
      <GeeksSEO title='Accuracy Class Reference - VITAR Group | Portal' />

      <ContentHeader
        title='Accuracy Class Reference'
        description='Create, manage all your calibration references in one centralize dashboard'
        badgeText='Calibration References Data Management'
        badgeText2='Listing'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' style={{ fontSize: '14px' }} />,
          },

          {
            text: 'Calibration References',
            link: '/#',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Mass',
            link: '/#',
            icon: <BoxSeamFill className='me-2' size={14} />,
          },
          {
            text: 'ACR',
            link: '/calibration-references/mass/acr',
            icon: <Table className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: 'Add Data',
            icon: <Plus size={20} />,
            variant: 'light',
            onClick: () => router.push('/calibration-references/mass/acr/create'),
          },
        ]}
      />

      <Card className='border-0 shadow-none'>
        <Card.Body className='p-4'>
          <DataTable table={table} isLoading={acr.isLoading} isError={acr.isError}>
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

export default ACRList;
