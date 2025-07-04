import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import EquipmentsTab from '@/sub-components/dashboard/customer/Tab/EquipmentsTab';
import HistoryTab from '@/sub-components/dashboard/customer/Tab/HistoryTab';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { Building2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Badge, Button, Card, Col, Row, Spinner, Tab, Tabs } from 'react-bootstrap';
import {
  Activity,
  ArrowLeftShort,
  Calendar,
  Exclamation,
  EyeFill,
  HouseFill,
  PencilSquare,
  PeopleFill,
  Person,
  PersonSquare,
} from 'react-bootstrap-icons';
import { FaArrowLeft } from 'react-icons/fa';

const CustomerDetails = () => {
  const router = useRouter();
  const { customerId, tab } = router.query;

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(tab || 'overview');

  const VENDOR_LIMIT = 3;

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (!customerId) return;

      try {
        // const customerDoc = await getDoc(doc(db, 'customers', id));

        const [customerDoc, contactDocs] = await Promise.all([
          getDoc(doc(db, 'customers', customerId)),
          getDocs(query(collection(db, 'contacts'), where('customerId', '==', customerId))),
        ]);

        if (customerDoc.exists()) {
          const customerData = customerDoc.data();
          const contacts = [];

          if (!contactDocs.empty) {
            contactDocs.docs.forEach((doc) => {
              contacts.push({ id: doc.id, ...doc.data() });
            });
          }

          setCustomer({ id: customerDoc.id, ...customerData, contacts });
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching customer details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerDetails();
  }, [customerId]);

  //* set active tab based on query "tab"
  useEffect(() => {
    if (tab) setActiveTab(tab);
  }, [tab]);

  if (loading) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
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
        badgeText2='View Customer'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseFill className='me-2' size={14} />,
          },
          {
            text: 'Customers',
            link: '/customers',
            icon: <PeopleFill className='me-2' size={14} />,
          },
          {
            text: `View ${customer.id}`,
            icon: <EyeFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: 'Back',
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push(`/customers`),
          },
        ]}
        dropdownItems={[
          {
            label: 'Edit Customer',
            icon: PencilSquare,
            onClick: () => router.push(`/customers/edit-customer/${customer.id}`),
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
                          <small className='text-muted'>Basic customer details</small>
                        </div>
                        <Badge
                          className='profile-badge'
                          style={{
                            background: 'linear-gradient(45deg, #305cde, #1e40a6)',
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
                            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                              <div
                                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                                style={{ width: '40px', height: '40px' }}
                              >
                                <i className='fe fe-user'></i>
                              </div>
                              <div>
                                <div className='text-secondary fs-6'>Full Name</div>
                                <div className='text-primary-label fw-semibold'>
                                  {customer.customerName}
                                </div>
                              </div>
                            </div>
                          </Col>

                          <Col md={4}>
                            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                              <div
                                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                                style={{ width: '40px', height: '40px' }}
                              >
                                <i className='fe fe-hash'></i>
                              </div>
                              <div className='flex-grow-1'>
                                <div className='text-secondary fs-6'>Customer ID</div>
                                <div className='text-primary-label fw-semibold'>{customer.id}</div>
                              </div>
                            </div>
                          </Col>

                          <Col md={4}>
                            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                              <div
                                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                                style={{ width: '40px', height: '40px' }}
                              >
                                <i className='fe fe-hash'></i>
                              </div>
                              <div className='flex-grow-1'>
                                <div className='text-secondary fs-6'>TIN Number</div>
                                <div className='text-primary-label fw-semibold'>
                                  {customer?.tinNumber}
                                </div>
                              </div>
                            </div>
                          </Col>

                          <Col md={4}>
                            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                              <div
                                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                                style={{ width: '40px', height: '40px' }}
                              >
                                <i className='fe fe-hash'></i>
                              </div>
                              <div className='flex-grow-1'>
                                <div className='text-secondary fs-6'>BRN Number</div>
                                <div className='text-primary-label fw-semibold'>
                                  {customer?.registrationNumber ?? customer?.brnNumber}
                                </div>
                              </div>
                            </div>
                          </Col>

                          <Col md={4}>
                            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                              <div
                                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                                style={{ width: '40px', height: '40px' }}
                              >
                                <i className='fe fe-activity'></i>
                              </div>
                              <div className='flex-grow-1'>
                                <div className='text-secondary fs-6'>Status</div>
                                <div className='text-primary-label fw-semibold text-capitalize'>
                                  {customer?.status}
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
                          bg={customer?.contract?.status === 'Y' ? 'success' : 'danger'}
                          className='status-badge'
                        >
                          {customer?.contract?.status === 'Y' ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      {customer.contract && customer.contract.status === 'Y' && (
                        <div className='status-item'>
                          <div className='d-flex flex-column align-items-center'>
                            <div className='d-flex w-100 mb-2'>
                              <Calendar size={16} className='text-primary me-2' />
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
                <Col lg={12}>
                  <Card className='border-0 shadow-none mb-4'>
                    <Card.Body>
                      <div className='d-flex align-items-center gap-2 fw-bold mb-3'>
                        <span className='text-uppercase' style={{ fontSize: '16px' }}>
                          Total Contacts:
                        </span>

                        <Badge bg='primary' className='fs-4'>
                          {customer.contacts.length > 0 ? customer.contacts.length : 0}
                        </Badge>
                      </div>

                      <div>
                        <div
                          className='d-flex flex-column gap-4 overflow-auto'
                          style={{ maxHeight: '400px' }}
                        >
                          {customer.contacts.length < 1 && (
                            <div className='text-center py-5'>
                              <Exclamation size={80} className='text-muted' />
                              <h6>No Contacts Available</h6>
                              <p className='text-muted small'>Add contacts to your customer</p>
                            </div>
                          )}

                          {Array.isArray(customer.contacts) &&
                            customer.contacts.map((contact, i) => (
                              <div>
                                <h5 className='text-primary-label mb-2 fs-5'>Contact #{i + 1}</h5>

                                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                                  <div
                                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                                    style={{ width: '40px', height: '40px' }}
                                  >
                                    <i className='fe fe-phone'></i>
                                  </div>

                                  <Row className='w-100 row-gap-3'>
                                    {contact.isDefault && (
                                      <Col lg={12}>
                                        <Badge bg='primary'>Default</Badge>
                                      </Col>
                                    )}

                                    <Col lg={6}>
                                      <div className='text-secondary fs-6'>First Name</div>
                                      <div className='text-primary-label fw-semibold'>
                                        {contact.firstName}
                                      </div>
                                    </Col>

                                    <Col lg={6}>
                                      <div className='text-secondary fs-6'>Last Name</div>
                                      <div className='text-primary-label fw-semibold'>
                                        {contact.lastName}
                                      </div>
                                    </Col>

                                    <Col lg={6}>
                                      <div className='text-secondary fs-6'>Phone</div>
                                      <div className='text-primary-label fw-semibold'>
                                        {contact.phone}
                                      </div>
                                    </Col>

                                    <Col lg={6}>
                                      <div className='text-secondary fs-6'>Email</div>
                                      <div className='text-primary-label fw-semibold'>
                                        {contact.email}
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
              </Row>
            </Tab>

            <Tab title='Locations' eventKey='locations'>
              <Row>
                <Col lg={12}>
                  <Card className='border-0 shadow-none mb-4'>
                    <Card.Body>
                      <div className='d-flex align-items-center gap-2 text-capitalize fw-bold mb-3'>
                        <span className='text-uppercase' style={{ fontSize: '16px' }}>
                          Total Locations:
                        </span>

                        <Badge bg='primary' className='fs-4'>
                          {Array.isArray(customer.locations) ? customer.locations.length : 0}
                        </Badge>
                      </div>

                      <div className='overflow-auto pe-2' style={{ maxHeight: '440px' }}>
                        <div className='d-flex flex-column gap-4 locations-container'>
                          {(!Array.isArray(customer.locations) ||
                            customer.locations.length < 1) && (
                            <div className='text-center py-5'>
                              <Exclamation size={80} className='text-muted' />
                              <h6>No Location Available</h6>
                              <p className='text-muted small'>Add location to your customer</p>
                            </div>
                          )}

                          {Array.isArray(customer.locations) &&
                            customer.locations.map((location, i) => (
                              <div>
                                <h5 className='text-primary-label mb-2 fs-5'>Location #{i + 1}</h5>

                                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                                  <div
                                    className='d-none d-lg-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
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
                                      <div className='text-secondary fs-6'>Main Address</div>
                                      <div className='text-primary-label fw-semibold'>
                                        {location.mainAddress}
                                      </div>
                                    </Col>

                                    <Col lg={3}>
                                      <div className='text-secondary fs-6'>ID</div>
                                      <div className='text-primary-label fw-semibold'>
                                        {location.siteId}
                                      </div>
                                    </Col>

                                    <Col lg={8}>
                                      <div className='text-secondary fs-6'>Name</div>
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
              </Row>
            </Tab>

            <Tab title='Vendors' eventKey='vendors'>
              <Row>
                <Col lg={12}>
                  <Card className='border-0 shadow-none mb-4'>
                    <Card.Body>
                      <div className='d-flex align-items-center gap-2 text-capitalize fw-bold mb-3'>
                        <span className='text-uppercase' style={{ fontSize: '16px' }}>
                          Total Vendors:
                        </span>

                        <Badge bg='primary' className='fs-4'>
                          {Array.isArray(customer.vendors) ? customer.vendors.length : 0} /{' '}
                          {VENDOR_LIMIT}
                        </Badge>
                      </div>

                      <div className='overflow-auto pe-2' style={{ maxHeight: '500px' }}>
                        <div className='d-flex flex-column gap-4 vendors-container'>
                          {(!Array.isArray(customer.vendors) || customer.vendors.length < 1) && (
                            <div className='text-center py-5'>
                              <Exclamation size={80} className='text-muted' />
                              <h6>No Vendors Available</h6>
                              <p className='text-muted small'>Add vendor to your customer</p>
                            </div>
                          )}

                          {Array.isArray(customer.vendors) &&
                            customer.vendors.map((vendor, i) => (
                              <div>
                                <h5 className='text-primary-label mb-2 fs-5'>Vendor #{i + 1}</h5>

                                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                                  <div
                                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                                    style={{ width: '40px', height: '40px' }}
                                  >
                                    <PersonSquare size={20} />
                                  </div>

                                  <Row className='w-100 row-gap-3'>
                                    <Col lg={12}>
                                      <div className='text-secondary fs-6'>Name</div>
                                      <div className='text-primary-label fw-semibold'>
                                        {vendor.name}
                                      </div>
                                    </Col>

                                    <Col lg={6}>
                                      <div className='text-secondary fs-6'>P.I.C</div>
                                      <div className='text-primary-label fw-semibold'>
                                        {vendor.pic}
                                      </div>
                                    </Col>

                                    <Col lg={6}>
                                      <div className='text-secondary fs-6'>Title</div>
                                      <div className='text-primary-label fw-semibold'>
                                        {vendor.title}
                                      </div>
                                    </Col>

                                    <Col lg={6}>
                                      <div className='text-secondary fs-6'>Phone</div>
                                      <div className='text-primary-label fw-semibold'>
                                        {vendor.phone}
                                      </div>
                                    </Col>

                                    <Col lg={6}>
                                      <div className='text-secondary fs-6'>Email</div>
                                      <div className='text-primary-label fw-semibold'>
                                        {vendor.email}
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
              </Row>
            </Tab>

            <Tab title='Equipment' eventKey='equipment'>
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
