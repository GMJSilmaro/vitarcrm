import { ACCURACY_CLASS } from '@/schema/calibrations/mass/standard-weight';
import { formatToDicimalString } from '@/utils/calibrations/data-formatter';
import { safeParseFloat } from '@/utils/common';
import React, { useMemo } from 'react';
import { Card, Table } from 'react-bootstrap';

function SWCalibrationResult({ calibration }) {
  const testWeightNo = useMemo(() => {
    return safeParseFloat(calibration?.testWeightNo);
  }, [JSON.stringify(calibration)]);

  const accuracyClass = useMemo(() => {
    const accuracyClassOptions = ACCURACY_CLASS.map((acc) => ({
      value: acc,
      label: acc
        .split(' ')
        .map((str) => _.capitalize(str))
        .join(' '),
    }));

    return accuracyClassOptions.find((option) => option.value === calibration?.accuracyClass)?.label; //prettier-ignore
  }, [JSON.stringify(calibration)]);

  const nominalValues = calibration?.results?.nominalValues || []; //prettier-ignore
  const isNominalValueWithAsterisks = calibration?.results?.isNominalValueWithAsterisks || []; //prettier-ignore
  const resultExpandedUncertainties = calibration?.results?.resultExpandedUncertainties || []; //prettier-ignore
  const conventionalValues = calibration?.results?.conventionalValues || []; //prettier-ignore
  const mpes = calibration?.results?.mpes || []; //prettier-ignore

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
      </Card.Header>

      <Card.Body className='py-0'>
        <div className='mt-3 mb-5 d-flex flex-col align-items-center gap-2'>
          <div className='flex align-items-center gap-2'>
            <div className='d-flex align-items-center gap-4'>
              <div className='fs-5'>
                <span className='pe-2'>Accuracy Class:</span>
                <span className='fw-bold text-capitalize'>{accuracyClass}</span>
              </div>

              <div className='fs-5'>
                <span className='pe-2'>No. of Test Weight:</span>
                <span className='fw-bold'>{testWeightNo}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          {testWeightNo && (testWeightNo > 0 || testWeightNo <= 30) ? (
            <Table className='text-center align-middle'>
              <thead>
                <tr>
                  <th>Point</th>
                  <th>Nominal Value (g)</th>
                  <th>Conventional Value (g)</th>
                  <th>MPE (g)</th>
                  <th>Expanded Uncertainty (g)</th>
                </tr>
              </thead>

              <tbody>
                {Array.from({ length: testWeightNo }).map((_, i) => (
                  <tr key={i}>
                    <td>A{i + 1}</td>
                    <td>
                      {formatToDicimalString(nominalValues?.[i], 3)}
                      {isNominalValueWithAsterisks?.[i] ? '*' : ''}
                    </td>
                    <td>
                      {formatToDicimalString(nominalValues?.[i], 3)}{' '}
                      &nbsp;&nbsp;&nbsp;
                      {formatToDicimalString(conventionalValues?.[i], 6)}
                    </td>
                    <td>
                      {accuracyClass === 'N/A'
                        ? 'N/A'
                        : formatToDicimalString(mpes?.[i], 6)}
                    </td>
                    <td>
                      <span className='me-2'>±</span>{' '}
                      {formatToDicimalString(
                        resultExpandedUncertainties?.[i],
                        6
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className='text-center'>
              <h4 className='mb-0'>No. of Test Weight not yet supported</h4>
              <p>Module is under development</p>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

export default SWCalibrationResult;
