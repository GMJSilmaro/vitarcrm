import { useAuth } from '@/contexts/AuthContext';

import {
  customerEquipmentSchema,
  jobRequestSchema,
  summarySchema,
  taskSchema,
  tasksSchema,
} from '@/schema/job-request';
import { useRouter } from 'next/router';
import React, { useCallback, useMemo, useState } from 'react';
import { Form, Tab, Tabs } from 'react-bootstrap';
import { FormProvider, useForm } from 'react-hook-form';
import JobRequestSummaryForm from './tabs-form/JobRequestSummaryForm';
import { getFormDefaultValues } from '@/utils/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import JobRequestCustomerEquipmentForm from './tabs-form/JobRequestCustomerEquipment';
import JobRequestTaskForm from './tabs-form/JobRequestTaskForm';
import FormDebug from '@/components/Form/FormDebug';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';

const JobRequestForm = ({ data }) => {
  const auth = useAuth();
  const router = useRouter();

  const [activeKey, setActiveKey] = useState('0');

  const tabsLength = 2;
  const tabSchema = [summarySchema, customerEquipmentSchema, tasksSchema];

  const [isLoading, setIsLoading] = useState(false);

  const schema = useMemo(() => {
    return tabSchema[Number(activeKey)] ?? summarySchema;
  }, [activeKey]);

  const form = useForm({
    mode: 'onChange',
    defaultValues: {
      ...getFormDefaultValues(schema),
      ...data,
      ...(!data && { status: 'created' }),
      customerEquipments: [],
    },
    resolver: zodResolver(schema),
  });

  const handleNext = useCallback(async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    if (Number(activeKey) <= tabSchema.length - 1) {
      const nextActiveKey = String(Number(activeKey) + 1);
      setActiveKey(nextActiveKey);

      if (Number(activeKey) === tabSchema.length - 1) {
        const parseData = jobRequestSchema.safeParse(form.getValues());

        if (parseData.success) {
          handleSubmit(parseData.data);
        } else toast.error('Failed to parse data. Please try again later.');
      }
    }
  }, [activeKey]);

  const handlePrevious = useCallback(() => {
    if (Number(activeKey) > 0) handleOnSelect(activeKey - 1);
  }, [activeKey]);

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);

      await setDoc(
        doc(db, 'jobRequests', formData.jobRequestId),
        {
          ...formData,
          ...(!data && { createdAt: serverTimestamp(), createdBy: auth.currentUser }),
          updatedAt: serverTimestamp(),
          updatedBy: auth.currentUser,
        },
        { merge: true }
      );

      toast.success(`Job Request ${data ? 'updated' : 'created'} successfully.`, {
        position: 'top-right',
      });

      setIsLoading(false);
      window.location.assign(`/job-requests/edit-job-requests/${formData.jobRequestId}`);
    } catch (error) {
      console.error('Error submitting job request:', error);
      toast.error('Something went wrong. Please try again later.');
      setIsLoading(false);
      setActiveKey((prev) => prev - 1);
    }
  };

  const handleOnSelect = async (key) => {
    const isValid = await form.trigger();
    if (!isValid && activeKey !== key) {
      toast.error('Please fix the errors in the form and try again.', { position: 'top-right' });
      return;
    }

    setActiveKey(key);
  };

  return (
    <>
      {/* <FormDebug form={form} /> */}

      <FormProvider {...form}>
        <Form>
          <Tabs
            id='job-request-tab'
            activeKey={activeKey > tabsLength ? tabsLength : activeKey}
            onSelect={handleOnSelect}
          >
            <Tab eventKey='0' title='Summary'>
              <JobRequestSummaryForm data={data} isLoading={isLoading} handleNext={handleNext} />
            </Tab>

            <Tab eventKey='1' title='Calibration Items'>
              <JobRequestCustomerEquipmentForm
                data={data}
                isLoading={isLoading}
                handleNext={handleNext}
                handlePrevious={handlePrevious}
              />
            </Tab>

            <Tab eventKey='2' title='Additional Instructions'>
              <JobRequestTaskForm
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

export default JobRequestForm;
