import React, { useMemo } from 'react';
import { Col, Row, Table } from 'react-bootstrap';
import { std, max, min, abs } from 'mathjs';
import { useFormContext } from 'react-hook-form';

const RTest = ({ data }) => {
  const form = useFormContext();

  const calibrationPointNo = useMemo(() => {
    const value = parseFloat(form.getValues('calibrationPointNo')?.value);
    return isNaN(value) ? 6 : value;
  }, [form.watch('calibrationPointNo')]);

  const rangeMaxCalibration = useMemo(() => {
    const value = parseFloat(form.getValues('rangeMaxCalibration'));
    return isNaN(value) ? 0 : value;
  }, [form.watch('rangeMaxCalibration')]);

  const rangeMaxCalibrationFormatted = useMemo(() => {
    return Number(rangeMaxCalibration).toFixed(4);
  }, [rangeMaxCalibration]);

  const rangeMaxCalibrationHalfFormatted = useMemo(() => {
    return Number(rangeMaxCalibration / 2).toFixed(4);
  }, [rangeMaxCalibration]);

  const totalMaxRangeCalibrationHalf = useMemo(() => {
    const rangeMaxCalibrationHalf = rangeMaxCalibration / 2;
    return std(Array(calibrationPointNo).fill(rangeMaxCalibrationHalf)).toFixed(4);
  }, [rangeMaxCalibration, calibrationPointNo]);

  const totalMaxRangeCalibration = useMemo(() => {
    return std(Array(calibrationPointNo).fill(rangeMaxCalibration)).toFixed(4);
  }, [rangeMaxCalibration, calibrationPointNo]);

  const errorMaxRangeCalibration = useMemo(() => {
    const values = Array(calibrationPointNo).fill(rangeMaxCalibration);
    const maxValue = max(values);
    const minValue = min(values);
    const result = maxValue - minValue;
    return result.toFixed(4);
  }, [rangeMaxCalibration, calibrationPointNo]);

  const errorMaxRangeCalibrationHalf = useMemo(() => {
    const rangeMaxCalibrationHalf = rangeMaxCalibration / 2;
    const values = Array(calibrationPointNo).fill(rangeMaxCalibrationHalf);
    const maxValue = max(values);
    const minValue = min(values);
    const result = maxValue - minValue;
    return result.toFixed(4);
  }, [rangeMaxCalibration, calibrationPointNo]);

  const maxRepetabilityError = useMemo(() => {
    const values = [errorMaxRangeCalibrationHalf, errorMaxRangeCalibration];
    const maxValue = max(values);
    const result = abs(maxValue);
    return result;
  }, [rangeMaxCalibration, errorMaxRangeCalibrationHalf, errorMaxRangeCalibration]);

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
              {Array.from({ length: calibrationPointNo }).map((_, i) => (
                <tr key={i}>
                  <td className='text-center'>#{i + 1}</td>
                  <td className='text-center'>{rangeMaxCalibrationHalfFormatted}</td>
                  <td className='text-center'>{rangeMaxCalibrationFormatted}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th className='text-center'>Total</th>
                <th className='text-center'>{totalMaxRangeCalibrationHalf}</th>
                <th className='text-center'>{totalMaxRangeCalibration}</th>
              </tr>
              <tr>
                <th className='text-center'>Error (g)</th>
                <th className='text-center'>{totalMaxRangeCalibrationHalf}</th>
                <th className='text-center'>{errorMaxRangeCalibration}</th>
              </tr>
              <tr>
                <th className='text-center'>Std Dvtn</th>
                <th className='text-center'>{totalMaxRangeCalibrationHalf}</th>
                <th className='text-center'>{totalMaxRangeCalibration}</th>
              </tr>
              <tr>
                <th className='text-center' colSpan={1}>
                  Max Repeatability Error (g)
                </th>
                <th className='text-center' colSpan={2}>
                  {maxRepetabilityError}
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
