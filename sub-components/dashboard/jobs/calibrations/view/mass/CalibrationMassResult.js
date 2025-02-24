import { EXPANDED_UNCERTAINTY, NOMINAL_VALUE } from '@/schema/calibration';
import { format } from 'date-fns';
import React, { useMemo } from 'react';
import { Card, Table } from 'react-bootstrap';

const CalibrationMassResult = ({ calibration }) => {
  const calibrationPointNo = useMemo(() => {
    const value = parseFloat(calibration.calibrationPointNo);
    return isNaN(value) ? undefined : value;
  }, [calibration]);

  // TODO: Add Calibration Mass result
  //* Static Calibration Mass result for now

  return (
    <Card className='shadow-none'>
      <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h5 className='mb-0'>Result</h5>
            <small className='text-muted'>
              Result of the calibration for the selected category
            </small>
          </div>
        </div>

        <div className='mt-3 flex align-items-center gap-2'>
          <div className='fs-5'>
            <span className='pe-2'>Software Version:</span>
            <span className='fw-bold text-capitalize'>
              UC-WB (Single), Rev:24-001 - {format(new Date(), 'yyyy-MM-dd')}
            </span>
          </div>

          <div className='fs-5'>
            <span className='pe-2'>Source Version:</span>
            <span className='fw-bold'>Version no. d&msd 13.2, rev. 126</span>
          </div>

          <div className='mt-3 d-flex align-items-center gap-3'>
            <div className='fs-5'>
              <span className='pe-2'>Type of Range:</span>
              <span className='fw-bold text-capitalize'>{calibration.rangeType}</span>
            </div>

            <div className='fs-5'>
              <span className='pe-2'>d:</span>
              <span className='fw-bold'>10 g</span>
            </div>

            <div className='fs-5'>
              <span className='pe-2'>Repeatability =</span>
              <span className='fw-bold'>{Number(0).toFixed(4)} g</span>
            </div>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        {calibrationPointNo ? (
          <Table className='text-center align-middle'>
            <thead>
              <tr>
                <th>Point</th>
                <th>Nominal Value (g)</th>
                <th>Measured Value (g)</th>
                <th>Correction (g)</th>
                <th>Expanded Uncertainty (g)</th>
              </tr>
            </thead>

            <tbody>
              {Array.from({ length: calibrationPointNo }).map((_, i) => (
                <tr key={i}>
                  <td>A{i + 1}</td>
                  <td>{NOMINAL_VALUE[i].toFixed(4)}</td>
                  <td>{NOMINAL_VALUE[i].toFixed(4)}</td>
                  <td>{Number(0).toFixed(4)}</td>
                  <td>{EXPANDED_UNCERTAINTY[i]}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <div className='text-center'>
            <h4 className='mb-0'>No. of calibration point not yet supported</h4>
            <p>Module is under development</p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default CalibrationMassResult;
