import { Button, Card } from 'react-bootstrap';
import { Eye } from 'react-bootstrap-icons';

import DataTable from '../../../../components/common/DataTable';
import DataTableViewOptions from '../../../../components/common/DataTableViewOptions';
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import DataTableColumnHeader from '../../../../components/common/DataTableColumnHeader';
import { useMemo } from 'react';

const data = [
  {
    inventoryId: 'D001',
    category: 'DIMENSIONAL',
    description: 'Gauge Block Set',
    tagId: 'ST-DM-001',
    make: 'Mitutoyo',
    model: '516-496-D',
    serialNumber: 'GB12345',
    type: 'Grade 0',
    rangeMin: '1 mm',
    rangeMax: '100 mm',
    rangeMinPercent: '0.001',
    rangeMaxPercent: '0.001',
    certificateNo: 'NMIM-D-2024-001',
    traceability: 'NMIM',
  },
  {
    inventoryId: 'E001',
    category: 'ELECTRICAL',
    description: 'Multifunction Calibrator',
    tagId: 'ST-EL-001',
    make: 'Fluke',
    model: '5522A',
    serialNumber: '95678234',
    type: 'Reference',
    rangeMin: '0V',
    rangeMax: '1000V',
    rangeMinPercent: '0.002',
    rangeMaxPercent: '0.005',
    certificateNo: 'NMIM-E-2024-001',
    traceability: 'NMIM',
  },
  {
    inventoryId: 'E002',
    category: 'ELECTRICAL',
    description: 'Digital Multimeter',
    tagId: 'ST-EL-002',
    make: 'Keysight',
    model: '34465A',
    serialNumber: 'MY54321',
    type: 'Working',
    rangeMin: '0V',
    rangeMax: '750V',
    rangeMinPercent: '0.005',
    rangeMaxPercent: '0.005',
    certificateNo: 'NMIM-E-2024-002',
    traceability: 'NMIM',
  },
  {
    inventoryId: 'M001',
    category: 'MECHANICAL',
    description: 'Standard Weight',
    tagId: 'ST-MW 4',
    make: '-',
    model: '-',
    serialNumber: 'N/A',
    type: 'M1',
    rangeMin: '10 kg',
    rangeMax: '',
    rangeMinPercent: '',
    rangeMaxPercent: '',
    certificateNo: 'ST-MW 4 - 2311',
    traceability: 'NMIM',
  },
  {
    inventoryId: 'M002',
    category: 'MECHANICAL',
    description: 'Standard Weight Set',
    tagId: 'ST-MW 1',
    make: 'KERN & SOHN GMBH',
    model: '-',
    serialNumber: 'N/A',
    type: 'F1',
    rangeMin: '1 kg',
    rangeMax: '10 kg',
    rangeMinPercent: '',
    rangeMaxPercent: '',
    certificateNo: 'SST/SA/R/2024F/2309',
    traceability: 'NMIM',
  },
  {
    inventoryId: 'M003',
    category: 'MECHANICAL',
    description: 'Standard Weight Set',
    tagId: 'ST-MW 1B',
    make: 'CHANGZHOU ACCURATE WEIGHT',
    model: '-',
    serialNumber: 'N/A',
    type: 'F1',
    rangeMin: '1 mg',
    rangeMax: '500 g',
    rangeMinPercent: '',
    rangeMaxPercent: '',
    certificateNo: 'SST/SA/R/2024C/1299',
    traceability: 'NMIM',
  },
  {
    inventoryId: 'M004',
    category: 'MECHANICAL',
    description: 'Mass Comparator',
    tagId: 'ST-WB 4',
    make: 'SARTORIUS',
    model: 'CP-084-0402',
    serialNumber: '19309950',
    type: '-',
    rangeMin: '220 g',
    rangeMax: '',
    rangeMinPercent: '',
    rangeMaxPercent: '',
    certificateNo: 'NMIM-1010-M-24',
    traceability: 'NMIM',
  },
  {
    inventoryId: 'P001',
    category: 'PRESSURE',
    description: 'Digital Pressure Gauge',
    tagId: 'ST-PR-001',
    make: 'WIKA',
    model: 'CPG1500',
    serialNumber: '12345678',
    type: 'Digital',
    rangeMin: '0 bar',
    rangeMax: '10 bar',
    rangeMinPercent: '0.1',
    rangeMaxPercent: '0.1',
    certificateNo: 'NMIM-P-2024-001',
    traceability: 'NMIM',
  },
  {
    inventoryId: 'T001',
    category: 'TEMPERATURE',
    description: 'Digital Thermometer',
    tagId: 'ST-TH-001',
    make: 'Fluke',
    model: '1523',
    serialNumber: 'B87439',
    type: 'Reference',
    rangeMin: '-95°C',
    rangeMax: '150°C',
    rangeMinPercent: '0.01',
    rangeMaxPercent: '0.02',
    certificateNo: 'NMIM-T-2024-001',
    traceability: 'NMIM',
  },
  {
    inventoryId: 'V001',
    category: 'VOLUMETRIC',
    description: 'Micropipette',
    tagId: 'ST-VL-001',
    make: 'Eppendorf',
    model: 'Research plus',
    serialNumber: 'NSB4567',
    type: 'Variable',
    rangeMin: '0.5 µL',
    rangeMax: '10 µL',
    rangeMinPercent: '0.8',
    rangeMaxPercent: '0.8',
    certificateNo: 'NMIM-V-2024-001',
    traceability: 'NMIM',
  },
  {
    inventoryId: 'T001',
    category: 'TEMPERATURE',
    description: 'Digital Thermometer',
    tagId: 'ST-TH-001',
    make: 'Fluke',
    model: '1523',
    serialNumber: 'B87439',
    type: 'Reference',
    rangeMin: '-95°C',
    rangeMax: '150°C',
    rangeMinPercent: '0.01',
    rangeMaxPercent: '0.02',
    certificateNo: 'NMIM-T-2024-001',
    traceability: 'NMIM',
  },
  {
    inventoryId: 'T002',
    category: 'TEMPERATURE',
    description: 'Temperature Bath',
    tagId: 'ST-TH-002',
    make: 'WIKA',
    model: 'CTB9100-165',
    serialNumber: 'A123456',
    type: 'Working',
    rangeMin: '-35°C',
    rangeMax: '165°C',
    rangeMinPercent: '0.1',
    rangeMaxPercent: '0.1',
    certificateNo: 'NMIM-T-2024-002',
    traceability: 'NMIM',
  },
  {
    inventoryId: 'T003',
    category: 'TEMPERATURE',
    description: 'Humidity Chamber',
    tagId: 'ST-TH-003',
    make: 'ESPEC',
    model: 'PL-2KPH',
    serialNumber: '12345',
    type: 'Working',
    rangeMin: '10%RH',
    rangeMax: '95%RH',
    rangeMinPercent: '1.0',
    rangeMaxPercent: '1.0',
    certificateNo: 'NMIM-T-2024-003',
    traceability: 'NMIM',
  },
];

const EquipmentsTab = () => {
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

export default EquipmentsTab;
