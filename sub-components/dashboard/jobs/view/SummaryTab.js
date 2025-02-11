import DataTable from '@/components/common/DataTable';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import { db } from '@/firebase';
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { orderBy } from 'lodash';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Row, Spinner } from 'react-bootstrap';
import {
  Building,
  Envelope,
  ExclamationCircleFill,
  Eye,
  Geo,
  Map,
  Person,
  PersonVcard,
  Phone,
  Signpost,
} from 'react-bootstrap-icons';

const SummaryTab = ({ job }) => {
  const router = useRouter();

  const [customer, setCustomer] = useState({ data: [], isLoading: true, isError: false });
  const [contact, setContact] = useState();
  const [location, setLocation] = useState({ data: [], isLoading: true, isError: false });
  const [equipments, setEquipments] = useState({ data: [], isLoading: true, isError: false });

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

          const category = row.original.category?.toLowerCase();
          const inventoryId = row.original.inventoryId;

          return (
            <Button
              variant='primary'
              size='sm'
              className='d-flex align-items-center gap-1'
              onClick={() => {
                router.push(`/dashboard/calibration/${category}/${inventoryId}`);
              }}
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
    data: equipments.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  //* query customer
  useEffect(() => {
    if (!job?.location?.id) return;

    getDoc(doc(db, 'customers', job?.customer?.id))
      .then((doc) => {
        const data = doc.data();

        if (doc.exists()) {
          setCustomer({
            data: {
              id: doc.id,
              ...doc.data(),
            },
            isLoading: false,
            isError: false,
          });
        }

        if (
          job?.contact &&
          Array.isArray(data.customerContact) &&
          data.customerContact.length > 0
        ) {
          setContact(data.customerContact.find((contact) => contact.id === job.contact.id));
        }
      })
      .catch((err) => {
        console.error(err.message);
        setCustomer({ data: [], isLoading: false, isError: true });
      });
  }, []);

  //* query location
  useEffect(() => {
    if (!job?.location?.id) return;

    getDoc(doc(db, 'locations', job?.location?.id))
      .then((doc) => {
        const data = doc.data();

        if (doc.exists()) {
          setLocation({
            data: {
              id: doc.id,
              ...data,
            },
            isLoading: false,
            isError: false,
          });
        }
      })
      .catch((err) => {
        console.error(err.message);
        setLocation({ data: [], isLoading: false, isError: true });
      });
  }, []);

  //* query equipments
  useEffect(() => {
    if (job?.equipments.length < 1) return;

    const equipmentsIds = job.equipments.map((equipment) => equipment.id);

    const q = query(
      collection(db, 'equipments'),
      orderBy('inventoryId', 'asc'),
      where('inventoryId', 'in', equipmentsIds)
    );

    getDocs(q)
      .then((snapshot) => {
        if (!snapshot.empty) {
          setEquipments({
            data: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
            isLoading: false,
            isError: false,
          });
        }
      })
      .catch((err) => {
        console.error(err.message);
        setEquipments({ data: [], isLoading: false, isError: true });
      });
  }, []);

  const renderError = () => {
    return (
      <div
        className='d-flex flex-column justify-content-center align-items-center fs-6 py-2'
        style={{ height: '200px' }}
      >
        <ExclamationCircleFill className='text-danger mb-2' size={32} />
        <h5 className='text-danger'>Something went wrong. Please try again Later</h5>
      </div>
    );
  };

  console.log({ job, customer, location, equipments });

  return (
    <Row>
      <Col>
        <Card className='border-0 shadow-none'>
          <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
            <div className='d-flex justify-content-between align-items-center'>
              <div>
                <h5 className='mb-0'>Customer Details</h5>
                <small className='text-muted'>Basic customer details</small>
              </div>
            </div>
          </Card.Header>

          {customer.isLoading ? (
            <div
              className='d-flex justify-content-center align-items-center fs-6 py-2'
              style={{ height: '200px' }}
            >
              <Spinner size='sm' className='me-2' animation='border' variant='primary' /> Loading
              Customer Details...
            </div>
          ) : (
            <>
              <Card.Body className='pt-4'>
                <Row className='row-gap-3'>
                  <Col className='d-flex flex-column gap-3'>
                    <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100'>
                      <div
                        className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                        style={{ width: '40px', height: '40px' }}
                      >
                        <Person size={20} />
                      </div>
                      <div>
                        <div className='text-secondary fs-6'>Customer:</div>
                        <div className='text-primary-label fw-semibold'>
                          {customer?.data?.customerName}
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>

              <Card.Header className='bg-transparent border-0 pb-0'>
                <div className='d-flex justify-content-between align-items-center'>
                  <div>
                    <h5 className='mb-0'>Contact Details</h5>
                    <small className='text-muted'>Basic contact details</small>
                  </div>
                </div>
              </Card.Header>

              <Card.Body>
                <Row>
                  <Col md={3}>
                    <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100'>
                      <div
                        className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                        style={{ width: '40px', height: '40px' }}
                      >
                        <PersonVcard size={20} />
                      </div>
                      <div>
                        <div className='text-secondary fs-6'>First Name:</div>
                        <div className='text-primary-label fw-semibold'>
                          {contact?.firstName || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100'>
                      <div
                        className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                        style={{ width: '40px', height: '40px' }}
                      >
                        <PersonVcard size={20} />
                      </div>
                      <div>
                        <div className='text-secondary fs-6'>Last Name:</div>
                        <div className='text-primary-label fw-semibold'>
                          {contact?.lastName || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100'>
                      <div
                        className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                        style={{ width: '40px', height: '40px' }}
                      >
                        <Envelope size={20} />
                      </div>
                      <div>
                        <div className='text-secondary fs-6'>Email:</div>
                        <div className='text-primary-label fw-semibold'>
                          {contact?.email || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100'>
                      <div
                        className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                        style={{ width: '40px', height: '40px' }}
                      >
                        <Phone size={20} />
                      </div>
                      <div>
                        <div className='text-secondary fs-6'>Phone:</div>
                        <div className='text-primary-label fw-semibold'>
                          {contact?.phone || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </>
          )}

          {customer.isError && renderError()}

          {location.isLoading ? (
            <div
              className='d-flex justify-content-center align-items-center fs-6 py-2'
              style={{ height: '200px' }}
            >
              <Spinner size='sm' className='me-2' animation='border' variant='primary' /> Loading
              Location Details...
            </div>
          ) : (
            <>
              <Card.Header className='bg-transparent border-0 pb-0'>
                <div className='d-flex justify-content-between align-items-center'>
                  <div>
                    <h5 className='mb-0'>Location Details</h5>
                    <small className='text-muted'>Basic location details</small>
                  </div>
                </div>
              </Card.Header>

              <Card.Body>
                <Row className='row-gap-3'>
                  <Col md={4}>
                    <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100'>
                      <div
                        className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                        style={{ width: '40px', height: '40px' }}
                      >
                        <Building size={20} />
                      </div>
                      <div>
                        <div className='text-secondary fs-6'>Location:</div>
                        <div className='text-primary-label fw-semibold'>
                          {location.data.siteName || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </Col>

                  <Col md={4}>
                    <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100'>
                      <div
                        className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                        style={{ width: '40px', height: '40px' }}
                      >
                        <Geo size={20} />
                      </div>
                      <div>
                        <div className='text-secondary fs-6'>Longitude:</div>
                        <div className='text-primary-label fw-semibold'>
                          {location.data?.additionalInformation?.longitude || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </Col>

                  <Col md={4}>
                    <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100'>
                      <div
                        className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                        style={{ width: '40px', height: '40px' }}
                      >
                        <Geo size={20} />
                      </div>
                      <div>
                        <div className='text-secondary fs-6'>Latitude:</div>
                        <div className='text-primary-label fw-semibold'>
                          {location.data?.additionalInformation?.latitude || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </Col>

                  <Col md={4}>
                    <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100'>
                      <div
                        className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                        style={{ width: '40px', height: '40px' }}
                      >
                        <Signpost size={20} />
                      </div>
                      <div>
                        <div className='text-secondary fs-6'>Street Address #1:</div>
                        <div className='text-primary-label fw-semibold'>
                          {location.data.streetAddress1 || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </Col>

                  <Col md={4}>
                    <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100'>
                      <div
                        className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                        style={{ width: '40px', height: '40px' }}
                      >
                        <Signpost size={20} />
                      </div>
                      <div>
                        <div className='text-secondary fs-6'>Street Address #2:</div>
                        <div className='text-primary-label fw-semibold'>
                          {location.data.streetAddress2 || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </Col>

                  <Col md={4}>
                    <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100'>
                      <div
                        className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                        style={{ width: '40px', height: '40px' }}
                      >
                        <Signpost size={20} />
                      </div>
                      <div>
                        <div className='text-secondary fs-6'>Street Address #3:</div>
                        <div className='text-primary-label fw-semibold'>
                          {location.data.streetAddress3 || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </Col>

                  <Col md={4}>
                    <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100'>
                      <div
                        className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                        style={{ width: '40px', height: '40px' }}
                      >
                        <Map size={20} />
                      </div>
                      <div>
                        <div className='text-secondary fs-6'>City:</div>
                        <div className='text-primary-label fw-semibold'>
                          {location.data.city || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </Col>

                  <Col md={4}>
                    <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100'>
                      <div
                        className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                        style={{ width: '40px', height: '40px' }}
                      >
                        <Map size={20} />
                      </div>
                      <div>
                        <div className='text-secondary fs-6'>Posttal Code:</div>
                        <div className='text-primary-label fw-semibold'>
                          {location.data.postalCode || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </Col>

                  <Col md={4}>
                    <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100'>
                      <div
                        className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                        style={{ width: '40px', height: '40px' }}
                      >
                        <Map size={20} />
                      </div>
                      <div>
                        <div className='text-secondary fs-6'>Province:</div>
                        <div className='text-primary-label fw-semibold'>
                          {location.data.province || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </Col>

                  <Col md={4}>
                    <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100'>
                      <div
                        className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                        style={{ width: '40px', height: '40px' }}
                      >
                        <Map size={20} />
                      </div>
                      <div>
                        <div className='text-secondary fs-6'>Country:</div>
                        <div className='text-primary-label fw-semibold'>
                          {location.data.country || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </>
          )}

          {location.isError && renderError()}

          {equipments.isLoading ? (
            <div
              className='d-flex justify-content-center align-items-center fs-6 py-2'
              style={{ height: '200px' }}
            >
              <Spinner size='sm' className='me-2' animation='border' variant='primary' /> Loading
              Equipments...
            </div>
          ) : (
            <>
              <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
                <div className='d-flex justify-content-between align-items-center'>
                  <div>
                    <h5 className='mb-0'>Equipments</h5>
                    <small className='text-muted'>
                      Details about the equipment needed for the job.
                    </small>
                  </div>
                </div>
              </Card.Header>

              <Card.Body>
                <DataTable table={table}>
                  <div className='d-flex justify-content-end'>
                    <DataTableViewOptions table={table} />
                  </div>
                </DataTable>
              </Card.Body>
            </>
          )}

          {equipments.isError.isError && renderError()}
        </Card>
      </Col>
    </Row>
  );
};

export default SummaryTab;
