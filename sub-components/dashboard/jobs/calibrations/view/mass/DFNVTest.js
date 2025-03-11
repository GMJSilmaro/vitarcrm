import { max } from 'mathjs';
import React, { useMemo } from 'react';
import { Table } from 'react-bootstrap';
import styles from '../../mass.module.css';
import { NOMINAL_VALUE } from '@/schema/calibration';

const DFNVTest = ({ calibration }) => {
  const calibrationPointNo = useMemo(() => {
    const value = parseFloat(calibration.calibrationPointNo);
    return isNaN(value) ? undefined : value;
  }, [calibration]);

  const nominalValues = useMemo(() => {
    return calibration.data?.nominalValues || [];
  }, [calibration]);

  const dfnv = useMemo(() => {
    return calibration.data?.dfnv || [];
  }, []);

  const measuredValues = useMemo(() => {
    return calibration.data?.measuredValues || [];
  }, []);

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

            //* maximum length of the element of point.data
            const maximumDataLength = max(
              calibrationPoints.map((point) => {
                return max(point.data.map((data) => data.length));
              })
            );

            return (
              <tr key={entryIndex}>
                <td className='align-text-top'>
                  <div>{`${entry.description} - ${entry.tagId}`}</div>

                  <div
                    className='mt-3 d-inline-flex flex-wrap gap-1 justify-content-center'
                    style={{ maxWidth: '90%' }}
                  >
                    {entry?.ids?.length > 0 &&
                      entry?.ids?.map((id, idIndex) => (
                        <div key={`${id}-${idIndex}`}>
                          <div>{id}</div>
                        </div>
                      ))}
                  </div>
                </td>

                {calibrationPoints.map((point) => {
                  return (
                    <td className='p-0'>
                      <Table responsive>
                        <tr>
                          <th className={styles.dataColumnHeader}>E2</th>
                          <th className={styles.dataColumnHeader}>ST-MW</th>
                        </tr>
                        <tbody>
                          {Array.from({ length: maximumDataLength }).map((_, i) => {
                            return (
                              <tr key={i}>
                                <td className={styles.dataColumn}>
                                  {point.data?.[0]?.[i] || <>&nbsp;</>}
                                </td>
                                <td className={styles.dataColumn}>
                                  {point.data?.[1]?.[i] || <>&nbsp;</>}
                                </td>
                              </tr>
                            );
                          })}

                          {maximumDataLength === 0 && (
                            <tr>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                            </tr>
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

              //* maximum length of the element of point.data
              const maximumDataLength = max(
                calibrationPoints.map((point) => {
                  return max(point.data.map((data) => data.length));
                })
              );

              return (
                <tr key={entryIndex}>
                  <td className='align-text-top'>
                    <div>{`${entry.description} - ${entry.tagId}`}</div>

                    <div
                      className='mt-3 d-inline-flex flex-wrap gap-1 justify-content-center'
                      style={{ maxWidth: '90%' }}
                    >
                      {entry?.ids?.length > 0 &&
                        entry?.ids?.map((id, idIndex) => (
                          <div key={`${id}-${idIndex}`}>
                            <div>{id}</div>
                          </div>
                        ))}
                    </div>
                  </td>

                  {calibrationPoints.map((point) => {
                    return (
                      <td className='p-0'>
                        <Table borderless responsive>
                          <tr>
                            <th className={styles.dataColumnHeader}>E2</th>
                            <th className={styles.dataColumnHeader}>ST-MW</th>
                          </tr>
                          <tbody>
                            {Array.from({ length: maximumDataLength }).map((_, i) => {
                              return (
                                <tr key={i}>
                                  <td className={styles.dataColumn}>
                                    {point.data?.[0]?.[i] || <>&nbsp;</>}
                                  </td>
                                  <td className={styles.dataColumn}>
                                    {point.data?.[1]?.[i] || <>&nbsp;</>}
                                  </td>
                                </tr>
                              );
                            })}

                            {maximumDataLength === 0 && (
                              <tr>
                                <td>&nbsp;</td>
                                <td>&nbsp;</td>
                              </tr>
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
