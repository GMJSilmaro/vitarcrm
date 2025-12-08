import React from 'react';
import { Col, Form, InputGroup, Row } from 'react-bootstrap';
import { Controller, useFormContext } from 'react-hook-form';

const WBEnvConditionForm = ({ data }) => {
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
          <Form.Label id='minTemperature'>Ambient Temperature (Min)</Form.Label>

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
          <Form.Label id='maxTemperature'>Ambient Temperature (Max)</Form.Label>

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
          <Form.Label id='minRHumidity'>Relative Humidity (Min)</Form.Label>

          <Controller
            name='minRHumidity'
            control={form.control}
            render={({ field }) => (
              <>
                <InputGroup>
                  <Form.Control
                    {...field}
                    style={{ marginTop: '1px' }}
                    id='minRHumidity'
                    type='number'
                    placeholder='Enter minimum r. humidity'
                  />

                  <InputGroup.Text>%rh</InputGroup.Text>
                </InputGroup>

                {formErrors && formErrors.minRHumidity?.message && (
                  <Form.Text className='text-danger'>{formErrors.minRHumidity?.message}</Form.Text>
                )}
              </>
            )}
          />
        </Form.Group>

        <Form.Group as={Col} md={3}>
          <Form.Label id='maxRHumidity'>Relative Humidity (Max)</Form.Label>

          <Controller
            name='maxRHumidity'
            control={form.control}
            render={({ field }) => (
              <>
                <InputGroup>
                  <Form.Control
                    {...field}
                    style={{ marginTop: '1px' }}
                    id='maxRHumidity'
                    type='number'
                    placeholder='Enter maximum r. humidity'
                  />

                  <InputGroup.Text>%rh</InputGroup.Text>
                </InputGroup>

                {formErrors && formErrors.maxRHumidity?.message && (
                  <Form.Text className='text-danger'>{formErrors.maxRHumidity?.message}</Form.Text>
                )}
              </>
            )}
          />
        </Form.Group>
      </Row>
    </>
  );
};

export default WBEnvConditionForm;
