import { max } from 'mathjs';
import React, { useMemo } from 'react';
import { Table } from 'react-bootstrap';
import styles from '../../mass.module.css';
import { NOMINAL_VALUE } from '@/schema/calibration';

const DFNVTest = ({ calibration, rangeIndex }) => {
  const slotsFields = useMemo(() => {
    return [{ title: 'E2' }, { title: 'F1' }, { title: 'F1' }];
  }, []);

  const currentRange = useMemo(() => {
    const rangeDetails = calibration?.rangeDetails || [];
    return rangeDetails.find((_, rIndex) => rIndex === rangeIndex);
  }, [JSON.stringify(calibration), rangeIndex]);

  const currentCalibrationData = useMemo(() => {
    return calibration?.data?.[rangeIndex];
  }, [JSON.stringify(calibration), rangeIndex]);

  const calibrationPointNo = useMemo(() => {
    const value = parseFloat(currentRange?.calibrationPointNo);
    return isNaN(value) ? undefined : value;
  }, [JSON.stringify(currentRange)]);

  const nominalValues = useMemo(() => {
    return currentCalibrationData?.nominalValues || [];
  }, [JSON.stringify(currentCalibrationData)]);

  const dfnv = useMemo(() => {
    return currentCalibrationData?.dfnv || [];
  }, [JSON.stringify(currentCalibrationData)]);

  const measuredValues = useMemo(() => {
    return currentCalibrationData?.measuredValues || [];
  }, [JSON.stringify(currentCalibrationData)]);

  return (
    <>
      <Table className='text-center align-middle mb-0' bordered responsive>
        <thead>
          <tr>
            <th colSpan={7}>Departure From Nominal Value (g)</th>
          </tr>

          <tr>
            <th>Inspection Point</th>
            {NOMINAL_VALUE.slice(0, 6).map((_, i) => (
              <th key={i}>A{i + 1}</th>
            ))}
          </tr>

          <tr>
            <th>Nominal Value</th>
            {NOMINAL_VALUE.slice(0, 6).map((value, i) => (
              <th key={i}>{nominalValues[i]?.toFixed(4)}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {dfnv.map((entry, entryIndex) => {
            const calibrationPoints = entry.calibrationPoints.slice(0, 6);

            //* maximum length of the element of point.data first 2 elements of data
            const maximumDataLengthRow1 = max(
              calibrationPoints?.length > 0
                ? calibrationPoints.map((point) => {
                    return max(point.data.slice(0, 2).map((data) => data.length));
                  })
                : 0
            );

            //* maximum length of the element of point.data first 2 elements of data
            const maximumDataLengthRow2 = max(
              calibrationPoints?.length > 0
                ? calibrationPoints.map((point) => {
                    return max(point.data.slice(2, 4).map((data) => data.length));
                  })
                : 0
            );

            return (
              <tr key={entryIndex}>
                <td className='align-text-top'>
                  <div>Weight(s) Used</div>

                  <div className='mt-3 d-flex flex-column row-gap-3'>
                    {slotsFields.map((slotField, slotIndex) => (
                      <div
                        className='mt-2 d-inline-flex flex-wrap gap-1 justify-content-center'
                        style={{ maxWidth: '90%' }}
                      >
                        <h4 className='mb-0 d-block w-100 mb-1'>{slotField.title}:</h4>
                        {entry?.ids?.[slotIndex]?.length > 0 &&
                          entry?.ids?.[slotIndex]?.map((id, idIndex) => (
                            <div key={`${id}-${idIndex}`}>{id}</div>
                          ))}
                      </div>
                    ))}
                  </div>
                </td>

                {calibrationPoints.map((point) => {
                  return (
                    <td className='p-0 align-top'>
                      <Table responsive className='mb-0' style={{ borderCollapse: 'collapse' }}>
                        <tr>
                          <th className='border-top-0'>E2</th>
                          <th className='border-start border-top-0'>ST-MW</th>
                        </tr>

                        <tbody>
                          {Array.from({ length: maximumDataLengthRow1 }).map(
                            (_, indexColumnData) => {
                              return (
                                <tr key={indexColumnData}>
                                  <td className={`${styles.columnDataContent}`}>
                                    {point.data?.[0]?.[indexColumnData] || <>&nbsp;</>}
                                  </td>

                                  <td className={`${styles.columnDataContent} border-start`}>
                                    {point.data?.[1]?.[indexColumnData] || <>&nbsp;</>}
                                  </td>
                                </tr>
                              );
                            }
                          )}

                          {maximumDataLengthRow1 === 0 && (
                            <tr>
                              <td className='border-bottom'>&nbsp;</td>
                              <td className='border-start border-bottom'>&nbsp;</td>
                            </tr>
                          )}

                          <tr>
                            <th className='border-top'>F1</th>
                            <th className='border-top border-start'>F1</th>
                          </tr>

                          {maximumDataLengthRow2 === 0 && (
                            <tr>
                              <td className='border-bottom'>&nbsp;</td>
                              <td className='border-start border-bottom'>&nbsp;</td>
                            </tr>
                          )}

                          {Array.from({ length: maximumDataLengthRow2 }).map(
                            (_, indexColumnData) => {
                              return (
                                <tr key={indexColumnData}>
                                  <td className={`${styles.columnDataContent} border-bottom`}>
                                    {point.data?.[2]?.[indexColumnData] || <>&nbsp;</>}
                                  </td>
                                  <td
                                    className={`${styles.columnDataContent} border-start border-bottom`}
                                  >
                                    {point.data?.[3]?.[indexColumnData] || <>&nbsp;</>}
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </Table>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>

        <tfoot>
          {Array.from({ length: 3 }).map((_, measuredValueIndex) => (
            <tr key={measuredValueIndex}>
              {measuredValueIndex === 0 && (
                <th rowSpan={3} className='align-middle'>
                  Measured Value
                </th>
              )}

              {NOMINAL_VALUE.slice(0, 6).map((_, pointIndex) => (
                <th key={`${pointIndex}-measured-value`} className='align-middle'>
                  {measuredValues?.[pointIndex]?.[measuredValueIndex] || ''}
                </th>
              ))}
            </tr>
          ))}
        </tfoot>
      </Table>

      <hr className='my-4 border border-primary border-3' />

      {calibrationPointNo && calibrationPointNo > 6 && (
        <Table className='text-center align-middle' bordered responsive>
          <thead>
            <tr>
              <th colSpan={7}>Departure From Nominal Value (g)</th>
            </tr>

            <tr>
              <th>Inspection Point</th>
              {NOMINAL_VALUE.slice(6, calibrationPointNo).map((_, i) => (
                <th key={i}>A{i + 7}</th>
              ))}
            </tr>

            <tr>
              <th>Nominal Value</th>
              {NOMINAL_VALUE.slice(6, calibrationPointNo).map((value, i) => (
                <th key={i}>{nominalValues[i + 6]?.toFixed(4)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dfnv.map((entry, entryIndex) => {
              const calibrationPoints = entry.calibrationPoints.slice(6, calibrationPointNo);

              //* maximum length of the element of point.data first 2 elements of data
              const maximumDataLengthRow1 = max(
                calibrationPoints?.length > 0
                  ? calibrationPoints.map((point) => {
                      return max(point.data.slice(0, 2).map((data) => data.length));
                    })
                  : 0
              );

              //* maximum length of the element of point.data first 2 elements of data
              const maximumDataLengthRow2 = max(
                calibrationPoints?.length > 0
                  ? calibrationPoints.map((point) => {
                      return max(point.data.slice(2, 4).map((data) => data.length));
                    })
                  : 0
              );

              return (
                <tr key={entryIndex}>
                  <td className='align-text-top'>
                    <div>Weight(s) Used</div>

                    <div className='mt-3 d-flex flex-column row-gap-3'>
                      {slotsFields.map((slotField, slotIndex) => (
                        <div
                          className='mt-2 d-inline-flex flex-wrap gap-1 justify-content-center'
                          style={{ maxWidth: '90%' }}
                        >
                          <h4 className='mb-0 d-block w-100 mb-1'>{slotField.title}:</h4>
                          {entry?.ids?.[slotIndex]?.length > 0 &&
                            entry?.ids?.[slotIndex]?.map((id, idIndex) => (
                              <div key={`${id}-${idIndex}`}>{id}</div>
                            ))}
                        </div>
                      ))}
                    </div>
                  </td>

                  {calibrationPoints.map((point, pointIndex) => {
                    const _pointIndex = pointIndex + 6;

                    return (
                      <td className='p-0 align-top' key={_pointIndex}>
                        <Table responsive className='mb-0' style={{ borderCollapse: 'collapse' }}>
                          <tr>
                            <th className='border-top-0'>E2</th>
                            <th className='border-start border-top-0'>ST-MW</th>
                          </tr>

                          <tbody>
                            {Array.from({ length: maximumDataLengthRow1 }).map(
                              (_, indexColumnData) => {
                                return (
                                  <tr key={indexColumnData}>
                                    <td className={`${styles.columnDataContent}`}>
                                      {point.data?.[0]?.[indexColumnData] || <>&nbsp;</>}
                                    </td>

                                    <td className={`${styles.columnDataContent} border-start`}>
                                      {point.data?.[1]?.[indexColumnData] || <>&nbsp;</>}
                                    </td>
                                  </tr>
                                );
                              }
                            )}

                            {maximumDataLengthRow1 === 0 && (
                              <tr>
                                <td className='border-bottom'>&nbsp;</td>
                                <td className='border-start border-bottom'>&nbsp;</td>
                              </tr>
                            )}

                            <tr>
                              <th className='border-top'>F1</th>
                              <th className='border-top border-start'>F1</th>
                            </tr>

                            {maximumDataLengthRow2 === 0 && (
                              <tr>
                                <td className='border-bottom'>&nbsp;</td>
                                <td className='border-start border-bottom'>&nbsp;</td>
                              </tr>
                            )}

                            {Array.from({ length: maximumDataLengthRow2 }).map(
                              (_, indexColumnData) => {
                                return (
                                  <tr key={indexColumnData}>
                                    <td className={`${styles.columnDataContent} border-bottom`}>
                                      {point.data?.[2]?.[indexColumnData] || <>&nbsp;</>}
                                    </td>
                                    <td
                                      className={`${styles.columnDataContent} border-start border-bottom`}
                                    >
                                      {point.data?.[3]?.[indexColumnData] || <>&nbsp;</>}
                                    </td>
                                  </tr>
                                );
                              }
                            )}
                          </tbody>
                        </Table>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            {Array.from({ length: 3 }).map((_, measuredValueIndex) => (
              <tr key={measuredValueIndex}>
                {measuredValueIndex === 0 && (
                  <th rowSpan={3} className='align-middle'>
                    Measured Value
                  </th>
                )}

                {NOMINAL_VALUE.slice(6, calibrationPointNo).map((_, pointIndex) => {
                  const _pointIndex = pointIndex + 6;
                  return (
                    <th key={`${_pointIndex}-measured-value`} className='align-middle'>
                      {measuredValues?.[_pointIndex]?.[measuredValueIndex] || ''}
                    </th>
                  );
                })}
              </tr>
            ))}
          </tfoot>
        </Table>
      )}
    </>
  );
};

export default DFNVTest;
