import DataTable from '@/components/common/DataTable';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import DataTableFilter from '@/components/common/DataTableFilter';
import DataTableSearch from '@/components/common/DataTableSearch';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import { CATEGORY } from '@/schema/customerEquipment';
import { globalSearchFilter } from '@/utils/datatable';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import _ from 'lodash';
import React, { useCallback, useMemo, useState } from 'react';
import { Badge, Card, Nav, Tab } from 'react-bootstrap';
import { Tag } from 'react-bootstrap-icons';

const CustomerEquipment = ({ job, customer }) => {
  const [activeKey, setActiveKey] = useState(CATEGORY[0]);

  const columnHelper = createColumnHelper();

  const getSelectedCategoryCount = useCallback(
    (category) => {
      const selectedEquipments = job?.customerEquipments;
      if (!selectedEquipments || selectedEquipments?.length < 1 || !category) return 0;
      return selectedEquipments.filter((eq) => eq?.category === category)?.length || 0;
    },
    [job]
  );

  const selectedCustomerEquipmentByCategory = useMemo(() => {
    if (!job || !customer.data || customer.isLoading) return [];

    const customerEquipment = customer.data?.equipments || [];
    const selectedCustomerEquipmentIds = job?.customerEquipments?.map((eq) => eq.id) || [];
    const filteredCustomerEquipment = customerEquipment
      .filter((eq) => selectedCustomerEquipmentIds.includes(eq.id))
      .filter((eq) => eq.category === activeKey);

    return filteredCustomerEquipment;
  }, [job, customer.data, customer.isLoading, activeKey]);

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
    ];
  }, [activeKey, selectedCustomerEquipmentByCategory]);

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
    data: selectedCustomerEquipmentByCategory,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFns: { globalSearch: globalSearchFilter },
    globalFilterFn: 'globalSearch',
    initialState: {},
    getRowId: (row) => row.id,
  });

  return (
    <Card className='shadow-none'>
      <Card.Body>
        <h4 className='mb-0'>Customer</h4>
        <p className='text-muted fs-6'>
          List of customer equipment that will be calibrated, organized by category.
        </p>

        <Tab.Container className='mt-5' activeKey={activeKey} onSelect={(key) => setActiveKey(key)}>
          <Nav variant='pills' className='d-flex justify-content-center gap-3'>
            {CATEGORY.map((c) => {
              return (
                <Nav.Item key={`${c}-nav-item`} className='d-flex align-items-center'>
                  <Nav.Link eventKey={`${c}`}>
                    <Tag size={18} />
                    {c
                      .split(' ')
                      .map((str) => _.capitalize(str || ''))
                      .join(' ')}

                    <Badge
                      className={`ms-2 ${activeKey === c ? 'text-dark' : ''}`}
                      bg={activeKey === c ? 'light' : 'primary'}
                    >
                      {getSelectedCategoryCount(c)}
                    </Badge>
                  </Nav.Link>
                </Nav.Item>
              );
            })}
          </Nav>

          <hr className='my-3' />

          <Tab.Content className='h-100 w-100'>
            {CATEGORY.map((c) => (
              <Tab.Pane key={`${c}-tab-pane`} className='h-100' eventKey={c}>
                <DataTable table={table} isLoading={customer.isLoading} isError={customer.isError}>
                  <div className='d-flex justify-content-between'>
                    <DataTableSearch table={table} />

                    <div className='d-flex align-items-center gap-2'>
                      <DataTableFilter table={table} filterFields={filterFields} />
                      <DataTableViewOptions table={table} />
                    </div>
                  </div>
                </DataTable>
              </Tab.Pane>
            ))}
          </Tab.Content>
        </Tab.Container>
      </Card.Body>
    </Card>
  );
};

export default CustomerEquipment;
