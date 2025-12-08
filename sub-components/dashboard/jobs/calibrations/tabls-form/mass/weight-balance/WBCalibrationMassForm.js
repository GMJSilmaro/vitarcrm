import React, { useEffect, useMemo, useState } from 'react';
import { Accordion, Row } from 'react-bootstrap';
import { Rulers, Table } from 'react-bootstrap-icons';
import WBDFNVTest from './WBDFNVTest';
import WBRTest from './WBRTest';
import WBETest from './WBETest';
import WBOtherMeasurementsForm from './WBOtherMeasurementsForm';
import WBCalculationTable from './WBCalculationTable';
import WBMassResultForm from './WBMassResultForm';
import { useFormContext } from 'react-hook-form';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/firebase';

const WBCalibrationMassForm = ({ range, data, rangeIndex }) => {
  const form = useFormContext();

  const [ck, setCk] = useState({ data: [], isLoading: true, isError: false });
  const [cuswd, setCuswd] = useState({ data: [], isLoading: true, isError: false });
  const [mpe, setMpe] = useState({ data: [], isLoading: true, isError: false });

  const category = useMemo(() => {
    const value = form.getValues('category')?.value || form.getValues('category') || '';
    return value.toLowerCase();
  }, [form.watch('category')]);

  const variant = useMemo(() => {
    const value = form.getValues('variant')?.value || form.getValues('variant') || '';
    return value.toLowerCase();
  }, [form.watch('variant')]);

  //* query CK
  useEffect(() => {
    const q = query(collection(db, 'jobCalibrationReferences', 'CR000003', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log({ snapshot });

        if (!snapshot.empty) {
          const ckData = {
            data: snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })),
            isLoading: false,
            isError: false,
          };

          setCk(ckData);

          form.setValue(`ck`, ckData);
          return;
        }

        form.setValue(`ck`, { data: [], isLoading: false, isError: false });
        setCk({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        form.setValue(`ck`, { data: [], isLoading: false, isError: false });
        setCk({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  //* query Correction, Uncertainty of the Standard Weight & Drift (CUSWD)
  useEffect(() => {
    const q = query(collection(db, 'jobCalibrationReferences', 'CR000001', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const cuswdData = {
            data: snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })),
            isLoading: false,
            isError: false,
          };

          setCuswd(cuswdData);

          form.setValue(`cuswd`, cuswdData);
          return;
        }

        form.setValue(`cuswd`, { data: [], isLoading: false, isError: false });
        setCuswd({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        form.setValue(`cuswd`, { data: [], isLoading: false, isError: false });
        setCuswd({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  //* query MPE
  useEffect(() => {
    const q = query(collection(db, 'jobCalibrationReferences', 'CR000002', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const mpeData = {
            data: snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })),
            isLoading: false,
            isError: false,
          };

          setMpe(mpeData);

          return;
        }

        form.setValue(`mpe`, { data: [], isLoading: false, isError: false });
        setMpe({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        form.setValue(`mpe`, { data: [], isLoading: false, isError: false });
        setMpe({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

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
            <span className='pe-2'>Variant:</span>
            <span className='fw-bold text-capitalize'>{variant}</span>
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
              <WBDFNVTest data={data} rangeIndex={rangeIndex} />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey='1'>
            <Accordion.Header>
              <Table className='me-2' size={17} />
              Repeatability Test (g)
            </Accordion.Header>

            <Accordion.Body>
              <WBRTest data={data} rangeIndex={rangeIndex} />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey='2'>
            <Accordion.Header>
              <Table className='me-2' size={17} />
              Eccentricity Test (g)
            </Accordion.Header>

            <Accordion.Body>
              <WBETest data={data} rangeIndex={rangeIndex} />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey='3'>
            <Accordion.Header>
              <Rulers className='me-2' size={17} />
              Other Measurements
            </Accordion.Header>

            <Accordion.Body>
              <WBOtherMeasurementsForm data={data} rangeIndex={rangeIndex} />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey='4'>
            <Accordion.Header>
              <Table className='me-2' size={17} />
              Uncertainty Calculation (Electronic Balance) - A1 - A
              {range?.calibrationPointNo?.value || ''}
            </Accordion.Header>

            <Accordion.Body>
              <WBCalculationTable data={data} rangeIndex={rangeIndex} />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey='5'>
            <Accordion.Header>
              <Table className='me-2' size={17} />
              Results
            </Accordion.Header>

            <Accordion.Body>
              <WBMassResultForm rangeIndex={rangeIndex} />
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Row>
    </>
  );
};

export default WBCalibrationMassForm;
