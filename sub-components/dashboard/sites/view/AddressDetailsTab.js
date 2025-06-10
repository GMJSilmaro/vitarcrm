import { Building2 } from 'lucide-react';
import React from 'react';
import { Badge, Card, Col, Row } from 'react-bootstrap';
import { GeoAlt } from 'react-bootstrap-icons';

const AddressDetailsTab = ({ site }) => {
  return (
    <Row>
      <Col lg={8}>
        <Card className='border-0 shadow-none mb-4'>
          <Card.Body>
            <div className='overflow-auto pe-2' style={{ maxHeight: '740px' }}>
              <div className='d-flex flex-column gap-4 locations-container'>
                {(!Array.isArray(site.addresses) || site.addresses.length < 1) && (
                  <div className='text-center py-5'>
                    <Exclamation size={80} className='text-muted' />
                    <h6>No Address Available</h6>
                    <p className='text-muted small'>Add address to the site</p>
                  </div>
                )}

                {site.addresses &&
                  Array.isArray(site.addresses) &&
                  site.addresses.map((address, i) => (
                    <div>
                      <h5 className='text-primary-label mb-2 fs-5'>Address #{i + 1}</h5>

                      <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                        <div
                          className='d-none d-lg-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                          style={{ width: '40px', height: '40px' }}
                        >
                          <GeoAlt size={20} />
                        </div>

                        <Row className='w-100 row-gap-3'>
                          {address.isDefault && (
                            <Col lg={12}>
                              <Badge bg='primary'>Default</Badge>
                            </Col>
                          )}

                          <Col lg={12}>
                            <div className='text-secondary fs-6'>Street Address 1:</div>
                            <div className='text-primary-label fw-semibold'>
                              {address.street1 || 'N/A'}
                            </div>
                          </Col>

                          <Col lg={12}>
                            <div className='text-secondary fs-6'>Street Address 2:</div>
                            <div className='text-primary-label fw-semibold'>
                              {address.street2 || 'N/A'}
                            </div>
                          </Col>

                          <Col lg={12}>
                            <div className='text-secondary fs-6'>Street Address 3:</div>
                            <div className='text-primary-label fw-semibold'>
                              {address.street3 || 'N/A'}
                            </div>
                          </Col>

                          <Col lg={4}>
                            <div className='text-secondary fs-6'>State:</div>
                            <div className='text-primary-label fw-semibold'>
                              {address.province || 'N/A'}
                            </div>
                          </Col>

                          <Col lg={4}>
                            <div className='text-secondary fs-6'>City:</div>
                            <div className='text-primary-label fw-semibold'>
                              {address.city || 'N/A'}
                            </div>
                          </Col>

                          <Col lg={4}>
                            <div className='text-secondary fs-6'>Postal Code:</div>
                            <div className='text-primary-label fw-semibold'>
                              {address.postalCode || 'N/A'}
                            </div>
                          </Col>

                          <Col lg={4}>
                            <div className='text-secondary fs-6'>Country:</div>
                            <div className='text-primary-label fw-semibold'>
                              {address.country || 'N/A'}
                            </div>
                          </Col>

                          <Col lg={4}>
                            <div className='text-secondary fs-6'>Longitude:</div>
                            <div className='text-primary-label fw-semibold'>
                              {address.longitude || 'N/A'}
                            </div>
                          </Col>

                          <Col lg={4}>
                            <div className='text-secondary fs-6'>Latitude:</div>
                            <div className='text-primary-label fw-semibold'>
                              {address.latitude || 'N/A'}
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

      <Col lg={4} className='d-none d-lg-block'>
        <Card className='my-4 bg-light-subtle rounded border border-light-subtle w-100'>
          <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
            <h5 className='mb-0'>Address Overview</h5>
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
                {site.addresses && Array.isArray(site.addresses) ? site?.addresses?.length : 0}
              </div>
              <div className='text-muted' style={{ fontSize: '16px' }}>
                Total Address
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default AddressDetailsTab;
