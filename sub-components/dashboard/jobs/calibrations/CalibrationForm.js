import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  calibrationInfoSchema,
  calibrationMassSchema,
  calibrationMeasurementSchema,
  calibrationReferenceInstrumentsSchema,
  calibrationSchema,
} from '@/schema/calibration';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Form, Tab, Tabs } from 'react-bootstrap';
import { FormProvider, useForm } from 'react-hook-form';
import { getFormDefaultValues } from '@/utils/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import FormDebug from '@/components/Form/FormDebug';

import CalibrationMeasures from './tabls-form/CalibrationMeasuresForm';
import CalibrateInfoForm from './tabls-form/CalibrateInfoForm';
import CalibrationReferenceInstrumentsForm from './tabls-form/CalibrationReferenceInstrumentsForm';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import CalibrationMassForm from './tabls-form/CalibrationMassForm';

const CalibrationForm = ({ data }) => {
  const auth = useAuth();

  const router = useRouter();
  const { jobId } = router.query;

  const tabsLength = 3;
  const tabSchema = [
    calibrationInfoSchema,
    calibrationMeasurementSchema,
    calibrationReferenceInstrumentsSchema,
    calibrationMassSchema,
  ];

  const [job, setJob] = useState({ data: null, isLoading: true, isError: false });
  const [isLoading, setIsLoading] = useState(false);
  const [activeKey, setActiveKey] = useState('0');

  const schema = useMemo(() => {
    return tabSchema[Number(activeKey)] ?? calibrationInfoSchema;
  }, [activeKey]);

  const form = useForm({
    mode: 'onChange',
    defaultValues: { ...getFormDefaultValues(schema), ...data, dfnv: [] },
    resolver: zodResolver(schema),
  });

  const handleNext = useCallback(async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    if (Number(activeKey) <= tabSchema.length - 1) {
      const nextActiveKey = String(Number(activeKey) + 1);
      setActiveKey(nextActiveKey);

      if (Number(activeKey) === tabSchema.length - 1) {
        const parseData = calibrationSchema.safeParse(form.getValues());

        if (parseData.success) {
          handleSubmit(parseData.data);
        } else toast.error('Failed to parse data. Please try again later.');
      }
    }
  }, [activeKey]);

  const handlePrevious = useCallback(() => {
    if (Number(activeKey) > 0) handleOnSelect(activeKey - 1);
  }, [activeKey]);

  const handleSubmit = useCallback(async (formData) => {
    console.log({ formData });

    //* stringified the test calibration points's test data
    const adjustedDFNV = formData.dfnv.map((entry) => ({
      ...entry,
      calibrationPoints: entry.calibrationPoints.map((point) => ({
        ...point,
        data: point.data.map((data) => JSON.stringify(data)),
      })),
    }));

    try {
      setIsLoading(true);

      const promises = [
        setDoc(
          doc(db, 'jobCalibrations', formData.calibrateId),
          {
            ...formData,
            dfnv: adjustedDFNV,
            ...(!data && { createdAt: serverTimestamp(), createdBy: auth.currentUser }),
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser,
          },
          { merge: true }
        ),
        setDoc(
          doc(db, 'jobCertificates', formData.certificateNumber),
          {
            results: {},
            jobId: formData.jobId,
            calibrateId: formData.calibrateId,
            ...(!data && { createdAt: serverTimestamp(), createdBy: auth.currentUser }),
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser,
          },
          { merge: true }
        ),
      ];

      await Promise.all(promises);
      router.push(`/jobs/${jobId}/calibrations//edit-calibrations/${formData.calibrateId}`);
      toast.success(`Calibration ${data ? 'updated' : 'created'} successfully.`, {position: 'top-right'}); // prettier-ignore
      setIsLoading(false);
      setActiveKey((prev) => prev - 1);
    } catch (error) {
      console.error('Error submitting calibraiton:', error);
      toast.error('Something went wrong. Please try again later.');
      setIsLoading(false);
      setActiveKey((prev) => prev - 1);
    }
  }, []);

  const handleOnSelect = async (key) => {
    const isValid = await form.trigger();
    if (!isValid && activeKey !== key) {
      toast.error('Please fix the errors in the form and try again.', { position: 'top-right' });
      return;
    }

    setActiveKey(key);
  };

  //* query job
  useEffect(() => {
    if (jobId) {
      const jobHeaderRef = doc(db, 'jobHeaders', jobId);
      const jobDetailsRef = doc(db, 'jobDetails', jobId);

      Promise.all([getDoc(jobHeaderRef), getDoc(jobDetailsRef)])
        .then(([jobHeader, jobDetails]) => {
          if (jobHeader.exists() && jobDetails.exists()) {
            setJob({
              data: {
                id: jobHeader.id,
                ...jobHeader.data(),
                ...jobDetails.data(),
              },
              isLoading: false,
              isError: false,
            });

            form.setValue('jobId', jobHeader.id);
            return;
          }

          setJob({ data: null, isLoading: false, isError: false });
        })
        .catch((err) => {
          console.error(err.message);
          setJob({ data: null, isLoading: false, isError: true });
        });
    }
  }, [jobId]);

  return (
    <>
      {/* <FormDebug form={form} /> */}

      <FormProvider {...form}>
        <Form>
          <Tabs
            id='calibration-tab'
            activeKey={activeKey > tabsLength ? tabsLength : activeKey}
            onSelect={handleOnSelect}
          >
            <Tab eventKey='0' title='Info'>
              <CalibrateInfoForm
                job={job}
                data={data}
                isLoading={isLoading}
                handleNext={handleNext}
              />
            </Tab>

            <Tab eventKey='1' title='Measurements'>
              <CalibrationMeasures
                data={data}
                isLoading={isLoading}
                handleNext={handleNext}
                handlePrevious={handlePrevious}
              />
            </Tab>

            <Tab eventKey='2' title='Reference Instruments'>
              <CalibrationReferenceInstrumentsForm
                job={job}
                data={data}
                isLoading={isLoading}
                handleNext={handleNext}
                handlePrevious={handlePrevious}
              />
            </Tab>

            <Tab eventKey='3' title='Calibration'>
              <CalibrationMassForm
                data={data}
                isLoading={isLoading}
                handleNext={handleNext}
                handlePrevious={handlePrevious}
              />
            </Tab>
          </Tabs>
        </Form>
      </FormProvider>
    </>
  );
};

export default CalibrationForm;
