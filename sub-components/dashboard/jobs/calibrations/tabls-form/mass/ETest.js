import { abs, divide, max } from 'mathjs';
import { useCallback, useEffect, useMemo } from 'react';
import { Col, Form, Row, Table } from 'react-bootstrap';
import { Controller, useFormContext } from 'react-hook-form';
import styles from '../../mass.module.css';
import { TEST_LOADS } from '@/schema/calibration';

const ETest = ({ data, rangeIndex }) => {
  const form = useFormContext();
  const formErrors = form.formState.errors;

  const currentRange = useMemo(() => {
    const rangeDetails = form.getValues('rangeDetails') || [];
    return rangeDetails.find((_, rIndex) => rIndex === rangeIndex);
  }, [rangeIndex, JSON.stringify(form.watch('rangeDetails')), rangeIndex]);

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
      const values = form.getValues(`data.${rangeIndex}.etest.values`);

      if (values) {
        if (Array.isArray(values)) actualValue = values.map((value) => (isNaN(value) ? 0 : value));
        if (actualValue.length < 1) actualValue = Array(TEST_LOADS.length).fill(0);
      } else actualValue = Array(TEST_LOADS.length).fill(0);

      const firstErrorValue = (actualValue[0] + actualValue[actualValue.length - 1]) / 2;

      if (index < 1) return '';
      else if (index > 0 && index < actualValue.length - 1) {
        return abs(actualValue[index] - firstErrorValue);
      } else return '';
    },
    [JSON.stringify(form.watch(`data.${rangeIndex}.etest.values`)), TEST_LOADS]
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

    //* set temporary value used for view in table
    form.setValue(`data.${rangeIndex}.etest.maxError`, result);

    return result;
  }, [getErrorValue, TEST_LOADS]);

  //* set initial etest value & d1 & d2
  useEffect(() => {
    //* if data exist and rangeMaxCalibration is same as data's dont dont something, else set initial data
    if (data && parseFloat(data?.[rangeIndex]?.rangeMaxCalibration) === rangeMaxCalibration) {
      return;
    }

    setTimeout(() => {
      if (!data || parseFloat(data?.[rangeIndex]?.rangeMaxCalibration) !== rangeMaxCalibration) {
        form.setValue(
          `data.${rangeIndex}.etest.values`,
          Array(TEST_LOADS.length).fill(divide(rangeMaxCalibration, 3))
        );
        form.setValue(`data.${rangeIndex}.etest.testLoad`, divide(rangeMaxCalibration, 3));
        form.setValue(`data.${rangeIndex}.d1`, 0);
        form.setValue(`data.${rangeIndex}.d2`, 0);
      }
    }, 1000);
  }, [data, rangeMaxCalibration]);

  const numberInputOnWheel = (e) => {
    e.target.blur();
  };

  return (
    <>
      <div className='mx-0 border border-primary rounded overflow-hidden'>
        <Table className='text-center align-middle' responsive bordered>
          <thead>
            <tr>
              <th>Test Load</th>
              <th>
                <Controller
                  name={`data.${rangeIndex}.etest.testLoad`}
                  control={form.control}
                  render={({ field }) => (
                    <Form.Control
                      onChange={(e) => {
                        form.setValue(
                          `data.${rangeIndex}.etest.testLoad`,
                          isNaN(e.target.value) ? 0 : parseFloat(e.target.value)
                        );
                      }}
                      onWheel={numberInputOnWheel}
                      name={field.name}
                      ref={field.ref}
                      value={field.value}
                      className={`${styles.columnData} text-center`}
                      type='number'
                    />
                  )}
                />
              </th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {TEST_LOADS.map((testLoad, i) => {
              return (
                <tr key={i}>
                  <td>{testLoad}</td>
                  <td>
                    <Controller
                      name={`data.${rangeIndex}.etest.values.${i}`}
                      control={form.control}
                      render={({ field }) => (
                        <Form.Control
                          onChange={(e) => {
                            form.setValue(
                              `data.${rangeIndex}.etest.values.${i}`,
                              isNaN(e.target.value) ? 0 : parseFloat(e.target.value)
                            );
                          }}
                          onWheel={numberInputOnWheel}
                          name={field.name}
                          ref={field.ref}
                          value={field.value}
                          className={`${styles.columnData} text-center`}
                          type='number'
                        />
                      )}
                    />
                  </td>
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
            <td>
              <Controller
                name={`data.${rangeIndex}.d1`}
                control={form.control}
                render={({ field }) => (
                  <Form.Control
                    onChange={(e) => {
                      form.setValue(
                        `data.${rangeIndex}.d1`,
                        isNaN(e.target.value) ? 0 : parseFloat(e.target.value)
                      );
                    }}
                    onWheel={numberInputOnWheel}
                    name={field.name}
                    ref={field.ref}
                    value={field.value}
                    className={`${styles.columnData} text-center`}
                    type='number'
                  />
                )}
              />
            </td>
            <th>mm</th>
          </tr>
          <tr>
            <td className='text-center fw-bold'>
              d<sub>2</sub>
            </td>
            <td>
              <Controller
                name={`data.${rangeIndex}.d2`}
                control={form.control}
                render={({ field }) => (
                  <Form.Control
                    onChange={(e) => {
                      form.setValue(
                        `data.${rangeIndex}.d2`,
                        isNaN(e.target.value) ? 0 : parseFloat(e.target.value)
                      );
                    }}
                    onWheel={numberInputOnWheel}
                    name={field.name}
                    ref={field.ref}
                    value={field.value}
                    className={`${styles.columnData} text-center`}
                    type='number'
                  />
                )}
              />
            </td>
            <th>mm</th>
          </tr>
        </tbody>
      </Table> */}
    </>
  );
};

export default ETest;
