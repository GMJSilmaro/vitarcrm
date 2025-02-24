import { abs } from 'mathjs';
import React, { useMemo } from 'react';
import { Col, Row, Table } from 'react-bootstrap';

const ETest = ({ calibration }) => {
  const rangeMaxCalibration = useMemo(() => {
    const value = parseFloat(calibration.rangeMaxCalibration);
    return isNaN(value) ? undefined : value;
  }, [calibration]);

  const testLoadFormatted = useMemo(() => {
    const value = rangeMaxCalibration / 3;
    return value.toFixed(4);
  }, [rangeMaxCalibration]);

  const testLoads = ['C1', 'E1', 'E2', 'E3', 'E4', 'C2'];

  return (
    <Row className='mx-0 d-flex flex-column border border-primary rounded overflow-hidden'>
      <Col className='p-0'>
        <Table responsive>
          <thead>
            <tr>
              <th className='text-center'>Test Load</th>
              <th className='text-center'>{testLoadFormatted}</th>
              <th className='text-center'>Error</th>
            </tr>
          </thead>
          <tbody>
            {testLoads.map((testLoad, i) => {
              let errorValue;

              if (i === 0) {
                const value = parseFloat(testLoadFormatted);
                // errorValue = (value + value) / 2; //* it should be like this but in the excel its empty
                errorValue = '';
              } else if (i === testLoads.length - 1) errorValue = '';
              else {
                const value = parseFloat(testLoadFormatted);
                const c1ErrorValue = (value + value) / 2;
                errorValue = abs(value - c1ErrorValue);
              }

              return (
                <tr key={i}>
                  <td className='text-center'>{testLoad}</td>
                  <td className='text-center'>{testLoadFormatted}</td>
                  <td className='text-center'>{errorValue !== '' ? errorValue.toFixed(4) : ''}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th className='text-center'>{''}</th>
              <th className='text-center'>Max Error</th>
              <th className='text-center'>{Number(0).toFixed(4)}</th>
            </tr>
          </tfoot>
        </Table>
      </Col>

      {/* ///TODO: add d1 and d2 input  */}
      {/* <Col className='px-5'>
        <Table responsive bordered>
          <tbody>
            <tr>
              <td className='text-center fw-bold'>
                d<sub>1</sub>
              </td>
              <td className='text-center'>{Number(0).toFixed(4)}</td>
              <td className='text-center'>mm</td>
            </tr>
            <tr>
              <td className='text-center fw-bold'>
                d<sub>2</sub>
              </td>
              <td className='text-center'>{Number(0).toFixed(4)}</td>
              <td className='text-center'>mm</td>
            </tr>
          </tbody>
        </Table>
      </Col> */}
    </Row>
  );
};

export default ETest;
