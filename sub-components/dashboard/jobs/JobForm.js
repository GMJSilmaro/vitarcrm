import { FormProvider, useForm } from 'react-hook-form';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Accordion, Button, Card, Form, Tab, Table, Tabs } from 'react-bootstrap';
import { jobSchema, scheduleSchema, summarySchema, tasksSchema } from '@/schema/job';
import { getFormDefaultValues } from '@/utils/zod';
import {
  collection,
  doc,
  getDocs,
  increment,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase';
import TaskForm from './tabs-form/JobTaskForm';
import JobSchedulingForm from './tabs-form/JobSchedulingForm';

import JobSummaryForm from './tabs-form/JobSummaryForm';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { areIntervalsOverlapping, format, isAfter, isBefore, startOfDay } from 'date-fns';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { ExclamationTriangleFill } from 'react-bootstrap-icons';
import FormDebug from '@/components/Form/FormDebug';
import toast from 'react-hot-toast';

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
    defaultValues: { ...getFormDefaultValues(schema), ...data, workers: [] },
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

  const handlePrevious = useCallback(() => {
    if (Number(activeKey) > 0) handleOnSelect(activeKey - 1);
  }, [activeKey]);

  const handleCheckOverlap = useCallback(
    async (workerId, workerName, newJob) => {
      if (!workerId || !workerName || !newJob) return [];

      const conflict = [];
      const constraints = [
        where('workers', 'array-contains', { id: workerId, name: workerName }),
        where('status', 'in', ['created', 'confirmed', 'in progress']),
      ];

      try {
        if (data) constraints.unshift(where('jobId', '!=', data.id));

        const workerJobs = await getDocs(query(collection(db, 'jobHeaders'), ...constraints));
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
      } catch (error) {
        console.error('Error checking conflicts:', error);
        return [];
      }

      return conflict.length > 0 ? conflict : [];
    },
    [data]
  );

  const handleSubmit = useCallback(
    async (formData) => {
      console.log({ formData });

      try {
        setIsLoading(true);
        const { jobId, equipments, ...jobHeaders } = formData;

        //* new job date
        const startDate = new Date(`${jobHeaders.startDate}T${jobHeaders.startTime}:00`);
        const endDate = new Date(`${jobHeaders.endDate}T${jobHeaders.endTime}:00`);

        //* not allowed to create jobs in the past, only allowed when doing edit
        if (
          !data &&
          (isBefore(startOfDay(jobHeaders.startDate), startOfDay(new Date())) ||
            isBefore(startOfDay(jobHeaders.endDate), startOfDay(new Date())))
        ) {
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

        let workerConflicts = [];

        //* check overlap intervals per worker
        if (jobHeaders?.workers?.length > 0) {
          for (const worker of jobHeaders.workers) {
            const workerId = worker?.id;
            const workerName = worker?.name;

            workerConflicts.push({
              workerId,
              workerName,
              conflicts: await handleCheckOverlap(worker?.id, worker?.name, {
                startDate,
                endDate,
              }),
            });
          }
        }

        if (
          workerConflicts &&
          workerConflicts.filter((worker) => worker.conflicts.length > 0).length > 0
        ) {
          setActiveKey((prev) => prev - 1);
          setIsLoading(false);

          const filteredConflicts = workerConflicts.filter((worker) => worker.conflicts.length > 0);

          await withReactContent(Swal).fire({
            title: 'Conflict Error',
            icon: 'error',
            showConfirmButton: false,
            showCloseButton: true,
            cancelButtonText: 'Ok',
            width: '600px',
            html: (
              <div className=''>
                <div>
                  The following technicians are already assigned to another job during this time.
                  Check the conflict details below.
                </div>

                <Accordion className='mt-4'>
                  {filteredConflicts.map((worker, i) => (
                    <Accordion.Item eventKey={`${i}-${worker.workerId}`}>
                      <Accordion.Header className='text-danger'>
                        <ExclamationTriangleFill className='me-3' size={17} />
                        Conflict Details #{i + 1} - {worker.workerName} (#
                        {worker.workerId})
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
                            {worker.conflicts.map((conflict) => (
                              <tr>
                                <td>{conflict.jobId}</td>
                                <td>{conflict.jobDate}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </div>
            ),
          });

          return;
        }

        await runTransaction(db, async (transaction) => {
          try {
            //* create job header
            transaction.set(
              doc(db, 'jobHeaders', jobId),
              {
                ...jobHeaders,
                jobId,

                contact: jobHeaders?.contact ?? null,
                ...(!data && { createdAt: serverTimestamp(), createdBy: auth.currentUser }),
                updatedAt: serverTimestamp(),
                updatedBy: auth.currentUser,
              },
              { merge: true }
            );

            //* create job details
            // TODO: if implement returning per equipment
            // TODO: add isReturned field - means all equipments are returned to jobDetails
            // TODO: add isReturend field per equipment element - means equipment is returned
            transaction.set(
              doc(db, 'jobDetails', jobId),
              {
                jobId,
                isReturnedEquipment: false,
                equipments: equipments.map((equipment) => ({ jobId, ...equipment })),
                ...(!data && { createdAt: serverTimestamp(), createdBy: auth.currentUser }),
                updatedAt: serverTimestamp(),
                updatedBy: auth.currentUser,
              },
              { merge: true }
            );

            //* decrement equipment qty - means equipment is in use if create
            if (!data) {
              equipments.map((eq) =>
                transaction.update(doc(db, 'equipments', eq.id), { qty: increment(-1) })
              );
            } else {
              //* when edit find the differece between old and new equipments
              const oldEquipments = data.equipments.map((eq) => eq.id);
              const newEquipments = equipments.map((eq) => eq.id);

              const removedEquipments = oldEquipments.filter((eq) => !newEquipments.includes(eq));
              const addedEquipments = newEquipments.filter((eq) => !oldEquipments.includes(eq));

              //* update equipment qty
              removedEquipments.map((eq) =>
                transaction.update(doc(db, 'equipments', eq), { qty: increment(1) })
              );

              addedEquipments.map((eq) =>
                transaction.update(doc(db, 'equipments', eq), { qty: increment(-1) })
              );
            }
          } catch (error) {
            return error;
          }
        });

        router.push(`/jobs/edit-jobs/${jobId}`);
        toast.success(`Job ${data ? 'updated' : 'created'} successfully.`, {position: 'top-right'}); // prettier-ignore
        setIsLoading(false);
        setActiveKey((prev) => prev - 1);
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

  return (
    <>
      {/* <FormDebug form={form} /> */}

      <FormProvider {...form}>
        <Form>
          <Tabs
            id='job-tab'
            activeKey={activeKey > tabsLength ? tabsLength : activeKey}
            onSelect={handleOnSelect}
          >
            <Tab eventKey='0' title='Summary'>
              <JobSummaryForm data={data} isLoading={isLoading} handleNext={handleNext} />
            </Tab>

            <Tab eventKey='1' title='Job Task'>
              <TaskForm
                isLoading={isLoading}
                handleNext={handleNext}
                handlePrevious={handlePrevious}
              />
            </Tab>

            <Tab eventKey='2' title='Job Scheduling'>
              <JobSchedulingForm
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

export default JobForm;
