import DataTable from '@/components/common/DataTable';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import DataTableFilter from '@/components/common/DataTableFilter';
import DataTableSearch from '@/components/common/DataTableSearch';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import ContentHeader from '@/components/dashboard/ContentHeader';
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
import { format, isValid } from 'date-fns';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  Dropdown,
  Image,
  OverlayTrigger,
  Row,
  Spinner,
  Tooltip,
} from 'react-bootstrap';
import {
  Activity,
  CheckCircle,
  Clock,
  Envelope,
  Eye,
  GeoAlt,
  HouseDoorFill,
  PencilSquare,
  People,
  PeopleFill,
  Plus,
  Telephone,
  ThreeDotsVertical,
  Trash,
} from 'react-bootstrap-icons';

import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const TechnicianList = () => {
  const router = useRouter();

  const [workers, setWorkers] = useState({ data: [], isLoading: true, isError: false });
  const [stats, setStats] = useState({ totalUsers: 0, active: 0, inactive: 0, fieldWorkers: 0 });

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
      columnHelper.accessor((row) => row.fullName, {
        id: 'technician',
        size: 200,
        header: ({ column }) => <DataTableColumnHeader column={column} title='User / Technician' />,
        cell: (info) => {
          return (
            <div className='d-flex align-items-center'>
              <div className='position-relative'>
                <Image
                  src={info.row.original.profilePicture || '/images/avatar/default-avatar.png'}
                  alt={info.getValue()}
                  width={45}
                  height={45}
                  className='rounded-circle'
                  style={{
                    objectFit: 'cover',
                    border: '2px solid #fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                />

                <span
                  className={`position-absolute bottom-0 end-0 ${
                    info.row.original.isOnline ? 'bg-success' : 'bg-secondary'
                  }`}
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    border: '2px solid #fff',
                  }}
                />
              </div>
              <div className='ms-3'>
                <div className='d-flex justify-content-start align-items-center gap-2'>
                  <span className='text-start fw-semibold text-dark' style={{ fontSize: '14px' }}>
                    {info.getValue()}
                  </span>
                </div>
                <div className='d-flex align-items-center'>
                  <small
                    className='text-success fw-semibold'
                    style={{ fontSize: '12px', paddingRight: '4px' }}
                  >
                    #{info.row.original.workerId}
                  </small>
                  {info?.row?.original?.role && info.row.original.role !== 'admin' && (
                    <>
                      <span style={{ paddingRight: '4px' }}>•</span>
                      <small
                        className='text-warning fw-semibold text-capitalize'
                        style={{ fontSize: '12px' }}
                      >
                        {info.row.original.role}
                      </small>
                    </>
                  )}
                </div>

                <div className='d-flex gap-1 mt-1'>
                  {info.row.original.isFieldWorker && (
                    <Badge
                      bg='warning'
                      text='dark'
                      style={{
                        fontSize: '10px',
                        padding: '4px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      Field Worker
                    </Badge>
                  )}
                  {info.row.original.role === 'admin' && (
                    <Badge
                      bg='purple'
                      style={{
                        backgroundColor: 'red',
                        fontSize: '10px',
                        padding: '4px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      Admin
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor(
        (row) => `${row?.email || ''} - ${row?.primaryPhone || ''} - ${row?.secondaryPhone || ''}`,
        {
          id: 'contact info',
          size: 100,
          header: ({ column }) => <DataTableColumnHeader column={column} title='Contact Info' />,
          cell: (info) => {
            const { email, primaryPhone, secondaryPhone } = info.row.original;

            return (
              <div className='d-flex flex-column justify-content-center row-gap-1'>
                <div style={{ width: 'fit-content' }}>
                  <Envelope size={14} className='text-muted me-2' />
                  <span className='fs-5'>{email || '-'}</span>
                </div>

                <div style={{ width: 'fit-content' }}>
                  <Telephone size={14} className='text-muted me-2' />
                  <span className='fs-5'>{primaryPhone || '-'}</span>
                </div>

                {secondaryPhone && (
                  <div style={{ width: 'fit-content' }}>
                    <Telephone size={14} className='text-muted me-2' />
                    <span className='fs-5'>{secondaryPhone || '-'}</span>
                  </div>
                )}
              </div>
            );
          },
        }
      ),
      columnHelper.accessor(
        (row) => {
          const address = row?.address;

          return `${address?.streetAddress || ''} ${
            address?.stateProvince ? `, ${address?.stateProvince}` : ''
          } ${address?.postalCode ? `, ${address?.postalCode}` : ''}`;
        },
        {
          id: 'address',
          size: 250,
          header: ({ column }) => <DataTableColumnHeader column={column} title='Address' />,
          cell: ({ row }) => {
            const address = row.original?.address;

            return (
              <div>
                <GeoAlt size={14} className='me-2' />
                <span className='fs-5'>
                  {`${address?.streetAddress || ''} ${
                    address?.stateProvince ? `, ${address?.stateProvince}` : ''
                  } ${address?.postalCode ? `, ${address?.postalCode}` : ''}`}
                </span>
              </div>
            );
          },
        }
      ),
      columnHelper.accessor((row) => (row?.skills?.length > 0 ? row.skills.join(', ') : ''), {
        id: 'skills',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Skills' />,
        cell: ({ row }) => {
          const skills = row.original?.skills || [];

          return (
            <OverlayTrigger
              placement='top'
              overlay={
                <Tooltip>
                  <div className='text-start'>
                    <strong>Skills</strong>

                    <div className='mt-1'>
                      {skills.map((skill, index) => (
                        <div key={index} className='d-flex align-items-center gap-1 mb-1'>
                          <i
                            className='fe fe-check-circle text-success'
                            style={{ fontSize: '12px' }}
                          ></i>
                          <span>{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Tooltip>
              }
            >
              <div className='d-flex flex-wrap gap-1'>
                {skills.slice(0, 2).map((skill, index) => (
                  <Badge
                    key={index}
                    bg='light'
                    text='dark'
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    {skill}
                  </Badge>
                ))}
                {skills.length > 2 && (
                  <Badge
                    bg='secondary'
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                  >
                    +{skills.length - 2} more
                  </Badge>
                )}
              </div>
            </OverlayTrigger>
          );
        },
      }),
      columnHelper.accessor((row) => (row?.activeUser ? 'active' : 'inactive'), {
        id: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
        size: 50,
        cell: ({ row }) => {
          const status = row.original?.isActive;
          const lastLogin = row.original?.lastLogin?.toDate();

          return (
            <div className='d-flex flex-column align-items-start row-gap-1'>
              <Badge
                bg={status ? 'success' : 'danger'}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                }}
              >
                {status ? 'Active' : 'Inactive'}
              </Badge>
              <small className='text-muted mt-1' style={{ fontSize: '11px' }}>
                Last login: {isValid(lastLogin) ? format(lastLogin, 'DD-MM-YYYY, p') : ''}
              </small>
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

          const { id } = row.original;

          const handleViewTechnician = (id) => {
            router.push(`/workers/view/${id}`);
          };

          const handleEditTechnician = (id) => {
            router.push(`/workers/edit-workers/${id}`);
          };

          const handleDeleteTechnician = (id) => {
            Swal.fire({
              title: 'Are you sure?',
              text: 'This action cannot be undone.',
              icon: 'warning',
              showCancelButton: true,
              customClass: {
                confirmButton: 'btn btn-primary rounded',
                cancelButton: 'btn btn-secondary rounded',
              },
            }).then(async (data) => {
              if (data.isConfirmed) {
                try {
                  setIsLoading(true);

                  const technicianRef = doc(db, 'users', row.id);
                  await deleteDoc(technicianRef);

                  toast.success('Job removed successfully', { position: 'top-right' });
                  setIsLoading(false);
                } catch (error) {
                  console.error('Error removing technician:', error);
                  toast.error('Error removing technician: ' + error.message, {
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
              placement='left-start'
              overlay={
                <Dropdown.Menu show style={{ zIndex: 999 }}>
                  <Dropdown.Item onClick={() => handleViewTechnician(id)}>
                    <Eye className='me-2' size={16} />
                    View Technician
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleEditTechnician(id)}>
                    <PencilSquare className='me-2' size={16} />
                    Edit Technician
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleDeleteTechnician(id)}>
                    <Trash className='me-2' size={16} />
                    Delete Technician
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
        label: 'Technician',
        columnId: 'technician',
        type: 'text',
        placeholder: 'Search by technician...',
      },
      {
        label: 'Contact Info',
        columnId: 'contact info',
        type: 'text',
        placeholder: 'Search by contact info...',
      },
      { label: 'Address', columnId: 'address', type: 'text', placeholder: 'Search by address...' },
      { label: 'Skills', columnId: 'skills', type: 'text', placeholder: 'Search by skills...' },
      {
        label: 'Status',
        columnId: 'status',
        type: 'select',
        options: [
          { label: 'All Status', value: '' },
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
    ];
  }, []);

  const statCards = useMemo(() => {
    return [
      {
        title: 'Technicians Statistics',
        value: stats.totalUsers,
        icon: <People size={20} className='text-primary' />,
        badge: { text: 'Total', variant: 'primary' },
        background: '#e7f1ff',
        summary: `${stats.active} Active | ${stats.inactive} Inactive`,
      },
      {
        title: 'Active Technicians',
        value: stats.active,
        icon: <Activity size={20} className='text-success' />,
        badge: { text: 'Active', variant: 'success' },
        background: '#e6f8f0',
        summary: 'Currently Active Users',
      },
      {
        title: 'Field Technicians',
        value: stats.fieldWorkers,
        icon: <Clock size={20} className='text-warning' />,
        badge: { text: 'Field', variant: 'warning' },
        background: '#fff8ec',
        summary: 'Field Technicians Available',
      },
      {
        title: 'Inactive Technicians',
        value: stats.inactive,
        icon: <CheckCircle size={20} className='text-info' />,
        badge: { text: 'Inactive', variant: 'danger' },
        background: '#e7f6f8',
        summary: 'Currently Inactive Users',
      },
    ];
  }, [stats]);

  const table = useReactTable({
    data: workers.data,
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

  //* query technicians
  useEffect(() => {
    const q = query(collection(db, 'users'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          setWorkers({
            data: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
            isLoading: false,
            isError: false,
          });

          return;
        }

        setWorkers({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        setWorkers({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  //* query
  useEffect(() => {
    if (!workers && workers.data.length < 1) return;

    const technicians = workers.data.filter((user) => user.role === 'technician');

    //* calculate
    const totalTechnicians = technicians.length;
    const active = technicians.filter((technician) => technician.isActive).length;
    const inactive = technicians.filter((technician) => !technician.isActive && technician.role === 'technician').length; //prettier-ignore
    const fieldWorkers = technicians.filter((technician) => technician.isFieldWorker).length;

    setStats({
      totalUsers: totalTechnicians,
      active,
      inactive,
      fieldWorkers,
    });
  }, [workers]);

  return (
    <>
      <GeeksSEO title='Technicians- VITAR Group | Portal' />

      <ContentHeader
        title='Technicians List'
        description='Manage and track all your workers in one centralized dashboard'
        infoText='Track worker availability, skills, and performance metrics'
        badgeText='Technician Management'
        badgeText2='Workforce'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' size={14} />,
          },
          {
            text: 'Technicians',
            link: '/jobs',
            icon: <PeopleFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: 'Add New Technician',
            icon: <Plus size={20} />,
            variant: 'light',
            onClick: () => router.push('/workers/create'),
          },
        ]}
      />

      {/* Stats Cards Row */}
      <Row className='g-4 mb-4'>
        {statCards.map((card, index) => (
          <Col key={index} lg={3} sm={6}>
            <Card className='border-0 shadow-sm'>
              <Card.Body>
                <div className='d-flex justify-content-between align-items-center'>
                  <div>
                    <p className='text-muted mb-1'>{card.title}</p>
                    <h3 className='mb-1'>{card.value}</h3>
                    <Badge bg={card.badge.variant}>{card.badge.text}</Badge>
                    <div className='small text-muted mt-2'>{card.summary}</div>
                  </div>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: card.background,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {card.icon}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className='border-0 shadow-none'>
        <Card.Body className='p-4'>
          <DataTable table={table} isLoading={workers.isLoading} isError={workers.isError}>
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

export default TechnicianList;
