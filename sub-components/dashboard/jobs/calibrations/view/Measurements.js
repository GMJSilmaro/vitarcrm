import React from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import {
  BookmarkCheck,
  Crosshair,
  ListOl,
  Rulers,
  Speedometer,
  Thermometer,
  ThermometerHigh,
  ThermometerSnow,
  ThermometerSun,
  ViewStacked,
} from 'react-bootstrap-icons';

const Measurements = ({ calibration }) => {
  return (
    <Card className='border-0 shadow-none'>
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
          <Col md={3}>
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

          <Col md={3}>
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
                  {calibration?.rangeMinCalibration ?? 'N/A'}
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
                <Speedometer size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Range of Calibration (Max):</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.rangeMaxCalibration ?? 'N/A'}
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

          <Col md={3}>
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
                  {calibration?.resolution || 'N/A'}
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
                <Rulers size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>Unit Used For COC:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.unitUsedForCOC || 'N/A'}
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
                <ListOl size={20} />
              </div>
              <div>
                <div className='text-secondary fs-6'>No. of Calibration Point:</div>
                <div className='text-primary-label fw-semibold text-capitalize'>
                  {calibration?.calibrationPointNo || 'N/A'}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>

      <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h4 className='mb-0'>Other measurements</h4>
            <p className='text-muted fs-6 mb-0'>Details about the other measurements.</p>
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
        </Row>
      </Card.Body>
    </Card>
  );
};

export default Measurements;
