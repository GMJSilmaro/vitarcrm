import { Accordion, Card, Col, Nav, Row, Tab } from 'react-bootstrap';
import DFNVTest from './WBDFNVTest';
import { CardList, Rulers, Table } from 'react-bootstrap-icons';
import { FormProvider, useForm } from 'react-hook-form';
import WBRTest from './WBRTest';
import WBETest from './WBETest';
import WBCalculationTable from './WBCalculationTable';
import WBOtherMeasurements from './WBOtherMeasurements';
import WBEnvCondition from './WBEnvCondition';
import { useMemo } from 'react';

const WBCalibrationTemplate = ({ calibration }) => {
  const category = useMemo(() => {
    if (!calibration.category) return null;
    return calibration.category?.toLowerCase();
  }, [calibration]);

  const variant = useMemo(() => {
    if (!calibration.variant) return null;
    return calibration.variant?.toLowerCase()?.replace('-', ' ');
  }, [calibration]);

  if (category !== 'mass') return null;

  const rangeDetails = calibration?.rangeDetails || [];

  if (category !== 'mass') return null;

  return (
    <Card className='border-0 shadow-none'>
      <Card.Body>
        <WBEnvCondition calibration={calibration} />

        <hr className='my-5' />

        <Tab.Container defaultActiveKey='0'>
          <Row className='mt-5'>
            <Col className='px-0' md={12}>
              <Nav
                variant='pills'
                className='d-flex justify-content-center align-items-center gap-3'
              >
                {rangeDetails?.length > 0 &&
                  Array.from({ length: rangeDetails?.length }).map(
                    (_, rangeIndex) => (
                      <Nav.Item
                        key={`${rangeIndex}-nav-item`}
                        className='d-flex align-items-center'
                      >
                        <Nav.Link eventKey={`${rangeIndex}`}>
                          <CardList size={18} />
                          Range {rangeIndex + 1}
                        </Nav.Link>
                      </Nav.Item>
                    )
                  )}
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
                      <CalibrationTemplateContent
                        calibration={calibration}
                        category={category}
                        variant={variant}
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

const CalibrationTemplateContent = ({
  calibration,
  category,
  variant,
  range,
  rangeIndex,
}) => {
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
            <span className='pe-2'>Variant:</span>
            <span className='fw-bold text-capitalize'>{variant}</span>
          </div>

          <div className='fs-5'>
            <span className='pe-2'>Range:</span>
            <span className='fw-bold'>
              {range?.rangeMinCalibration ?? ''} to{' '}
              {range?.rangeMaxCalibration || ''} (gram)
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
              <WBRTest calibration={calibration} rangeIndex={rangeIndex} />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey='2'>
            <Accordion.Header>
              <Table className='me-2' size={17} />
              Eccentricity Test (g)
            </Accordion.Header>

            <Accordion.Body>
              <WBETest calibration={calibration} rangeIndex={rangeIndex} />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey='3'>
            <Accordion.Header>
              <Rulers className='me-2' size={17} />
              Other Measurements
            </Accordion.Header>

            <Accordion.Body>
              <WBOtherMeasurements
                calibration={calibration}
                rangeIndex={rangeIndex}
              />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey='4'>
            <Accordion.Header>
              <Table className='me-2' size={17} />
              Uncertainty Calculation (Electronic Balance) - A1 - A
              {range?.calibrationPointNo || ''}
            </Accordion.Header>

            <Accordion.Body>
              <FormProvider {...form}>
                <WBCalculationTable
                  calibration={calibration}
                  rangeIndex={rangeIndex}
                />
              </FormProvider>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Row>
    </>
  );
};

export default WBCalibrationTemplate;
