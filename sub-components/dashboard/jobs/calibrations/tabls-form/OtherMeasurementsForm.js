import { Col, Form, InputGroup, Row } from 'react-bootstrap';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

const OtherMeasurementsForm = ({ data, rangeIndex }) => {
  const form = useFormContext();
  const formErrors = form.formState.errors;

  const typeOfBalance = useWatch({
    control: form.control,
    name: `data.${rangeIndex}.typeOfBalance`,
  });

  return (
    <Row className='mb-3 row-gap-3'>
      <Form.Group as={Col} md={12}>
        <Form.Label>Type of Balance</Form.Label>

        <div className='d-flex gap-6 w-100 flex-wrap justify-content-center justify-content-md-start'>
          <div
            className={`d-flex justify-content-center align-items-center hover-item p-5 border rounded ${
              typeOfBalance === '1' ? 'border-primary' : ''
            }`}
            style={{ cursor: 'pointer' }}
            onClick={() => form.setValue(`data.${rangeIndex}.typeOfBalance`, '1')}
          >
            <img src='/images/balance-type-1.png' width={150} />
          </div>

          <div
            className={`d-flex justify-content-center align-items-center hover-item p-5 border rounded ${
              typeOfBalance === '2' ? 'border-primary' : ''
            }`}
            style={{ cursor: 'pointer' }}
            onClick={() => form.setValue(`data.${rangeIndex}.typeOfBalance`, '2')}
          >
            <img src='/images/balance-type-2.png' width={100} />
          </div>

          <div
            className={`d-flex justify-content-center align-items-center hover-item p-5 border rounded ${
              typeOfBalance === '3' ? 'border-primary' : ''
            }`}
            style={{ cursor: 'pointer' }}
            onClick={() => form.setValue(`data.${rangeIndex}.typeOfBalance`, '3')}
          >
            <img src='/images/balance-type-3.png' width={150} />
          </div>
        </div>
      </Form.Group>
    </Row>
  );
};

export default OtherMeasurementsForm;
