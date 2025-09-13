import React, { useMemo } from 'react';
import { Accordion, Row } from 'react-bootstrap';
import { Rulers, Table } from 'react-bootstrap-icons';
import DFNVTest from './DFNVTest';
import RTest from './RTest';
import ETest from './ETest';
import OtherMeasurementsForm from '../OtherMeasurementsForm';
import CalculationTable from './CalculationTable';
import MassResultForm from './MassResultForm';
import { useFormContext } from 'react-hook-form';

const CalibrationMassForm = ({ range, data, rangeIndex }) => {
  const form = useFormContext();

  const category = useMemo(() => {
    const value = form.getValues('category')?.value || form.getValues('category') || '';
    return value.toLowerCase();
  }, [form.watch('category')]);

  return (
    <>
      <Row className='mb-3'>
        <h4 className='mb-0'>Calibration</h4>
        <p className='text-muted fs-6'>
          Details of various test, computation and results of the calibration.
        </p>

        <div className='flex align-items-center gap-2'>
          <div className='fs-5'>
            <span className='pe-2'>Category:</span>
            <span className='fw-bold text-capitalize'>{category}</span>
          </div>

          <div className='fs-5'>
            <span className='pe-2'>Range:</span>
            <span className='fw-bold'>
              {range?.rangeMinCalibration ?? ''} to {range?.rangeMaxCalibration || ''} (gram)
            </span>
          </div>

          <div className='fs-5'>
            <span className='pe-2'>Resolution:</span>
            <span className='fw-bold'>{range?.resolution?.value || ''}</span>
          </div>

          <div className='fs-5'>
            <span className='pe-2'>Unit for COC:</span>
            <span className='fw-bold'>{range?.unitUsedForCOC?.value || ''}</span>
          </div>

          <div className='fs-5'>
            <span className='pe-2'>No. of Calibration Point:</span>
            <span className='fw-bold'>{range?.calibrationPointNo?.value || ''}</span>
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
              <DFNVTest data={data} rangeIndex={rangeIndex} />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey='1'>
            <Accordion.Header>
              <Table className='me-2' size={17} />
              Repeatability Test (g)
            </Accordion.Header>

            <Accordion.Body>
              <RTest data={data} rangeIndex={rangeIndex} />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey='2'>
            <Accordion.Header>
              <Table className='me-2' size={17} />
              Eccentricity Test (g)
            </Accordion.Header>

            <Accordion.Body>
              <ETest data={data} rangeIndex={rangeIndex} />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey='3'>
            <Accordion.Header>
              <Rulers className='me-2' size={17} />
              Other Measurements
            </Accordion.Header>

            <Accordion.Body>
              <OtherMeasurementsForm data={data} rangeIndex={rangeIndex} />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey='4'>
            <Accordion.Header>
              <Table className='me-2' size={17} />
              Uncertainty Calculation (Electronic Balance) - A1 - A
              {range?.calibrationPointNo?.value || ''}
            </Accordion.Header>

            <Accordion.Body>
              <CalculationTable data={data} rangeIndex={rangeIndex} />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey='5'>
            <Accordion.Header>
              <Table className='me-2' size={17} />
              Results
            </Accordion.Header>

            <Accordion.Body>
              <MassResultForm rangeIndex={rangeIndex} />
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Row>
    </>
  );
};

export default CalibrationMassForm;
