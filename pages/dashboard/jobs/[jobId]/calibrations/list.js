import DataTable from '@/components/common/DataTable';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import DataTableFilter from '@/components/common/DataTableFilter';
import DataTableSearch from '@/components/common/DataTableSearch';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import ContentHeader from '@/components/dashboard/ContentHeader';
import CertificateOfCalibrationPDF2 from '@/components/pdf/CertificateOfCalibrationPDF2';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { useCertificateData } from '@/hooks/useCalibrationCertificateDate';
import { useNotifications } from '@/hooks/useNotifications';
import {
  CATEGORY,
  PRINT_STATUS,
  PRINT_STATUS_COLOR,
  STATUS,
  STATUS_COLOR,
} from '@/schema/calibration';
import { titleCase } from '@/utils/common';
import { fuzzyFilter, globalSearchFilter } from '@/utils/datatable';
import { GeeksSEO } from '@/widgets';
import { usePDF } from '@react-pdf/renderer';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import _ from 'lodash';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Card, Dropdown, Form, OverlayTrigger, Spinner } from 'react-bootstrap';
import {
  ArrowRepeat,
  BriefcaseFill,
  BuildingFill,
  CardList,
  CheckCircle,
  ExclamationCircle,
  Eye,
  FileEarmarkArrowDown,
  HandThumbsDown,
  HouseDoorFill,
  PencilSquare,
  PersonLinesFill,
  Plus,
  Printer,
  ShieldCheck,
  Speedometer,
  ThreeDotsVertical,
  Trash,
  WrenchAdjustableCircleFill,
} from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

//* Temporary - need to refractor
const DropdownItemPrintCoc = ({
  printStatus,
  handlePrint,
  trigger,
  setTrigger,
  isLoading,
  calibration,
  instruments,
  calibratedBy,
  approvedSignatory,
  error,
}) => {
  const iframeRef = useRef(null);
  const [instance, updateInstance] = usePDF();

  const showLoading = isLoading || instance.loading || calibratedBy.isLoading || approvedSignatory.isLoading; //prettier-ignore

  const PDF = () => {
    useEffect(() => {
      if (iframeRef.current && instance.url) {
        const iframe = iframeRef.current;
        iframe.src = instance.url;
        iframe.onload = () => iframe.contentWindow?.print();
      }
    }, [instance, iframeRef]);

    return <iframe ref={iframeRef} style={{ display: 'none' }} />;
  };

  useEffect(() => {
    return () => setTrigger(0);
  }, []);

  useEffect(() => {
    if (
      !isLoading &&
      calibration &&
      instruments.length > 0 &&
      calibratedBy.data &&
      approvedSignatory.data
    ) {
      console.log('loaded data to pdf = ', {
        calibration,
        instruments,
        calibratedBy,
        approvedSignatory,
      });

      updateInstance(
        <CertificateOfCalibrationPDF2
          calibration={calibration}
          instruments={{ data: instruments }}
          calibratedBy={calibratedBy}
          approvedSignatory={approvedSignatory}
        />
      );
    }
  }, [
    isLoading,
    calibratedBy.isLoading,
    approvedSignatory.isLoading,
    JSON.stringify(calibration),
    JSON.stringify(instruments),
    JSON.stringify(calibratedBy.data),
    JSON.stringify(approvedSignatory.data),
  ]);

  if (error) {
    return (
      <Dropdown.Item style={{ cursor: 'not-allowed' }}>
        <ExclamationCircle className='me-2' /> Print Unvailable
      </Dropdown.Item>
    );
  }

  return (
    <Dropdown.Item onClick={handlePrint} disabled={showLoading || !!error}>
      {showLoading ? (
        <Spinner className='me-2' animation='border' size='sm' />
      ) : (
        <Printer className='me-2' size={16} />
      )}

      {!showLoading ? 'Print Certificate' : 'Initializing PDF'}

      {trigger > 0 && <PDF />}
    </Dropdown.Item>
  );
};

const JobCalibration = () => {
  const router = useRouter();
  const auth = useAuth();
  const notifications = useNotifications();

  const { jobId } = router.query;

  const [job, setJob] = useState({ data: null, isLoading: true, isError: false });
  const [jobRequest, setJobRequest] = useState({ data: null, isLoading: true, isError: false });
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
      columnHelper.accessor('status', {
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
        cell: ({ row }) => {
          const status = row?.original?.status;

          return (
            <div className='d-flex flex-column justify-content-center align-items-sm-center gap-2'>
              <Badge className='text-capitalize' bg={STATUS_COLOR[status] || 'secondary'}>
                {_.startCase(status)}
              </Badge>

              {status === 'data-rejected' && (
                <span className='fw-medium fst-italic'>
                  "{row.original.reasonMessage || 'N/A'}"
                </span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('printStatus', {
        id: 'print status',
        filterFn: 'equals',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Print Status' />,
        cell: ({ row }) => {
          const printStatus = row?.original?.printStatus;

          if (!printStatus) return null;

          return (
            <Badge className='text-capitalize' bg={PRINT_STATUS_COLOR[printStatus] || 'secondary'}>
              {_.startCase(printStatus)}
            </Badge>
          );
        },
      }),
      columnHelper.accessor((row) => row?.approvedSignatory?.name || '', {
        id: 'approvedSignatory',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Approved Signatory' />
        ),
        cell: ({ row }) => {
          const approvedSignatory = row?.original?.approvedSignatory?.name || '';

          return <div>{approvedSignatory}</div>;
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

          const { id, jobId, certificateNumber, calibratedBy, printStatus, status } = row.original;

          const [trigger, setTrigger] = useState(0);
          const {calibration, instruments,isLoading: isLoadingCertData, error, approvedSignatory, calibratedBy: calibratedByData} = useCertificateData(id, jobId, trigger); //prettier-ignore

          console.log({ row: row.original, jobId });

          const handleViewCalibration = (id) => {
            router.push(`/jobs/${jobId}/calibrations/view/${id}`);
          };

          const handleEditCalibration = (id) => {
            router.push(`/jobs/${jobId}/calibrations/edit-calibrations/${id}`);
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
                      module: 'calibration',
                      icon: 'calibration',
                      target: ['admin', 'supervisor'],
                      title: 'Calibration removed',
                      message: `Calibration (#${id}) was removed by ${auth.currentUser.displayName}.`,
                      data: {
                        redirectUrl: `/jobs/${jobId}/calibrations`,
                      },
                    }),
                  ]);

                  toast.success('Calibration removed successfully', { position: 'top-right' });
                  setIsLoading(false);
                } catch (error) {
                  console.error('Error removing calibration:', error);
                  toast.error('Error removing calibration: ' + error.message, {
                    position: 'top-right',
                  });
                  setIsLoading(false);
                }
              }
            });
          };

          const notifyCalibratedBy = async (status) => {
            try {
              const workerId = calibratedBy.id;
              const snapshots = await getDocs(
                query(collection(db, 'users'), where('workerId', '==', workerId))
              );

              if (!snapshots.empty) {
                const snapshot = snapshots.docs[0];
                const user = { id: snapshot.id, ...snapshot.data() };

                if (user && user.id) {
                  await notifications.create({
                    module: 'calibration',
                    target: [user.id],
                    title: 'Calibration status updated',
                    message: `Calibration (#${id}) status was updated by ${auth.currentUser.displayName} to "${_.startCase(status)}".`, //prettier-ignore
                    data: {
                      redirectUrl: `/jobs/${jobId}/calibrations/view/${id}`,
                    },
                  });
                }
              }
            } catch (error) {
              console.error('Failed to notify technician:', error);
            }
          };

          const handleUpdateCalibrationStatus = (id, status) => {
            if (status === 'data-rejected') {
              withReactContent(Swal)
                .fire({
                  title: `Calibration Status Update - Calibration #${id}`,
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonText: 'Confirm',
                  cancelButtonText: 'Cancel',
                  customClass: {
                    confirmButton: 'btn btn-primary rounded',
                    cancelButton: 'btn btn-secondary rounded',
                  },
                  html: (
                    <div className='d-flex flex-column gap-4'>
                      <div
                        style={{ color: '#545454' }}
                      >{`Are you sure you want to update the calibration status to "${_.startCase(
                        status
                      )}"?`}</div>

                      <div>
                        <Form.Control
                          id={`calibration-status-update-${id}`}
                          type='text'
                          as='textarea'
                          rows={4}
                          placeholder='Enter a message/reason'
                        />
                      </div>
                    </div>
                  ),
                  preConfirm: () => {
                    return document.getElementById(`calibration-status-update-${id}`).value;
                  },
                })
                .then(async (data) => {
                  const { value, isConfirmed } = data;
                  if (isConfirmed) {
                    try {
                      setIsLoading(true);

                      const calibrationRef = doc(db, 'jobCalibrations', id);

                      await Promise.all([
                        updateDoc(calibrationRef, {
                          status,
                          printStatus: null,
                          reasonMessage: value,
                          updatedAt: serverTimestamp(),
                          updatedBy: auth.currentUser,
                        }),
                        //* create notification for admin and supervisor when updated a calibration status
                        notifications.create({
                          module: 'calibration',
                          target: ['admin', 'supervisor'],
                          title: 'Calibration status updated',
                          message: `Calibration (#${id}) status was updated by ${auth.currentUser.displayName} to "${_.startCase(status)}".`, //prettier-ignore
                          data: {
                            redirectUrl: `/jobs/${jobId}/calibrations/view/${id}`,
                          },
                        }),

                        notifyCalibratedBy(status),
                      ]);

                      toast.success('Job request status updated successfully', {
                        position: 'top-right',
                      });
                      setIsLoading(false);
                    } catch (error) {
                      console.error('Error updating job request status:', error);
                      toast.error('Error updating job request status: ' + error.message, { position: 'top-right' }); //prettier-ignore
                      setIsLoading(false);
                    }
                  }
                });
              return;
            }

            Swal.fire({
              title: `Calibration Status Update - Calibration #${id}`,
              text: `Are you sure you want to update the calibration status to "${_.startCase(
                status
              )}"?`,
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

                  const jobCalibrationRef = doc(db, 'jobCalibrations', id);

                  await Promise.all([
                    updateDoc(jobCalibrationRef, {
                      status,
                      printStatus: null,
                      reasonMessage: null,
                      updatedAt: serverTimestamp(),
                      updatedBy: auth.currentUser,
                    }),

                    //* create notification for admin and supervisor when updated a calibration status
                    notifications.create({
                      module: 'calibration',
                      target: ['admin', 'supervisor'],
                      title: 'Calibration status updated',
                      message: `Calibration (#${id}) status was updated by ${auth.currentUser.displayName} to "${_.startCase(status)}".`, //prettier-ignore
                      data: {
                        redirectUrl: `/jobs/${jobId}/calibrations/view/${id}`,
                      },
                    }),

                    notifyCalibratedBy(status),
                  ]);

                  toast.success('Calibration status updated successfully', {
                    position: 'top-right',
                  });
                  setIsLoading(false);
                } catch (error) {
                  console.error('Error updating calibration status:', error);
                  toast.error('Error updating calibration status: ' + error.message, { position: 'top-right' }); //prettier-ignore
                  setIsLoading(false);
                }
              }
            });
          };

          const handlePrintCertificate = async (id, status) => {
            setTrigger((prev) => prev + 1);

            try {
              const jobCalibrationRef = doc(db, 'jobCalibrations', id);

              const calibrationPrintStatus = !status
                ? 'printed'
                : status === 'printed'
                ? 'reprinted'
                : 'reprinted';

              await updateDoc(jobCalibrationRef, {
                printStatus: calibrationPrintStatus,
                updatedAt: serverTimestamp(),
                updatedBy: auth.currentUser,
              });

              //* notify admin & supervisor when printed
              await notifications.create({
                module: 'calibration',
                target: ['admin', 'supervisor'],
                title: `Certificate ${calibrationPrintStatus}`,
                message: `Certificate (#${id})'s certificate has been printed by ${auth.currentUser.displayName}.`,
                data: {
                  redirectUrl: `/jobs/view/${jobId}`,
                },
              });
            } catch (error) {
              console.error('Error printing certificate:', error);
            }
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
                  <Dropdown.Item onClick={() => handleEditCalibration(id)}>
                    <PencilSquare className='me-2' size={16} />
                    Edit Calibration
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleDeleteCalibration(id, certificateNumber)}>
                    <Trash className='me-2' size={16} />
                    Delete Calibration
                  </Dropdown.Item>

                  <OverlayTrigger
                    rootClose
                    trigger='click'
                    placement='left'
                    overlay={
                      <Dropdown.Menu show style={{ zIndex: 999 }}>
                        <Dropdown.Item
                          onClick={() => {
                            handleUpdateCalibrationStatus(id, 'data-validation', calibratedBy);
                          }}
                        >
                          <CheckCircle className='me-2' size={16} />
                          Data Validation
                        </Dropdown.Item>

                        <Dropdown.Item
                          onClick={() => {
                            handleUpdateCalibrationStatus(id, 'data-rejected', calibratedBy);
                          }}
                        >
                          <HandThumbsDown className='me-2' size={16} />
                          Data Rejected
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => {
                            handleUpdateCalibrationStatus(id, 'cert-complete', calibratedBy);
                          }}
                        >
                          <ShieldCheck className='me-2' size={16} />
                          Cert Complete
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    }
                  >
                    <Dropdown.Item>
                      <ArrowRepeat className='me-2' size={16} />
                      Update Status
                    </Dropdown.Item>
                  </OverlayTrigger>

                  {status === 'cert-complete' && (
                    <DropdownItemPrintCoc
                      handlePrint={() => handlePrintCertificate(id, printStatus)}
                      printStatus={printStatus}
                      trigger={trigger}
                      setTrigger={setTrigger}
                      isLoading={isLoadingCertData}
                      calibration={calibration}
                      instruments={instruments}
                      calibratedBy={calibratedByData}
                      approvedSignatory={approvedSignatory}
                      error={error}
                    />
                  )}
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
        label: 'ID',
        columnId: 'id',
        type: 'text',
        placeholder: 'Search by id...',
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
        type: 'select',
        options: [
          { label: 'All Category', value: '' },
          ...CATEGORY.map((c) => ({
            label: titleCase(c),
            value: c,
          })),
        ],
      },
      {
        label: 'Status',
        columnId: 'status',
        type: 'select',
        options: [
          { label: 'All Status', value: '' },
          ...STATUS.map((s) => ({
            label: _.startCase(s),
            value: s,
          })),
        ],
      },
      {
        label: 'Print Status',
        columnId: 'print status',
        type: 'select',
        options: [
          { label: 'All Print Status', value: '' },
          ...PRINT_STATUS.map((s) => ({
            label: _.startCase(s),
            value: s,
          })),
        ],
      },
      {
        label: 'Approved Signatory',
        columnId: 'approvedSignatory',
        type: 'text',
        placeholder: 'Search by approved signatory...',
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

  const handleUpdateToComplete = async (id, setIsLoading, salesperson) => {
    if (!id) return;

    Swal.fire({
      title: `Job Status Update - Job #${id}`,
      text: `Are you sure you want to update the job status to "Job Complete"?`,
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
          console.log({ salesperson });

          setIsLoading(true);

          const jobHeaderRef = doc(db, 'jobHeaders', id);

          await Promise.all([
            updateDoc(jobHeaderRef, {
              status: 'job-complete',
              updatedAt: serverTimestamp(),
              updatedBy: auth.currentUser,
            }),
            //* create notification for admin and supervisor when updated a job status
            notifications.create({
              module: 'job',
              target: ['admin', 'supervisor', ...(salesperson ? [salesperson] : [])],
              title: 'Job status updated',
              message: `Job (#${id}) status was updated by ${auth.currentUser.displayName} to "Job Complete".`, //prettier-ignore
              data: {
                redirectUrl: `/jobs/view/${id}`,
              },
            }),
          ]);

          toast.success('Job status updated successfully', { position: 'top-right' });
          setIsLoading(false);

          //* reload page after 2 seconds
          setTimeout(() => {
            window.location.assign(`/jobs/view/${jobId}`);
          }, 2000);
        } catch (error) {
          console.error('Error updating job status:', error);
          toast.error('Error updating job status: ' + error.message, { position: 'top-right' }); //prettier-ignore
          setIsLoading(false);
        }
      }
    });
  };

  const isShowValidateJob = useMemo(() => {
    if (
      !job.data ||
      job?.data?.customerEquipments?.length < 1 ||
      !calibrations.data ||
      calibrations.data.length < 1
    ) {
      return false;
    }

    if (job?.data?.status === 'job-complete') return false;

    //* check if all job calibration items or customer equipment selected has a status of cert-complete
    const calibrationItems = job?.data.customerEquipments || [];

    if (calibrationItems?.length < 1) return false;

    return calibrationItems.every((cItem) => {
      const calibration = calibrations.data.find((c) => c.description?.id === cItem.id);
      return calibration?.status === 'cert-complete';
    });
  }, [JSON.stringify(job), JSON.stringify(calibrations)]);

  //* query job calibrations
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

  //* query job
  useEffect(() => {
    if (jobId) {
      const jobHeaderRef = doc(db, 'jobHeaders', jobId);

      getDoc(jobHeaderRef).then((jobDoc) => {
        if (jobDoc.exists()) {
          const jobData = { id: jobDoc.id, ...jobDoc.data() };

          const jobDetailsPromise = getDoc(doc(db, 'jobDetails', jobData.id));
          const jobRequestPromise = jobData?.jobRequestId
            ? getDoc(doc(db, 'jobRequests', jobData.jobRequestId))
            : Promise.resolve(null);

          Promise.all([jobDetailsPromise, jobRequestPromise])
            .then(([jobDetailsDoc, jobRequestDoc]) => {
              if (jobDetailsDoc.exists()) {
                setJob({
                  data: { id: jobData.id, ...jobData, ...jobDetailsDoc.data() },
                  isLoading: false,
                  isError: false,
                });

                if (jobRequestDoc) {
                  setJobRequest({
                    data: { id: jobRequestDoc.id, ...jobRequestDoc.data() },
                    isLoading: false,
                    isError: false,
                  });
                }
              } else {
                setJob({
                  data: null,
                  isLoading: false,
                  isError: false,
                });

                setJobRequest({
                  data: null,
                  isLoading: false,
                  isError: false,
                });
              }
            })
            .catch((err) => {
              console.error(err);
              setJob({
                data: null,
                isLoading: false,
                isError: false,
              });
            });
        }
      });
    }
  }, [jobId]);

  return (
    <>
      <GeeksSEO title={`Job #${jobId} Calibrations - VITAR Group | Portal`} />

      <ContentHeader
        title={`Job #${jobId} Calibrations List`}
        description='Create, manage and tract all your jobs calibrations in once centralize dashboard'
        infoText='Manage job calibrations, view results and Reprint Certificates'
        badgeText='Calibration Management'
        badgeText2='Listing'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' style={{ fontSize: '14px' }} />,
          },
          {
            text: 'Jobs',
            link: '/jobs',
            icon: <BriefcaseFill className='me-2' size={14} />,
          },
          {
            text: `Job #${jobId} Calibrations`,
            link: `/jobs/${jobId}/calibrations`,
            icon: <Speedometer className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          ...(isShowValidateJob && (auth.role === 'admin' || auth.role === 'supervisor')
            ? [
                {
                  text: 'Validate Job',
                  icon: <ShieldCheck size={20} />,
                  variant: 'light',
                  onClick: (args) =>
                    handleUpdateToComplete(
                      jobId,
                      args.setIsLoading,
                      jobRequest?.data?.createdBy?.uid
                    ),
                },
              ]
            : []),
          {
            text: `Add calibration for Job #${jobId}`,
            icon: <Plus size={20} />,
            variant: isShowValidateJob ? 'outline-primary' : 'light',
            onClick: () => router.push(`/jobs/${jobId}/calibrations/create`),
          },
        ]}
      />

      <Card className='border-0 shadow-none'>
        <Card.Body className='p-4'>
          <DataTable
            table={table}
            isLoading={calibrations.isLoading}
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
    </>
  );
};

export default JobCalibration;
