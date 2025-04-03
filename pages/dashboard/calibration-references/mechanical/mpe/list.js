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
import { collection, onSnapshot, query } from 'firebase/firestore';
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
} from 'react-bootstrap-icons';

const MPEList = () => {
  const router = useRouter();
  const auth = useAuth();

  const [mpe, setMpe] = useState({ data: [], isLoading: true, isError: false });

  const columnHelper = createColumnHelper();

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
      columnHelper.accessor('code', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Code' />,
      }),
      columnHelper.accessor('weight', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Weight' />,
      }),
      columnHelper.accessor('mpe', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='MPE' />,
      }),
      columnHelper.accessor('uncertainty', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Uncertainty' />,
      }),

      columnHelper.accessor('actions', {
        id: 'actions',
        size: 50,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Actions' />,
        cell: ({ row }) => {
          const [isLoading, setIsLoading] = useState(false);

          const { id, details } = row.original;

          const handleViewData = (id) => {};

          const handleEditData = (id) => {};

          const handleDeleteData = (id) => {};

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
        type: 'select',
        options: [
          { label: 'All Code', value: '' },
          { label: 'E2', value: 'E2' },
          { label: 'F1', value: 'F1' },
          { label: 'M1', value: 'M1' },
        ],
      },
      {
        label: 'Weight',
        columnId: 'weight',
        type: 'text',
        placeholder: 'Search by weight...',
      },
      {
        label: 'MPE',
        columnId: 'mpe',
        type: 'text',
        placeholder: 'Search by MPE...',
      },
      {
        label: 'Uncertainty',
        columnId: 'uncertainty',
        type: 'text',
        placeholder: 'Search by uncertainty...',
      },
    ];
  }, []);

  const table = useReactTable({
    data: mpe.data,
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
    const q = query(collection(db, 'jobCalibrationReferences', 'CR000002', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          setMpe({
            data: snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })),
            isLoading: false,
            isError: false,
          });

          console.log(
            snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
          );

          return;
        }

        setMpe({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        setMpe({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <>
      <GeeksSEO title='MPE - VITAR Group | Portal' />

      <ContentHeader
        title='MPE'
        description='Create, manage all your calibration references in one centralize dashboard'
        badgeText='Calibration References'
        badgeText2='Data Management'
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
            text: 'Category',
            link: '/#',
            icon: <Gear className='me-2' size={14} />,
          },
          {
            text: 'MPE',
            link: '/calibration-references/mechanical/mpe',
            icon: <Table className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: 'Add Data',
            icon: <Plus size={20} />,
            variant: 'light',
            onClick: () => router.push('/calibration-references/mechanical/mpe/create'),
          },
        ]}
      />

      <Card className='border-0 shadow-none'>
        <Card.Body className='p-4'>
          <DataTable table={table} isLoading={mpe.isLoading} isError={mpe.isError}>
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

export default MPEList;
