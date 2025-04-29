import DataTable from '@/components/common/DataTable';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import DataTableFilter from '@/components/common/DataTableFilter';
import DataTableSearch from '@/components/common/DataTableSearch';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import PageHeader from '@/components/common/PageHeader';
import ContentHeader from '@/components/dashboard/ContentHeader';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import CurrentJobCard from '@/sub-components/dashboard/user/jobs/CurrentJobCard';
import { fuzzyFilter, globalSearchFilter } from '@/utils/datatable';
import { GeeksSEO } from '@/widgets';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { collection, deleteDoc, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Dropdown, OverlayTrigger, Spinner } from 'react-bootstrap';
import {
  ArrowLeftShort,
  BriefcaseFill,
  BuildingFill,
  CardList,
  Eye,
  FileEarmarkArrowDown,
  HouseDoorFill,
  PencilSquare,
  PersonLinesFill,
  Plus,
  Printer,
  Speedometer,
  ThreeDotsVertical,
  Trash,
  WrenchAdjustableCircleFill,
} from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const JobCalibration = () => {
  const router = useRouter();
  const auth = useAuth();

  const { jobId, workerId } = router.query;

  const [job, setJob] = useState({ data: null, isLoading: true, isError: false });
  const [calibrations, setCalibrations] = useState({ data: [], isLoading: true, isError: false });

  const columnHelper = createColumnHelper();

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('id', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='ID' />,
        size: 100,
        cell: ({ row }) => (
          <div>
            <Speedometer className='me-2' size={14} />
            {row.original.id}
          </div>
        ),
      }),
      columnHelper.accessor('certificateNumber', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Certificate No.' />,
        size: 100,
        cell: ({ row }) => (
          <div>
            <CardList className='me-2' size={14} />
            {row.original.certificateNumber}
          </div>
        ),
      }),
      columnHelper.accessor('category', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Category' />,
        size: 100,
        cell: ({ row }) => (
          <div className='text-capitalize'>{row?.original?.category.toLowerCase() || 'N/A'}</div>
        ),
      }),
      columnHelper.accessor((row) => row?.location?.name || 'N/A', {
        id: 'location',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Location' />,
        cell: ({ row }) => {
          const location = row?.original?.location?.name || 'N/A';
          return (
            <div>
              <BuildingFill className='me-2' size={14} /> {location}
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row?.description?.name || 'N/A', {
        id: 'equipment',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Equipment' />,
        cell: ({ row }) => {
          const description = row?.original?.description?.name || 'N/A';
          return (
            <div>
              <WrenchAdjustableCircleFill className='me-2' size={14} /> {description}
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row?.calibratedBy?.name || 'N/A', {
        id: 'calibrated by',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Calibrated By' />,
        cell: ({ row }) => {
          const calibratedBy = row?.original?.calibratedBy?.name || 'N/A';
          return (
            <div>
              <PersonLinesFill className='me-2' size={14} /> {calibratedBy}
            </div>
          );
        },
      }),
      columnHelper.accessor('actions', {
        id: 'actions',
        size: 50,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Actions' />,
        enableSorting: false,
        cell: ({ row }) => {
          const [isLoading, setIsLoading] = useState(false);

          const { id, certificateNumber } = row.original;

          const handleViewCalibration = (id) => {
            router.push(`/user/${workerId}/jobs/${jobId}/calibrations/view/${id}`);
          };

          const handleEditCalibration = (id) => {
            router.push(`/user/${workerId}/jobs/${jobId}/calibrations/edit-calibrations/${id}`);
          };

          const handleDeleteCalibration = (id, certificateNumber) => {
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

                  const calibrationRef = doc(db, 'jobCalibrations', id);
                  const certificateRef = doc(db, 'jobCertificates', id);

                  await Promise.all([
                    deleteDoc(calibrationRef),
                    deleteDoc(certificateRef),
                    //* create notification when calibration is removed
                    notifications.create({
                      icon: 'calibration',
                      target: ['admin', 'supervisor'],
                      title: 'Calibration removed',
                      message: `Calibration (#${id}) was removed by ${auth.currentUser.displayName}.`,
                      data: {
                        redirectUrl: `/jobs/${jobId}/calibrations`,
                      },
                    }),
                  ]);

                  toast.success('Site removed successfully', { position: 'top-right' });
                  setIsLoading(false);
                } catch (error) {
                  console.error('Error removing site:', error);
                  toast.error('Error removing site: ' + error.message, { position: 'top-right' });
                  setIsLoading(false);
                }
              }
            });
          };

          return (
            <OverlayTrigger
              rootClose
              trigger='click'
              placement='left-start'
              overlay={
                <Dropdown.Menu show style={{ zIndex: 999 }}>
                  <Dropdown.Item onClick={() => handleViewCalibration(id)}>
                    <Eye className='me-2' size={16} />
                    View Calibration
                  </Dropdown.Item>

                  {job.data?.status !== 'validated' && (
                    <Dropdown.Item onClick={() => handleEditCalibration(id)}>
                      <PencilSquare className='me-2' size={16} />
                      Edit Calibration
                    </Dropdown.Item>
                  )}

                  <Dropdown.Item onClick={() => handleDeleteCalibration(id, certificateNumber)}>
                    <Trash className='me-2' size={16} />
                    Delete Calibration
                  </Dropdown.Item>

                  <Dropdown.Item onClick={() => {}}>
                    <Printer className='me-2' size={16} />
                    Reprint Certificate
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
  }, [job]);

  const filterFields = useMemo(() => {
    return [
      {
        label: 'Calibration ID',
        columnId: 'id',
        type: 'text',
        placeholder: 'Search by calibration id...',
      },
      {
        label: 'Certificate No.',
        columnId: 'certificateNumber',
        type: 'text',
        placeholder: 'Search by certificate no...',
      },
      {
        label: 'Category',
        columnId: 'category',
        type: 'text',
        placeholder: 'Search by category...',
      },
      {
        label: 'Location',
        columnId: 'location',
        type: 'text',
        placeholder: 'Search by location...',
      },
      {
        label: 'Equipment',
        columnId: 'equipment',
        type: 'text',
        placeholder: 'Search by equipment...',
      },
      {
        label: 'Calibrated By',
        columnId: 'calibrated by',
        type: 'text',
        placeholder: 'Search by calibrated by...',
      },
    ];
  }, []);

  const table = useReactTable({
    data: calibrations.data,
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

  //* query job
  useEffect(() => {
    if (!jobId) {
      setJob({ data: null, isLoading: false, isError: false });
      return;
    }

    const jobHeaderRef = doc(db, 'jobHeaders', jobId);
    const jobDetailsRef = doc(db, 'jobDetails', jobId);

    Promise.all([getDoc(jobHeaderRef), getDoc(jobDetailsRef)])
      .then(([jobHeader, jobDetails]) => {
        if (jobHeader.exists() && jobDetails.exists()) {
          setJob({
            data: {
              id: jobHeader.id,
              ...jobHeader.data(),
              ...jobDetails.data(),
            },
            isLoading: false,
            isError: false,
          });

          return;
        }

        setJob({ data: null, isLoading: false, isError: false });
      })
      .catch((err) => {
        console.error(err.message);
        setJob({ data: null, isLoading: false, isError: true });
      });
  }, [jobId]);

  //* query calibration
  useEffect(() => {
    if (!jobId) return;

    const q = query(collection(db, 'jobCalibrations'), where('jobId', '==', jobId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          setCalibrations({
            data: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
            isLoading: false,
            isError: false,
          });
        } else {
          setCalibrations({
            data: [],
            isLoading: false,
            isError: false,
          });
        }
      },
      (err) => {
        console.error(err.message);
        setCalibrations({
          data: [],
          isLoading: false,
          isError: true,
        });
      }
    );

    return () => unsubscribe();
  }, [jobId]);

  console.log({ job });

  return (
    <>
      <GeeksSEO title={`Job #${jobId} Calibrations - VITAR Group | Portal`} />

      <div className='d-flex flex-column row-gap-4 h-100'>
        <PageHeader
          title={`Job #${jobId} Calibrations`}
          subtitle={`List of all the calibrations for the job #${jobId}`}
          action={
            <Button variant='light' onClick={() => router.back()}>
              <ArrowLeftShort size={20} className='me-2' />
              Go Back
            </Button>
          }
        />

        <CurrentJobCard />

        <Card className='shadow-sm'>
          <Card.Body className='p-4'>
            <DataTable
              table={table}
              isLoading={calibrations.isLoading || job.isLoading}
              isError={calibrations.isError}
            >
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
      </div>
    </>
  );
};

export default JobCalibration;
