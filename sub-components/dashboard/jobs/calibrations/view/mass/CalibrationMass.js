import { Accordion, Card } from 'react-bootstrap';
import DFNVTest from './DFNTest';
import { Gear, GearFill, Table } from 'react-bootstrap-icons';
import RTest from './RTest';
import ETest from './ETest';
import { useMemo } from 'react';

const CalibrationMass = ({ calibration, category }) => {
  const calibrationPointNo = useMemo(() => {
    const value = parseFloat(calibration.calibrationPointNo);
    return isNaN(value) ? 6 : value;
  }, [calibration]);

  console.log({ calibration });

  return (
    <Card className='border-0 shadow-none'>
      <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h5 className='mb-0'>Calibration</h5>
            <small className='text-muted'>
              Ensure accurate calibration through "Departure from Nominal Value (g) test",
              "Repeatability Test (g)" and "Eccentricity Test (g)"
            </small>
          </div>
        </div>

        <div className='mt-3 flex align-items-center gap-2'>
          <div className='fs-5'>
            <span className='pe-2'>Category:</span>
            <span className='fw-bold text-capitalize'>{category}</span>
          </div>

          <div className='fs-5'>
            <span className='pe-2'>No. of Calibration Point:</span>
            <span className='fw-bold'>{calibration.calibrationPointNo}</span>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <Accordion className='mt-1'>
          <Accordion.Item eventKey='0'>
            <Accordion.Header>
              <Table className='me-2' size={17} />
              Departure From Nominal Value (g)
            </Accordion.Header>

            <Accordion.Body>
              <DFNVTest calibration={calibration} />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey='1'>
            <Accordion.Header>
              <Table className='me-2' size={17} />
              Repeatability Test (g)
            </Accordion.Header>

            <Accordion.Body>
              <RTest calibration={calibration} />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey='2'>
            <Accordion.Header>
              <Table className='me-2' size={17} />
              Eccentricity Test (g)
            </Accordion.Header>

            <Accordion.Body>
              <ETest calibration={calibration} />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey='3'>
            <Accordion.Header>
              <Table className='me-2' size={17} />
              Uncertainty Calculation (Electronic Balance) - A1 - A{calibrationPointNo}
            </Accordion.Header>

            <Accordion.Body>
              <div
                className='d-flex flex-column align-items-center justify-content-center gap-2'
                style={{ height: 300 }}
              >
                <GearFill size={40} className='d-block' />

                <div className='d-flex flex-column text-center'>
                  <h4 className='mb-0'>Currently in Development</h4>
                  <p className='text-muted fs-6'>This component/module is still being developed.</p>
                </div>
              </div>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Card.Body>
    </Card>
  );
};

export default CalibrationMass;
