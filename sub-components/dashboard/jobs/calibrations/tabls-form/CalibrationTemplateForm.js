import { useEffect, useMemo } from 'react';
import { Button, Card, Col, Nav, Row, Spinner, Tab } from 'react-bootstrap';
import { CardList, Save } from 'react-bootstrap-icons';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import CalibrationMassForm from './mass/CalibrationMassForm';
import EnvironmentaConditionForm from './mass/EnvironmentalConditionForm';

const CalibrationTemplateForm = ({ data, isLoading, handleNext, handlePrevious }) => {
  const form = useFormContext();

  const rangeDetails = useWatch({ control: form.control, name: 'rangeDetails' });

  const category = useMemo(() => {
    const value = form.getValues('category')?.value || form.getValues('category') || '';
    return value.toLowerCase();
  }, [form.watch('category')]);

  const currentRangeData = useMemo(() => {
    const values = data?.data;

    if (!values) return [];

    const calibrationData = JSON.parse(data.data);
    return Array.isArray(calibrationData) ? calibrationData : [];
  }, JSON.stringify(data));

  //* set calibration test data if data exist
  useEffect(() => {
    if (data && currentRangeData.length > 0) {
      currentRangeData.forEach((rData, rIndex) => {
        form.setValue(`data.${rIndex}.dfnv`, rData.dfnv);
        form.setValue(`data.${rIndex}.nominalValues`, rData.nominalValues);
        form.setValue(`data.${rIndex}.rtest.half`, rData.rtest.half);
        form.setValue(`data.${rIndex}.rtest.max`, rData.rtest.max);
        form.setValue(`data.${rIndex}.etest.values`, rData.etest.values);
        form.setValue(`data.${rIndex}.etest.testLoad`, rData.etest.testLoad);
        form.setValue(`data.${rIndex}.measuredValues`, rData.measuredValues);
        form.setValue(`data.${rIndex}.d1`, rData.d1);
        form.setValue(`data.${rIndex}.d2`, rData.d2);
        form.setValue(`data.${rIndex}.typeOfBalance`, rData.typeOfBalance);
      });
    }
  }, [JSON.stringify(data), JSON.stringify(currentRangeData)]);

  //* temporary check
  if (!category || category?.toLowerCase() !== 'mass') {
    return (
      <Card className='shadow-none'>
        <Card.Body className='text-center mt-5'>
          <h4 className='mb-0'>Calibration Category or Calibration Point No. not yet suppoted</h4>
          <p>Module is under development</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className='shadow-none'>
      <Card.Body>
        <EnvironmentaConditionForm data={data} />

        <hr className='my-5' />

        <Tab.Container defaultActiveKey='0'>
          <Row className='mt-5'>
            <Col className='px-0' md={12}>
              <Nav
                variant='pills'
                className='d-flex justify-content-center align-items-center gap-3'
              >
                {rangeDetails?.length > 0 &&
                  Array.from({ length: rangeDetails?.length }).map((_, rangeIndex) => (
                    <Nav.Item key={`${rangeIndex}-nav-item`} className='d-flex align-items-center'>
                      <Nav.Link eventKey={`${rangeIndex}`}>
                        <CardList size={18} />
                        Range {rangeIndex + 1}
                      </Nav.Link>
                    </Nav.Item>
                  ))}
              </Nav>
            </Col>

            <Col md={12} className='ps-0'>
              <Tab.Content className='w-100 h-100'>
                {rangeDetails?.length > 0 &&
                  rangeDetails.map((range, rangeIndex) => (
                    <Tab.Pane
                      key={`${rangeIndex}-tab-pane`}
                      className='h-100'
                      eventKey={rangeIndex}
                    >
                      <CalibrationMassForm range={range} data={data} rangeIndex={rangeIndex} />
                    </Tab.Pane>
                  ))}
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>

        <div className='mt-4 d-flex justify-content-between align-items-center'>
          <Button
            disabled={isLoading}
            type='button'
            variant='outline-primary'
            onClick={handlePrevious}
          >
            Previous
          </Button>

          <Button type='button' className='mt-2' onClick={handleNext} disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner
                  as='span'
                  animation='border'
                  size='sm'
                  role='status'
                  aria-hidden='true'
                  className='me-2'
                />
                {data ? 'Updating' : 'Finishing'}...
              </>
            ) : (
              <>
                <Save size={14} className='me-2' />
                {data ? 'Update' : 'Finish'} {' Calibration'}
              </>
            )}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default CalibrationTemplateForm;
