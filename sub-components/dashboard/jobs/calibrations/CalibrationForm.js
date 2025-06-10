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
import { Accordion, Form, Tab, Tabs } from 'react-bootstrap';
import { FormProvider, useForm } from 'react-hook-form';
import { getFormDefaultValues } from '@/utils/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import FormDebug from '@/components/Form/FormDebug';

import CalibrationMeasures from './tabls-form/CalibrationMeasuresForm';
import CalibrateSummaryForm from './tabls-form/CalibrateSummaryForm';
import CalibrationReferenceInstrumentsForm from './tabls-form/CalibrationReferenceInstrumentsForm';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import CalibrationMassForm from './tabls-form/CalibrationMassForm';
import withReactContent from 'sweetalert2-react-content';
import Swal from 'sweetalert2';
import { ExclamationTriangleFill } from 'react-bootstrap-icons';
import useMounted from '@/hooks/useMounted';
import { format } from 'date-fns';
import { useNotifications } from '@/hooks/useNotifications';

const CalibrationForm = ({ data, isAdmin = true, calibrations }) => {
  const auth = useAuth();
  const isMounted = useMounted();

  const router = useRouter();
  const { jobId, workerId } = router.query;

  const notifications = useNotifications();

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
  const [reminded, setReminded] = useState(false);

  const [isLoadingCache, setIsLoadingCache] = useState(false);
  const [isLoadingClearCache, setIsLoadingClearCache] = useState(false);

  const schema = useMemo(() => {
    return tabSchema[Number(activeKey)] ?? calibrationInfoSchema;
  }, [activeKey]);

  const form = useForm({
    mode: 'onChange',
    defaultValues: {
      ...getFormDefaultValues(schema),
      ...data,
      traceabilityCalibrationLab: null,
      cocInstruments: [],
      data: { content: [] },
    },
    resolver: zodResolver(schema),
  });

  const formErrors = form.formState.errors;

  const calibratedCustomerEquipmentIds = useMemo(() => {
    if (!calibrations) return [];

    return calibrations?.data?.map((c) => c?.description?.id || '').filter(Boolean) || [];
  }, [calibrations]);

  const hasDuplicate = (array) => {
    const seen = new Set();
    const duplicates = new Set();

    for (const value of array) {
      if (seen.has(value)) duplicates.add(value);
      seen.add(value);
    }

    return duplicates.size > 0 ? Array.from(duplicates) : [];
  };

  const validateCalibrationPointsData = (calibrationPoints) => {
    if (!calibrationPoints) return [];

    let conflict = [];
    const classes = ['E2', 'ST-MW', '1st F1', '2nd F1'];

    calibrationPoints.forEach((point, index) => {
      point.data.forEach((slot, slotIndex) => {
        const duplicates = hasDuplicate(slot);

        if (duplicates.length > 0) {
          conflict.push({
            pointIndex: index,
            slotIndex: slotIndex,
            values: slot,
            duplicates: duplicates,
            message: `Duplicate value(s) in calibration point #${index + 1}, slot ${
              classes[slotIndex]
            }`,
          });
        }
      });
    });

    return conflict;
  };

  const handleNext = useCallback(async () => {
    //* only trigger form.trigger at top if its not the final part of form becauase it clears all errors which is not needed
    if (Number(activeKey) < tabSchema.length - 1) {
      const isValid = await form.trigger();

      if (!isValid) {
        toast.error('Please fix the errors in the form and try again.', { position: 'top-right' });
        return;
      }
    }

    if (Number(activeKey) <= tabSchema.length - 1) {
      const nextActiveKey = String(Number(activeKey) + 1);
      setActiveKey(nextActiveKey);

      if (Number(activeKey) === tabSchema.length - 1) {
        const formValues = form.getValues();
        const parseData = calibrationSchema.safeParse(formValues);

        if (parseData.success) {
          const formData = parseData.data;

          //* check conflict
          const conflicts = validateCalibrationPointsData(
            formData?.data?.dfnv?.[0]?.calibrationPoints
          );

          if (conflicts.length > 0) {
            console.log({ conflicts });

            setActiveKey((prev) => prev - 1);
            setIsLoading(false);

            //* Swal popup with conflict, using accordion
            await withReactContent(Swal).fire({
              title: 'Duplicate Value Error',
              icon: 'error',
              showConfirmButton: false,
              showCloseButton: true,
              cancelButtonText: 'Ok',
              width: '600px',
              html: (
                <div>
                  <div>
                    The following calibration points have duplicate values. Please fix the errors
                    and try again.
                  </div>

                  <Accordion className='mt-4'>
                    {conflicts.map((conflict, i) => (
                      <Accordion.Item eventKey={`${i}-${conflict.pointIndex}`}>
                        <Accordion.Header className='text-danger'>
                          <ExclamationTriangleFill className='me-3' size={17} />
                          {conflict.message}
                        </Accordion.Header>
                        <Accordion.Body className='fs-6'>
                          <div className='d-flex flex-column align-items-start gap-2'>
                            <div>
                              <span className='fw-bold me-2'>Duplicates:</span>{' '}
                              {conflict?.duplicates?.join(', ')}
                            </div>
                            <div>
                              <span className='fw-bold me-2'>Values:</span>{' '}
                              {conflict?.values?.join(', ')}
                            </div>
                          </div>
                        </Accordion.Body>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                </div>
              ),
            });

            return;
          }

          let dfnvHasData = true;

          const filterNullUndefined = (v) => v !== null && v !== undefined && v !== '';

          // prettier-ignore
          if (
            formValues.data?.dfnv?.[0]?.calibrationPoints?.length === 0 || 
            formValues.data?.dfnv?.[0]?.calibrationPoints?.every((point) => point?.data?.filter(filterNullUndefined).every((columnData) => columnData?.filter(filterNullUndefined).length === 0)) || 
            formValues?.data?.nominalValues?.filter(filterNullUndefined).length === 0 ||
            formValues?.data?.measuredValues?.filter(filterNullUndefined).every((mValues) =>mValues?.filter(filterNullUndefined).length === 0)
          ) {
            dfnvHasData = false;
          }

          //* check if theres no data in dfnv (empty), no nominal valueso or measuredValues and the other measurement show popup
          if (
            !reminded &&
            (!dfnvHasData ||
              (!formValues.minTemperature && !formValues.minTemperature !== 0) ||
              (!formValues.maxTemperature && !formValues.maxTemperature !== 0) ||
              (!formValues.rangeMinRHumidity && !formValues.rangeMinRHumidity !== 0) ||
              (!formValues.rangeMaxRHumidity && !formValues.rangeMaxRHumidity !== 0) ||
              !formValues.typeOfBalance)
          ) {
            await Swal.fire({
              title: 'Reminder!',
              text: 'Please fill-in the data in "Departure From Nominal Value (g)" and "Other Measurements"',
              icon: 'warning',
              showCancelButton: false,
              confirmButtonText: 'Ok',
              customClass: {
                confirmButton: 'btn btn-primary rounded',
              },
            }).then((data) => {
              if (data.isConfirmed) {
                setReminded(true);
                setActiveKey((prev) => prev - 1);
              }
            });

            return;
          }

          handleSubmit(formData);
        } else {
          toast.error('Failed to parse data. Please try again later.');
          setActiveKey((prev) => prev - 1);
        }
      }
    }
  }, [activeKey]);

  const handlePrevious = useCallback(() => {
    if (Number(activeKey) > 0) handleOnSelect(activeKey - 1);
  }, [activeKey]);

  const handleSubmit = useCallback(
    async (formData) => {
      console.log({ formData });

      try {
        setIsLoading(true);

        const results = {
          nominalValues: formData?.data?.nominalValues || [],
          measuredValuesM: formData?.data?.measuredValuesM || [],
          corrections: formData?.data?.corrections || [],
          expandedUncertainties: formData?.data?.expandedUncertainties || [],
          rangeType: formData?.rangeType || 'single',
          resolution: !isNaN(parseFloat(formData?.resolution))
            ? parseFloat(formData?.resolution)
            : 0,
          rtestMaxError: formData?.data?.rtest?.maxError || 0,
        };

        const promises = [
          setDoc(
            doc(db, 'jobCalibrations', formData.calibrateId),
            {
              ...formData,
              ...(data && data?.status === 'data-rejected' && { status: 'data-resubmission' }),
              approvedSignatory: {
                id: formData.approvedSignatory.id,
                name: formData.approvedSignatory.name,
              },
              data: JSON.stringify(formData.data),
              ...(!data && { createdAt: serverTimestamp(), createdBy: auth.currentUser }),
              updatedAt: serverTimestamp(),
              updatedBy: auth.currentUser,
            },
            { merge: true }
          ),
          setDoc(
            doc(db, 'jobCertificates', formData.calibrateId),
            {
              results,
              jobId: formData.jobId,
              calibrateId: formData.calibrateId,
              certificateNumber: formData.certificateNumber,
              ...(!data && { createdAt: serverTimestamp(), createdBy: auth.currentUser }),
              updatedAt: serverTimestamp(),
              updatedBy: auth.currentUser,
            },
            { merge: true }
          ),
        ];

        await Promise.all(promises);

        if (!data) {
          //* create notification for admin and supervisor when created a calibration
          await notifications.create({
            module: 'calibration',
            target: ['admin', 'supervisor'],
            title: 'New calibration created',
            message: `
             A new calibration (#${formData.calibrateId}) has been created by ${auth.currentUser.displayName} for job (#${formData.jobId}) and calibrated by ${formData.calibratedBy.name}.`,
            data: {
              redirectUrl: `/jobs/${formData.jobId}/calibrations/view/${formData.calibrateId}`,
            },
          });
        } else {
          //* create notification for admin and supervisor when updated a calibration
          await notifications.create({
            module: 'calibration',
            target: ['admin', 'supervisor'],
            title: 'Calibration updated',
            message: `
             A calibration (#${formData.calibrateId}) has been updated by ${auth.currentUser.displayName} for job (#${formData.jobId}) and calibrated by ${formData.calibratedBy.name}.`,
            data: {
              redirectUrl: `/jobs/${formData.jobId}/calibrations/view/${formData.calibrateId}`,
            },
          });

          if (data?.status === 'data-rejected') {
            //* create notification for admin and supervisor when updated a calibration status to resubmission
            notifications.create({
              module: 'calibration',
              target: ['admin', 'supervisor'],
              title: 'Calibration status updated',
              message: `Calibration (#${formData.calibrateId}) status was updated by ${auth.currentUser.displayName} to "Data Resubmission".`, //prettier-ignore
              data: {
                redirectUrl: `/jobs/${formData.jobId}/calibrations/view/${formData.calibrateId}`,
              },
            });
          }
        }

        //* create notification for assigned approved signatory
        if (formData?.approvedSignatory?.uid) {
          await notifications.create({
            module: 'calibration',
            target: [formData.approvedSignatory.uid],
            title: `You are assigned as an approved signatory`,
            message: `
             A calibration (#${formData.calibrateId}) has been assigned to you by ${auth.currentUser.displayName} for job (#${formData.jobId}).`,
            data: {
              redirectUrl: `/jobs/${formData.jobId}/calibrations/view/${formData.calibrateId}`,
            },
          });
        }

        if (isAdmin) {
          window.location.assign(
            `/jobs/${formData.jobId}/calibrations/view/${formData.calibrateId}`
          );
        } else {
          workerId &&
            window.location.assign(
              `/user/${workerId}/jobs/${formData.jobId}/calibrations/view/${formData.calibrateId}`
            );
        }
        toast.success(`Calibration ${data ? 'updated' : 'created'} successfully.`, {position: 'top-right'}); // prettier-ignore
        setIsLoading(false);
        setActiveKey((prev) => prev - 1);
      } catch (error) {
        console.error('Error submitting calibraiton:', error);
        toast.error('Something went wrong. Please try again later.');
        setIsLoading(false);
        setActiveKey((prev) => prev - 1);
      }
    },
    [data, formErrors]
  );

  const handleOnSelect = async (key) => {
    const isValid = await form.trigger();
    if (!isValid && activeKey !== key) {
      toast.error('Please fix the errors in the form and try again.', { position: 'top-right' });
      return;
    }

    setActiveKey(key);
  };

  const handleLoadDataCache = useCallback(async () => {
    setIsLoadingCache(true);

    const calibrationId = data?.calibrateId;
    const cacheKey = `calibration-${auth.currentUser.uid}-${auth.workerId}${calibrationId ? `-${calibrationId}` : ''}`; //prettier-ignore
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      const formData = JSON.parse(cachedData);

      const fieldToRestore = [
        { delay: 500, group: [{ name: 'category', value: formData.category }] },
        {
          delay: 500,
          group: [
            { name: 'certificateNumber', value: formData.certificateNumber },
            { name: 'serialNumber', value: formData.serialNumber },
          ],
        },
        { delay: 500, group: [{ name: 'description', value: formData.description }] },
        { delay: 500, group: [{ name: 'dateCalibrated', value: formData.dateCalibrated }] },
        { delay: 500, group: [{ name: 'dueDateRequested', value: formData.dueDateRequested }] },
        {
          delay: 500,
          group: [
            { name: 'dueDateDuration', value: formData.dueDateDuration },
            { name: 'dueDate', value: formData.dueDate },
          ],
        },
        { delay: 500, group: [{ name: 'rangeType', value: formData.rangeType }] },
        {
          delay: 500,
          group: [
            { name: 'rangeMinCalibration', value: formData.rangeMinCalibration },
            { name: 'rangeMaxCalibration', value: formData.rangeMaxCalibration },
          ],
        },
        {
          delay: 500,
          group: [
            { name: 'traceabilityType', value: formData.traceabilityType },
            { name: 'traceabilityCountry', value: formData.traceabilityCountry },
            { name: 'traceabilityCalibrationLab', value: formData.traceabilityCalibrationLab },
            {
              name: 'traceabilityAccreditationBody',
              value: formData.traceabilityAccreditationBody,
            },
          ],
        },
        { delay: 1000, group: [{ name: 'resolution', value: formData.resolution }] },
        {
          delay: 2500,
          group: [
            { name: 'unitUsedForCOC', value: formData.unitUsedForCOC },
            { name: 'calibrationPointNo', value: formData.calibrationPointNo },
            { name: 'instruments', value: formData.instruments },
            { name: 'cocInstruments', value: formData.cocInstruments },
          ],
        },
        { delay: 1000, group: [{ name: 'data', value: formData.data }] },
      ];

      //* restore form data with delays
      for (const fieldGroup of fieldToRestore) {
        for (const field of fieldGroup.group) {
          form.setValue(field.name, field.value);
          delete formData[field.name];
        }

        await new Promise((resolve) => setTimeout(resolve, fieldGroup.delay));
      }

      //* Reset remaining form values if any
      form.reset((formValues) => ({ ...formValues, ...formData }));
      toast.success('Data cache loaded successfully.');
    } else toast.error('Failed to load data cache. Please try again later.');

    setIsLoadingCache(false);
  }, [auth, data]);

  const handleClearCache = useCallback(async () => {
    setIsLoadingClearCache(true);

    const calibrationId = data?.calibrateId;
    const cacheKey = `calibration-${auth.currentUser.uid}-${auth.workerId}${calibrationId ? `-${calibrationId}` : ''}`; //prettier-ignore
    const cachedData = localStorage.getItem(cacheKey);

    await new Promise((resolve) => setTimeout(resolve, 2500));

    if (cachedData) {
      localStorage.removeItem(cacheKey);
      toast.success('Data cache cleared successfully.');
    } else toast.error('Failed to clear data cache. Please try again later.');

    setIsLoadingClearCache(false);
  }, [auth, data]);

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

  //* store form data into cache
  useEffect(() => {
    if (auth.currentUser && isMounted && form.formState.isDirty && !isLoadingCache) {
      const calibrationId = data?.calibrateId;
      const cacheKey = `calibration-${auth.currentUser.uid}-${auth.workerId}${calibrationId ? `-${calibrationId}` : ''}`; //prettier-ignore
      localStorage.setItem(cacheKey, JSON.stringify(form.getValues()));
    }
  }, [JSON.stringify(form.watch()), auth, data, isLoadingCache]);

  console.log({ data, jobCalibrations: calibrations, calibratedCustomerEquipmentIds });

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
            <Tab eventKey='0' title='Summary'>
              <CalibrateSummaryForm
                job={job}
                data={data}
                isLoading={isLoading}
                handleNext={handleNext}
                isAdmin={isAdmin}
                handleLoadDataCache={handleLoadDataCache}
                handleClearCache={handleClearCache}
                isLoadingCache={isLoadingCache}
                isLoadingClearCache={isLoadingClearCache}
                calibratedCustomerEquipmentIds={calibratedCustomerEquipmentIds}
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
