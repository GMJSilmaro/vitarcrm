import { Eye, FileText } from 'react-bootstrap-icons';
import { Button } from 'react-bootstrap';

export const getCalibrationColumns = (router, onViewCertificate) => [
  { 
    header: 'Inventory ID', 
    accessorKey: 'inventoryId'
  },
  { 
    header: 'Category', 
    accessorKey: 'category'
  },
  { 
    header: 'Description', 
    accessorKey: 'description'
  },
  { 
    header: 'Tag ID', 
    accessorKey: 'tagId'
  },
  { 
    header: 'Make', 
    accessorKey: 'make'
  },
  { 
    header: 'Model', 
    accessorKey: 'model'
  },
  { 
    header: 'Serial Number', 
    accessorKey: 'serialNumber'
  },
  { 
    header: 'Type', 
    accessorKey: 'type'
  },
  { 
    header: 'Range (Min)', 
    accessorKey: 'rangeMin'
  },
  { 
    header: 'Range (Max)', 
    accessorKey: 'rangeMax'
  },
  { 
    header: 'Certificate No', 
    accessorKey: 'certificateNo'
  },
  { 
    header: 'Traceability', 
    accessorKey: 'traceability'
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      if (!row?.original) return null;
      
      return (
        <div className="d-flex align-items-center gap-2">
          <Button
            variant="danger"
            size="sm"
            className="d-flex align-items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              const category = row.original.category?.toLowerCase();
              if (category) {
                router.push(`/dashboard/calibration/${category}/${row.original.inventoryId}`);
              }
            }}
          >
            <Eye size={14} />
            <span>View</span>
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            className="d-flex align-items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              if (onViewCertificate) {
                onViewCertificate(row.original);
              }
            }}
          >
            <FileText size={14} />
            <span>Certificate</span>
          </Button>
        </div>
      );
    }
  }
];

export const tableStyles = {
  table: {
    width: '100%'
  },
  header: {
    background: '#f8f9fa',
    fontWeight: '600',
    padding: '12px 8px',
    borderBottom: '2px solid #dee2e6'
  },
  cell: {
    padding: '12px 8px',
    borderBottom: '1px solid #dee2e6'
  }
}; 