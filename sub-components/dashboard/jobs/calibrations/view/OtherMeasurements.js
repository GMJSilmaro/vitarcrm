import { Card, Col, Row } from 'react-bootstrap';
import {
  LayoutWtf,
  Thermometer,
  ThermometerHigh,
  ThermometerSnow,
  ThermometerSun,
} from 'react-bootstrap-icons';

const OtherMeasurements = ({ calibration }) => {
  return (
    <Row className='row-gap-3'>
      <Col md={3}>
        <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
          <div
            className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
            style={{ width: '40px', height: '40px' }}
          >
            <Thermometer size={20} />
          </div>
          <div>
            <div className='text-secondary fs-6'>Temperature (Min):</div>
            <div className='text-primary-label fw-semibold text-capitalize'>
              {calibration?.minTemperature || 'N/A'}
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
            <ThermometerHigh size={20} />
          </div>
          <div>
            <div className='text-secondary fs-6'>Temperature (Max):</div>
            <div className='text-primary-label fw-semibold text-capitalize'>
              {calibration?.maxTemperature ?? 'N/A'}
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
            <ThermometerSnow size={20} />
          </div>
          <div>
            <div className='text-secondary fs-6'>R. Humidity (Min):</div>
            <div className='text-primary-label fw-semibold text-capitalize'>
              {calibration?.rangeMinRHumidity ?? 'N/A'}
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
            <ThermometerSun size={20} />
          </div>
          <div>
            <div className='text-secondary fs-6'>R. Humidity (Max):</div>
            <div className='text-primary-label fw-semibold text-capitalize'>
              {calibration?.rangeMaxRHumidity ?? 'N/A'}
            </div>
          </div>
        </div>
      </Col>

      <Col md={4}>
        <div className='d-flex align-items-sm-center gap-3 p-3 bg-light-subtle rounded border border-light-subtle w-100 h-100'>
          <div className='d-flex justify-content-center align-items-center flex-column w-100 gap-3'>
            <div
              className='d-flex justify-content-center align-items-center fs-3 rounded shadow text-primary-label'
              style={{ width: '40px', height: '40px' }}
            >
              <LayoutWtf size={20} />
            </div>
            <div className='text-secondary fs-6'>Type of Balance:</div>
            <div className=' gap-5'>
              {calibration?.typeOfBalance && (
                <img src={`/images/balance-type-${calibration?.typeOfBalance}.png`} width={140} />
              )}
            </div>
          </div>
        </div>
      </Col>
    </Row>
  );
};

export default OtherMeasurements;
