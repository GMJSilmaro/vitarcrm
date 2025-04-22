import { Col, Form, InputGroup, Row } from 'react-bootstrap';
import { Controller, useFormContext } from 'react-hook-form';

const OtherMeasurementsForm = (data) => {
  const form = useFormContext();
  const formErrors = form.formState.errors;

  return (
    <div>
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
    </div>
  );
};

export default OtherMeasurementsForm;
