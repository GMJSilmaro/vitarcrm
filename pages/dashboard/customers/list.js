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
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Dropdown, OverlayTrigger, Spinner } from 'react-bootstrap';
import {
  Building,
  Eye,
  GeoAltFill,
  House,
  PencilSquare,
  Plus,
  ThreeDotsVertical,
  Trash,
} from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const CustomerList = () => {
  const router = useRouter();

  const [customers, setCustomers] = useState({ data: [], isLoading: true, isError: false });

  const columnHelper = createColumnHelper();

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('index', {
        id: 'index',
        header: ({ column }) => <DataTableColumnHeader column={column} title='#' />,
        enableSorting: false,
        size: 50,
        cell: (info) => {
          const rowIndex = info.row.index;
          const pageIndex = table.getState().pagination.pageIndex;
          const pageSize = table.getState().pagination.pageSize;
          const displayIndex = rowIndex + pageIndex * pageSize + 1;
          return (
            <div className='d-flex justify-content-center align-items-center'>
              <span className='text-primary'>{displayIndex}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor('id', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='ID' />,
        size: 100,
        cell: ({ row }) => (
          <div className='d-flex justify-content-center align-items-center'>
            <Building className='me-2' size={14} />
            {row.original.id}
          </div>
        ),
      }),
      columnHelper.accessor('customerName', {
        id: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Name' />,
      }),
      columnHelper.accessor(
        (row) => {
          const locations = row.locations || [];
          const defaultLocation = locations.find((loc) => loc.isDefault) || locations[0];

          if (!defaultLocation) return 'N/A';

          return `${defaultLocation?.siteName || ''}, ${defaultLocation?.mainAddress || ''}`;
        },
        {
          id: 'sites',
          header: ({ column }) => <DataTableColumnHeader column={column} title='Sites' />,
          cell: ({ row }) => {
            const locations = row.original.locations || [];
            const defaultLocation = locations.find((loc) => loc.isDefault) || locations[0];

            if (!defaultLocation) return 'N/A';

            return (
              <div className='mb-2 d-flex justify-content-center align-items-center'>
                <div>
                  {/* Site Name */}
                  <div className='d-flex align-items-center'>
                    <Building className='me-2 text-primary' size={14} />
                    <span className='fw-bold text-primary'>{defaultLocation.siteName}</span>
                  </div>

                  {/* Address */}
                  <div className='text-muted small'>
                    <div className='d-flex align-items-center'>
                      <GeoAltFill className='me-2' size={12} />
                      <div>{defaultLocation.mainAddress || 'No Address Available'}</div>
                    </div>
                  </div>

                  {locations.length > 1 && (
                    <div className='mt-1'>
                      <Badge
                        bg='info'
                        className='d-flex align-items-center'
                        style={{ width: 'fit-content' }}
                      >
                        <GeoAltFill className='me-1' size={10} />+{locations.length - 1} Location
                        {locations.length - 1 > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            );
          },
        }
      ),
      columnHelper.accessor('status', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
        size: 100,
        cell: ({ row }) => {
          const colors = {
            active: 'success',
            inactive: 'danger',
          };

          return (
            <Badge className='text-capitalize' bg={colors[row.original.status] || 'secondary'}>
              {row.original.status}
            </Badge>
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

          const handleViewCustomer = (id) => {
            router.push(`/customers/view/${id}`);
          };

          const handleEditCustomer = (id) => {
            router.push(`/customers/edit-customer/${id}`);
          };

          const handleDeleteCustomer = (id) => {
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

                  const customerRef = doc(db, 'customers', id);

                  // TODO  not only delete customer as well as data related to it e.g contacts
                  await deleteDoc(customerRef);

                  toast.success('Customer removed successfully', { position: 'top-right' });
                } catch (error) {
                  console.error('Error removing customer:', error);
                  toast.error('Error removing customer: ' + error.message, {
                    position: 'top-right',
                  });
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
                  <Dropdown.Item onClick={() => handleViewCustomer(id)}>
                    <Eye className='me-2' size={16} />
                    View Customer
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleEditCustomer(id)}>
                    <PencilSquare className='me-2' size={16} />
                    Edit Customer
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleDeleteCustomer(id)}>
                    <Trash className='me-2' size={16} />
                    Delete Customer
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
        label: 'ID',
        columnId: 'id',
        type: 'text',
        placeholder: 'Search by customer id...',
      },
      {
        label: 'Name',
        columnId: 'name',
        type: 'text',
        placeholder: 'Search by customer name...',
      },
      {
        label: 'Sites',
        columnId: 'sites',
        type: 'text',
        placeholder: 'Search by sites...',
      },
      {
        label: 'Status',
        columnId: 'status',
        type: 'select',
        options: [
          { label: 'All Status', value: '' },
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
        placeholder: 'Search by status...',
      },
    ];
  }, []);

  const table = useReactTable({
    data: customers.data,
    columns: columns,
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
    const q = query(collection(db, 'customers'), orderBy('customerId', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          setCustomers({
            data: snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })),
            isLoading: false,
            isError: false,
          });

          return;
        }

        setCustomers({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        setCustomers({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <>
      <GeeksSEO title='Customers - VITAR Group | Portal' />

      <ContentHeader
        title='Customers List'
        description='Manage and track all your customers in one centralized dashboard'
        infoText='Track customer details, addresses, and customer-specific information'
        badgeText='Customer Management'
        badgeText2='Customers'
        breadcrumbItems={[
          {
            icon: <House className='me-2' size={14} />,
            text: 'Dashboard',
            link: '/dashboard',
          },
          {
            icon: <Building className='me-2' size={14} />,
            text: 'Customers',
          },
        ]}
        actionButtons={[
          {
            text: 'Create New Customer',
            icon: <Plus size={16} />,
            variant: 'light',
            tooltip: 'Add a new customer',
            onClick: () => router.push('/customers/create'),
          },
        ]}
      />

      <Card className='border-0 shadow-none'>
        <Card.Body className='p-4'>
          <DataTable table={table} isLoading={customers.isLoading} isError={customers.isError}>
            <div className='d-flex justify-content-between'>
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

export default CustomerList;
