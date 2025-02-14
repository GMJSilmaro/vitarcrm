import { FormProvider, useForm } from 'react-hook-form';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Accordion, Button, Form, Tab, Table, Tabs } from 'react-bootstrap';
import { jobSchema, scheduleSchema, summarySchema, tasksSchema } from '@/schema/job';
import { getFormDefaultValues } from '@/utils/zod';
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase';
import TaskForm from './tabs-form/JobTaskForm';
import JobSchedulingForm from './tabs-form/JobSchedulingForm';
import toast from 'react-hot-toast';
import JobSummaryForm from './tabs-form/JobSummaryForm';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { areIntervalsOverlapping, format, isAfter, isBefore } from 'date-fns';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { ExclamationTriangleFill } from 'react-bootstrap-icons';

const JobForm = ({ data }) => {
  const auth = useAuth();

  const router = useRouter();
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

  const handleCheckOverlap = useCallback(
    async (workerId, workerName, newJob) => {
      const constraints = [
        where('worker.id', '==', workerId),
        where('status', 'in', ['created', 'confirmed', 'in progress']),
      ];

      if (data) constraints.unshift(where('jobId', '!=', data.id));

      const workerJobs = await getDocs(query(collection(db, 'jobHeaders'), ...constraints));

      const conflict = [];
      const jobs = workerJobs.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      jobs.forEach((existingJob) => {
        const existingJobStart = new Date(`${existingJob.startDate}T${existingJob.startTime}:00`);
        const existingJobEnd = new Date(`${existingJob.endDate}T${existingJob.endTime}:00`);
        const newJobStart = newJob.startDate;
        const newJobEnd = newJob.endDate;

        const isOverlap = areIntervalsOverlapping(
          { start: newJobStart, end: newJobEnd },
          { start: existingJobStart, end: existingJobEnd }
        );

        if (isOverlap) {
          conflict.push({
            workerId,
            workerName,
            jobId: existingJob.id,
            jobDate: `${format(existingJobStart, 'dd/MM/yyyy, p')} - ${format(
              existingJobEnd,
              'dd/MM/yyyy, p'
            )}`,
            message: `Technician ${workerName} has a scheduling conflict with job #${
              existingJob.id
            } on ${format(existingJobStart, 'dd/MM/yyyy, p')} - ${format(
              existingJobEnd,
              'dd/MM/yyyy, p'
            )}`,
          });
        }
      });

      return conflict.length > 0 ? conflict : undefined;
    },
    [data]
  );

  const handleSubmit = useCallback(
    async (formData) => {
      try {
        setIsLoading(true);
        const { jobId, equipments, ...jobHeaders } = formData;

        const startDate = new Date(`${jobHeaders.startDate}T${jobHeaders.startTime}:00`);
        const endDate = new Date(`${jobHeaders.endDate}T${jobHeaders.endTime}:00`);

        //* not allowed to create jobs in the past, only allowed when doing edit
        if (!data && (isBefore(startDate, new Date()) || isBefore(endDate, new Date()))) {
          Swal.fire({
            title: 'Job Creation Not Allowed',
            text: `You are not allowed to create a job in the past. Please select a date in the present or the future.`,
            icon: 'error',
            showCancelButton: true,
            showCancelButton: false,
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK',
          });
          setActiveKey((prev) => prev - 1);
          setIsLoading(false);
          return;
        }

        //* check overlap intervals
        const conflicts = await handleCheckOverlap(jobHeaders.worker.id, jobHeaders.worker.name, {
          startDate,
          endDate,
        });

        if (conflicts && conflicts.length > 0) {
          setActiveKey((prev) => prev - 1);
          setIsLoading(false);

          await withReactContent(Swal).fire({
            title: 'Overlap Error',
            icon: 'error',
            showConfirmButton: false,
            showCloseButton: true,
            cancelButtonText: 'Ok',
            width: '600px',
            html: (
              <div className=''>
                <div>
                  Technician{' '}
                  <strong>
                    {jobHeaders.worker.name} (#{jobHeaders.worker.id})
                  </strong>{' '}
                  is already assigned to another job during this time.
                </div>

                <Accordion className='mt-4'>
                  <Accordion.Item eventKey='0'>
                    <Accordion.Header className='text-danger'>
                      <ExclamationTriangleFill className='me-2' size={17} />
                      Conflict Details
                    </Accordion.Header>
                    <Accordion.Body>
                      <Table className='fs-5 mb-0' striped bordered hover>
                        <thead>
                          <tr>
                            <th>Job ID</th>
                            <th>Start Date - End Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {conflicts.map((conflict) => (
                            <tr>
                              <td>{conflict.jobId}</td>
                              <td>{conflict.jobDate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              </div>
            ),
          });

          return;
        }

        const promises = [
          setDoc(
            doc(db, 'jobHeaders', jobId),
            {
              ...jobHeaders,
              jobId,
              contact: jobHeaders?.contact ?? null,
              ...(!data && { createdAt: serverTimestamp() }),
              updatedAt: serverTimestamp(),
              ...(!data && { createdAt: serverTimestamp(), createdBy: auth.currentUser }),
              updatedAt: serverTimestamp(),
              updatedBy: auth.currentUser,
            },
            { merge: true }
          ),
          setDoc(
            doc(db, 'jobDetails', jobId),
            {
              jobId,
              equipments: equipments.map((equipment) => ({ jobId, ...equipment })),
              ...(!data && { createdAt: serverTimestamp(), createdBy: auth.currentUser }),
              updatedAt: serverTimestamp(),
              updatedBy: auth.currentUser,
            },
            { merge: true }
          ),
        ];
        await Promise.all(promises);
        router.push(`/jobs/edit-jobs/${jobId}`);
        toast.success(`Job ${data ? 'updated' : 'created'} successfully.`, {position: 'top-right'}); // prettier-ignore
        setIsLoading(false);
      } catch (error) {
        console.error('Error submitting job:', error);
        toast.error('Something went wrong. Please try again later.');
        setIsLoading(false);
        setActiveKey((prev) => prev - 1);
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
