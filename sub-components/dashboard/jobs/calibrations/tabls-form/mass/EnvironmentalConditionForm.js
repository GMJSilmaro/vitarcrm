import React from 'react';
import { Col, Form, InputGroup, Row } from 'react-bootstrap';
import { Controller, useFormContext } from 'react-hook-form';

const EnvironmentaConditionForm = ({ data }) => {
  const form = useFormContext();
  const formErrors = form.formState.errors;

  return (
    <>
      <h4 className='mb-0'>Environmental Condition</h4>
      <p className='text-muted fs-6'>
        The instrument has been calibrated under the following environmental conditions.
      </p>

      <Row className='mb-3 row-gap-3'>
        <Form.Group as={Col} md={3}>
          <Form.Label id='minTemperature'>Temperature (Min)</Form.Label>

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
          <Form.Label id='maxTemperature'>Temperature (Max)</Form.Label>

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
          <Form.Label id='rangeMinRHumidity'>R. Humidity (Min)</Form.Label>

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
          <Form.Label id='rangeMaxRHumidity'>R. Humidity (Max)</Form.Label>

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
    </>
  );
};

export default EnvironmentaConditionForm;
