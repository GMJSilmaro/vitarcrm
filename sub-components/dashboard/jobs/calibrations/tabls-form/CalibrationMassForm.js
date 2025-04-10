import React, { useEffect, useMemo } from 'react';
import { Accordion, Button, Card, Row, Spinner } from 'react-bootstrap';
import { Save, Table } from 'react-bootstrap-icons';
import DFNTest from './mass/DFNVTest';
import RTest from './mass/RTest';
import ETest from './mass/ETest';
import { useFormContext } from 'react-hook-form';
import CalculationTable from './mass/CalculationTable';

const CalibrationMassForm = ({ data, isLoading, handleNext, handlePrevious }) => {
  const form = useFormContext();

  const category = useMemo(() => {
    const value = form.getValues('category')?.value || form.getValues('category') || '';
    return value.toLowerCase();
  }, [form.watch('category')]);

  const calibrationPointNo = useMemo(() => {
    const value = parseFloat(form.getValues('calibrationPointNo')?.value);
    return isNaN(value) ? 6 : value;
  }, [form.watch('calibrationPointNo')]);

  //* set test data if data exist
  useEffect(() => {
    if (data && calibrationPointNo) {
      const resolvedData = JSON.parse(data.data);

      form.setValue('data.dfnv', resolvedData.dfnv);
      form.setValue('data.nominalValues', resolvedData.nominalValues);
      form.setValue('data.rtest.half', resolvedData.rtest.half);
      form.setValue('data.rtest.max', resolvedData.rtest.max);
      form.setValue('data.etest.values', resolvedData.etest.values);
      form.setValue('data.measuredValues', resolvedData.measuredValues);
      form.setValue('data.etest.testLoad', resolvedData.etest.testLoad);
      form.setValue('data.d1', resolvedData.d1);
      form.setValue('data.d2', resolvedData.d2);
    }
  }, [data, calibrationPointNo]);

  //* temporary check
  if (!category || category?.toLowerCase() !== 'mechanical' || !calibrationPointNo) {
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
        <Row className='mb-3'>
          <h5 className='mb-1'>Calibration</h5>
          <p className='text-muted'>
            Ensure accurate calibration through "Departure from Nominal Value (g) test",
            "Repeatability Test (g)" and "Eccentricity Test (g)"
          </p>

          <div className='flex align-items-center gap-2'>
            <div className='fs-5'>
              <span className='pe-2'>Category:</span>
              <span className='fw-bold text-capitalize'>{category}</span>
            </div>

            <div className='fs-5'>
              <span className='pe-2'>No. of Calibration Point:</span>
              <span className='fw-bold'>{calibrationPointNo}</span>
            </div>
          </div>
        </Row>

        <Row>
          <Accordion className='mt-1'>
            <Accordion.Item eventKey='0'>
              <Accordion.Header>
                <Table className='me-2' size={17} />
                Departure From Nominal Value (g)
              </Accordion.Header>

              <Accordion.Body>
                <DFNTest data={data} />
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey='1'>
              <Accordion.Header>
                <Table className='me-2' size={17} />
                Repeatability Test (g)
              </Accordion.Header>

              <Accordion.Body>
                <RTest data={data} />
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey='2'>
              <Accordion.Header>
                <Table className='me-2' size={17} />
                Eccentricity Test (g)
              </Accordion.Header>

              <Accordion.Body>
                <ETest data={data} />
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey='3'>
              <Accordion.Header>
                <Table className='me-2' size={17} />
                Uncertainty Calculation (Electronic Balance) - A1 - A{calibrationPointNo}
              </Accordion.Header>

              <Accordion.Body>
                <CalculationTable data={data} />
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
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

          <Button type='button' className='mt-2' onClick={handleNext}>
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
                {data ? 'Updating' : 'Creating'}...
              </>
            ) : (
              <>
                <Save size={14} className='me-2' />
                {data ? 'Update' : 'Create'} {' Calibration'}
              </>
            )}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default CalibrationMassForm;
