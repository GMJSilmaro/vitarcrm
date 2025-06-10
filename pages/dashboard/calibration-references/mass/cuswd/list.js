import DataTable from '@/components/common/DataTable';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import DataTableFilter from '@/components/common/DataTableFilter';
import DataTableSearch from '@/components/common/DataTableSearch';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import ContentHeader from '@/components/dashboard/ContentHeader';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { globalSearchFilter } from '@/utils/datatable';
import { GeeksSEO } from '@/widgets';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { collection, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Dropdown, OverlayTrigger, Spinner } from 'react-bootstrap';
import {
  Eye,
  HouseDoorFill,
  ListColumns,
  PencilSquare,
  Plus,
  ThreeDotsVertical,
  Trash,
  Table,
  Gear,
  BoxSeam,
  BoxSeamFill,
} from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const CUSWDList = () => {
  const router = useRouter();
  const auth = useAuth();

  const [cuswd, setCuswd] = useState({ data: [], isLoading: true, isError: false });

  const columnHelper = createColumnHelper();

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('index', {
        id: 'index',
        header: ({ column }) => <DataTableColumnHeader column={column} title='#' />,
        enableSorting: false,
        size: 50,
        cell: ({ row, table }) => (
          <div>
            {(table.getSortedRowModel()?.flatRows?.findIndex((flatRow) => flatRow.id === row.id) ||
              0) + 1}
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.tagId, {
        id: 'tag id',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Tag Id' />,
      }),
      columnHelper.accessor('class', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Class' />,
      }),
      columnHelper.accessor((row) => row.nominalValue, {
        id: 'nominal value (g)',
        size: 150,
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>
            <div className='d-flex flex-column align-items-center row-gap-0.5'>
              <div>Nominal Value</div>
              <div>(g)</div>
            </div>
          </DataTableColumnHeader>
        ),
      }),
      columnHelper.accessor((row) => row.currentYearError, {
        id: 'current year error (mg)',
        size: 150,
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>
            <div className='d-flex flex-column align-items-center row-gap-0.5'>
              <div>Current Year</div>
              <div>Error (mg)</div>
            </div>
          </DataTableColumnHeader>
        ),
      }),
      columnHelper.accessor((row) => row.currentYearActualValue, {
        id: 'current year actual value (g)',
        size: 150,
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>
            <div className='d-flex flex-column align-items-center row-gap-0.5'>
              <div>Current Year</div>
              <div>Actual Value (g)</div>
            </div>
          </DataTableColumnHeader>
        ),
      }),
      columnHelper.accessor((row) => row.eUncertainty, {
        id: 'e. uncertainty (mg)',
        size: 150,
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>
            <div className='d-flex flex-column align-items-center row-gap-0.5'>
              <div>E. Uncertainty </div>
              <div>(mg)</div>
            </div>
          </DataTableColumnHeader>
        ),
      }),
      columnHelper.accessor((row) => row.uCertg, {
        id: 'u cert (g)',
        size: 150,
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>
            <div className='d-flex flex-column align-items-center row-gap-0.5'>
              <div>
                U<sub>cert</sub>
              </div>
              <div>(g)</div>
            </div>
          </DataTableColumnHeader>
        ),
      }),
      columnHelper.accessor((row) => row.uCert2g2, {
        id: 'u cert2 (g2)',
        size: 150,
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>
            <div className='d-flex flex-column align-items-center row-gap-0.5'>
              <div>
                U
                <sub>
                  cert<sup>2</sup>
                </sub>
              </div>
              <div>
                (g<sup>2</sup>)
              </div>
            </div>
          </DataTableColumnHeader>
        ),
      }),
      columnHelper.accessor((row) => row.uCert4vG4, {
        id: 'u cert4 (g4)',
        size: 150,
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>
            <div className='d-flex flex-column align-items-center row-gap-0.5'>
              <div>
                U
                <sub>
                  cert<sup>4</sup>
                </sub>{' '}
                / <small>V</small>
              </div>
              <div>
                (g<sup>4</sup>)
              </div>
            </div>
          </DataTableColumnHeader>
        ),
      }),
      columnHelper.accessor((row) => row.uInstg, {
        id: 'u inst (g)',
        size: 150,
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>
            <div className='d-flex flex-column align-items-center row-gap-0.5'>
              <div>
                U<sub>inst</sub>
              </div>
              <div>(g)</div>
            </div>
          </DataTableColumnHeader>
        ),
      }),
      columnHelper.accessor((row) => row.uInst2g2, {
        id: 'u inst2 (g2)',
        size: 150,
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>
            <div className='d-flex flex-column align-items-center row-gap-0.5'>
              <div>
                U
                <sub>
                  inst<sup>2</sup>
                </sub>
              </div>
              <div>
                (g<sup>2</sup>)
              </div>
            </div>
          </DataTableColumnHeader>
        ),
      }),
      columnHelper.accessor((row) => row.uInst4vG4, {
        id: 'u inst4 (g4)',
        size: 150,
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>
            <div className='d-flex flex-column align-items-center row-gap-0.5'>
              <div>
                U
                <sub>
                  inst<sup>4</sup>
                </sub>{' '}
                / <small>V</small>
              </div>
              <div>
                (g<sup>4</sup>)
              </div>
            </div>
          </DataTableColumnHeader>
        ),
      }),
      columnHelper.accessor((row) => row.prKgMn3, {
        id: 'pr (kg m3)',
        size: 150,
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>
            <div className='d-flex flex-column align-items-center row-gap-0.5'>
              <div>
                P<sub>r</sub>
              </div>
              <div>
                (kg m<sup>-3</sup>)
              </div>
            </div>
          </DataTableColumnHeader>
        ),
      }),
      columnHelper.accessor((row) => row.uPrKgMn3, {
        id: '(U)pr (kg m3)',
        size: 150,
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>
            <div className='d-flex flex-column align-items-center row-gap-0.5'>
              <div>
                <sup>U</sup>(P<sub>r</sub>)
              </div>
              <div>
                (kg m<sup>-3</sup>)
              </div>
            </div>
          </DataTableColumnHeader>
        ),
      }),
      columnHelper.accessor((row) => row.lastYearError, {
        id: 'last year error (mg)',
        size: 150,
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>
            <div className='d-flex flex-column align-items-center row-gap-0.5'>
              <div>Last Year</div>
              <div>Error (mg)</div>
            </div>
          </DataTableColumnHeader>
        ),
      }),
      columnHelper.accessor((row) => row.lastYearActualValue, {
        id: 'last year actual value (g)',
        size: 150,
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>
            <div className='d-flex flex-column align-items-center row-gap-0.5'>
              <div>Last Year Actual</div>
              <div>Actual Value (g)</div>
            </div>
          </DataTableColumnHeader>
        ),
      }),
      columnHelper.accessor((row) => row.driftg, {
        id: 'drift (g)',
        size: 150,
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>
            <div className='d-flex flex-column align-items-center row-gap-0.5'>
              <div>Drift</div>
              <div>(g)</div>
            </div>
          </DataTableColumnHeader>
        ),
      }),
      columnHelper.accessor('actions', {
        id: 'actions',
        size: 50,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Actions' />,
        cell: ({ row }) => {
          const [isLoading, setIsLoading] = useState(false);

          const { id } = row.original;

          const handleViewData = (id) => {
            router.push(`/calibration-references/mass/cuswd/view/${id}`);
          };

          const handleEditData = (id) => {
            router.push(`/calibration-references/mass/cuswd/edit-cuswd/${id}`);
          };

          const handleDeleteData = (id) => {
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

                  const cuswdDocRef = doc(db, 'jobCalibrationReferences', 'CR000001', 'data', id);

                  await deleteDoc(cuswdDocRef);

                  toast.success('Refence data removed successfully', { position: 'top-right' });
                  setIsLoading(false);
                } catch (error) {
                  console.error('Error removing refence data:', error);
                  toast.error('Error removing refence data: ' + error.message, {
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
              placement='left'
              offset={[0, 20]}
              overlay={
                <Dropdown.Menu show style={{ zIndex: 999 }}>
                  <Dropdown.Item onClick={() => handleViewData(id)}>
                    <Eye className='me-2' size={16} />
                    View Data
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleEditData(id)}>
                    <PencilSquare className='me-2' size={16} />
                    Edit Data
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleDeleteData(id)}>
                    <Trash className='me-2' size={16} />
                    Delete Data
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
        label: 'Tag ID',
        columnId: 'tag id',
        type: 'text',
        placeholder: 'Search by tag id...',
      },
      {
        label: 'Class',
        columnId: 'class',
        type: 'text',
        placeholder: 'Search by class...',
      },
      {
        label: 'Nominal Value (g)',
        columnId: 'nominal value (g)',
        type: 'text',
        placeholder: 'Search by nominal Value (g)...',
      },
      {
        label: 'Current Year Error (mg)',
        columnId: 'current year error (mg)',
        type: 'text',
        placeholder: 'Search by current year error (mg)...',
      },
      {
        label: 'Current Year Actual Value (g)',
        columnId: 'current year actual value (g)',
        type: 'text',
        placeholder: 'Search by current year actual value (g)...',
      },

      {
        label: 'E. Uncertainty (mg)',
        columnId: 'e. uncertainty (mg)',
        type: 'text',
        placeholder: 'Search by e. uncertainty (mg)...',
      },
      {
        label: 'U Cert (g)',
        columnId: 'u cert (g)',
        type: 'text',
        placeholder: 'Search by u cert (g)...',
      },
      {
        label: 'U Cert2 (g2)',
        columnId: 'u cert2 (g2)',
        type: 'text',
        placeholder: 'Search by u cert2 (g2)...',
      },
      {
        label: 'U Cert4 (g4)',
        columnId: 'u cert4 (g4)',
        type: 'text',
        placeholder: 'Search by u cert4 (g4)...',
      },
      {
        label: 'U Inst (g)',
        columnId: 'u inst (g)',
        type: 'text',
        placeholder: 'Search by u inst (g)...',
      },
      {
        label: 'U Inst2 (g2)',
        columnId: 'u inst2 (g2)',
        type: 'text',
        placeholder: 'Search by u inst2 (g2)...',
      },

      {
        label: 'U Inst4 (g4)',
        columnId: 'u inst4 (g4)',
        type: 'text',
        placeholder: 'Search by u inst4 (g4)...',
      },
      {
        label: 'Pr (kg m3)',
        columnId: 'pr (kg m3)',
        type: 'text',
        placeholder: 'Search by pr (kg m3)...',
      },
      {
        label: '(U)Pr (kg m3)',
        columnId: '(U)pr (kg m3)',
        type: 'text',
        placeholder: 'Search by (U)Pr (kg m3)...',
      },
      {
        label: 'Last Year Error (mg)',
        columnId: 'last year error (mg)',
        type: 'text',
        placeholder: 'Search by last year error (mg)...',
      },
      {
        label: 'Last Year Actual Value (g)',
        columnId: 'last year actual value (g)',
        type: 'text',
        placeholder: 'Search by last actual value (g)...',
      },
      {
        label: 'Drift (g)',
        columnId: 'drift (g)',
        type: 'text',
        placeholder: 'Search by drift (g)...',
      },
    ];
  }, []);

  const table = useReactTable({
    data: cuswd.data,
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

  useEffect(() => {
    const q = query(collection(db, 'jobCalibrationReferences', 'CR000001', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          setCuswd({
            data: snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })),
            isLoading: false,
            isError: false,
          });

          return;
        }

        setCuswd({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        setCuswd({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <>
      <GeeksSEO title='Correction, Uncertainty of the Standard Weight & Drift - VITAR Group | Portal' />

      <ContentHeader
        title='Correction, Uncertainty of the Standard Weight & Drift'
        description='Create, manage all your calibration references in one centralize dashboard'
        badgeText='Calibration References Data Management'
        badgeText2='Listing'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' style={{ fontSize: '14px' }} />,
          },
          {
            text: 'Calibration References',
            link: '/calibration-references/mass/cuswd',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Mass',
            link: '/#',
            icon: <BoxSeamFill className='me-2' size={14} />,
          },
          {
            text: 'Correction, Uncertainty of the Standard Weight & Drift',
            link: '/calibration-references/mass/cuswd',
            icon: <Table className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: 'Add Data',
            icon: <Plus size={20} />,
            variant: 'light',
            onClick: () => router.push('/calibration-references/mass/cuswd/create'),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body className='p-4'>
          <DataTable table={table} isLoading={cuswd.isLoading} isError={cuswd.isError}>
            <div className='d-flex flex-column row-gap-3 flex-lg-row justify-content-lg-between'>
              <DataTableSearch table={table} />

              <div className='d-flex align-items-center gap-2'>
                <DataTableFilter table={table} filterFields={filterFields} />
                <DataTableViewOptions table={table} />
              </div>
            </div>
          </DataTable>
        </Card.Body>
      </Card>
    </>
  );
};

export default CUSWDList;
