import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import EquipmentsTab from '@/sub-components/dashboard/customer/Tab/EquipmentsTab';
import HistoryTab from '@/sub-components/dashboard/customer/Tab/HistoryTab';
import { doc, getDoc } from 'firebase/firestore';
import { Building2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  Row,
  Spinner,
  Tab,
  Tabs,
} from 'react-bootstrap';
import { Activity, Calendar, Exclamation } from 'react-bootstrap-icons';
import { FaArrowLeft } from 'react-icons/fa';

const CustomerDetails = () => {
  const router = useRouter();
  const { id } = router.query;

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (!id) return;

      try {
        const customerDoc = await getDoc(doc(db, 'customers', id));

        if (customerDoc.exists()) {
          setCustomer({ id: customerDoc.id, ...customerDoc.data() });
          console.log({ id: customerDoc.id, ...customerDoc.data() });
        }
      } catch (error) {
        console.error('Error fetching customer details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerDetails();
  }, [id]);

  if (loading) {
    return (
      <div
        className='d-flex justify-content-center align-items-center'
        style={{ height: '100vh' }}
      >
        <Spinner animation='border' variant='primary' />
      </div>
    );
  }

  if (!customer) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>Customer not found</h3>
          <Link href='/customers'>
            <Button variant='primary' className='mt-3'>
              Back to Customer List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='container-fluid px-4'>
      {/* Header Section */}
      <ContentHeader
        title={`View Details for ${customer.customerName}`}
        description='View comprehensive customer details including overview, contacts, locations, equipments and job histories.'
        badgeText='Customer Management'
        badgeText2='Customers'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <i className='fe fe-home' style={{ marginRight: '8px' }} />,
          },
          {
            text: 'Customer List',
            link: '/customers',
            icon: <i className='fe fe-users' style={{ marginRight: '8px' }} />,
          },
          {
            text: `View ${customer.id}`,
            icon: <i className='fe fe-user' style={{ marginRight: '8px' }} />,
          },
        ]}
        actionButtons={[
          {
            text: 'Back to Customers List',
            icon: <FaArrowLeft size={16} />,
            variant: 'light',
            tooltip: 'Back to Customers List',
            onClick: () => router.push('/customers'),
          },
        ]}
      />

      <Card>
        <Card.Body>
          <Tabs className='mb-1' activeKey={activeTab} onSelect={setActiveTab}>
            <Tab title='Overview' eventKey='overview'>
              <Row>
                <Col lg={8}>
                  {/* Personal Information Card */}
                  <Card className='border-0 shadow-none'>
                    <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
                      <div className='d-flex justify-content-between align-items-center'>
                        <div>
                          <h5 className='mb-0'>Personal Information</h5>
                          <small className='text-muted'>
                            Basic customer details
                          </small>
                        </div>
                        <Badge
                          className='profile-badge'
                          style={{
                            background:
                              'linear-gradient(45deg, #305cde, #1e40a6)',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: '500',
                            boxShadow: '0 2px 4px rgba(196, 18, 48, 0.2)',
                          }}
                        >
                          <i className='fe fe-user'></i>
                          Profile Details
                        </Badge>
                      </div>
                    </Card.Header>

                    <Card.Body className='pt-4'>
                      <div className='d-flex flex-column gap-4'>
                        <Row className='row-gap-3'>
                          <Col md={4}>
                            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100'>
                              <div
                                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                                style={{ width: '40px', height: '40px' }}
                              >
                                <i className='fe fe-user'></i>
                              </div>
                              <div>
                                <div className='text-secondary fs-6'>
                                  Full Name
                                </div>
                                <div className='text-primary-label fw-semibold'>
                                  {customer.customerName}
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
                                <i className='fe fe-hash'></i>
                              </div>
                              <div className='flex-grow-1'>
                                <div className='text-secondary fs-6'>
                                  Customer ID
                                </div>
                                <div className='text-primary-label fw-semibold'>
                                  {customer.id}
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
                                <i className='fe fe-hash'></i>
                              </div>
                              <div className='flex-grow-1'>
                                <div className='text-secondary fs-6'>
                                  TIN Number
                                </div>
                                <div className='text-primary-label fw-semibold'>
                                  {customer.tinNumber}
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
                                <i className='fe fe-hash'></i>
                              </div>
                              <div className='flex-grow-1'>
                                <div className='text-secondary fs-6'>
                                  BRN Number
                                </div>
                                <div className='text-primary-label fw-semibold'>
                                  {customer.registrationNumber ??
                                    customer.brnNumber}
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
                                <i className='fe fe-activity'></i>
                              </div>
                              <div className='flex-grow-1'>
                                <div className='text-secondary fs-6'>
                                  Status
                                </div>
                                <div className='text-primary-label fw-semibold text-capitalize'>
                                  {customer.status}
                                </div>
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/*Contract */}
                <Col lg={4}>
                  <Card className='my-4 bg-light-subtle rounded border border-light-subtle w-100'>
                    <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
                      <h5 className='mb-0'>Contract Information</h5>
                    </Card.Header>

                    <Card.Body>
                      <div className='status-item mb-4'>
                        <div className='d-flex align-items-center mb-2'>
                          <Activity size={16} className='text-primary me-2' />
                          <div className='text-muted'>Contract Status</div>
                        </div>
                        <Badge
                          bg={
                            customer.contract.status === 'Y'
                              ? 'success'
                              : 'danger'
                          }
                          className='status-badge'
                        >
                          {customer.contract.status === 'Y'
                            ? 'Active'
                            : 'Inactive'}
                        </Badge>
                      </div>

                      {customer.contract &&
                        customer.contract.status === 'Y' && (
                          <div className='status-item'>
                            <div className='d-flex flex-column align-items-center'>
                              <div className='d-flex w-100 mb-2'>
                                <Calendar
                                  size={16}
                                  className='text-primary me-2'
                                />
                                <div className='text-muted'>Contract Date</div>
                              </div>

                              <div className='flex w-100'>
                                <div className='d-flex gap-2 align-items-center mb-2'>
                                  <div>Start:</div>
                                  <Badge bg='secondary' className='ms-2'>
                                    {customer.contract.startDate ?? 'N/A'}
                                  </Badge>
                                </div>

                                <div className='d-flex gap-2 align-items-center'>
                                  <div>End:</div>
                                  <Badge bg='secondary' className='ms-2'>
                                    {customer.contract.endDate ?? 'N/A'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>

            <Tab title='Contacts' eventKey='contacts'>
              <Row>
                <Col lg={8}>
                  <Card className='border-0 shadow-none mb-4'>
                    <Card.Body>
                      <div>
                        <div
                          className='d-flex flex-column gap-4 overflow-auto'
                          style={{ maxHeight: '800px' }}
                        >
                          {(!Array.isArray(customer.customerContact) ||
                            customer.customerContact.length < 1) && (
                            <div className='text-center py-5'>
                              <Exclamation size={80} className='text-muted' />
                              <h6>No Contacts Available</h6>
                              <p className='text-muted small'>
                                Add contacts to your customer
                              </p>
                            </div>
                          )}

                          {Array.isArray(customer.customerContact) &&
                            customer.customerContact.map((contact, i) => (
                              <div>
                                <h5 className='text-primary-label mb-2 fs-5'>
                                  Contact #{i + 1}
                                </h5>

                                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100'>
                                  <div
                                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                                    style={{ width: '40px', height: '40px' }}
                                  >
                                    <i className='fe fe-phone'></i>
                                  </div>

                                  <Row className='w-100 row-gap-3 column-gap-3'>
                                    {contact.isDefault && (
                                      <Col lg={12}>
                                        <Badge bg='primary'>Default</Badge>
                                      </Col>
                                    )}

                                    <Col lg={3}>
                                      <div className='text-secondary fs-6'>
                                        First Name
                                      </div>
                                      <div className='text-primary-label fw-semibold'>
                                        {contact.firstName}
                                      </div>
                                    </Col>

                                    <Col lg={3}>
                                      <div className='text-secondary fs-6'>
                                        Last Name
                                      </div>
                                      <div className='text-primary-label fw-semibold'>
                                        {contact.lastName}
                                      </div>
                                    </Col>

                                    <Col lg={3}>
                                      <div className='text-secondary fs-6'>
                                        Phone
                                      </div>
                                      <div className='text-primary-label fw-semibold'>
                                        {contact.phone}
                                      </div>
                                    </Col>

                                    <Col lg={3}>
                                      <div className='text-secondary fs-6'>
                                        Email
                                      </div>
                                      <div className='text-primary-label fw-semibold'>
                                        {contact.email}
                                      </div>
                                    </Col>

                                    <Col lg={3}>
                                      <div className='text-secondary fs-6'>
                                        Role
                                      </div>
                                      <div className='text-primary-label fw-semibold'>
                                        {contact.role}
                                      </div>
                                    </Col>
                                  </Row>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={4}>
                  <Card className='my-4 bg-light-subtle rounded border border-light-subtle w-100'>
                    <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
                      <h5 className='mb-0'>Contact Overview</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className='text-center mb-4'>
                        <div
                          style={{
                            fontSize: '2.5rem',
                            fontWeight: '600',
                            color: '#305cde',
                          }}
                        >
                          {Array.isArray(customer.customerContact)
                            ? customer.customerContact.length
                            : 0}
                        </div>
                        <div
                          className='text-muted'
                          style={{ fontSize: '16px' }}
                        >
                          Total Contacts
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>

            <Tab title='Locations' eventKey='locations'>
              <Row>
                <Col lg={8}>
                  <Card className='border-0 shadow-none mb-4'>
                    <Card.Body>
                      <div
                        className='overflow-auto'
                        style={{ maxHeight: '800px' }}
                      >
                        <div className='d-flex flex-column gap-4 locations-container'>
                          {(!Array.isArray(customer.locations) ||
                            customer.locations.length < 1) && (
                            <div className='text-center py-5'>
                              <Exclamation size={80} className='text-muted' />
                              <h6>No Location Available</h6>
                              <p className='text-muted small'>
                                Add location to your customer
                              </p>
                            </div>
                          )}

                          {Array.isArray(customer.locations) &&
                            customer.locations.map((location, i) => (
                              <div>
                                <h5 className='text-primary-label mb-2 fs-5'>
                                  Location #{i + 1}
                                </h5>

                                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100'>
                                  <div
                                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                                    style={{ width: '40px', height: '40px' }}
                                  >
                                    <Building2 size={20} />
                                  </div>

                                  <Row className='w-100 row-gap-3 column-gap-3'>
                                    {location.isDefault && (
                                      <Col lg={12}>
                                        <Badge bg='primary'>Default</Badge>
                                      </Col>
                                    )}

                                    <Col lg={12}>
                                      <div className='text-secondary fs-6'>
                                        Main Address
                                      </div>
                                      <div className='text-primary-label fw-semibold'>
                                        {location.mainAddress}
                                      </div>
                                    </Col>

                                    <Col lg={3}>
                                      <div className='text-secondary fs-6'>
                                        ID
                                      </div>
                                      <div className='text-primary-label fw-semibold'>
                                        {location.siteId}
                                      </div>
                                    </Col>

                                    <Col lg={3}>
                                      <div className='text-secondary fs-6'>
                                        Name
                                      </div>
                                      <div className='text-primary-label fw-semibold'>
                                        {location.siteName}
                                      </div>
                                    </Col>
                                  </Row>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={4}>
                  <Card className='my-4 bg-light-subtle rounded border border-light-subtle w-100'>
                    <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
                      <h5 className='mb-0'>Location Overview</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className='text-center mb-4'>
                        <div
                          style={{
                            fontSize: '2.5rem',
                            fontWeight: '600',
                            color: '#305cde',
                          }}
                        >
                          {Array.isArray(customer.locations)
                            ? customer.locations.length
                            : 0}
                        </div>
                        <div
                          className='text-muted'
                          style={{ fontSize: '16px' }}
                        >
                          Total Locations
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>

            <Tab title='Equipment' eventKey='Equipment'>
              <EquipmentsTab />
            </Tab>

            <Tab title='Job History' eventKey='job-history'>
              <HistoryTab />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      <style jsx global>{`
        @media (max-width: 768px) {
          .certificate-dates {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .filter-panel .d-flex {
            flex-direction: column;
          }

          .filter-panel .form-control,
          .filter-panel .form-select {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomerDetails;
