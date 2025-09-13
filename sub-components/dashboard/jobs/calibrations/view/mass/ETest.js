import { abs, max } from 'mathjs';
import { useCallback, useMemo } from 'react';
import { Table } from 'react-bootstrap';
import { TEST_LOADS } from '@/schema/calibration';

const ETest = ({ calibration, rangeIndex }) => {
  const currentCalibrationData = useMemo(() => {
    return calibration?.data?.[rangeIndex];
  }, [JSON.stringify(calibration), rangeIndex]);

  const currentRange = useMemo(() => {
    const rangeDetails = calibration?.rangeDetails || [];
    return rangeDetails.find((_, rIndex) => rIndex === rangeIndex);
  }, [JSON.stringify(calibration), rangeIndex]);

  const rangeMaxCalibration = useMemo(() => {
    const value = parseFloat(currentRange?.rangeMaxCalibration);
    return isNaN(value) ? 0 : value;
  }, [JSON.stringify(currentRange)]);

  const testLoadFormatted = useMemo(() => {
    const value = rangeMaxCalibration / 3;
    return value.toFixed(4);
  }, [rangeMaxCalibration]);

  const getErrorValue = useCallback(
    (index) => {
      let actualValue;
      const values = currentCalibrationData?.etest?.values;

      if (values) {
        if (Array.isArray(values) && values?.length > 0) {
          actualValue = values.map((value) => (isNaN(value) ? 0 : value));
        }
        if (actualValue.length < 1) actualValue = Array(TEST_LOADS.length).fill(0);
      } else actualValue = Array(TEST_LOADS.length).fill(0);

      const firstErrorValue = (actualValue[0] + actualValue[actualValue.length - 1]) / 2;

      if (index < 1) return '';
      else if (index > 0 && index < actualValue.length - 1) {
        return abs(actualValue[index] - firstErrorValue);
      } else return '';
    },
    [JSON.stringify(currentCalibrationData), JSON.stringify(TEST_LOADS)]
  );

  const maxErrorValue = useMemo(() => {
    let values = [];

    TEST_LOADS.forEach((_, i) => {
      if (i > 0 && i < TEST_LOADS.length - 1) {
        values.push(getErrorValue(i));
      }
    });

    //* filter out empty values
    if (values.length > 0) values = values.filter(Boolean);
    if (values.length < 1) values = [0];

    const result = max(values);

    return result;
  }, [getErrorValue, TEST_LOADS]);

  return (
    <>
      <div className='mx-0 border border-primary rounded overflow-hidden'>
        <Table className='text-center align-middle' responsive bordered>
          <thead>
            <tr>
              <th>Test Load</th>
              <th>{currentCalibrationData?.etest?.testLoad || ''}</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {TEST_LOADS.map((testLoad, i) => {
              return (
                <tr key={i}>
                  <td>{testLoad}</td>
                  <td>{currentCalibrationData?.etest?.values?.[i] || ''}</td>
                  <td>{getErrorValue(i) !== '' ? getErrorValue(i).toFixed(4) : ''}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th>&nbsp;</th>
              <th>Max Error</th>
              <th>{maxErrorValue ? maxErrorValue.toFixed(4) : ''}</th>
            </tr>
          </tfoot>
        </Table>
      </div>

      {/* <hr className='my-4 border border-primary border-3' />

      <Table className='w-50 mx-auto text-center align-middle' responsive bordered>
        <tbody>
          <tr>
            <td className='text-center fw-bold'>
              d<sub>1</sub>
            </td>
            <td>{currentCalibrationData?.d1 || ''}</td>
            <th>mm</th>
          </tr>
          <tr>
            <td className='text-center fw-bold'>
              d<sub>2</sub>
            </td>
            <td>{currentCalibrationData?.d2 || ''}</td>
            <th>mm</th>
          </tr>
        </tbody>
      </Table> */}
    </>
  );
};

export default ETest;
