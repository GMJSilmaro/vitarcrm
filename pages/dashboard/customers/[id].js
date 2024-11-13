import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Tabs,
  Tab,
  Breadcrumb,
  Button,
  Spinner,
  Badge
} from 'react-bootstrap';
import { useRouter } from 'next/router';
import { GeeksSEO } from 'widgets';
import { AccountInfoTab } from 'sub-components/customer/AccountInfoTab';
import { ServiceLocationTab } from 'sub-components/customer/ServiceLocationTab';
import EquipmentsTab from 'sub-components/customer/EquipmentsTab';
import { DocumentsTab } from 'sub-components/customer/DocumentsTab';
import { HistoryTab } from 'sub-components/customer/HistoryTab';
import { NotesTab } from 'sub-components/customer/NotesTab';
import QuotationsTab from 'sub-components/customer/QuotationsTab';
import Link from 'next/link';
import ContentHeader from 'components/dashboard/ContentHeader';

const ViewCustomer = () => {
  const [activeTab, setActiveTab] = useState('accountInfo');
  const [customerData, setCustomerData] = useState(null);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { id } = router.query;
  
  useEffect(() => {
    // Wait for router to be ready
    if (!router.isReady) return;

    const fetchCustomerData = async () => {
      console.log('Current ID:', id);
      if (!id || id === '[id]') {
        console.log('Skipping fetch - invalid ID');
        return;
      }

      setLoading(true);
      try {
        const [customerResponse, equipmentResponse] = await Promise.all([
          fetch(`/api/getCustomerCode?cardCode=${encodeURIComponent(id)}`),
          fetch('/api/getEquipments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cardCode: id })
          })
        ]);

        if (!customerResponse.ok) {
          throw new Error(`Failed to fetch customer details: ${await customerResponse.text()}`);
        }

        const [customerInfo, equipmentData] = await Promise.all([
          customerResponse.json(),
          equipmentResponse.ok ? equipmentResponse.json() : []
        ]);

        setCustomerData(customerInfo);
        setEquipments(equipmentData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [router.isReady, id]); // Add router.isReady to dependencies

  const handleTabChange = (key) => {
    if (key) setActiveTab(key);
  };

  if (loading) {
    return (
      <Container>
        <Row>
          <Col lg={12} md={12} sm={12}>
            <ContentHeader
              title="Loading..."
              description="View and manage customer details, equipment, and history"
              breadcrumbItems={[
                { text: 'Dashboard', link: '/', icon: <i className="fe fe-home me-2" /> },
                { text: 'Loading...', link: '/customers' },
                { text: 'Loading...' }
              ]}
              badgeText="Loading..."
              badgeText2="Loading..."
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <Spinner animation="border" role="status" variant="primary" style={{ width: '3rem', height: '3rem' }}>
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="mt-3">Loading customer data...</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Row>
          <Col>
            <Card className="text-center">
              <Card.Body>
                <Card.Title className="text-danger">Error Loading Customer</Card.Title>
                <Card.Text>
                  {error}
                  <br />
                  <small className="text-muted">Customer ID: {id}</small>
                </Card.Text>
                <div className="d-flex gap-2 justify-content-center">
                  <Button variant="primary" onClick={() => router.push('/customers')}>
                    Back to Customers List
                  </Button>
                  <Button variant="secondary" onClick={() => window.location.reload()}>
                    Retry Loading
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  if (!customerData) {
    return (
      <Container className="mt-5">
        <Row>
          <Col>
            <Card className="text-center">
              <Card.Body>
                <Card.Title>No Data Found</Card.Title>
                <Card.Text>No customer data found for the given ID.</Card.Text>
                <Button variant="primary" onClick={() => router.push('/customers')}>
                  Back to Customers List
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container>
      <GeeksSEO title={`View Customer: ${customerData.cardName || ''} | FSM Portal`} />
      <Row>
        <Col lg={12} md={12} sm={12}>
          <ContentHeader
            title={customerData?.CardName}
            description="View and manage customer details, equipment, and history"
            badgeText={`ID: ${customerData?.CardCode}`}
            badgeText2={customerData?.ContactPerson}
            breadcrumbItems={[
              { text: 'Dashboard', link: '/', icon: <i className="fe fe-home me-2" /> },
              { text: 'Customers', link: '/customers' },
              { text: 'Customer Details' }
            ]}
            actionButton={{
              text: 'Back to Customers',
              icon: <i className="fe fe-arrow-left"></i>,
              onClick: () => router.push('/customers'),
              variant: 'light'
            }}
          />
        </Col>
      </Row>

      <Row>
        <Col xl={12} lg={12} md={12} sm={12}>
          <Card className="shadow-sm">
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={handleTabChange}
                className="mb-3"
              >
                <Tab eventKey="accountInfo" title="Account Info">
                  <AccountInfoTab customerData={customerData} />
                </Tab>
                <Tab eventKey="serviceLocation" title="Site">
                  <ServiceLocationTab customerData={customerData} />
                </Tab>
                <Tab eventKey="notes" title="Notes">
                  <NotesTab customerId={id} />
                </Tab>
                <Tab eventKey="equipments" title="Equipments">
                    <EquipmentsTab customerData={customerData} equipments={equipments} />
                </Tab>
                <Tab eventKey="history" title="Job History">
                  <HistoryTab customerData={customerData} customerID={id} />
                </Tab>
                <Tab eventKey="quotations" title="Quotations">
                  <QuotationsTab customerId={id} />
                </Tab>
                
                <Tab eventKey="documents" title="Documents">
                  <DocumentsTab customerData={customerData} />
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ViewCustomer;
