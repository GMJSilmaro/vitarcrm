import { format } from 'date-fns';
import { useCallback } from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import {
  Building,
  Calendar,
  CalendarEvent,
  CalendarRange,
  CardHeading,
  CheckCircle,
  Clock,
  Geo,
  Hash,
  Person,
  Tag,
  Toggles,
  WrenchAdjustableCircle,
} from 'react-bootstrap-icons';

const InfoTab = ({ calibration }) => {
  const handleGetLocationValue = useCallback(() => {
    if (calibration?.location) {
      const locationData = calibration?.location;
      let value = locationData?.siteName || 'N/A';

      if (locationData?.addresses && locationData?.addresses?.length > 0) {
        const defaultAddress = locationData.addresses.find((address) => address.isDefault);

        if (defaultAddress) {
          if (defaultAddress?.street1) value += ` ${defaultAddress.street1}`;
          else if (defaultAddress?.street2) value += ` ${defaultAddress.street2}`;
          else if (defaultAddress?.street3) value += ` ${defaultAddress.street3}`;

          if (defaultAddress?.city) value += ` ${defaultAddress.city}`;
          if (defaultAddress?.province) value += ` ${defaultAddress.province}`;
          if (defaultAddress?.postalCode) value += ` ${defaultAddress.postalCode}`;
          if (defaultAddress?.country) value += ` ${defaultAddress.country}`;
        }
      }

      return value;
    }

    return 'N/A';
  }, [calibration]);

  return (
    <Card className='border-0 shadow-none'>
      <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h5 className='mb-0'>Customer Info</h5>
            <small className='text-muted'>Basic customer details</small>
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
                <Person size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Customer:</div>
                <div className='text-primary-label fw-semibold'>
                  {calibration?.job?.customer?.name || 'N/A'}
                </div>
              </div>
            </div>
          </Col>

          <Col md={9}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Building size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Location:</div>
                <div className='text-primary-label fw-semibold'>{handleGetLocationValue()}</div>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>

      <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h5 className='mb-0'>Customer Equipment</h5>
            <small className='text-muted'>Details about the customer equipment being tested.</small>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <Row className='row-gap-3'>
          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <WrenchAdjustableCircle size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Description:</div>
                <div className='text-primary-label fw-semibold'>
                  {calibration?.description?.name || 'N/A'}
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
                <CardHeading size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Make:</div>
                <div className='text-primary-label fw-semibold'>{calibration?.make || 'N/A'}</div>
              </div>
            </div>
          </Col>

          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <CardHeading size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Model:</div>
                <div className='text-primary-label fw-semibold'>{calibration?.model || 'N/A'}</div>
              </div>
            </div>
          </Col>

          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <CardHeading size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Serial No:</div>
                <div className='text-primary-label fw-semibold'>
                  {calibration?.serialNumber || 'N/A'}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>

      <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h5 className='mb-0'>Calibration Info</h5>
            <small className='text-muted'>
              Calibration Info, including calibration ID, category, date issued, date received, etc.
            </small>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <Row className='row-gap-3'>
          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Hash size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Job ID:</div>
                <div className='text-primary-label fw-semibold'>{calibration?.jobId || 'N/A'}</div>
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
                <div className='text-secondary fs-6'>Calibrate ID:</div>
                <div className='text-primary-label fw-semibold'>
                  {calibration?.calibrateId || 'N/A'}
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
                <Hash size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Certificate No:</div>
                <div className='text-primary-label fw-semibold'>
                  {calibration?.certificateNumber || 'N/A'}
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
                <Tag size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Category No:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.category.toLowerCase() || 'N/A'}
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
                <div className='text-secondary fs-6'>Submitted By:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.submittedBy?.name || 'N/A'}
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
                <CheckCircle size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Approved Signatory:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.approvedSignatory?.name || 'N/A'}
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
                <Geo size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Calibrated At:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.calibratedAt || 'N/A'}
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
                <div className='text-secondary fs-6'>Calibrated By:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.calibratedBy?.name || 'N/A'}
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
                <Calendar size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Date Issued:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.dateIssued || 'N/A'}
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
                <Calendar size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Date Received:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.dateReceived || 'N/A'}
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
                <Calendar size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Date Calibrated:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.dateCalibrated || 'N/A'}
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
                <Toggles size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Due Date Requested:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.dueDateRequested || 'N/A'}
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
                <CalendarRange size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Due Date Duration:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.dueDateDuration || 'N/A'}
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
                <CalendarEvent size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Due Date:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.dueDate || 'N/A'}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>

      <Card.Header className='bg-transparent border-0 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h5 className='mb-0'>Record Details</h5>
            <small className='text-muted'>
              Details about who created or updated the record and when it was modified.
            </small>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <Row className='row-gap-3'>
          <Col md={3}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Clock size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Date:</div>
                <div className='text-primary-label fw-semibold'>
                  {calibration?.createdAt
                    ? format(calibration.createdAt.toDate(), 'dd/MM/yyyy')
                    : 'N/A'}
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
                <div className='text-secondary fs-6'>Created By:</div>
                <div className='text-primary-label fw-semibold'>
                  {calibration?.createdBy?.displayName || 'N/A'}
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
                <Clock size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Last Updated:</div>
                <div className='text-primary-label fw-semibold'>
                  {calibration?.updatedAt
                    ? format(calibration.createdAt.toDate(), 'dd/MM/yyyy')
                    : 'N/A'}
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
                <div className='text-secondary fs-6'>Updated By:</div>
                <div className='text-primary-label fw-semibold'>
                  {calibration?.updatedBy?.displayName || 'N/A'}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default InfoTab;
