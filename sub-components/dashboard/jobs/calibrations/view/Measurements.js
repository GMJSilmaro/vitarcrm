import { TRACEABILITY_CALIBRATION_LAB } from '@/schema/calibration';
import { Badge, Card, Col, Row } from 'react-bootstrap';
import {
  BookmarkCheck,
  Buildings,
  Crosshair,
  GlobeAsiaAustralia,
  Hash,
  ListOl,
  Rulers,
  ShieldCheck,
  Speedometer,
  ViewStacked,
} from 'react-bootstrap-icons';

const Measurements = ({ calibration }) => {
  const rangeDetails = calibration?.rangeDetails || [];

  console.log({ rangeDetails });

  return (
    <Card className='border-0 shadow-none'>
      <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h4 className='mb-0'>Location</h4>
            <p className='text-muted fs-6 mb-0'>Location of the calibration.</p>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <Row className='row-gap-3'>
          <Col md={12}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <Buildings size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Location:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.calibrationLocation || 'N/A'}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>

      <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h4 className='mb-0'>Criteria</h4>
            <p className='text-muted fs-6 mb-0'>
              Measurements criteria to be used as a basis for the calibration.
            </p>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <Row className='row-gap-3'>
          <Col md={4}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <ViewStacked size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Type of Range:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.rangeType || 'N/A'}
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
                <Hash size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Range Count:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.rangeCount || 'N/A'}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>

      <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h4 className='mb-0'>Range Details </h4>
            <p className='text-muted fs-6 mb-0'>Details for each measurement range</p>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        {rangeDetails.map((rd, i) => (
          <Row key={`range-details-${i}`} className='row-gap-3'>
            <Col xs={12}>
              <h1 className='mb-0'>
                <Badge bg='primary' className='fs-5'>
                  Range {i + 1}
                </Badge>
              </h1>
            </Col>

            <Col md={4}>
              <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
                <div
                  className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                  style={{ width: '40px', height: '40px' }}
                >
                  <Speedometer size={20} />
                </div>
                <div>
                  <div className='text-secondary fs-6'>Range of Calibration (Min):</div>
                  <div className='text-primary-label fw-semibold text-capitalize'>
                    {rd?.rangeMinCalibration ?? 'N/A'}
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
                  <Speedometer size={20} />
                </div>
                <div>
                  <div className='text-secondary fs-6'>Range of Calibration (Max):</div>
                  <div className='text-primary-label fw-semibold text-capitalize'>
                    {rd?.rangeMaxCalibration ?? 'N/A'}
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
                  <Crosshair size={20} />
                </div>
                <div>
                  <div className='text-secondary fs-6'>Resolution:</div>
                  <div className='text-primary-label fw-semibold text-capitalize'>
                    {rd?.resolution || 'N/A'}
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
                  <Rulers size={20} />
                </div>
                <div>
                  <div className='text-secondary fs-6'>Unit Used For COC:</div>
                  <div className='text-primary-label fw-semibold text-capitalize'>
                    {rd?.unitUsedForCOC || 'N/A'}
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
                  <ListOl size={20} />
                </div>
                <div>
                  <div className='text-secondary fs-6'>No. of Calibration Point:</div>
                  <div className='text-primary-label fw-semibold text-capitalize'>
                    {rd?.calibrationPointNo || 'N/A'}
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        ))}
      </Card.Body>

      <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h4 className='mb-0'>Traceability</h4>
            <p className='text-muted fs-6 mb-0'>Details of the calibration traceability.</p>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <Row className='row-gap-3'>
          <Col md={4}>
            <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
              <div
                className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
                style={{ width: '40px', height: '40px' }}
              >
                <BookmarkCheck size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Traceability Type:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.traceabilityType ?? 'N/A'}
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
                <GlobeAsiaAustralia size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Country:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.traceabilityCountry ?? 'N/A'}
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
                <Buildings size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Country Lab:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.traceabilityCalibrationLab?.length > 0
                    ? TRACEABILITY_CALIBRATION_LAB.filter((lab) =>
                        calibration?.traceabilityCalibrationLab?.includes(lab.value)
                      )
                        .filter(Boolean)
                        .map((lab) => `${lab.name} - ${lab.accreditationNo}`)
                        .join(', ')
                    : 'N/A'}
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
                <Buildings size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Signatory:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.traceabilityCalibrationLab?.length > 0
                    ? TRACEABILITY_CALIBRATION_LAB.filter((lab) =>
                        calibration?.traceabilityCalibrationLab?.includes(lab.value)
                      )?.[0]?.signatory
                    : 'N/A'}
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
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Accreditation Body:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.traceabilityAccreditationBody || 'N/A'}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default Measurements;
