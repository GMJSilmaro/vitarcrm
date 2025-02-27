import { Button, Card, Dropdown, OverlayTrigger, Spinner } from 'react-bootstrap';
import { CardList, Eye, PencilSquare, ThreeDotsVertical, Trash } from 'react-bootstrap-icons';

import DataTable from '../../../../components/common/DataTable';
import DataTableViewOptions from '../../../../components/common/DataTableViewOptions';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import DataTableColumnHeader from '../../../../components/common/DataTableColumnHeader';
import { useEffect, useMemo, useState } from 'react';
import { fuzzyFilter, globalSearchFilter } from '@/utils/datatable';
import DataTableSearch from '@/components/common/DataTableSearch';
import { useRouter } from 'next/router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import DataTableFilter from '@/components/common/DataTableFilter';

const EquipmentsTab = () => {
  const router = useRouter();
  const { id } = router.query;

  const columnHelper = createColumnHelper();

  const [customerEquipments, setCustomerEquipments] = useState({data: [], isLoading: true, isError: false}); // prettier-ignore

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('id', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='ID' />,
        size: 100,
      }),
      columnHelper.accessor('description', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Description' />,
      }),
      columnHelper.accessor('make', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Make' />,
      }),
      columnHelper.accessor('model', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Model' />,
      }),
      columnHelper.accessor('serialNumber', {
        id: 'serial number',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Serial Number' />,
      }),
      columnHelper.accessor('rangeMin', {
        id: 'range min',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Range (Min)' />,
      }),
      columnHelper.accessor('rangeMax', {
        id: 'range max',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Range (Max)' />,
      }),
      columnHelper.accessor('uom', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='UOM' />,
      }),
      columnHelper.accessor('notes', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Notes' />,
      }),
      columnHelper.accessor('actions', {
        id: 'actions',
        size: 50,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Actions' />,
        enableSorting: false,
        cell: ({ row }) => {
          const [isLoading, setIsLoading] = useState(false);

          return (
            <OverlayTrigger
              rootClose
              trigger='click'
              placement='left-start'
              overlay={
                <Dropdown.Menu show style={{ zIndex: 999 }}>
                  <Dropdown.Item onClick={() => {}}>
                    <Eye className='me-2' size={16} />
                    View Equipment
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
        label: 'Equipment ID',
        columnId: 'id',
        type: 'text',
        placeholder: 'Search by equipment id...',
      },
      {
        label: 'Description',
        columnId: 'description',
        type: 'text',
        placeholder: 'Search by description...',
      },
      {
        label: 'Make',
        columnId: 'make',
        type: 'text',
        placeholder: 'Search by make...',
      },
      {
        label: 'Model',
        columnId: 'model',
        type: 'text',
        placeholder: 'Search by model...',
      },
      {
        label: 'Serial Number',
        columnId: 'serial number',
        type: 'text',
        placeholder: 'Search by serial number...',
      },
      {
        label: 'Range (Min)',
        columnId: 'range min',
        type: 'text',
        placeholder: 'Search by range min...',
      },
      {
        label: 'Range (Max)',
        columnId: 'range max',
        type: 'text',
        placeholder: 'Search by range max...',
      },
      {
        label: 'UOM',
        columnId: 'uom',
        type: 'text',
        placeholder: 'Search by uom...',
      },
      {
        label: 'Notes',
        columnId: 'notes',
        type: 'text',
        placeholder: 'Search by notes...',
      },
    ];
  }, []);

  const table = useReactTable({
    data: customerEquipments.data,
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

  //* query customer equipments
  useEffect(() => {
    if (!id) return;

    const q = query(collection(db, 'customerEquipments'), where('customerId', '==', id));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          setCustomerEquipments({
            data: snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })),
            isLoading: false,
            isError: false,
          });

          return;
        }

        setCustomerEquipments({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        setCustomerEquipments({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <Card className='border-0 shadow-none'>
      <Card.Body className='p-4'>
        <DataTable
          table={table}
          isLoading={customerEquipments.isLoading}
          isError={customerEquipments.isError}
        >
          <div className='d-flex justify-content-between'>
            <DataTableSearch table={table} />

            <div className='d-flex align-items-center gap-2'>
              <DataTableFilter table={table} filterFields={filterFields} />
              <DataTableViewOptions table={table} />
            </div>
          </div>
        </DataTable>
      </Card.Body>
    </Card>
  );
};

export default EquipmentsTab;
