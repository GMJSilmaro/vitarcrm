import DataTable from '@/components/common/DataTable';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import DataTableFilter from '@/components/common/DataTableFilter';
import DataTableSearch from '@/components/common/DataTableSearch';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import ContentHeader from '@/components/dashboard/ContentHeader';
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
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import _ from 'lodash';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Dropdown, OverlayTrigger, Spinner } from 'react-bootstrap';
import {
  BoxSeam,
  Eye,
  HouseDoorFill,
  PencilSquare,
  Plus,
  ThreeDotsVertical,
  Tools,
  Trash,
} from 'react-bootstrap-icons';

const ReferenceEquipment = () => {
  const router = useRouter();
  const { category } = router.query;

  const categoryTitle = category ? _.capitalize(category) : '';

  const [equipments, setEquipments] = useState({ data: [], isLoading: true, isError: false });

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
        cell: ({ row }) => (
          <div className='d-flex align-items-center'>
            <BoxSeam className='me-2' size={14} />
            {row.original.id}
          </div>
        ),
      }),
      columnHelper.accessor('description', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Description' />,
      }),
      columnHelper.accessor('category', {
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Category' />,
        cell: ({ row }) => {
          return <div className='text-capitalize'>{row.original.category?.toLowerCase()}</div>;
        },
      }),
      columnHelper.accessor('tagId', {
        id: 'tag id',
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Tag ID' />,
      }),
      columnHelper.accessor('make', {
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Make' />,
      }),
      columnHelper.accessor('model', {
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Model' />,
      }),
      columnHelper.accessor((row) => String(row.serialNumber), {
        id: 'serial no',
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Serial No' />,
      }),
      columnHelper.accessor('certificateNo', {
        id: 'certificate no',
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Certificate No' />,
      }),
      columnHelper.accessor('traceability', {
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Traceability' />,
      }),
      columnHelper.accessor((row) => (row?.qty > 0 ? 'true' : 'false'), {
        id: 'availability',
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Availability' />,
        cell: ({ row }) => {
          const isAvailable = row.original.qty > 0;
          return (
            <Badge className='text-capitalize' bg={isAvailable ? 'success' : 'danger'}>
              {isAvailable ? 'Available' : 'Unavailable'}
            </Badge>
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

          const { id, category } = row.original;

          const categoryValue = row.original.category?.toLowerCase();

          const handleViewEquipment = (id, category) => {
            router.push(`/reference-equipment/${category}/view/${id}`);
          };

          const handleEditEquipment = (id, category) => {};

          const handleDeleteEquipment = (id, category) => {};

          const handleViewCertificate = (id, category) => {};

          return (
            <OverlayTrigger
              rootClose
              trigger='click'
              placement='left'
              overlay={
                <Dropdown.Menu show style={{ zIndex: 999 }}>
                  <Dropdown.Item onClick={() => handleViewEquipment(id, categoryValue)}>
                    <Eye className='me-2' size={16} />
                    View Equipment
                  </Dropdown.Item>

                  <Dropdown.Item onClick={() => handleEditEquipment(id, category)}>
                    <PencilSquare className='me-2' size={16} />
                    Edit Equipment
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleDeleteEquipment(id, category)}>
                    <Trash className='me-2' size={16} />
                    Delete Equipment
                  </Dropdown.Item>

                  <Dropdown.Item onClick={() => handleViewCertificate(id, category)}>
                    <Eye className='me-2' size={16} />
                    View Certificate
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
      { label: 'ID', columnId: 'id', type: 'text', placeholder: 'Search by equipment id...' },
      {
        label: 'Description',
        columnId: 'description',
        type: 'text',
        placeholder: 'Search by description...',
      },
      {
        label: 'Category',
        columnId: 'category',
        type: 'text',
        placeholder: 'Search by category...',
      },
      { label: 'Tag ID', columnId: 'tag id', type: 'text', placeholder: 'Search by tag id...' },
      { label: 'Make', columnId: 'make', type: 'text', placeholder: 'Search by make...' },
      { label: 'Model', columnId: 'model', type: 'text', placeholder: 'Search by model...' },
      {
        label: 'Serial No',
        columnId: 'serial no',
        type: 'text',
        placeholder: 'Search by serial no...',
      },
      {
        label: 'Certificate No',
        columnId: 'certificate no',
        type: 'text',
        placeholder: 'Search by certificate no...',
      },
      {
        label: 'Traceability',
        columnId: 'traceability',
        type: 'text',
        placeholder: 'Search by traceability...',
      },
      {
        label: 'Availability',
        columnId: 'availability',
        type: 'select',
        options: [
          { label: 'All Availability', value: '' },
          { label: 'Available', value: 'true' },
          { label: 'Unavailable', value: 'false' },
        ],
        placeholder: 'Search by availability...',
      },
    ];
  }, []);

  const table = useReactTable({
    data: equipments.data,
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

  //* query equipments
  useEffect(() => {
    if (!category) return;

    const q = query(
      collection(db, 'equipments'),
      orderBy('inventoryId', 'asc'),
      where('category', '==', category.toUpperCase())
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshop) => {
        if (!snapshop.empty) {
          setEquipments({
            data: snapshop.docs.map((doc) => {
              return {
                id: doc.id,
                ...doc.data(),
              };
            }),
            isLoading: false,
            isError: false,
          });

          return;
        }

        setEquipments({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        setEquipments({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, [category]);

  return (
    <>
      <GeeksSEO title={`Reference Equipments - ${categoryTitle + '- '}VITAR Group | Portal`} />

      <ContentHeader
        title={`Reference Equipments List ${categoryTitle ? `(${categoryTitle})` : ''}`}
        description='Create, manage, and track all your inventory equipment in one centralized dashboard'
        infoText='Manage inventory equipment'
        badgeText='Inventory Equipment'
        badgeText2='Reference Equipment'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' style={{ fontSize: '14px' }} />,
          },
          {
            text: 'Reference Equipment',
            link: '/reference-equipment',
            icon: <Tools className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: 'Add Equipment',
            icon: <Plus size={20} />,
            variant: 'light',
            onClick: () => router.push('/reference-equipment/create'),
          },
        ]}
      />

      <Card className='border-0 shadow-none'>
        <Card.Body className='p-4'>
          <DataTable table={table} isLoading={equipments.isLoading} isError={equipments.isError}>
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

export default ReferenceEquipment;
