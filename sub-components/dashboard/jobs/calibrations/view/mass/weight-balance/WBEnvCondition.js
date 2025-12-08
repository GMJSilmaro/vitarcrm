import React from 'react';
import { Col, Row } from 'react-bootstrap';
import {
  Thermometer,
  ThermometerHigh,
  ThermometerSnow,
  ThermometerSun,
} from 'react-bootstrap-icons';

const WBEnvCondition = ({ calibration }) => {
  return (
    <>
      <h4 className='mb-0'>Environmental Condition</h4>

      <p className='text-muted fs-6'>
        The instrument has been calibrated under the following environmental
        conditions.
      </p>

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
              <div className='text-secondary fs-6'>
                Ambient Temperature (Min):
              </div>
              <div className='text-primary-label fw-semibold text-capitalize'>
                {calibration?.minTemperature || 'N/A'} °C
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
              <div className='text-secondary fs-6'>
                Ambient Temperature (Max):
              </div>
              <div className='text-primary-label fw-semibold text-capitalize'>
                {calibration?.maxTemperature ?? 'N/A'} °C
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
              <div className='text-secondary fs-6'>
                Relative Humidity (Min):
              </div>
              <div className='text-primary-label fw-semibold text-capitalize'>
                {calibration?.minRHumidity ?? 'N/A'} %rh
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
              <div className='text-secondary fs-6'>
                Relative Humidity (Max):
              </div>
              <div className='text-primary-label fw-semibold text-capitalize'>
                {calibration?.maxRHumidity ?? 'N/A'} %rh
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </>
  );
};

export default WBEnvCondition;
