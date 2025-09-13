import { formatToDicimalString } from '@/utils/calibrations/data-formatter';
import { countDecimals } from '@/utils/common';
import { divide, multiply } from 'mathjs';
import React, { useCallback, useMemo } from 'react';
import { Table } from 'react-bootstrap';
import { useFormContext } from 'react-hook-form';

const MassResultForm = ({ rangeIndex }) => {
  const form = useFormContext();

  const currentRange = useMemo(() => {
    const rangeDetails = form.getValues('rangeDetails') || [];
    return rangeDetails.find((_, rIndex) => rIndex === rangeIndex);
  }, [rangeIndex, JSON.stringify(form.watch('rangeDetails')), rangeIndex]);

  const calibrationPointNo = useMemo(() => {
    const value = parseFloat(currentRange?.calibrationPointNo?.value);
    return isNaN(value) ? undefined : value;
  }, [JSON.stringify(currentRange)]);

  const unitUsedForCOC = useMemo(() => {
    return currentRange?.unitUsedForCOC?.value || 'gram';
  }, [JSON.stringify(currentRange)]);

  const resolution = useMemo(() => {
    const value = parseFloat(currentRange?.resolution?.value);
    return isNaN(value) ? 0 : value;
  }, [JSON.stringify(currentRange)]);

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
    const value = form.getValues(`data.${rangeIndex}.corrections`);
    return value && Array.isArray(value) ? value : [];
  }, [JSON.stringify(form.watch(`data.${rangeIndex}.corrections`))]);

  const measuredValuesM = useMemo(() => {
    const value = form.getValues(`data.${rangeIndex}.measuredValuesM`);
    return value && Array.isArray(value) ? value : [];
  }, [JSON.stringify(form.watch(`data.${rangeIndex}.measuredValuesM`))]);

  const expandedUncertainties = useMemo(() => {
    const value = form.getValues(`data.${rangeIndex}.expandedUncertainties`);
    return value && Array.isArray(value) ? value : [];
  }, [JSON.stringify(form.watch(`data.${rangeIndex}.expandedUncertainties`))]);

  const nominalValues = useMemo(() => {
    const value = form.getValues(`data.${rangeIndex}.nominalValues`);
    return value && Array.isArray(value) ? value : [];
  }, [JSON.stringify(form.watch(`data.${rangeIndex}.nominalValues`))]);

  const rangeType = useMemo(() => {
    return form.getValues('rangeType')?.value || '';
  }, [JSON.stringify(form.watch('rangeType'))]);

  const rtestMaxError = useMemo(() => {
    const value = form.getValues(`data.${rangeIndex}.rtest.maxError`);
    return isNaN(value) ? 0 : value;
  }, [form.watch(`data.${rangeIndex}.rtest.maxError`)]);

  // console.log({ corrections, resolution, unitUsedForCOC });

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
