import { Accordion, Card, Col, Nav, Row, Tab } from 'react-bootstrap';
import DFNVTest from './DFNVTest';
import { CardList, Gear, GearFill, Rulers, Table } from 'react-bootstrap-icons';
import RTest from './RTest';
import ETest from './ETest';
import { useEffect, useMemo } from 'react';
import CalculationTable from './CalculationTable';
import { FormProvider, useForm } from 'react-hook-form';
import OtherMeasurements from '../OtherMeasurements';
import EnvironmentalCondition from './EnvironmentalCondition';

const CalibrationMass = ({ calibration, category }) => {
  const rangeDetails = calibration?.rangeDetails || [];

  return (
    <Card className='border-0 shadow-none'>
      <Card.Body>
        <EnvironmentalCondition calibration={calibration} />

        <hr className='my-5' />

        <Tab.Container defaultActiveKey='0'>
          <Row className='mt-5'>
            <Col className='px-0' md={12}>
              <Nav
                variant='pills'
                className='d-flex justify-content-center align-items-center gap-3'
              >
                {rangeDetails?.length > 0 &&
                  Array.from({ length: rangeDetails?.length }).map((_, rangeIndex) => (
                    <Nav.Item key={`${rangeIndex}-nav-item`} className='d-flex align-items-center'>
                      <Nav.Link eventKey={`${rangeIndex}`}>
                        <CardList size={18} />
                        Range {rangeIndex + 1}
                      </Nav.Link>
                    </Nav.Item>
                  ))}
              </Nav>
            </Col>

            <Col md={12} className='ps-0'>
              <Tab.Content className='w-100 h-100'>
                {rangeDetails?.length > 0 &&
                  rangeDetails.map((range, rangeIndex) => (
                    <Tab.Pane
                      key={`${rangeIndex}-tab-pane`}
                      className='h-100'
                      eventKey={rangeIndex}
                    >
                      <CalibrationMassContent
                        calibration={calibration}
                        category={category}
                        range={range}
                        rangeIndex={rangeIndex}
                      />
                    </Tab.Pane>
                  ))}
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </Card.Body>
    </Card>
  );
};

const CalibrationMassContent = ({ calibration, category, range, rangeIndex }) => {
  const form = useForm({
    values: calibration,
  });

  console.log({ range });

  return (
    <>
      <Row className='mb-3'>
        <h4 className='mb-0'>Calibration</h4>
        <p className='text-muted fs-6'>
          Details of various test, computation and results of the calibration.
        </p>

        <div className='flex align-items-center gap-2'>
          <div className='fs-5'>
            <span className='pe-2'>Category:</span>
            <span className='fw-bold text-capitalize'>{category}</span>
          </div>

          <div className='fs-5'>
            <span className='pe-2'>Range:</span>
            <span className='fw-bold'>
              {range?.rangeMinCalibration ?? ''} to {range?.rangeMaxCalibration || ''} (gram)
            </span>
          </div>

          <div className='fs-5'>
            <span className='pe-2'>Resolution:</span>
            <span className='fw-bold'>{range?.resolution || ''}</span>
          </div>

          <div className='fs-5'>
            <span className='pe-2'>Unit for COC:</span>
            <span className='fw-bold'>{range?.unitUsedForCOC || ''}</span>
          </div>

          <div className='fs-5'>
            <span className='pe-2'>No. of Calibration Point:</span>
            <span className='fw-bold'>{range?.calibrationPointNo || ''}</span>
          </div>
        </div>
      </Row>

      <Row>
        <Accordion className='mt-1'>
          <Accordion.Item eventKey='0'>
            <Accordion.Header>
              <Table className='me-2' size={17} />
              Departure From Nominal Value (g)
            </Accordion.Header>

            <Accordion.Body>
              <DFNVTest calibration={calibration} rangeIndex={rangeIndex} />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey='1'>
            <Accordion.Header>
              <Table className='me-2' size={17} />
              Repeatability Test (g)
            </Accordion.Header>

            <Accordion.Body>
              <RTest calibration={calibration} rangeIndex={rangeIndex} />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey='2'>
            <Accordion.Header>
              <Table className='me-2' size={17} />
              Eccentricity Test (g)
            </Accordion.Header>

            <Accordion.Body>
              <ETest calibration={calibration} rangeIndex={rangeIndex} />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey='3'>
            <Accordion.Header>
              <Rulers className='me-2' size={17} />
              Other Measurements
            </Accordion.Header>

            <Accordion.Body>
              <OtherMeasurements calibration={calibration} rangeIndex={rangeIndex} />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey='4'>
            <Accordion.Header>
              <Table className='me-2' size={17} />
              Uncertainty Calculation (Electronic Balance) - A1 - A{range?.calibrationPointNo || ''}
            </Accordion.Header>

            <Accordion.Body>
              <FormProvider {...form}>
                <CalculationTable calibration={calibration} rangeIndex={rangeIndex} />
              </FormProvider>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Row>
    </>
  );
};

export default CalibrationMass;
