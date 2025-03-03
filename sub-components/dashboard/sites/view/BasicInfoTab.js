import { Card, CardFooter, Col, Row } from 'react-bootstrap';
import { Activity, Hash, Person } from 'react-bootstrap-icons';

const BasicInfoTab = ({ site }) => {
  console.log({ site });

  return (
    <Card className='border-0 shadow-none'>
      <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h5 className='mb-0'>Basic Info</h5>
            <small className='text-muted'>Site Basic Details</small>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <Row>
          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Hash size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>ID:</div>
                <div className='text-primary-label fw-semibold'>{site.siteId || 'N/A'}</div>
              </div>
            </div>
          </Col>

          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Hash size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Name:</div>
                <div className='text-primary-label fw-semibold'>{site.siteName || 'N/A'}</div>
              </div>
            </div>
          </Col>

          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Activity size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Status:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {site.status || 'N/A'}
                </div>
              </div>
            </div>
          </Col>

          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Person size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Customer:</div>
                <div className='text-primary-label fw-semibold'>{site.customerName || 'N/A'}</div>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default BasicInfoTab;
