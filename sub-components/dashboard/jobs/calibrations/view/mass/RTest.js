import { useMemo } from 'react';
import { Col, Row, Table } from 'react-bootstrap';
import { std, max, min, abs } from 'mathjs';

const RTest = ({ calibration }) => {
  const data = useMemo(() => {
    return calibration?.data || [];
  }, [calibration]);

  const calibrationPointNo = useMemo(() => {
    const value = parseFloat(calibration?.calibrationPointNo);
    return isNaN(value) ? 6 : value;
  }, [calibration]);

  const rangeMaxCalibration = useMemo(() => {
    const value = parseFloat(calibration?.rangeMaxCalibration);
    return isNaN(value) ? 0 : value;
  }, [calibration]);

  const halfResults = useMemo(() => {
    let actualValues;
    const halfValues = calibration?.data?.rtest?.half;

    if (halfValues) {
      if (Array.isArray(halfValues)) actualValues = halfValues.filter(Boolean);
      if (actualValues.length < 1) actualValues = [0];
    } else actualValues = [0];

    return {
      raw: {
        total: std(actualValues),
        error: max(actualValues) - min(actualValues),
        std: std(actualValues, 'uncorrected'),
      },
      formatted: {
        total: std(actualValues).toFixed(4),
        error: (max(actualValues) - min(actualValues)).toFixed(4),
        std: std(actualValues, 'uncorrected').toFixed(4),
      },
    };
  }, [calibration]);

  const maxResults = useMemo(() => {
    let actualValues;
    const maxValues = calibration?.data?.rtest?.max;

    if (maxValues) {
      if (Array.isArray(maxValues)) actualValues = maxValues.filter(Boolean);
      if (actualValues.length < 1) actualValues = [0];
    } else actualValues = [0];

    return {
      raw: {
        total: std(actualValues),
        error: max(actualValues) - min(actualValues),
        std: std(actualValues, 'uncorrected'),
      },
      formatted: {
        total: std(actualValues).toFixed(4),
        error: (max(actualValues) - min(actualValues)).toFixed(4),
        std: std(actualValues, 'uncorrected').toFixed(4),
      },
    };
  }, [calibration]);

  const maxRepetabilityError = useMemo(() => {
    const values = [maxResults?.raw?.error ?? 0, halfResults?.raw?.error ?? 0];
    const maxValue = max(values);
    return {
      raw: abs(maxValue),
      formatted: abs(maxValue).toFixed(4),
    };
  }, [maxResults?.raw?.error, halfResults?.raw?.error]);

  return (
    <>
      <Row className='mx-0 d-flex flex-column border border-primary rounded overflow-hidden'>
        <Col className='p-0'>
          <Table className='text-center align-middle' bordered responsive>
            <thead style={{ width: '200px' }}>
              <tr>
                <th className='text-center'>No.</th>
                <th className='text-center'>1/2 Max</th>
                <th className='text-center'>Max</th>
              </tr>
            </thead>

            <thead>
              <tr>
                <th className='text-center'>Nominal Value</th>
                <th className='text-center'>{rangeMaxCalibration / 2}</th>
                <th className='text-center'>{rangeMaxCalibration}</th>
              </tr>
            </thead>

            <tbody>
              {Array.from({ length: calibrationPointNo }).map((_, i) => (
                <tr key={i}>
                  <td className='text-center'>#{i + 1}</td>
                  <td className='text-center'>{data?.rtest?.half?.[i] || ''}</td>
                  <td className='text-center'>{data?.rtest?.max?.[i] || ''}</td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr>
                <th className='text-center'>Total</th>
                <th className='text-center'>{halfResults?.formatted.total ?? ''}</th>
                <th className='text-center'>{maxResults?.formatted.total ?? ''}</th>
              </tr>
              <tr>
                <th className='text-center'>Error (g)</th>
                <th className='text-center'>{halfResults?.formatted.error ?? ''}</th>
                <th className='text-center'>{maxResults?.formatted.error ?? ''}</th>
              </tr>
              <tr>
                <th className='text-center'>Std Dvtn</th>
                <th className='text-center'>{halfResults?.formatted.std ?? ''}</th>
                <th className='text-center'>{maxResults?.formatted.std ?? ''}</th>
              </tr>
              <tr>
                <th className='text-center' colSpan={1}>
                  Max <br />
                  Repeatability Error (g)
                </th>
                <th className='text-center' colSpan={2}>
                  {maxRepetabilityError?.formatted ?? ''}
                </th>
              </tr>
            </tfoot>
          </Table>
        </Col>
      </Row>
    </>
  );
};

export default RTest;
