import { TooltipContent } from '@/components/common/ToolTipContent';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import Select from '@/components/Form/Select';
import {
  CALIBRATION_POINT_NO,
  RANGE_TYPE,
  RESOLUTION,
  TRACEABILITY_ACCREDITATION_BODY,
  TRACEABILITY_CALIBRATION_LAB,
  TRACEABILITY_COUNTRY,
  TRACEABILITY_TYPE,
  UNIT_USED_FOR_COC,
} from '@/schema/calibration';
import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Form, InputGroup, OverlayTrigger, Row, Tooltip } from 'react-bootstrap';
import { Controller, useFormContext } from 'react-hook-form';

const CalibrationMeasures = ({ data, isLoading, handleNext, handlePrevious }) => {
  const [rangeTypeOptions] = useState(RANGE_TYPE.map((rangeType) => ({ value: rangeType, label: _.capitalize(rangeType) }))); //prettier-ignore
  const [resolutionOptions] = useState(RESOLUTION.map((resolution) => ({ value: resolution, label: resolution }))); //prettier-ignore
  const [unitUsedForCOCOptions] = useState(UNIT_USED_FOR_COC.map((unit) => ({ value: unit, label: unit }))); //prettier-ignore
  const [calibrationPointNoOptions] = useState(CALIBRATION_POINT_NO.map((pointNo) => ({ value: pointNo, label: pointNo }))); //prettier-ignore

  const [traceabilityTypeOptions] = useState(TRACEABILITY_TYPE.map((traceabilityType) => ({ value: traceabilityType, label: traceabilityType }))); //prettier-ignore
  const [traceabilityCountryOptions] = useState(TRACEABILITY_COUNTRY.map((country) => ({ value: country, label: country }))); //prettier-ignore
  const [traceabilityCalibrationLabOptions] = useState(
    TRACEABILITY_CALIBRATION_LAB.map((lab) => ({
      label: `${lab.name}${
        lab.accreditationNo && lab.accreditationNo !== 'N/A' ? ` - ${lab.accreditationNo}` : ''
      }`,
      ...lab,
    }))
  );
  const [traceabilityAccreditationBodyOptions] = useState(TRACEABILITY_ACCREDITATION_BODY.map(body => ({ value: body, label: body }))); //prettier-ignore

  const form = useFormContext();
  const formErrors = form.formState.errors;

  const handleTraceabilityTypeChange = (option, field) => {
    field.onChange(option);
    form.clearErrors('traceabilityCountry');
    form.clearErrors('traceabilityCalibrationLab');
    form.clearErrors('traceabilityAccreditationBody');

    if (option.value !== '3') {
      //* clear the fields
      form.setValue('traceabilityCountry', '');
      form.setValue('traceabilityCalibrationLab', []);
      form.setValue('traceabilityAccreditationBody', '');

      //* delay to set null value
      setTimeout(() => {
        form.setValue('traceabilityCountry', null);
        form.setValue('traceabilityCalibrationLab', null);
        form.setValue('traceabilityAccreditationBody', null);
      }, 100);
    } else {
      form.setValue('traceabilityCountry', '');
      form.setValue('traceabilityCalibrationLab', []);
      form.setValue('traceabilityAccreditationBody', '');
    }
  };

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
      const selectedTraceabilityType = traceabilityTypeOptions.find(
        (option) => option.value === data.traceabilityType
      );

      form.setValue('traceabilityType', selectedTraceabilityType);

      if (selectedTraceabilityType.value === '3') {
        if (traceabilityCountryOptions.length > 0) {
          const selectedTraceabilityCountry = traceabilityCountryOptions.find(
            (option) => option.value === data.traceabilityCountry
          );
          form.setValue('traceabilityCountry', selectedTraceabilityCountry);
        }

        if (traceabilityCalibrationLabOptions.length > 0) {
          const selectedTraceabilityCalibrationLabCodes = data?.traceabilityCalibrationLab || [];
          const selectedTraceabilityCalibrationLab = traceabilityCalibrationLabOptions.filter(
            (option) => {
              return selectedTraceabilityCalibrationLabCodes.includes(option.value);
            }
          );

          form.setValue('traceabilityCalibrationLab', selectedTraceabilityCalibrationLab);
        }

        if (traceabilityAccreditationBodyOptions.length > 0) {
          const selectedTraceabilityAccreditationBody = traceabilityAccreditationBodyOptions.find(
            (option) => option.value === data.traceabilityAccreditationBody
          );
          form.setValue('traceabilityAccreditationBody', selectedTraceabilityAccreditationBody);
        }
      }
    }
  }, [
    data,
    traceabilityTypeOptions,
    traceabilityCountryOptions,
    traceabilityCalibrationLabOptions,
    traceabilityAccreditationBodyOptions,
  ]);

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
          <Form.Group as={Col} md={4}>
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

          <Form.Group as={Col} md={4}>
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

          <Form.Group as={Col} md={4}>
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

          <Form.Group as={Col} md={4}>
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

          <Form.Group as={Col} md={4}>
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

          <Form.Group as={Col} md={4}>
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
        <h4 className='mb-0'>Traceability</h4>
        <p className='text-muted fs-6'>Details of the calibrationn traceability</p>

        <Row className='mb-3 row-gap-3'>
          <Form.Group as={Col} md={4}>
            <RequiredLabel label='Type' id='traceabilityType' />
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
                    onChange={(option) => handleTraceabilityTypeChange(option, field)}
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

          <Form.Group as={Col} md={4}>
            <Form.Label className='me-2' id='traceabilityCountry'>
              Country
            </Form.Label>
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent
                    title='Traceability Country Search'
                    info={['Search by traceability country']}
                  />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='traceabilityCountry'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    isDisabled={form.watch('traceabilityType.value') !== '3'}
                    inputId='traceabilityCountry'
                    instanceId='traceabilityCountry'
                    onChange={(option) => field.onChange(option)}
                    options={traceabilityCountryOptions}
                    placeholder='Search by traceability country'
                    noOptionsMessage={() => 'No traceability country found'}
                  />

                  {formErrors && formErrors.traceabilityCountry?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.traceabilityCountry?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <Form.Label className='me-2' id='traceabilityCalibrationLab'>
              Calibration Lab
            </Form.Label>
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent
                    title='Traceability Calibration Lab Search'
                    info={['Search by traceability calibration lab']}
                  />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='traceabilityCalibrationLab'
              control={form.control}
              render={({ field }) => {
                return (
                  <>
                    <Select
                      {...field}
                      isDisabled={form.watch('traceabilityType.value') !== '3'}
                      id='traceabilityCalibrationLab'
                      inputId='traceabilityCalibrationLab'
                      instanceId='traceabilityCalibrationLab'
                      isMulti
                      onChange={(option) => field.onChange(option)}
                      options={traceabilityCalibrationLabOptions}
                      placeholder='Search by traceability calibration lab'
                      noOptionsMessage={() => 'No traceability calibration lab found'}
                    />

                    {formErrors && formErrors.traceabilityCalibrationLab?.message && (
                      <Form.Text className='text-danger'>
                        {formErrors.traceabilityCalibrationLab?.message}
                      </Form.Text>
                    )}
                  </>
                );
              }}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <Form.Label className='me-2' htmlFor='serialNumber'>
              Signatory
            </Form.Label>
            <Form.Control
              id='serialNumber'
              type='text'
              value={form.watch('traceabilityCalibrationLab.0.signatory') || ''}
              readOnly
              disabled
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <Form.Label className='me-2' id='traceabilityAccreditationBody'>
              Accreditation Body
            </Form.Label>
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent
                    title='Traceability Accreditation Body Search'
                    info={['Search by traceability accreditation body']}
                  />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='traceabilityAccreditationBody'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    isDisabled={form.watch('traceabilityType.value') !== '3'}
                    inputId='traceabilityAccreditationBody'
                    instanceId='traceabilityAccreditationBody'
                    onChange={(option) => field.onChange(option)}
                    options={traceabilityAccreditationBodyOptions}
                    placeholder='Search by traceability accreditation body'
                    noOptionsMessage={() => 'No traceability accreditation body found'}
                  />

                  {formErrors && formErrors.traceabilityAccreditationBody?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.traceabilityAccreditationBody?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
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
