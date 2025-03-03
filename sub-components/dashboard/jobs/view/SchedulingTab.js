import { Calendar, Clock, ExclamationOctagon, Hash, People, Person } from 'react-bootstrap-icons';
const { Row, Col, Card } = require('react-bootstrap');

const SchedulingTab = ({ job }) => {
  return (
    <Row>
      <Col>
        <Card className='border-0 shadow-none'>
          <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
            <div className='d-flex justify-content-between align-items-center'>
              <div>
                <h5 className='mb-0'>Job Details</h5>
                <small className='text-muted'>Details about the job</small>
              </div>
            </div>
          </Card.Header>

          <Card.Body className='pt-4'>
            <Row className='row-gap-3'>
              <Col md={3} className='d-flex flex-column gap-3'>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Hash size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>ID:</div>
                    <div className='text-primary-label fw-semibold'>{job?.id}</div>
                  </div>
                </div>
              </Col>

              <Col md={3} className='d-flex flex-column gap-3'>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <ExclamationOctagon size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Priority:</div>
                    <div className='text-primary-label fw-semibold text-capitalize'>
                      {job?.priority || 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={3} className='d-flex flex-column gap-3'>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <ExclamationOctagon size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Scope:</div>
                    <div className='text-primary-label fw-semibold text-capitalize'>
                      {job?.scope || 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={3} className='d-flex flex-column gap-3'>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <ExclamationOctagon size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Status:</div>
                    <div className='text-primary-label fw-semibold text-capitalize'>
                      {job?.status || 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={6} className='d-flex flex-column gap-3'>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <ExclamationOctagon size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Description:</div>
                    <div className='text-primary-label fw-semibold text-capitalize'>
                      {job?.description || 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={6} className='d-flex flex-column gap-3'>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <ExclamationOctagon size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Remarks:</div>
                    <div className='text-primary-label fw-semibold text-capitalize'>
                      {job?.remarks || 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>

          <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
            <div className='d-flex justify-content-between align-items-center'>
              <div>
                <h5 className='mb-0'>Schedule Details</h5>
                <small className='text-muted'>Details about the job schedule</small>
              </div>
            </div>
          </Card.Header>

          <Card.Body className='pt-4'>
            <Row className='row-gap-3'>
              <Col md={6} className='d-flex flex-column gap-3'>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Person size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Assigned Technician:</div>
                    <div className='text-primary-label fw-semibold'>
                      {job?.workers?.map((worker) => worker?.name).join(', ') || 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={6} className='d-flex flex-column gap-3'>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <People size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Team:</div>
                    <div className='text-primary-label fw-semibold text-capitalize'>
                      {job?.priority || 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={3} className='d-flex flex-column gap-3'>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Calendar size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Start Date:</div>
                    <div className='text-primary-label fw-semibold text-capitalize'>
                      {job?.startDate || 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={3} className='d-flex flex-column gap-3'>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>Start Time:</div>
                    <div className='text-primary-label fw-semibold text-capitalize'>
                      {job?.startTime || 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={3} className='d-flex flex-column gap-3'>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Calendar size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>End Date:</div>
                    <div className='text-primary-label fw-semibold text-capitalize'>
                      {job?.endDate || 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={3} className='d-flex flex-column gap-3'>
                <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                  <div
                    className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                    style={{ width: '40px', height: '40px' }}
                  >
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className='text-secondary fs-6'>End Time:</div>
                    <div className='text-primary-label fw-semibold text-capitalize'>
                      {job?.endTime || 'N/A'}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default SchedulingTab;
