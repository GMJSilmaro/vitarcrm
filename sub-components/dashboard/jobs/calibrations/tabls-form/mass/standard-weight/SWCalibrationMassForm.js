import { CATEGORY_VARIANTS_MAP } from '@/schema/calibrations/common-index';
import React, { useEffect, useMemo, useState } from 'react';
import { Accordion, Row } from 'react-bootstrap';
import { Rulers, Table } from 'react-bootstrap-icons';
import { useFormContext, useWatch } from 'react-hook-form';
import SWTestWeightTest from './SWTestWeightTest';
import SWCalculationTable from './SWCalculationTable';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/firebase';
import SWMassResultForm from './SWMassResultForm';

const SWCalibrationMassForm = ({ data }) => {
  const form = useFormContext();

  const [ck, setCk] = useState({ data: [], isLoading: true, isError: false });
  const [cuswd, setCuswd] = useState({
    data: [],
    isLoading: true,
    isError: false,
  });
  const [acr, setAcr] = useState({ data: [], isLoading: true, isError: false });
  const [rscmc, setRscmc] = useState({
    data: [],
    isLoading: true,
    isError: false,
  });

  const testWeightNo = useWatch({
    control: form.control,
    name: 'testWeightNo',
  });

  const category = useMemo(() => {
    const value =
      form.getValues('category')?.value || form.getValues('category') || '';
    return value.toLowerCase();
  }, [form.watch('category')]);

  const variant = useMemo(() => {
    const value =
      form.getValues('variant')?.value || form.getValues('variant') || '';
    return value.toLowerCase();
  }, [form.watch('variant')]);

  const accuracyClass = useMemo(() => {
    const value = form.getValues('accuracyClass');
    return value && typeof value === 'object' ? value?.value : value;
  }, [JSON.stringify(form.watch('accuracyClass'))]);

  //* query Correction, Uncertainty of the Standard Weight & Drift (CUSWD)
  useEffect(() => {
    const q = query(
      collection(db, 'jobCalibrationReferences', 'CR000001', 'data')
    );

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

  //* query CK Table
  useEffect(() => {
    const q = query(
      collection(db, 'jobCalibrationReferences', 'CR000003', 'data')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
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

  //* query ACR
  useEffect(() => {
    const q = query(
      collection(db, 'jobCalibrationReferences', 'CR000004', 'data')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const acrData = {
            data: snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })),
            isLoading: false,
            isError: false,
          };

          setAcr(acrData);

          form.setValue(`acr`, acrData);
          return;
        }

        form.setValue(`acr`, { data: [], isLoading: false, isError: false });
        setAcr({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        form.setValue(`acr`, { data: [], isLoading: false, isError: false });
        setAcr({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  //* query RSCMC
  useEffect(() => {
    const q = query(
      collection(db, 'jobCalibrationReferences', 'CR000006', 'data')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const rscmcData = {
            data: snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })),
            isLoading: false,
            isError: false,
          };

          setRscmc(rscmcData);

          form.setValue(`rscmc`, rscmcData);
          return;
        }

        form.setValue(`rscmc`, { data: [], isLoading: false, isError: false });
        setRscmc({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        form.setValue(`rscmc`, { data: [], isLoading: false, isError: false });
        setRscmc({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  // console.count('SWCalibrationMassForm Rerender');

  useEffect(() => {
    console.log({ ck, cuswd, rscmc });
  }, [JSON.stringify(ck), JSON.stringify(cuswd), JSON.stringify(rscmc)]);

  return (
    <>
      <Row className='mb-3'>
        <h4 className='mb-0'>Calibration</h4>
        <p className='text-muted fs-6'>
          Details of test, computation and results of the calibration.
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
            <span className='pe-2'>Accuracy Class:</span>
            <span className='fw-bold text-capitalize'>{accuracyClass}</span>
          </div>

          <div className='fs-5'>
            <span className='pe-2'>No. of Test Weight:</span>
            <span className='fw-bold'>{testWeightNo || ''}</span>
          </div>
        </div>
      </Row>

      <Row>
        <Accordion className='mt-1'>
          <Accordion.Item eventKey='0'>
            <Accordion.Header>
              <Table className='me-2' size={17} />
              Test Weight
            </Accordion.Header>

            <Accordion.Body>
              <SWTestWeightTest data={data} />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey='4'>
            <Accordion.Header>
              <Table className='me-2' size={17} />
              Uncertainty Calculation (Standard Weight) - A1 - A
              {testWeightNo || ''}
            </Accordion.Header>

            <Accordion.Body>
              <SWCalculationTable data={data} />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey='5'>
            <Accordion.Header>
              <Table className='me-2' size={17} />
              Results
            </Accordion.Header>

            <Accordion.Body>
              <SWMassResultForm data={data} />
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Row>
    </>
  );
};

export default SWCalibrationMassForm;
