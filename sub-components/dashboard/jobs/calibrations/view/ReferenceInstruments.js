import DataTable from '@/components/common/DataTable';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import DataTableSearch from '@/components/common/DataTableSearch';
import { fuzzyFilter, globalSearchFilter } from '@/utils/datatable';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import React, { useMemo } from 'react';
import { Card } from 'react-bootstrap';

const ReferenceInstruments = ({ instruments }) => {
  const columnHelper = createColumnHelper();

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('tagId', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='ID No' />,
      }),
      columnHelper.accessor('description', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Description' />,
      }),
      columnHelper.accessor('serialNumber', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Serial No.' />,
      }),
      columnHelper.accessor('certificateNo', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Cert No.' />,
      }),
      columnHelper.accessor('traceability', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Traceability' />,
      }),
      columnHelper.accessor('Due Date', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Due Date' />,
        cell: ({ row }) => {
          const dueDate = row.original.dueDate;
          if (!dueDate) return <div>-</div>;
          return <div>{format(new Date(dueDate), 'dd-MM-yyyy')}</div>;
        },
      }),
    ];
  }, []);

  const table = useReactTable({
    data: instruments.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFns: { globalSearch: globalSearchFilter },
    globalFilterFn: 'globalSearch',
  });

  return (
    <Card className='border-0 shadow-none'>
      <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h5 className='mb-0'>Instruments</h5>
            <small className='text-muted'>
              The instruments/equipments listed below are based on the selected equipments in the
              job but filtered out based on the selected category.
            </small>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <DataTable table={table} isLoading={instruments.isLoading} isError={instruments.isError}>
          <div className='d-flex flex-column row-gap-3 flex-lg-row justify-content-lg-between'>
            <DataTableSearch table={table} />
          </div>
        </DataTable>
      </Card.Body>
    </Card>
  );
};

export default ReferenceInstruments;
