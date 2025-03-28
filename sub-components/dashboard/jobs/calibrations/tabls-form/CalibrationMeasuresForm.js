import { TooltipContent } from '@/components/common/ToolTipContent';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import Select from '@/components/Form/Select';
import {
  CALIBRATION_POINT_NO,
  RANGE_TYPE,
  RESOLUTION,
  TRACEABILITY_TYPE,
  UNIT_USED_FOR_COC,
} from '@/schema/calibration';
import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Form, InputGroup, OverlayTrigger, Row, Tooltip } from 'react-bootstrap';
import { Controller, useFormContext } from 'react-hook-form';

const CalibrationMeasures = ({ data, isLoading, handleNext, handlePrevious }) => {
  const [rangeTypeOptions] = useState(RANGE_TYPE.map((rangeType) => ({ value: rangeType, label: _.capitalize(rangeType) }))); //prettier-ignore
  const [traceabilityTypeOptions] = useState(TRACEABILITY_TYPE.map((traceabilityType) => ({ value: traceabilityType, label: traceabilityType }))); //prettier-ignore
  const [resolutionOptions] = useState(RESOLUTION.map((resolution) => ({ value: resolution, label: resolution }))); //prettier-ignore
  const [unitUsedForCOCOptions] = useState(UNIT_USED_FOR_COC.map((unit) => ({ value: unit, label: unit }))); //prettier-ignore
  const [calibrationPointNoOptions] = useState(CALIBRATION_POINT_NO.map((pointNo) => ({ value: pointNo, label: pointNo }))); //prettier-ignore

  const form = useFormContext();
  const formErrors = form.formState.errors;

  //* set range type, if data exist
  useEffect(() => {
    if (data && rangeTypeOptions.length > 0) {
      const rangeType = rangeTypeOptions.find((option) => option.value === data.rangeType);
      form.setValue('rangeType', rangeType);
    }
  }, [data, rangeTypeOptions]);

  //* set traceability type, if data exist
  useEffect(() => {
    if (data && traceabilityTypeOptions.length > 0) {
      const traceabilityType = traceabilityTypeOptions.find(
        (option) => option.value === data.traceabilityType
      );
      form.setValue('traceabilityType', traceabilityType);
    }
  }, [data, traceabilityTypeOptions]);

  //* set resolution, if data exist
  useEffect(() => {
    if (data && resolutionOptions.length > 0) {
      const resolution = resolutionOptions.find((option) => option.value === data.resolution);
      form.setValue('resolution', resolution);
    }
  }, [data, resolutionOptions]);

  //* set unit used for COC, if data exist
  useEffect(() => {
    if (data && unitUsedForCOCOptions.length > 0) {
      const unitUsedForCOC = unitUsedForCOCOptions.find(
        (option) => option.value === data.unitUsedForCOC
      );
      form.setValue('unitUsedForCOC', unitUsedForCOC);
    }
  }, [data, unitUsedForCOCOptions]);

  //* set calibration point no, if data exist
  useEffect(() => {
    if (data && calibrationPointNoOptions.length > 0) {
      const calibrationPointNo = calibrationPointNoOptions.find(
        (option) => option.value === data.calibrationPointNo
      );
      form.setValue('calibrationPointNo', calibrationPointNo);
    }
  }, [data, calibrationPointNoOptions]);

  return (
    <Card className='shadow-none'>
      <Card.Body>
        <h4 className='mb-0'>Location</h4>
        <p className='text-muted fs-6'>Location of the calibration.</p>

        <Row className='mb-3 row-gap-3'>
          <Form.Group as={Col} md={12}>
            <Form.Label>Calibration Location</Form.Label>

            <Controller
              name='calibrationLocation'
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control {...field} type='text' value={field.value} />
                </>
              )}
            />
          </Form.Group>
        </Row>

        <hr className='my-4' />
        <h4 className='mb-0'>Criteria</h4>
        <p className='text-muted fs-6'>
          Measurements criteria to be used as a basis for the calibration.
        </p>

        <Row className='mb-3 row-gap-3'>
          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Type of Range' id='rangeType' />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent title='Type of Range Search' info={['Search by type of range']} />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='rangeType'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='rangeType'
                    instanceId='rangeType'
                    onChange={(option) => field.onChange(option)}
                    options={rangeTypeOptions}
                    placeholder='Search by type of range'
                    noOptionsMessage={() => 'No type of range found'}
                  />

                  {formErrors && formErrors.rangeType?.message && (
                    <Form.Text className='text-danger'>{formErrors.rangeType?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Range of Calibration (Min)' id='rangeMinCalibration' />

            <Controller
              name='rangeMinCalibration'
              control={form.control}
              render={({ field }) => (
                <>
                  <InputGroup>
                    <Form.Control
                      {...field}
                      style={{ marginTop: '1px' }}
                      id='rangeMinCalibration'
                      type='number'
                      placeholder='Enter minimum range of calibration'
                    />
                    <InputGroup.Text>gram</InputGroup.Text>
                  </InputGroup>

                  {formErrors && formErrors.rangeMinCalibration?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.rangeMinCalibration?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Range of Calibration (Max)' id='rangeMaxCalibration' />

            <Controller
              name='rangeMaxCalibration'
              control={form.control}
              render={({ field }) => (
                <>
                  <InputGroup>
                    <Form.Control
                      {...field}
                      style={{ marginTop: '1px' }}
                      id='rangeMaxCalibration'
                      type='number'
                      placeholder='Enter maximum range of calibration'
                    />
                    <InputGroup.Text>gram</InputGroup.Text>
                  </InputGroup>

                  {formErrors && formErrors.rangeMaxCalibration?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.rangeMaxCalibration?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Traceability Type' id='traceabilityType' />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent
                    title='Traceability Type Search'
                    info={['Search by traceability type']}
                  />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='traceabilityType'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='traceabilityType'
                    instanceId='traceabilityType'
                    onChange={(option) => field.onChange(option)}
                    options={traceabilityTypeOptions}
                    placeholder='Search by traceability type'
                    noOptionsMessage={() => 'No traceability type found'}
                  />

                  {formErrors && formErrors.traceabilityType?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.traceabilityType?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Resolution' id='resolution' />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent title='Resolution Search' info={['Search by resolution']} />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='resolution'
              control={form.control}
              render={({ field }) => (
                <>
                  <div className='d-flex'>
                    <Select
                      {...field}
                      className='flex-1 flex-grow-1'
                      inputId='resolution'
                      instanceId='resolution'
                      onChange={(option) => field.onChange(option)}
                      options={resolutionOptions}
                      placeholder='Search by resolution'
                      noOptionsMessage={() => 'No resolution found'}
                    />

                    <InputGroup.Text className='rounded-start-0'>gram</InputGroup.Text>
                  </div>

                  {formErrors && formErrors.resolution?.message && (
                    <Form.Text className='text-danger'>{formErrors.resolution?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Unit Used For COC' id='unitUsedForCOC' />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent
                    title='Unit Used For COC Search'
                    info={['Search by unit used for COC']}
                  />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='unitUsedForCOC'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='unitUsedForCOC'
                    instanceId='unitUsedForCOC'
                    onChange={(option) => field.onChange(option)}
                    options={unitUsedForCOCOptions}
                    placeholder='Search by unit used for COC'
                    noOptionsMessage={() => 'No unit used for COC found'}
                  />

                  {formErrors && formErrors.unitUsedForCOC?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.unitUsedForCOC?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='No. of Calibration Point' id='calibrationPointNo' />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent
                    title='Calibration Point No. Search'
                    info={['Search by calibration point no.']}
                  />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='calibrationPointNo'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    isDisabled={!form.watch('resolution')}
                    inputId='calibrationPointNo'
                    instanceId='calibrationPointNo'
                    onChange={(option) => field.onChange(option)}
                    options={calibrationPointNoOptions}
                    placeholder='Search by calibration point no. for COC'
                    noOptionsMessage={() => 'No calibration point no. found'}
                  />

                  {formErrors && formErrors.calibrationPointNo?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.calibrationPointNo?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>
        </Row>

        <hr className='my-4' />
        <h4 className='mb-0'>Other measurements</h4>
        <p className='text-muted fs-6'>Details about the other measurements.</p>

        <Row className='mb-3 row-gap-3'>
          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Temperature (Min)' id='minTemperature' />

            <Controller
              name='minTemperature'
              control={form.control}
              render={({ field }) => (
                <>
                  <InputGroup>
                    <Form.Control
                      {...field}
                      style={{ marginTop: '1px' }}
                      id='minTemperature'
                      type='number'
                      placeholder='Enter minimum temperature'
                    />

                    <InputGroup.Text>°C</InputGroup.Text>
                  </InputGroup>

                  {formErrors && formErrors.minTemperature?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.minTemperature?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Temperature (Max)' id='maxTemperature' />

            <Controller
              name='maxTemperature'
              control={form.control}
              render={({ field }) => (
                <>
                  <InputGroup>
                    <Form.Control
                      {...field}
                      style={{ marginTop: '1px' }}
                      id='maxTemperature'
                      type='number'
                      placeholder='Enter maximum temperature'
                    />

                    <InputGroup.Text>°C</InputGroup.Text>
                  </InputGroup>

                  {formErrors && formErrors.maxTemperature?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.maxTemperature?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='R. Humidity (Min)' id='rangeMinRHumidity' />

            <Controller
              name='rangeMinRHumidity'
              control={form.control}
              render={({ field }) => (
                <>
                  <InputGroup>
                    <Form.Control
                      {...field}
                      style={{ marginTop: '1px' }}
                      id='rangeMinRHumidity'
                      type='number'
                      placeholder='Enter minimum r. humidity'
                    />

                    <InputGroup.Text>%rh</InputGroup.Text>
                  </InputGroup>

                  {formErrors && formErrors.rangeMinRHumidity?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.rangeMinRHumidity?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='R. Humidity (Max)' id='rangeMaxRHumidity' />

            <Controller
              name='rangeMaxRHumidity'
              control={form.control}
              render={({ field }) => (
                <>
                  <InputGroup>
                    <Form.Control
                      {...field}
                      style={{ marginTop: '1px' }}
                      id='rangeMaxRHumidity'
                      type='number'
                      placeholder='Enter maximum r. humidity'
                    />

                    <InputGroup.Text>%rh</InputGroup.Text>
                  </InputGroup>

                  {formErrors && formErrors.rangeMaxRHumidity?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.rangeMaxRHumidity?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>
        </Row>

        <Row className='mb-3 row-gap-3'>
          <Form.Group as={Col} md={12}>
            <Form.Label>Type of Balance</Form.Label>

            <div className='d-flex gap-6 w-100'>
              <div
                className={`d-flex justify-content-center align-items-center hover-item p-5 border rounded ${
                  form.watch('typeOfBalance') === '1' ? 'border-primary' : ''
                }`}
                style={{ cursor: 'pointer' }}
                onClick={() => form.setValue('typeOfBalance', '1')}
              >
                <img src='/images/balance-type-1.png' width={150} />
              </div>

              <div
                className={`d-flex justify-content-center align-items-center hover-item p-5 border rounded ${
                  form.watch('typeOfBalance') === '2' ? 'border-primary' : ''
                }`}
                style={{ cursor: 'pointer' }}
                onClick={() => form.setValue('typeOfBalance', '2')}
              >
                <img src='/images/balance-type-2.png' width={100} />
              </div>

              <div
                className={`d-flex justify-content-center align-items-center hover-item p-5 border rounded ${
                  form.watch('typeOfBalance') === '3' ? 'border-primary' : ''
                }`}
                style={{ cursor: 'pointer' }}
                onClick={() => form.setValue('typeOfBalance', '3')}
              >
                <img src='/images/balance-type-3.png' width={150} />
              </div>
            </div>
          </Form.Group>
        </Row>

        <div className='mt-4 d-flex justify-content-between align-items-center'>
          <Button
            disabled={isLoading}
            type='button'
            variant='outline-primary'
            onClick={handlePrevious}
          >
            Previous
          </Button>

          <Button disabled={isLoading} type='button' onClick={handleNext}>
            Next
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default CalibrationMeasures;
