import { db } from '@/firebase';
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
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Dropdown, OverlayTrigger, Spinner } from 'react-bootstrap';
import {
  BuildingFill,
  Eye,
  GeoAltFill,
  HouseDoorFill,
  PencilSquare,
  Plus,
  ThreeDotsVertical,
  Trash,
} from 'react-bootstrap-icons';
import DataTableFilter from '@/components/common/DataTableFilter';
import DataTableSearch from '@/components/common/DataTableSearch';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import ContentHeader from '@/components/dashboard/ContentHeader';
import DataTable from '@/components/common/DataTable';
import { fuzzyFilter } from '@/utils/datatable';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

const SiteList = () => {
  const router = useRouter();

  const [sites, setSites] = React.useState({ data: [], isLoading: true, isError: false });

  const columnHelper = createColumnHelper();

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('id', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='ID' />,
        size: 100,
        cell: ({ row }) => {
          return (
            <div>
              <BuildingFill className='me-2' size={14} />
              {row.original.id}
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row.siteName, {
        id: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Name' />,
      }),
      columnHelper.accessor(
        (row) => {
          if (row?.addresses && row?.addresses.length > 0) {
            const defaultAddress = row.addresses.find((address) => address.isDefault);
            return defaultAddress?.street1 || 'N/A';
          }

          return 'N/A';
        },
        {
          id: 'address 1',
          header: ({ column }) => <DataTableColumnHeader column={column} title='Address 1' />,
          cell: ({ row }) => {
            const defaultAddress = row.original.addresses.find((address) => address.isDefault);

            return (
              <div>
                {defaultAddress?.street1 && <GeoAltFill className='me-2' size={14} />}
                {defaultAddress?.street1 || 'N/A'}
              </div>
            );
          },
        }
      ),
      columnHelper.accessor(
        (row) => {
          if (row?.addresses && row?.addresses.length > 0) {
            const defaultAddress = row.addresses.find((address) => address.isDefault);
            return defaultAddress?.street2 || 'N/A';
          }

          return 'N/A';
        },
        {
          id: 'address 2',
          header: ({ column }) => <DataTableColumnHeader column={column} title='Address 2' />,
          cell: ({ row }) => {
            const defaultAddress = row.original.addresses.find((address) => address.isDefault);

            return (
              <div>
                {defaultAddress?.street2 && <GeoAltFill className='me-2' size={14} />}
                {defaultAddress?.street2 || 'N/A'}
              </div>
            );
          },
        }
      ),
      columnHelper.accessor(
        (row) => {
          if (row?.addresses && row?.addresses.length > 0) {
            const defaultAddress = row.addresses.find((address) => address.isDefault);
            return defaultAddress?.street3 || 'N/A';
          }

          return 'N/A';
        },
        {
          id: 'address 3',
          header: ({ column }) => <DataTableColumnHeader column={column} title='Address 3' />,
          cell: ({ row }) => {
            const defaultAddress = row.original.addresses.find((address) => address.isDefault);

            return (
              <div>
                {defaultAddress?.street3 && <GeoAltFill className='me-2' size={14} />}
                {defaultAddress?.street3 || 'N/A'}
              </div>
            );
          },
        }
      ),
      columnHelper.accessor(
        (row) => {
          if (row?.addresses && row?.addresses.length > 0) {
            const defaultAddress = row.addresses.find((address) => address.isDefault);
            return `${defaultAddress?.province || 'N/A'}, ${defaultAddress?.city || 'N/A'}, ${
              defaultAddress?.postalCode || 'N/A'
            }`;
          }

          return 'N/A';
        },
        {
          id: 'province city postal code',
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Province/City/Postal Code' />
          ),
          cell: ({ row }) => {
            const defaultAddress = row.original.addresses.find((address) => address.isDefault);

            return (
              <div>{`${defaultAddress?.province || 'N/A'}, ${defaultAddress?.city || 'N/A'}, ${
                defaultAddress?.postalCode || 'N/A'
              }`}</div>
            );
          },
        }
      ),
      columnHelper.accessor(
        (row) => {
          if (row?.addresses && row?.addresses.length > 0) {
            const defaultAddress = row.addresses.find((address) => address.isDefault);
            return defaultAddress?.country || 'N/A';
          }

          return 'N/A';
        },
        {
          id: 'country',
          size: 100,
          header: ({ column }) => <DataTableColumnHeader column={column} title='Country' />,
          cell: ({ row }) => {
            const defaultAddress = row.original.addresses.find((address) => address.isDefault);

            return <div>{defaultAddress?.country || 'N/A'}</div>;
          },
        }
      ),
      columnHelper.accessor('actions', {
        id: 'actions',
        size: 100,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Action' />,
        enableSorting: false,
        cell: ({ row }) => {
          const [isLoading, setIsLoading] = useState(false);

          const { id } = row.original;

          const handleViewSite = (id) => {
            router.push(`/sites/view/${id}`);
          };

          const handleEditSite = (id) => {
            router.push(`/sites/edit-site/${id}`);
          };

          const handleDeleteSite = (id) => {
            //TODO: add cascade delete when location delete in customer, it also delete the location element in customer

            Swal.fire({
              title: 'Are you sure?',
              text: 'This action cannot be undone.',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#1e40a6',
              cancelButtonColor: '#6c757d',
              confirmButtonText: 'Confirm',
              cancelButtonText: 'Cancel',
            }).then(async (data) => {
              if (data.isConfirmed) {
                try {
                  setIsLoading(true);

                  const siteRef = doc(db, 'locations', id);

                  await deleteDoc(siteRef);

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
                  <Dropdown.Item onClick={() => handleViewSite(id)}>
                    <Eye className='me-2' size={16} />
                    View Site
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleEditSite(id)}>
                    <PencilSquare className='me-2' size={16} />
                    Edit Site
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleDeleteSite(id)}>
                    <Trash className='me-2' size={16} />
                    Delete Site
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
      { label: 'Site ID', columnId: 'id', type: 'text', placeholder: 'Search by site id...' },
      { label: 'Name', columnId: 'name', type: 'text', placeholder: 'Search by site name...' },
      {
        label: 'Address 1',
        columnId: 'address 1',
        type: 'text',
        placeholder: 'Search by main/default address 1...',
      },
      {
        label: 'Address 2',
        columnId: 'address 2',
        type: 'text',
        placeholder: 'Search by main/default address 2...',
      },
      {
        label: 'Address 3',
        columnId: 'address 3',
        type: 'text',
        placeholder: 'Search by main/default address 3...',
      },
      {
        label: 'Province/City/Postal Code',
        columnId: 'province city postal code',
        type: 'text',
        placeholder: 'Search by province/city/postal code...',
      },
      {
        label: 'Country',
        columnId: 'country',
        type: 'text',
        placeholder: 'Search by country...',
      },
    ];
  }, []);

  const table = useReactTable({
    data: sites.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFns: { fuzzy: fuzzyFilter },
    globalFilterFn: 'fuzzy',
  });

  useEffect(() => {
    const q = query(collection(db, 'locations'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          setSites({
            data: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
            isLoading: false,
            isError: false,
          });
        } else {
          setSites({
            data: [],
            isLoading: false,
            isError: false,
          });
        }
      },
      (err) => {
        console.error(err.message);
        setSites({
          data: [],
          isLoading: false,
          isError: true,
        });
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <>
      <GeeksSEO title='Site List - VITAR Group | Portal' />

      <ContentHeader
        title='Site List'
        description='Create, manage and tract all your sites in one centralize dashboard'
        infoText='Track site details, addresses, and site-specific information'
        badgeText='Site Management'
        badgeText2='Sites'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' style={{ fontSize: '14px' }} />,
          },
          {
            text: 'Site List',
            link: '/sites',
            icon: <BuildingFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: 'Create Site',
            icon: <Plus size={16} />,
            variant: 'light',
            onClick: () => router.push('/sites/create'),
          },
        ]}
      />

      <Card className='border-0 shadow-none'>
        <Card.Body className='p-4'>
          <DataTable table={table} isLoading={sites.isLoading} isError={sites.isError}>
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

export default SiteList;
