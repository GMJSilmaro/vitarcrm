import DataTable from '@/components/common/DataTable';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useRouter } from 'next/router';
import React, { useMemo } from 'react';
import { Button, Card } from 'react-bootstrap';
import { Eye } from 'react-bootstrap-icons';

const ReferenceEquipment = ({ job, equipments }) => {
  const router = useRouter();
  const { workerId } = router.query;

  const columnHelper = createColumnHelper();

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('inventoryId', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='ID' />,
        size: 100,
      }),
      columnHelper.accessor('category', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Category' />,
      }),
      columnHelper.accessor('description', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Description' />,
      }),
      columnHelper.accessor('tagId', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Tag ID' />,
        size: 250,
      }),
      columnHelper.accessor('make', {
        size: 250,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Make' />,
      }),
      columnHelper.accessor('model', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Model' />,
      }),
      columnHelper.accessor('serialNumber', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Serial Number' />,
      }),
      columnHelper.accessor('type', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Type' />,
      }),
      columnHelper.accessor('rangeMin', {
        size: 50,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Range (Min)' />,
      }),
      columnHelper.accessor('rangeMax', {
        size: 50,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Range (Max)' />,
      }),
      columnHelper.accessor('certificateNo', {
        size: 50,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Certificate No.' />,
      }),
      columnHelper.accessor('traceability', {
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Traceability' />,
      }),
      ...(!workerId
        ? [
            columnHelper.accessor('actions', {
              id: 'actions',
              header: ({ column }) => <DataTableColumnHeader column={column} title='Action' />,
              enableSorting: false,
              cell: ({ row }) => {
                if (workerId || !row?.original) return null;

                const category = row.original.category?.toLowerCase();
                const inventoryId = row.original.inventoryId;

                return (
                  <Button
                    variant='primary'
                    size='sm'
                    className='d-flex align-items-center gap-1'
                    onClick={() => {
                      router.push(`/reference-equipment/${category}/view/${inventoryId}`);
                    }}
                  >
                    <Eye className='me-1' size={14} />
                    <span>View</span>
                  </Button>
                );
              },
            }),
          ]
        : []),
    ];
  }, [workerId]);

  const table = useReactTable({
    data: equipments.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <Card className='border-0 shadow-none'>
      <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h5 className='mb-0'>Reference Equipment</h5>
            <small className='text-muted'>Details about the equipment needed for the job.</small>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <DataTable table={table} isLoading={equipments.isLoading} isError={equipments.isError}>
          <div className='d-flex justify-content-end'>
            <DataTableViewOptions table={table} />
          </div>
        </DataTable>
      </Card.Body>
    </Card>
  );
};
export default ReferenceEquipment;
