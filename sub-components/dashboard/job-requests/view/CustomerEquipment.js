import DataTable from '@/components/common/DataTable';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import DataTableFilter from '@/components/common/DataTableFilter';
import DataTableSearch from '@/components/common/DataTableSearch';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import { CATEGORY } from '@/schema/customerEquipment';
import { dateFilter, dateSort, globalSearchFilter } from '@/utils/datatable';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import _ from 'lodash';
import React, { useCallback, useMemo, useState } from 'react';
import { Badge, Card, Nav, Tab } from 'react-bootstrap';
import { Tag } from 'react-bootstrap-icons';

const CustomerEquipment = ({ jobRequest, customer }) => {
  const [activeKey, setActiveKey] = useState(CATEGORY[0]);

  const columnHelper = createColumnHelper();

  const getSelectedCategoryCount = useCallback(
    (category) => {
      const selectedEquipments = jobRequest?.customerEquipments;
      if (!selectedEquipments || selectedEquipments?.length < 1 || !category) return 0;
      return selectedEquipments.filter((eq) => eq?.category === category)?.length || 0;
    },
    [jobRequest]
  );

  const selectedCustomerEquipmentByCategory = useMemo(() => {
    if (!jobRequest || !customer.data || customer.isLoading) return [];

    const customerEquipment = customer.data?.equipments || [];
    const selectedCustomerEquipmentIds = jobRequest?.customerEquipments?.map((eq) => eq.id) || [];
    const filteredCustomerEquipment = customerEquipment
      .filter((eq) => selectedCustomerEquipmentIds.includes(eq.id))
      .filter((eq) => eq.category === activeKey);

    return filteredCustomerEquipment;
  }, [jobRequest, customer.data, customer.isLoading, activeKey]);

  const columns = useMemo(() => {
    return [
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
      // columnHelper.accessor('make', {
      //   header: ({ column }) => <DataTableColumnHeader column={column} title='Make' />,
      // }),
      // columnHelper.accessor('model', {
      //   header: ({ column }) => <DataTableColumnHeader column={column} title='Model' />,
      // }),
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
      columnHelper.accessor('tolerance', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Tolerance' />,
      }),
      columnHelper.accessor((row) => row?.uom || '', {
        id: 'unit',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Unit' />,
      }),
      columnHelper.accessor(
        (row) => (row.original?.dueDate ? format(row.original.dueDate, 'dd-MM-yyyy') : ''),
        {
          id: 'due date',
          header: ({ column }) => <DataTableColumnHeader column={column} title='Due Date' />,
          cell: ({ row }) => {
            const dueDate = row.original?.dueDate;
            if (!dueDate) return null;
            return <div>{format(dueDate, 'dd-MM-yyyy')}</div>;
          },
          filterFn: (row, columnId, filterValue, addMeta) => {
            const dueDate = row.original?.dueDate;
            const filterDateValue = new Date(filterValue);
            return dateFilter(dueDate, filterDateValue);
          },
          sortingFn: (rowA, rowB, columnId) => {
            const rowADueDate = rowA.original?.dueDate;
            const rowBDueDate = rowB.original?.dueDate;
            return dateSort(rowADueDate, rowBDueDate);
          },
        }
      ),
      columnHelper.accessor(
        (row) => (row.original?.calDate ? format(row.original.calDate, 'dd-MM-yyyy') : ''),
        {
          id: 'cal date',
          header: ({ column }) => <DataTableColumnHeader column={column} title='Cal Date' />,
          cell: ({ row }) => {
            const calDate = row.original?.calDate;
            if (!calDate) return null;
            return <div>{format(calDate, 'dd-MM-yyyy')}</div>;
          },
          filterFn: (row, columnId, filterValue, addMeta) => {
            const calDate = row.original?.calDate;
            const filterDateValue = new Date(filterValue);
            return dateFilter(calDate, filterDateValue);
          },
          sortingFn: (rowA, rowB, columnId) => {
            const rowACalDate = rowA.original?.calDate;
            const rowBCalDate = rowB.original?.calDate;
            return dateSort(rowACalDate, rowBCalDate);
          },
        }
      ),
      columnHelper.accessor('notes', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Notes' />,
      }),
    ];
  }, [activeKey, selectedCustomerEquipmentByCategory]);

  const filterFields = useMemo(() => {
    return [
      {
        label: 'Description',
        columnId: 'description',
        type: 'text',
        placeholder: 'Search by description...',
      },
      // {
      //   label: 'Make',
      //   columnId: 'make',
      //   type: 'text',
      //   placeholder: 'Search by make...',
      // },
      // {
      //   label: 'Model',
      //   columnId: 'model',
      //   type: 'text',
      //   placeholder: 'Search by model...',
      // },
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
        label: 'Tolerance',
        columnId: 'tolerance',
        type: 'text',
        placeholder: 'Search by tolerance...',
      },
      {
        label: 'Unit',
        columnId: 'unit',
        type: 'text',
        placeholder: 'Search by unit...',
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
        <h4 className='mb-0'>Calibration Items</h4>
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
                  <div className='d-flex flex-column row-gap-3 flex-lg-row justify-content-lg-between'>
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
