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
import { useMemo } from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import { Check, X } from 'react-bootstrap-icons';

const TaskTab = ({ job }) => {
  const columnHelper = createColumnHelper();

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('name', {
        id: 'title',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Title' />,
      }),
      columnHelper.accessor('description', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Description' />,
      }),
      columnHelper.accessor('isCompleted', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Completed' />,
        cell: ({ row }) => {
          const isCompleted = row.original.isCompleted;
          return isCompleted ? (
            <Check className='text-success' size={30} />
          ) : (
            <X className='text-danger' size={30} />
          );
        },
      }),
      columnHelper.accessor('isPriority', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Priority' />,
        cell: ({ row }) => {
          const isPriority = row.original.isPriority;
          return isPriority ? (
            <Check className='text-success' size={30} />
          ) : (
            <X className='text-danger' size={30} />
          );
        },
      }),
    ];
  }, []);

  const table = useReactTable({
    data: job.tasks,
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
            <h5 className='mb-0'>Additional Instructions</h5>
            <small className='text-muted'>
              List all the additional instructions needed for the job to guide the individual/team
              during calibration.
            </small>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <DataTable table={table}>
          <div className='d-flex justify-content-end'>
            <DataTableViewOptions table={table} />
          </div>
        </DataTable>
      </Card.Body>
    </Card>
  );
};

export default TaskTab;
