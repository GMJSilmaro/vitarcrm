import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useMemo } from 'react';
import { Badge, Button, Card } from 'react-bootstrap';
import { Eye } from 'react-bootstrap-icons';
import DataTableViewOptions from '../../../../components/common/DataTableViewOptions';
import DataTable from '../../../../components/common/DataTable';
import DataTableColumnHeader from '../../../../components/common/DataTableColumnHeader';

const data = [
  {
    id: '0000001',
    date: '2024-03-20',
    scope: 'Lab',
    customer: 'A & T INGREDIENTS SDN. BHD.',
    location: 'NO. 50 & 51, JALAN NILAI 7/3',
    description: 'Heat and Cool System Maintenance',
    status: 'Completed',
    duration: '2 hours',
  },
  {
    id: '0000002',
    date: '2024-03-22',
    scope: 'Onsite',
    customer: 'Tech Solutions Sdn. Bhd.',
    location: '123 Jalan Teknologi, Kuala Lumpur',
    description: 'Server Rack Installation',
    status: 'Completed',
    duration: '4 hours',
  },
  {
    id: '0000003',
    date: '2024-04-05',
    scope: 'Lab',
    customer: 'Green Energy Corp.',
    location: 'Lot 89, Industrial Park, Selangor',
    description: 'Battery Performance Testing',
    status: 'Completed',
    duration: '3 hours',
  },
  {
    id: '0000004',
    date: '2024-04-10',
    scope: 'Onsite',
    customer: 'ABC Manufacturing Sdn. Bhd.',
    location: 'No. 12, Jalan Perusahaan, Penang',
    description: 'Machine Calibration & Inspection',
    status: 'Completed',
    duration: '5 hours',
  },
  {
    id: '0000005',
    date: '2024-04-15',
    scope: 'Lab',
    customer: 'Smart Electronics Ltd.',
    location: 'Lab 5, Innovation Hub, Cyberjaya',
    description: 'Circuit Board Analysis',
    status: 'Completed',
    duration: '2.5 hours',
  },
];

export const HistoryTab = () => {
  const columnHelper = createColumnHelper();

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('id', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Job ID' />,
        size: 100,
      }),
      columnHelper.accessor('date', {
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Date' />,
      }),
      columnHelper.accessor('scope', {
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Scope' />,
        cell: ({ row }) => {
          const colors = {
            Lab: 'info',
            Onsite: 'warning',
          };

          return <Badge bg={colors[row.original.scope] || 'secondary'}>{row.original.scope}</Badge>;
        },
      }),
      columnHelper.accessor('customer', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Customer' />,
      }),
      columnHelper.accessor('location', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Location' />,
      }),
      columnHelper.accessor('description', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Description' />,
      }),
      columnHelper.accessor('status', {
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
        cell: ({ row }) => {
          const colors = {
            Completed: 'success',
            Pending: 'warning',
            'In Progress': 'primary',
            Cancelled: 'danger',
          };
          return (
            <Badge bg={colors[row.original.status] || 'secondary'}>{row.original.status}</Badge>
          );
        },
      }),
      columnHelper.accessor('duration', {
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Duration' />,
      }),
      columnHelper.accessor('actions', {
        id: 'actions',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Action' />,
        enableSorting: false,
        cell: ({ row }) => {
          if (!row?.original) return null;

          return (
            <Button
              variant='primary'
              size='sm'
              className='d-flex align-items-center gap-1'
              onClick={() => {}}
            >
              <Eye className='me-1' size={14} />
              <span>View</span>
            </Button>
          );
        },
      }),
    ];
  }, []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <Card className='border-0 shadow-none'>
      <Card.Body className='p-4'>
        <DataTable table={table}>
          <div className='d-flex justify-content-end'>
            <DataTableViewOptions table={table} />
          </div>
        </DataTable>
      </Card.Body>
    </Card>
  );
};

export default HistoryTab;
