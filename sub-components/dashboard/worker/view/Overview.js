import { format } from 'date-fns';
import { Badge, Card, Col, Row } from 'react-bootstrap';
import {
  Activity,
  Award,
  Calendar,
  Clock,
  Envelope,
  GenderAmbiguous,
  GeoAlt,
  PatchCheck,
  People,
  Person,
  Shield,
  Tag,
  Telephone,
} from 'react-bootstrap-icons';

const Overview = ({ user }) => {
  return (
    <Card className='border-0 shadow-none'>
      <Card.Body>
        <Row className='row-gap-3'>
          <Col lg={8}>
            <Row className='row-gap-3'>
              <Col md={12}>
                <Card.Header className='bg-transparent border-0 p-0'>
                  <div className='d-flex justify-content-between align-items-center'>
                    <div>
                      <h4 className='mb-0'>Personal Information</h4>
                      <p className='text-muted fs-6 mb-0'>Basic details and contact information</p>
                    </div>
                  </div>
                </Card.Header>
              </Col>

              <Col md={12}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Person size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Full Name:</div>
                    <div className='text-primary-label fw-semibold'>{user?.fullName || 'N/A'}</div>
                  </div>
                </div>
              </Col>

              <Col md={6}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Person size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Worker Id:</div>
                    <div className='text-primary-label fw-semibold'>{user?.workerId || 'N/A'}</div>
                  </div>
                </div>
              </Col>

              <Col md={6}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <GenderAmbiguous size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Gender:</div>
                    <div className='text-primary-label fw-semibold'>{user?.gender || 'N/A'}</div>
                  </div>
                </div>
              </Col>

              <Col md={6}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Calendar size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Date of Birth:</div>
                    <div className='text-primary-label fw-semibold'>
                      {user?.dateOfBirth ? format(user?.dateOfBirth, 'MMMM d, yyyy') : 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={6}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Calendar size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Expiration Date:</div>
                    <div className='text-primary-label fw-semibold'>
                      {user?.expirationDate ? format(user?.expirationDate, 'MMMM d, yyyy') : 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={6}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Envelope size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Email:</div>
                    <div className='text-primary-label fw-semibold'>{user?.email || 'N/A'}</div>
                  </div>
                </div>
              </Col>

              <Col md={6}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Telephone size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Primary Phone:</div>
                    <div className='text-primary-label fw-semibold'>
                      {user?.primaryPhone || 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={12}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <GeoAlt size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Complete Address:</div>
                    <div className='text-primary-label fw-semibold'>
                      {[
                        user?.address?.streetAddress,
                        user?.address?.stateProvince,
                        user?.address?.postalCode,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  </div>
                </div>
              </Col>

              {user?.categories && user?.categories?.length > 0 && (
                <Col md={12}>
                  <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                    <div
                      className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                      style={{ width: '40px', height: '40px' }}
                    >
                      <Tag size={20} />
                    </div>
                    <div>
                      <div className='text-secondary fs-6'>Assigned Categories:</div>
                      <div className='d-flex gap-2 mt-1 flex-wrap'>
                        {user?.categories?.map((category) => (
                          <Badge bg='light' text='dark'>
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Col>
              )}
            </Row>
          </Col>

          <Col lg={4}>
            <Row className='row-gap-3'>
              <Col md={12}>
                <Card.Header className='bg-transparent border-0 p-0'>
                  <div className='d-flex justify-content-between align-items-center'>
                    <div>
                      <h4 className='mb-0'>Account Status</h4>
                      <p className='text-muted fs-6 mb-0'>Account status & role details</p>
                    </div>
                  </div>
                </Card.Header>
              </Col>

              <Col md={6}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Activity size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Status:</div>
                    <Badge className='mt-1' bg={user?.isActive ? 'success' : 'danger'}>
                      {user?.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </Col>

              <Col md={6}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Shield size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Role & Access:</div>
                    <div className='d-flex gap-2 mt-1'>
                      <Badge className='text-capitalize' bg='primary'>
                        {user?.role}
                      </Badge>

                      {user.isFieldWorker && (
                        <Badge className='text-capitalize' bg='warning'>
                          Field Worker
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={12}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Last Login:</div>
                    <div className='text-primary-label fw-semibold'>
                      {user?.lastLogin ? format(user?.lastLogin.toDate(), 'PPpp') : 'Never'}
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={12}>
                <Card.Header className='bg-transparent border-0 p-0'>
                  <div className='d-flex justify-content-between align-items-center'>
                    <div>
                      <h4 className='mb-0'>Skills</h4>
                      <p className='text-muted fs-6 mb-0'>List of skills & experties</p>
                    </div>
                  </div>
                </Card.Header>
              </Col>

              <Col md={12}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Award size={20} />
                  </div>
                  <div>
                    <div className='d-flex gap-2 mt-1 flex-wrap'>
                      {user?.skills?.map((skill) => (
                        <Badge className='text-capitalize' bg='light' text='dark'>
                          <PatchCheck size={14} className='me-2' />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Col>

          <Col lg={8}>
            <Row className='row-gap-3'>
              <Col md={12}>
                <Card.Header className='bg-transparent border-0 pt-4 px-0'>
                  <div className='d-flex justify-content-between align-items-center'>
                    <div>
                      <h4 className='mb-0'>Emergency Contact</h4>
                      <p className='text-muted fs-6 mb-0'>Emergency contact info</p>
                    </div>
                  </div>
                </Card.Header>
              </Col>

              <Col md={4}>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Person size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Name:</div>
                    <div className='text-primary-label fw-semibold'>
                      {user?.emergencyContactName || 'N/A'}
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
                    <People size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Name:</div>
                    <div className='text-primary-label fw-semibold'>
                      {user?.emergencyRelationship || 'N/A'}
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
                    <Telephone size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Phone:</div>
                    <div className='text-primary-label fw-semibold'>
                      {user?.emergencyPhone || 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default Overview;
