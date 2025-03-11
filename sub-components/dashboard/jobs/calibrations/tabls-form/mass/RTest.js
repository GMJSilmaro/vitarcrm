import { useEffect, useMemo } from 'react';
import { Col, Form, Row, Table } from 'react-bootstrap';
import { std, max, min, abs, sum } from 'mathjs';
import { Controller, useFormContext } from 'react-hook-form';
import styles from '../../mass.module.css';

const RTest = ({ data }) => {
  const form = useFormContext();
  const formErrors = form.formState.errors;

  const calibrationPointNo = useMemo(() => {
    const value = parseFloat(form.getValues('calibrationPointNo')?.value);
    return isNaN(value) ? undefined : value;
  }, [form.watch('calibrationPointNo.value')]);

  const calibrationData = useMemo(() => {
    return form.getValues('data');
  }, [form.watch('data')]);

  const rangeMaxCalibration = useMemo(() => {
    const value = parseFloat(form.getValues('rangeMaxCalibration'));
    return isNaN(value) ? 0 : value;
  }, [form.watch('rangeMaxCalibration')]);

  const halfResults = useMemo(() => {
    let actualValues;
    const halfValues = form.getValues('data.rtest.half');

    if (halfValues) {
      if (Array.isArray(halfValues)) actualValues = halfValues.filter(Boolean);
      if (actualValues.length < 1) actualValues = [0];
    } else actualValues = [0];

    const result = {
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

    //* set temporary value used for view in table
    form.setValue(`data.rtest.std.${0}`, result.raw.std || 0);
    form.setValue(`data.rtest.maxDiffBetweenReadings.${0}`, result.raw.error || 0);

    return result;
  }, [JSON.stringify(form.watch('data.rtest.half'))]);

  const maxResults = useMemo(() => {
    let actualValues;
    const maxValues = form.getValues('data.rtest.max');

    if (maxValues) {
      if (Array.isArray(maxValues)) actualValues = maxValues.filter(Boolean);
      if (actualValues.length < 1) actualValues = [0];
    } else actualValues = [0];

    const result = {
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

    //* set temporary value used for view in table
    form.setValue(`data.rtest.std.${1}`, result.raw.std || 0);
    form.setValue(`data.rtest.maxDiffBetweenReadings.${1}`, result.raw.error || 0);

    return result;
  }, [JSON.stringify(form.watch('data.rtest.max'))]);

  const maxRepetabilityError = useMemo(() => {
    const values = [maxResults?.raw?.error ?? 0, halfResults?.raw?.error ?? 0];
    const maxValue = max(values);
    return {
      raw: abs(maxValue),
      formatted: abs(maxValue).toFixed(4),
    };
  }, [maxResults?.raw?.error, halfResults?.raw?.error]);

  //* set initial rtest data
  useEffect(() => {
    //* if data exist and calibration point no is same as data's dont dont something, else set initial data
    if (
      (data && parseFloat(data.calibrationPointNo) === calibrationPointNo) ||
      calibrationPointNo === undefined
    ) {
      return;
    }

    setTimeout(() => {
      if (
        !data ||
        (data.calibrationPointNo !== calibrationPointNo &&
          data.data !== JSON.stringify(calibrationData))
      ) {
        form.setValue('data.rtest.half', Array(calibrationPointNo).fill(0));
        form.setValue('data.rtest.max', Array(calibrationPointNo).fill(0));
      }
    }, 1000);
  }, [data, calibrationPointNo]);

  return (
    <>
      <Row className='mx-0 d-flex flex-column border border-primary rounded overflow-hidden'>
        <Col className='p-0'>
          <Table responsive>
            <thead>
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
              {Array.from({ length: calibrationPointNo || 0 }).map((_, i) => (
                <tr key={i}>
                  <td className='text-center'>#{i + 1}</td>
                  <td className='text-center'>
                    <Controller
                      name={`data.rtest.half.${i}`}
                      control={form.control}
                      render={({ field }) => (
                        <Form.Control
                          onChange={(e) => {
                            form.setValue(
                              `data.rtest.half.${i}`,
                              isNaN(e.target.value) ? 0 : parseFloat(e.target.value)
                            );

                            form.clearErrors(`data.rtest.half.${i}`);
                          }}
                          name={field.name}
                          ref={field.ref}
                          value={field.value}
                          className={`${styles.columnData} text-center ${
                            formErrors && formErrors.data?.rtest?.half?.[i]?.message
                              ? 'border-danger'
                              : ''
                          }`}
                          type='number'
                        />
                      )}
                    />
                  </td>
                  <td className='text-center'>
                    <Controller
                      name={`data.rtest.max.${i}`}
                      control={form.control}
                      render={({ field }) => (
                        <Form.Control
                          onChange={(e) => {
                            form.setValue(
                              `data.rtest.max.${i}`,
                              isNaN(e.target.value) ? 0 : parseFloat(e.target.value)
                            );
                          }}
                          name={field.name}
                          ref={field.ref}
                          value={field.value}
                          className={`${styles.columnData} text-center ${
                            formErrors && formErrors.data?.rtest?.max?.[i]?.message
                              ? 'border-danger'
                              : ''
                          }`}
                          type='number'
                        />
                      )}
                    />
                  </td>
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
                  Max Repeatability Error (g)
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
