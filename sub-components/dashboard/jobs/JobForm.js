import { FormProvider, useForm } from 'react-hook-form';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, Tab, Tabs } from 'react-bootstrap';
import { jobSchema, scheduleSchema, summarySchema, tasksSchema } from '@/schema/job';
import { getFormDefaultValues } from '@/utils/zod';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import TaskForm from './tabs-form/JobTaskForm';
import JobSchedulingForm from './tabs-form/JobSchedulingForm';
import toast from 'react-hot-toast';
import JobSummaryForm from './tabs-form/JobSummaryForm';

const JobForm = ({ data }) => {
  const [activeKey, setActiveKey] = useState('0');

  const tabsLength = 2;
  const tabSchema = [summarySchema, tasksSchema, scheduleSchema];

  const [isLoading, setIsLoading] = useState(false);

  const schema = useMemo(() => {
    return tabSchema[Number(activeKey)] ?? summarySchema;
  }, [activeKey]);

  const form = useForm({
    mode: 'onChange',
    defaultValues: { ...getFormDefaultValues(schema), ...data },
    resolver: zodResolver(schema),
  });

  const handleNext = useCallback(async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    if (Number(activeKey) <= tabSchema.length - 1) {
      const nextActiveKey = String(Number(activeKey) + 1);
      setActiveKey(nextActiveKey);

      if (Number(activeKey) === tabSchema.length - 1) {
        const parseData = jobSchema.safeParse(form.getValues());

        if (parseData.success) {
          handleSubmit(parseData.data);
        } else toast.error('Failed to parse data. Please try again later.');
      }
    }
  }, [activeKey]);

  const handleSubmit = useCallback(
    async (formData) => {
      try {
        setIsLoading(true);
        const { jobId, equipments, ...jobHeaders } = formData;

        const promises = [
          setDoc(doc(db, 'jobHeaders', jobId), {
            ...jobHeaders,
            contact: jobHeaders?.contact ?? null,
          }),
          setDoc(doc(db, 'jobDetails', jobId), {
            equipments: equipments.map((equipment) => ({ jobId, ...equipment })),
          }),
        ];
        await Promise.all(promises);
        toast.success(`Job ${data ? 'updated' : 'created'} successfully.`, {position: 'top-right'}); // prettier-ignore
        setIsLoading(false);
      } catch (error) {
        console.error('Error submitting job:', error);
        toast.error('Something went wrong. Please try again later.');
        setIsLoading(false);
      }
    },
    [data]
  );

  const handleOnSelect = async (key) => {
    const isValid = await form.trigger();
    if (!isValid && activeKey !== key) {
      toast.error('Please fix the errors in the form and try again.', { position: 'top-right' });
      return;
    }

    setActiveKey(key);
  };

  // console.log({ errors: form.formState.errors });

  return (
    <>
      {/* <div className='mb-4'> {JSON.stringify(form.watch(), null, 2)}</div> */}
      {/* <div className='mb-4'> {JSON.stringify(contactsOptions, null, 2)}</div> */}
      {/* <div className='mb-4'> {JSON.stringify(equipmentForm.watch(), null, 2)}</div> */}
      {/* <div className='mb-4'> {JSON.stringify({ equipments }, null, 2)}</div> */}
      {/* <div className='mb-4'> {JSON.stringify({ activeKey }, null, 2)}</div> */}

      <FormProvider {...form}>
        <Form>
          <Tabs
            id='job-tab'
            className='mb-4'
            activeKey={activeKey > tabsLength ? tabsLength : activeKey}
            onSelect={handleOnSelect}
          >
            <Tab eventKey='0' title='Summary'>
              <JobSummaryForm data={data} isLoading={isLoading} handleNext={handleNext} />
            </Tab>

            <Tab eventKey='1' title='Job Task'>
              <TaskForm isLoading={isLoading} handleNext={handleNext} />
            </Tab>

            <Tab eventKey='2' title='Job Scheduling'>
              <JobSchedulingForm data={data} isLoading={isLoading} handleNext={handleNext} />
            </Tab>
          </Tabs>
        </Form>
      </FormProvider>
    </>
  );
};

export default JobForm;
