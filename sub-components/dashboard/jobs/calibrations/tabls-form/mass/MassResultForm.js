import { formatToDicimalString } from '@/utils/calibrations/data-formatter';
import { countDecimals } from '@/utils/common';
import { divide, multiply } from 'mathjs';
import React, { useCallback, useMemo } from 'react';
import { Table } from 'react-bootstrap';
import { useFormContext } from 'react-hook-form';

const MassResultForm = () => {
  const form = useFormContext();

  const calibrationPointNo = useMemo(() => {
    const value = parseFloat(form.getValues('calibrationPointNo')?.value);
    return isNaN(value) ? 0 : value;
  }, [form.watch('calibrationPointNo')]);

  const unitUsedForCOC = useMemo(() => {
    return form.getValues('unitUsedForCOC')?.value || 'gram';
  }, [form.watch('unitUsedForCOC')]);

  const resolution = useMemo(() => {
    const value = parseFloat(form.getValues('resolution')?.value);
    return isNaN(value) ? 0 : value;
  }, [form.watch('resolution')]);

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

  const corrections = useMemo(() => {
    const value = form.getValues('data.corrections');
    return value && Array.isArray(value) ? value : [];
  }, [JSON.stringify(form.watch('data.corrections'))]);

  const measuredValuesM = useMemo(() => {
    const value = form.getValues('data.measuredValuesM');
    return value && Array.isArray(value) ? value : [];
  }, [JSON.stringify(form.watch('data.measuredValuesM'))]);

  const expandedUncertainties = useMemo(() => {
    const value = form.getValues('data.expandedUncertainties');
    return value && Array.isArray(value) ? value : [];
  }, [JSON.stringify(form.watch('data.expandedUncertainties'))]);

  const nominalValues = useMemo(() => {
    const value = form.getValues('data.nominalValues');
    return value && Array.isArray(value) ? value : [];
  }, [JSON.stringify(form.watch('data.nominalValues'))]);

  const rangeType = useMemo(() => {
    return form.getValues('rangeType')?.value || '';
  }, [JSON.stringify(form.watch('rangeType'))]);

  const rtestMaxError = useMemo(() => {
    const value = form.getValues('data.rtest.maxError');
    return isNaN(value) ? 0 : value;
  }, [form.watch('data.rtest.maxError')]);

  console.log({ corrections, resolution, unitUsedForCOC });

  return (
    <div className='d-flex flex-column row-gap-4'>
      <div>
        <div className='mt-3 flex align-items-center gap-2'>
          <div className='mt-3 d-flex align-items-center gap-4'>
            <div className='fs-5'>
              <span className='pe-2'>Type of Range:</span>
              <span className='fw-bold text-capitalize'>{rangeType || ''}</span>
            </div>

            <div className='fs-5'>
              <span className='pe-2'>d:</span>
              <span className='fw-bold'>{resolution || 0} g</span>
            </div>

            <div className='fs-5'>
              <span className='pe-2'>Repeatability: </span>
              <span className='fw-bold'>{formatToDicimalString(rtestMaxError, 4)} g</span>
            </div>

            <div className='fs-5'>
              <span className='pe-2'>No. of Calibration Point:</span>
              <span className='fw-bold'>{calibrationPointNo}</span>
            </div>

            <div className='fs-5'>
              <span className='pe-2'>COC Readability:</span>
              <span className='fw-bold'>{convertValueBasedOnUnit(resolution)}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
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
                  <td>{nominalValues?.[i] ?? ''}</td>
                  <td>{formatToDicimalString(measuredValuesM?.[i])}</td>
                  <td>{formatToDicimalString(corrections?.[i])}</td>
                  <td>
                    <span className='me-2'>±</span>{' '}
                    {formatToDicimalString(expandedUncertainties?.[i], 5)}
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
      </div>
    </div>
  );
};

export default MassResultForm;
