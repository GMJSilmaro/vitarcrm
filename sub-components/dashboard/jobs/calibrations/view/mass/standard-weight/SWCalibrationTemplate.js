import { useEffect, useMemo, useState } from 'react';
import { Accordion, Card, Row, Spinner } from 'react-bootstrap';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import SWTestWeightTest from './SWTestWeightTest';
import { Table } from 'react-bootstrap-icons';
import SWCalculationTable from './SWCalculationTable';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/firebase';
import {
  NOMINAL_VALUE,
  TAG_ID,
  UNIT_USED_FOR_COC,
} from '@/schema/calibrations/mass/standard-weight';
import { getArrayType } from '@/utils/common';
import FormDebug from '@/components/Form/FormDebug';

function SWCalibrationTemplate({ calibration, materials, instruments, environmental }) {
  const category = useMemo(() => {
    if (!calibration.category) return null;
    return calibration.category?.toLowerCase();
  }, [calibration]);

  const variant = useMemo(() => {
    if (!calibration.variant) return null;
    return calibration.variant?.toLowerCase()?.replace('-', ' ');
  }, [calibration]);

  if (category !== 'mass') return null;

  return (
    <Card className='border-0 shadow-none'>
      <Card.Body>
        <CalibrationTemplateContent
          calibration={calibration}
          variant={variant}
          category={category}
          materials={materials}
          instruments={instruments}
          environmental={environmental}
        />
      </Card.Body>
    </Card>
  );
}

const CalibrationTemplateContent = ({
  calibration,
  variant,
  category,
  materials,
  instruments,
  environmental,
}) => {
  const form = useForm({
    values: calibration,
  });

  const cData = calibration?.data || [];

  const [isLoadedCalibrationData, setIsLoadedCalibrationData] = useState(false);

  const unitUsedForCOCOptions = UNIT_USED_FOR_COC.map((unit) => ({ value: unit, label: unit })); //prettier-ignore
  const tagIdOptions = TAG_ID.map((tagId) => ({ value: tagId, label: tagId })); //prettier-ignore
  const nominalValueOptions = NOMINAL_VALUE.map((nominalValue) => ({ value: nominalValue, label: nominalValue })); //prettier-ignore

  const materialsOptions = useMemo(() => {
    if (!materials?.data || materials?.data?.length < 1) return [];

    return materials?.data?.map((m) => ({
      value: m.id,
      label: m.material,
      ptKgMn3: m?.ptKgMn3 || '',
      uPtKgMn3: m?.uPtKgMn3 || '',
    }));
  }, [JSON.stringify(materials)]);

  const instrumentsOptions = useMemo(() => {
    if (!instruments?.data || instruments?.data?.length < 1) return [];

    return instruments?.data?.map((instrument) => ({
      label: instrument?.description || '',
      value: instrument.id,
      ...instrument,
    }));
  }, [JSON.stringify(instruments)]);

  const environmentalOptions = useMemo(() => {
    const result =
      environmental?.data?.map((doc) => ({
        value: doc.id,
        label: `${doc?.code || ''}${doc?.description ? ' - ' + doc?.description : ''}`,
        u: doc?.u || '',
        unit: doc?.unit || '',
        dueDate: doc?.dueDate || '',
      })) || [];

    //* set temporary value
    form.setValue('environmental', result);

    return result;
  }, [JSON.stringify(environmental)]);

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

  const isLoading = useMemo(() => {
    return (
      isLoadedCalibrationData || ck.isLoading || cuswd.isLoading || acr.isLoading || rscmc.isLoading
    );
  }, [
    JSON.stringify(ck),
    JSON.stringify(cuswd),
    JSON.stringify(acr),
    JSON.stringify(rscmc),
    isLoadedCalibrationData,
  ]);

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

  //* query CK Table
  useEffect(() => {
    const q = query(collection(db, 'jobCalibrationReferences', 'CR000003', 'data'));

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
    const q = query(collection(db, 'jobCalibrationReferences', 'CR000004', 'data'));

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

        console.log('no acr data');

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
    const q = query(collection(db, 'jobCalibrationReferences', 'CR000006', 'data'));

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

  //* set environmental uP, if data exist
  useEffect(() => {
    if (environmentalOptions.length > 0) {
      const selectedEnvironmental = environmentalOptions.find( (option) => option.value === calibration.envUP); //prettier-ignore
      form.setValue('envUP', selectedEnvironmental);
    }
  }, [JSON.stringify(environmentalOptions), JSON.stringify(calibration)]);

  //* set environmental uT, if data exist
  useEffect(() => {
    if (environmentalOptions.length > 0) {
      const selectedEnvironmental = environmentalOptions.find( (option) => option.value === calibration.envUT); //prettier-ignore
      form.setValue('envUT', selectedEnvironmental);
    }
  }, [JSON.stringify(environmentalOptions), JSON.stringify(calibration)]);

  //* set environmental uHr, if data exist
  useEffect(() => {
    if (environmentalOptions.length > 0) {
      const selectedEnvironmental = environmentalOptions.find( (option) => option.value === calibration.envUHr); //prettier-ignore
      form.setValue('envUHr', selectedEnvironmental);
    }
  }, [JSON.stringify(environmentalOptions), JSON.stringify(calibration)]);

  //* set calibration data
  useEffect(() => {
    setIsLoadedCalibrationData(true);

    cData.forEach((c, pointIndex) => {
      const unitUsedForCOC = c?.unitUsedForCOC;
      const material = c?.material;
      const ptKgMn3 = c?.ptKgMn3;
      const uPtKgMn3 = c?.uPtKgMn3;
      const nominalValue = c?.nominalValue;
      const isNominalValueWithAsterisk = c?.isNominalValueWithAsterisk;
      const massComparatorRefEquipmentId = c?.massComparatorRefEquipmentId;
      const tagId = c?.tagId;
      const weights = c?.weights || [];
      const testWeightData = c?.testWeightData || [[], [], [], []];

      const selectedUnitUsedForCOC = unitUsedForCOCOptions.find((option) => option.value === unitUsedForCOC); //prettier-ignore
      const selectedMaterial = materialsOptions.find((option) => option.value === material); //prettier-ignore
      const selectedNominalValue = nominalValueOptions.find( (option) => option.value == nominalValue); //prettier-ignore
      const selectedTagId = tagIdOptions.find((option) => option.value === tagId); //prettier-ignore
      const selectedIntruments = instrumentsOptions.find((option) => option.value === massComparatorRefEquipmentId); //prettier-ignore

      // console.log({ c,
      //   unitUsedForCOCOptions, materialsOptions, nominalValueOptions, tagIdOptions, instrumentsOptions,
      //   selectedUnitUsedForCOC, selectedMaterial, selectedNominalValue, selectedTagId, selectedIntruments }); //prettier-ignore

      form.setValue(`data.${pointIndex}.unitUsedForCOC`, selectedUnitUsedForCOC);
      form.setValue(`data.${pointIndex}.material`, selectedMaterial);
      form.setValue(`data.${pointIndex}.ptKgMn3`, ptKgMn3);
      form.setValue(`data.${pointIndex}.uPtKgMn3`, uPtKgMn3);
      form.setValue(`data.${pointIndex}.nominalValue`, selectedNominalValue);
      form.setValue(`data.${pointIndex}.isNominalValueWithAsterisk`, isNominalValueWithAsterisk);
      form.setValue(`data.${pointIndex}.massComparatorRefEquipmentId`, selectedIntruments);
      form.setValue(`data.${pointIndex}.tagId`, selectedTagId);
      form.setValue(`data.${pointIndex}.weights`, weights);
      form.setValue(`data.${pointIndex}.testWeightData`, testWeightData);
    });

    setIsLoadedCalibrationData(false);
  }, [
    JSON.stringify(calibration),
    JSON.stringify(unitUsedForCOCOptions),
    JSON.stringify(materialsOptions),
    JSON.stringify(nominalValueOptions),
    JSON.stringify(tagIdOptions),
    JSON.stringify(instrumentsOptions),
  ]);

  return (
    <>
      {/* <FormDebug form={form} /> */}

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
            <span className='fw-bold text-capitalize'>{calibration?.accuracyClass || ''}</span>
          </div>

          <div className='fs-5'>
            <span className='pe-2'>No. of Test Weight:</span>
            <span className='fw-bold'>{calibration?.testWeightNo || ''}</span>
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
              <SWTestWeightTest
                calibration={calibration}
                materials={materials}
                instruments={instruments}
              />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey='4'>
            <Accordion.Header>
              <Table className='me-2' size={17} />
              Uncertainty Calculation (Standard Weight) - A1 - A{calibration?.testWeightNo || ''}
            </Accordion.Header>

            <Accordion.Body>
              <FormProvider {...form}>
                {isLoading ? (
                  <Spinner animation='border' variant='primary' />
                ) : (
                  <SWCalculationTable data={calibration} />
                )}
              </FormProvider>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Row>
    </>
  );
};

export default SWCalibrationTemplate;
