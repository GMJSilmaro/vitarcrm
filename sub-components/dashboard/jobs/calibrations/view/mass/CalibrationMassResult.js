import { formatToDicimalString } from '@/utils/calibrations/data-formatter';
import { countDecimals } from '@/utils/common';
import { divide, multiply } from 'mathjs';
import { useCallback, useMemo } from 'react';
import { Card, Table } from 'react-bootstrap';

const CalibrationMassResult = ({ calibration }) => {
  const calibrationPointNo = useMemo(() => {
    const value = parseFloat(calibration.calibrationPointNo);
    return isNaN(value) ? undefined : value;
  }, [calibration]);

  const unitUsedForCOC = useMemo(() => {
    return calibration?.unitUsedForCOC || 'gram';
  }, [calibration]);

  const resolution = useMemo(() => {
    const value = parseFloat(calibration?.resolution);
    return isNaN(value) ? 0 : value;
  }, [calibration]);

  const convertValueBasedOnUnit = useCallback(
    (value) => {
      const unit = unitUsedForCOC;

      if (typeof value === 'string' || value === undefined || value === null || isNaN(value)) {
        return '';
      }

      switch (unit) {
        case 'gram': {
          const precision = countDecimals(resolution);
          return formatToDicimalString(value, precision);
        }
        case 'kilogram': {
          const result = multiply(value, 0.001);
          const precision = countDecimals(divide(resolution, 1000));
          return formatToDicimalString(result, precision);
        }

        default:
          return value;
      }
    },
    [unitUsedForCOC, resolution]
  );

  const results = useMemo(() => {
    const value = calibration?.results;

    return value
      ? value
      : {
          corrections: [],
          expandedUncertainties: [],
          measuredValuesM: [],
          nominalValues: [],
          rangeType: '',
          resolution: 0,
          rtestMaxError: 0,
        };
  }, [calibration]);

  console.log({ calibration, results });

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
          <div className='mt-3 d-flex align-items-center gap-4'>
            <div className='fs-5'>
              <span className='pe-2'>Type of Range:</span>
              <span className='fw-bold text-capitalize'>{results?.rangeType || ''}</span>
            </div>

            <div className='fs-5'>
              <span className='pe-2'>d:</span>
              <span className='fw-bold'>{results?.resolution || 0} g</span>
            </div>

            <div className='fs-5'>
              <span className='pe-2'>Repeatability: </span>
              <span className='fw-bold'>{formatToDicimalString(results?.rtestMaxError, 4)} g</span>
            </div>

            <div className='fs-5'>
              <span className='pe-2'>No. of Calibration Point:</span>
              <span className='fw-bold'>{calibration?.calibrationPointNo}</span>
            </div>

            <div className='fs-5'>
              <span className='pe-2'>COC Readability:</span>
              <span className='fw-bold'>{convertValueBasedOnUnit(resolution)}</span>
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
                  <td>{results?.nominalValues?.[i] ?? ''}</td>
                  <td>{formatToDicimalString(results?.measuredValuesM?.[i])}</td>
                  <td>{formatToDicimalString(results?.corrections?.[i])}</td>
                  <td>
                    <span className='me-2'>±</span>{' '}
                    {formatToDicimalString(results?.expandedUncertainties?.[i], 5)}
                  </td>
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
