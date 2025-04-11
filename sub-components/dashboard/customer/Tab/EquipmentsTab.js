import { Badge, Button, Card, Dropdown, OverlayTrigger, Spinner } from 'react-bootstrap';
import { CardList, Eye, PencilSquare, Plus, ThreeDotsVertical, Trash } from 'react-bootstrap-icons';

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
import { collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import DataTableFilter from '@/components/common/DataTableFilter';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import _ from 'lodash';

const EquipmentsTab = () => {
  const router = useRouter();
  const { customerId } = router.query;

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
      columnHelper.accessor('category', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Category' />,
        cell: ({ row }) => {
          const category = row.original.category;

          return (
            <Badge bg='light' className='text-dark'>
              {category
                ? category
                    ?.split(' ')
                    ?.map((str) => _.capitalize(str))
                    ?.join(' ')
                : 'N/A'}
            </Badge>
          );
        },
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

          const { id } = row.original;

          const handleViewEquipment = (id) => {
            router.push(`/customers/${customerId}/equipment/view/${id}`);
          };

          const handleEditEquipment = (id) => {
            router.push(`/customers/${customerId}/equipment/edit-customer-equipment/${id}`);
          };

          const handleDeleteEquipment = (id) => {
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

                  const equipmentRef = doc(db, 'customerEquipments', id);

                  await deleteDoc(equipmentRef);

                  toast.success('Equipment removed successfully', { position: 'top-right' });
                  setIsLoading(false);
                } catch (error) {
                  console.error('Error removing equipment:', error);
                  toast.error('Error removing equipment: ' + error.message, {
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
                  {/* <Dropdown.Item onClick={() => {}}>
                    <Eye className='me-2' size={16} />
                    View Equipment
                  </Dropdown.Item> */}
                  <Dropdown.Item onClick={() => handleEditEquipment(id)}>
                    <PencilSquare className='me-2' size={16} />
                    Edit Equipment
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleDeleteEquipment(id)}>
                    <Trash className='me-2' size={16} />
                    Delete Equipment
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
      {
        label: 'Category',
        columnId: 'category',
        type: 'select',
        options: [
          { label: 'All Category', value: '' },
          { label: 'Temperature & Humidity', value: 'TEMPERATURE & HUMIDITY' },
          { label: 'Pressure', value: 'PRESSURE' },
          { label: 'Electrical', value: 'ELECTRICAL' },
          { label: 'Dimensional', value: 'DIMENSIONAL' },
          { label: 'Volumetric', value: 'VOLUMETRIC' },
          { label: 'Mass', value: 'MASS' },
        ],
        placeholder: 'Search by category...',
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
    if (!customerId) return;

    const q = query(collection(db, 'customerEquipments'), where('customerId', '==', customerId));

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
          <div className='d-flex flex-column row-gap-3 flex-lg-row justify-content-lg-between'>
            <DataTableSearch table={table} />

            <div className='d-flex align-items-center gap-2'>
              <Button
                size='sm'
                onClick={() => router.push(`/customers/${customerId}/equipment/create`)}
                className='d-flex'
              >
                <Plus className='me-2' size={18} />
                Add
              </Button>

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
