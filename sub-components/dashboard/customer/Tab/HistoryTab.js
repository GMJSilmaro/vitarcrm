import DataTable from '@/components/dashboard/DataTable';
import { useState } from 'react';
import { Badge, Button, Card } from 'react-bootstrap';
import { Eye } from 'react-bootstrap-icons';

const CUSTOMER_JOB_HISTORY = [
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

const COLUMNS = [
  {
    header: 'Job ID',
    accessorKey: 'id',
  },
  {
    header: 'Date',
    accessorKey: 'date',
  },
  {
    header: 'Scope',
    accessorKey: 'scope',
    cell: ({ row }) => {
      const colors = {
        Lab: 'info',
        Onsite: 'warning',
      };

      return <Badge bg={colors[row.original.scope] || 'secondary'}>{row.original.scope}</Badge>;
    },
  },
  {
    header: 'Customer',
    accessorKey: 'customer',
  },
  {
    header: 'Location',
    accessorKey: 'location',
  },
  {
    header: 'Description',
    accessorKey: 'description',
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }) => {
      const colors = {
        Completed: 'success',
        Pending: 'warning',
        'In Progress': 'primary',
        Cancelled: 'danger',
      };
      return <Badge bg={colors[row.original.status] || 'secondary'}>{row.original.status}</Badge>;
    },
  },
  {
    header: 'Duration',
    accessorKey: 'duration',
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      if (!row?.original) return null;

      return (
        <div className='d-flex align-items-center gap-2'>
          <Button
            variant='primary'
            size='sm'
            className='d-flex align-items-center gap-1'
            onClick={() => {}}
          >
            <Eye size={14} />
            <span>View</span>
          </Button>
        </div>
      );
    },
  },
];

export const HistoryTab = ({ customerData }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(CUSTOMER_JOB_HISTORY.length);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  return (
    <Card className='border-0 shadow-none'>
      <Card.Body className='p-4'>
        <DataTable
          columns={COLUMNS}
          data={CUSTOMER_JOB_HISTORY}
          loading={loading}
          currentPage={currentPage}
          perPage={perPage}
          totalRows={totalRows}
          onPageChange={setCurrentPage}
          onPerPageChange={setPerPage}
          emptyMessage='No customer equipments found'
          loadingMessage='Loading customer equipment...'
        />
      </Card.Body>
    </Card>
  );
};

export default HistoryTab;
