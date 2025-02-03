import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Building2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Badge, Card, Col, Nav, Row, Spinner, Tab } from 'react-bootstrap';
import { Activity, Phone, Calendar, Building, Exclamation } from 'react-bootstrap-icons';
import { User } from 'react-feather';
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
      <div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
        <Spinner animation='border' variant='primary' />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className='text-center py-5'>
        <h3>Customer not found</h3>
        <Link href='/customer'>
          <Button variant='primary' className='mt-3'>
            Back to Customer List
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className='container-fluid px-4'>
      {/* Header Section */}
      <ContentHeader
        title={`View Details for ${customer.customerName}`}
        description='View comprehensive customer details including personal info, contacts and contracts'
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
        actionButton={{
          text: 'Back to Customers List',
          icon: <FaArrowLeft size={16} />,
          variant: 'light',
          tooltip: 'Back to Customers List',
          onClick: () => router.push('/customers'),
        }}
      />

      <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
        <Nav variant='tabs' className='mb-4 gap-2' style={{ borderBottom: '1px solid #e2e8f0' }}>
          <Nav.Item>
            <Nav.Link
              eventKey='overview'
              className='px-4 py-3 d-flex align-items-center gap-2'
              style={{ border: 'none', fontWeight: '500' }}
            >
              <User size={18} />
              Overview
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              eventKey='contacts'
              className='px-4 py-3 d-flex align-items-center gap-2'
              style={{ border: 'none', fontWeight: '500' }}
            >
              <Phone size={18} />
              Contacts
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              eventKey='locations'
              className='px-4 py-3 d-flex align-items-center gap-2'
              style={{ border: 'none', fontWeight: '500' }}
            >
              <Building size={18} />
              Sites
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey='overview'>
            <Row>
              <Col lg={8}>
                {/* Personal Information Card */}
                <Card className='border-0 shadow-sm mb-4'>
                  <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
                    <div className='d-flex justify-content-between align-items-center'>
                      <div>
                        <h5 className='mb-0'>Personal Information</h5>
                        <small className='text-muted'>Basic cusatomer details</small>
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
                    <div className='info-grid'>
                      <div className='info-section'>
                        <div className='info-items'>
                          <div className='info-card'>
                            <div className='info-icon'>
                              <i className='fe fe-user'></i>
                            </div>
                            <div className='info-content'>
                              <div className='info-label'>Full Name</div>
                              <div className='info-value'>{customer.customerName}</div>
                            </div>
                          </div>

                          <div className='info-card'>
                            <div className='info-icon'>
                              <i className='fe fe-hash'></i>
                            </div>
                            <div className='info-content'>
                              <div className='info-label'>Customer ID</div>
                              <div className='info-value'>{customer.id}</div>
                            </div>
                          </div>

                          <div className='info-card'>
                            <div className='info-icon'>
                              <i className='fe fe-hash'></i>
                            </div>
                            <div className='info-content'>
                              <div className='info-label'>TIN Number</div>
                              <div className='info-value'>{customer.tinNumber}</div>
                            </div>
                          </div>

                          <div className='info-card'>
                            <div className='info-icon'>
                              <i className='fe fe-hash'></i>
                            </div>
                            <div className='info-content'>
                              <div className='info-label'>BRN Number</div>
                              <div className='info-value'>
                                {customer.registrationNumber ?? customer.brnNumber}
                              </div>
                            </div>
                          </div>

                          <div className='info-card'>
                            <div className='info-icon'>
                              <i className='fe fe-activity'></i>
                            </div>
                            <div className='info-content'>
                              <div className='info-label'>Status</div>
                              <div className='info-value text-capitalize'>{customer.status}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={4}>
                <Card className='border-0 shadow-sm mb-4'>
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
                        bg={customer.contract.status === 'Y' ? 'success' : 'danger'}
                        className='status-badge'
                      >
                        {customer.contract.status === 'Y' ? 'Active' : 'Inactive'}
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
          </Tab.Pane>

          <Tab.Pane eventKey='contacts'>
            <Row>
              <Col lg={8}>
                <Card>
                  <Card.Body>
                    <div className='contact-container'>
                      <div className='info-grid contact-container'>
                        {(!Array.isArray(customer.customerContact) ||
                          customer.customerContact.length < 1) && (
                          <div className='text-center py-5'>
                            <Exclamation size={80} className='text-muted' />
                            <h6>No Contacts Available</h6>
                            <p className='text-muted small'>Add contacts to your customer</p>
                          </div>
                        )}

                        {Array.isArray(customer.customerContact) &&
                          customer.customerContact.map((contact, i) => (
                            <div className='info-section'>
                              <h5 className='info-value mb-2 fs-5'>Contact #{i + 1}</h5>

                              <div className='info-card'>
                                <div className='info-icon'>
                                  <i className='fe fe-phone'></i>
                                </div>

                                <Row className='w-100 row-gap-3 column-gap-3'>
                                  {contact.isDefault && (
                                    <Col lg={12}>
                                      <Badge bg='primary'>Default</Badge>
                                    </Col>
                                  )}

                                  <Col lg={3}>
                                    <div className='info-label'>First Name</div>
                                    <div className='info-value'>{contact.firstName}</div>
                                  </Col>

                                  <Col lg={3}>
                                    <div className='info-label'>Last Name</div>
                                    <div className='info-value'>{contact.lastName}</div>
                                  </Col>

                                  <Col lg={3}>
                                    <div className='info-label'>Phone</div>
                                    <div className='info-value'>{contact.phone}</div>
                                  </Col>

                                  <Col lg={3}>
                                    <div className='info-label'>Email</div>
                                    <div className='info-value'>{contact.email}</div>
                                  </Col>

                                  <Col lg={3}>
                                    <div className='info-label'>Role</div>
                                    <div className='info-value'>{contact.role}</div>
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
                <Card className='border-0 shadow-sm mb-4'>
                  <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
                    <h5 className='mb-0'>Contact Overview</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className='text-center mb-4'>
                      <div style={{ fontSize: '2.5rem', fontWeight: '600', color: '#305cde' }}>
                        {Array.isArray(customer.customerContact)
                          ? customer.customerContact.length
                          : 0}
                      </div>
                      <div className='text-muted' style={{ fontSize: '16px' }}>
                        Total Contacts
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab.Pane>

          <Tab.Pane eventKey='locations'>
            <Row>
              <Col lg={8}>
                <Card>
                  <Card.Body>
                    <div className='contact-container'>
                      <div className='info-grid locations-container'>
                        {(!Array.isArray(customer.locations) || customer.locations.length < 1) && (
                          <div className='text-center py-5'>
                            <Exclamation size={80} className='text-muted' />
                            <h6>No Contacts Available</h6>
                            <p className='text-muted small'>Add contacts to your customer</p>
                          </div>
                        )}

                        {Array.isArray(customer.locations) &&
                          customer.locations.map((location, i) => (
                            <div className='info-section'>
                              <h5 className='info-value mb-2 fs-5'>Location #{i + 1}</h5>

                              <div className='info-card'>
                                <div className='info-icon'>
                                  <Building2 size={20} />
                                </div>

                                <Row className='w-100 row-gap-3 column-gap-3'>
                                  {location.isDefault && (
                                    <Col lg={12}>
                                      <Badge bg='primary'>Default</Badge>
                                    </Col>
                                  )}

                                  <Col lg={12}>
                                    <div className='info-label'>Main Address</div>
                                    <div className='info-value'>{location.mainAddress}</div>
                                  </Col>

                                  <Col lg={3}>
                                    <div className='info-label'>ID</div>
                                    <div className='info-value'>{location.siteId}</div>
                                  </Col>

                                  <Col lg={3}>
                                    <div className='info-label'>Name</div>
                                    <div className='info-value'>{location.siteName}</div>
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
                <Card className='border-0 shadow-sm mb-4'>
                  <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
                    <h5 className='mb-0'>Location Overview</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className='text-center mb-4'>
                      <div style={{ fontSize: '2.5rem', fontWeight: '600', color: '#305cde' }}>
                        {Array.isArray(customer.locations) ? customer.locations.length : 0}
                      </div>
                      <div className='text-muted' style={{ fontSize: '16px' }}>
                        Total Locations
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      <style jsx global>{`
        .nav-tabs {
          border-bottom: 1px solid #e2e8f0;
        }

        .nav-tabs .nav-link {
          color: #64748b;
          border: none;
          border-bottom: 2px solid transparent;
          padding: 1rem 1.5rem;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .nav-tabs .nav-link:hover {
          color: #305cde;
          border-color: transparent;
          background-color: #f8fafc;
        }

        .nav-tabs .nav-link.active {
          color: #305cde;
          border-bottom: 2px solid #305cde;
          background-color: transparent;
        }

        /* Card Styles */
        .info-grid {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .info-items {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .info-card {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.25rem;
          background: #f8fafc;
          border-radius: 12px;
          transition: all 0.2s ease;
          border: 1px solid #e2e8f0;
        }

        .info-card:hover {
          background: #f1f5f9;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .info-card.full-width {
          grid-column: 1 / -1;
        }

        .info-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #305cde;
          font-size: 1.2rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .info-content {
          flex: 1;
        }

        .info-label {
          font-size: 0.75rem;
          color: #64748b;
          margin-bottom: 0.25rem;
          font-weight: 500;
        }

        .info-value {
          color: #305cde;
          font-weight: 500;
          font-size: 0.9375rem;
        }

        /* Emergency Contact Styles */
        .emergency-container {
          background: #fef2f2;
          border: 1px dashed #fca5a5;
          border-radius: 12px;
          padding: 1.5rem;
        }

        .emergency-items {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .emergency-card {
          background: white;
          padding: 1.25rem;
          border-radius: 12px;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          transition: all 0.2s ease;
          border: 1px solid #fee2e2;
        }

        .emergency-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .emergency-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #fee2e2;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #dc2626;
          font-size: 1.2rem;
        }

        .emergency-content {
          flex: 1;
        }

        .emergency-label {
          font-size: 0.75rem;
          color: #64748b;
          margin-bottom: 0.25rem;
          font-weight: 500;
        }

        .emergency-value {
          color: #305cde;
          font-weight: 500;
          font-size: 0.9375rem;
        }

        /* Skills & Certifications Styles */
        .certificates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-top: 1rem;
        }

        .certificate-card {
          background: white;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .certificate-content {
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          height: 100%;
        }

        .certificate-card:hover .certificate-content {
          border-color: #cbd5e1;
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        }

        .certificate-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .certificate-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #305cde;
          margin-bottom: 0.5rem;
        }

        .certificate-issuer {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-bottom: 1rem;
        }

        .certificate-id {
          background: #f8fafc;
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          border: 1px dashed #cbd5e1;
        }

        .certificate-id code {
          display: block;
          color: #305cde;
          font-family: monospace;
          font-size: 0.875rem;
        }

        .certificate-dates {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 8px;
        }

        .date-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .date-item i,
        .date-item svg {
          padding: 0.5rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .certificate-status {
          position: absolute;
          bottom: 2rem;
          right: 2rem;
        }

        .certificate-status .badge {
          padding: 0.5rem 1rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        /* Skills Summary Styles */
        .skills-info {
          background: #f8fafc;
          border-radius: 12px;
          padding: 1.5rem;
          margin-top: 1rem;
        }

        .skills-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          padding: 0.5rem 0;
        }

        .skill-badge-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .skill-badge-item:hover {
          background: #f8fafc;
          transform: translateX(4px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .skill-badge-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #305cde;
        }

        .skill-icon {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e2e8f0;
          border-radius: 6px;
          color: #305cde;
        }

        .skill-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: #334155;
        }

        .remove-skill-btn {
          color: #94a3b8;
          padding: 4px;
          font-size: 18px;
          opacity: 0;
          transition: all 0.2s ease;
        }

        .skill-badge-item:hover .remove-skill-btn {
          opacity: 1;
        }

        .remove-skill-btn:hover {
          color: #ef4444;
          transform: scale(1.1);
        }

        /* Certificate Styles */
        .certificates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
          padding: 1rem 0;
        }

        .certificate-card {
          perspective: 1000px;
          height: 100%;
        }

        .certificate-content {
          position: relative;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 2rem;
          transition: all 0.3s ease;
          transform-style: preserve-3d;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .certificate-card:hover .certificate-content {
          transform: rotateX(5deg) rotateY(5deg);
          box-shadow: 0 20px 30px rgba(0, 0, 0, 0.1);
          border-color: #cbd5e1;
        }

        .certificate-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f1f5f9;
        }

        .certificate-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #305cde;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }

        .certificate-issuer {
          margin-bottom: 1.5rem;
        }

        .certificate-issuer strong {
          display: block;
          color: #0f172a;
          font-size: 1rem;
          margin-top: 0.25rem;
        }

        .certificate-id {
          background: #f8fafc;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          border: 1px dashed #cbd5e1;
        }

        .certificate-id code {
          display: block;
          color: #305cde;
          font-family: monospace;
          font-size: 0.875rem;
        }

        .certificate-dates {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 8px;
        }

        .date-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .remove-cert-btn {
          opacity: 0;
          transition: all 0.2s ease;
          font-size: 1.25rem;
        }

        .certificate-item:hover .remove-cert-btn {
          opacity: 1;
        }

        .remove-cert-btn:hover {
          transform: scale(1.1);
        }

        @media (max-width: 768px) {
          .certificate-dates {
            grid-template-columns: 1fr;
          }
        }

        /* Table Styles */
        .table {
          margin-bottom: 0;
        }

        .table th {
          font-weight: 600;
          background: #f8fafc;
          padding: 1rem;
          font-size: 0.875rem;
          color: #64748b;
        }

        .table td {
          padding: 1rem;
          vertical-align: middle;
          font-size: 0.875rem;
        }

        .table tbody tr {
          transition: all 0.2s ease;
        }

        .table tbody tr:hover {
          background-color: #f8fafc;
        }

        .table-responsive {
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        /* Filter Styles */
        .form-control,
        .form-select {
          font-size: 0.875rem;
          border-color: #e2e8f0;
          background-color: #fff;
        }

        .form-control:focus,
        .form-select:focus {
          border-color: #305cde;
          box-shadow: 0 0 0 0.2rem rgba(196, 18, 48, 0.25);
        }

        .form-select {
          padding-right: 2rem;
          background-position: right 0.5rem center;
        }

        /* Table Footer Styles */
        .table-footer {
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
        }

        /* Search Input Styles */
        .search-input {
          padding-left: 2.5rem;
          padding-right: 1rem;
          border-radius: 0.375rem;
        }

        .search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .filter-panel {
          border: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .filter-panel .form-control,
        .filter-panel .form-select {
          border: 1px solid #e2e8f0;
          font-size: 0.875rem;
          padding: 0.5rem 0.75rem;
        }

        .filter-panel .form-control:focus,
        .filter-panel .form-select:focus {
          border-color: #305cde;
          box-shadow: 0 0 0 2px rgba(196, 18, 48, 0.1);
        }

        .filter-panel .form-select {
          background-color: white;
          cursor: pointer;
        }

        /* Contact Styles */
        .contact-container,
        .locations-container {
          max-height: 800px;
          overflow-y: auto;
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
