import { TooltipContent } from '@/components/common/ToolTipContent';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import Select from '@/components/Form/Select';
import { isProd } from '@/constants/environment';
import { db } from '@/firebase';
import { PRIORITY_LEVELS, SCOPE_TYPE, STATUS } from '@/schema/job';
import { format } from 'date-fns';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import _ from 'lodash';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Col, Form, OverlayTrigger, Row, Spinner, Tooltip } from 'react-bootstrap';
import { Save } from 'react-bootstrap-icons';
import { Controller, useFormContext } from 'react-hook-form';

import { toast } from 'react-toastify';

const JobSchedulingForm = ({
  isLoading,
  handleNext,
  data,
  handlePrevious,
  toDuplicateJob,
  calibrations,
}) => {
  const router = useRouter();

  const { startDate, startTime, endDate, endTime, workerId } = router.query;

  const form = useFormContext();
  const formErrors = form.formState.errors;

  const [workersOptions, setWorkersOptions] = useState({ data: [], isLoading: true, isError: false }); //prettier-ignore
  const [prioritiesOptions] = useState(PRIORITY_LEVELS.map((prority) => ({ value: prority, label: _.capitalize(prority) }))); //prettier-ignore
  const [scopesOptions] = useState(SCOPE_TYPE.map((scope) => ({ value: scope, label: _.capitalize(scope) }))); //prettier-ignore
  const [statusesOptions] = useState(STATUS.map((status) => ({ value: status, label: _.capitalize(status) }))); //prettier-ignore
  const [teamOptions] = useState([{ value: 'individual', label: 'Individual' }]);

  //* query workers
  useEffect(() => {
    const constraints = [where('role', '==', 'technician')];

    if (!isProd) {
      const devQueryConstraint = [limit(10)];
      devQueryConstraint.forEach((constraint) => constraints.push(constraint));
    }

    const q = query(collection(db, 'users'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          setWorkersOptions({
            data: snapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                uid: doc.id,
                id: data.workerId,
                name: data.fullName,
                value: data.workerId,
                label: `${data.workerId} - ${data.fullName}`,
              };
            }),
            isLoading: false,
            isError: false,
          });
        } else {
          setWorkersOptions({ data: [], isLoading: false, isError: false });
        }
      },
      (err) => {
        console.error(err.message);
        setWorkersOptions({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  //* query & set last job id
  useEffect(() => {
    if (data) return;

    const q = query(collection(db, 'jobHeaders'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const id = snapshot.docs.pop().id.replace('J', '');
          const lastJobId = parseInt(id, 10);

          form.setValue('jobId', `J${(lastJobId + 1).toString().padStart(6, '0')}`);
        } else form.setValue('jobId', 'J000001');
      },
      (err) => {
        console.error(err.message);
        toast.error(err.message);
      }
    );

    return () => unsubscribe();
  }, [data]);

  const formatWorkerOptionLabel = (data) => {
    if (!data) return null;

    if (data?.length > 1) {
      return data.map((option) => option?.name || '');
    }

    return <div className='text-capitalize'>{data.label}</div>;
  };

  //* set startDate and startTime from router query
  useEffect(() => {
    if (startDate) form.setValue('startDate', startDate);
    if (startTime) form.setValue('startTime', startTime);
    if (endDate) form.setValue('endDate', endDate);
    if (endTime) form.setValue('endTime', endTime);
  }, [startDate, startTime, endDate, endTime]);

  //* set workerId from router query
  useEffect(() => {
    if (workerId && workersOptions.data.length > 0) {
      console.log({ workersOptions, workerId });
      form.setValue('workers', [workersOptions.data.find((w) => w.id === workerId)]);
    }
  }, [workerId, workersOptions]);

  //* set status value
  useEffect(() => {
    // form.setValue('team', teamOptions[0]);
    if (!data) form.setValue('status', statusesOptions[1]);
    else {
      const selectedStatus = statusesOptions.find((s) => s.value === data.status);
      form.setValue('status', selectedStatus);
    }
  }, [data]);

  //* set job id if data exist
  useEffect(() => {
    if (data) form.setValue('jobId', data.id);
  }, [data]);

  //* set worker if data exist
  useEffect(() => {
    if (data && workersOptions.data.length > 0) {
      const workers = workersOptions.data.filter((option) =>
        data?.workers?.some((worker) => worker?.id === option.value)
      );

      console.log({ workers });
      form.setValue('workers', workers);
    }
  }, [data, workersOptions]);

  //* set job priority if data exist
  useEffect(() => {
    if (data && prioritiesOptions.length > 0) {
      const priority = prioritiesOptions.find((option) => option.value === data.priority);
      form.setValue('priority', priority);
    }
  }, [data, prioritiesOptions]);

  //* set job scope if data exist
  useEffect(() => {
    if (data && scopesOptions.length > 0) {
      const scope = scopesOptions.find((option) => option.value === data.scope);
      form.setValue('scope', scope);
    }
  }, [data, scopesOptions]);

  //* set data if toDuplicateJob exists
  useEffect(() => {
    if (toDuplicateJob) {
      //* set workers
      if (workersOptions.data.length > 0) {
        const workers = workersOptions.data.filter((option) =>
          toDuplicateJob?.workers?.some((worker) => worker?.id === option.value)
        );

        form.setValue('workers', workers);
      }

      //* set priority
      if (prioritiesOptions.length > 0) {
        const priority = prioritiesOptions.find(
          (option) => option.value === toDuplicateJob.priority
        );
        form.setValue('priority', priority);
      }

      //* set scope
      if (scopesOptions.length > 0) {
        const scope = scopesOptions.find((option) => option.value === toDuplicateJob.scope);
        form.setValue('scope', scope);
      }

      //* set status
      if (statusesOptions.length > 0) {
        form.setValue('status', statusesOptions[1]);
      }

      //* set description
      form.setValue('description', toDuplicateJob.description);
    }
  }, [toDuplicateJob, workersOptions, statusesOptions, prioritiesOptions, scopesOptions]);

  return (
    <>
      <Card className='shadow-none'>
        <Card.Body className='pb-0'>
          <Form>
            <h4 className='mb-0'>Job</h4>
            <p className='text-muted fs-6'>Details about the job.</p>

            <Row className='mb-3 row-gap-3'>
              <Form.Group as={Col} md={6}>
                <Form.Label>ID</Form.Label>
                <Form.Control required type='text' value={form.watch('jobId')} readOnly disabled />
              </Form.Group>

              <Form.Group as={Col} md={6}>
                <RequiredLabel label='Assigned Technician' id='workers' />
                <OverlayTrigger
                  placement='right'
                  overlay={
                    <Tooltip>
                      <TooltipContent
                        title='Technician Search'
                        info={[
                          "Search by technician's id or name",
                          'Select at one or more technician',
                          'Required to proceed with job creation',
                        ]}
                      />
                    </Tooltip>
                  }
                >
                  <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
                </OverlayTrigger>

                <Controller
                  name='workers'
                  control={form.control}
                  render={({ field }) => (
                    <>
                      <Select
                        {...field}
                        id='workers'
                        inputId='workers'
                        instanceId='workers'
                        isMulti
                        onChange={(option) => field.onChange(option)}
                        formatOptionLabel={formatWorkerOptionLabel}
                        options={workersOptions.data}
                        placeholder={
                          workersOptions.isLoading
                            ? 'Loading technician...'
                            : "Search by technician's id or name"
                        }
                        isDisabled={workersOptions.isLoading}
                        noOptionsMessage={() =>
                          workersOptions.isLoading ? 'Loading...' : 'No technician found'
                        }
                      />

                      {formErrors && formErrors.workers?.message && (
                        <Form.Text className='text-danger'>{formErrors.workers?.message}</Form.Text>
                      )}
                    </>
                  )}
                />
              </Form.Group>

              <Form.Group as={Col} md={4}>
                <RequiredLabel label='Priority' id='priority' />
                <OverlayTrigger
                  placement='right'
                  overlay={
                    <Tooltip>
                      <TooltipContent
                        title='Job Priority Level Search'
                        info={['Search by priority level']}
                      />
                    </Tooltip>
                  }
                >
                  <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
                </OverlayTrigger>

                <Controller
                  name='priority'
                  control={form.control}
                  render={({ field }) => (
                    <>
                      <Select
                        {...field}
                        inputId='priority'
                        instanceId='priority'
                        onChange={(option) => field.onChange(option)}
                        options={prioritiesOptions}
                        placeholder='Search by job priority level'
                        noOptionsMessage={() => 'No job priority levels found'}
                      />

                      {formErrors && formErrors.priority?.message && (
                        <Form.Text className='text-danger'>
                          {formErrors.priority?.message}
                        </Form.Text>
                      )}
                    </>
                  )}
                />
              </Form.Group>

              <Form.Group as={Col} md={4}>
                <RequiredLabel label='Scope' id='scope' />
                <OverlayTrigger
                  placement='right'
                  overlay={
                    <Tooltip>
                      <TooltipContent
                        title='Job Scope Search'
                        info={["Search by job's scope type"]}
                      />
                    </Tooltip>
                  }
                >
                  <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
                </OverlayTrigger>

                <Controller
                  name='scope'
                  control={form.control}
                  render={({ field }) => (
                    <>
                      <Select
                        {...field}
                        inputId='scope'
                        instanceId='scope'
                        onChange={(option) => field.onChange(option)}
                        options={scopesOptions}
                        placeholder='Search by job scope type'
                        noOptionsMessage={() => 'No job scopes found'}
                      />

                      {formErrors && formErrors.scope?.message && (
                        <Form.Text className='text-danger'>{formErrors.scope?.message}</Form.Text>
                      )}
                    </>
                  )}
                />
              </Form.Group>

              <Form.Group as={Col} md={4}>
                <RequiredLabel label='Status' id='status' />
                <OverlayTrigger
                  placement='right'
                  overlay={
                    <Tooltip>
                      <TooltipContent
                        title='Job Status Search'
                        info={["Search by job's status type"]}
                      />
                    </Tooltip>
                  }
                >
                  <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
                </OverlayTrigger>

                <Controller
                  name='status'
                  control={form.control}
                  render={({ field }) => (
                    <>
                      <Select
                        {...field}
                        isDisabled
                        inputId='status'
                        instanceId='status'
                        onChange={(option) => field.onChange(option)}
                        options={statusesOptions}
                        placeholder='Search by job status type'
                        noOptionsMessage={() => 'No job status found'}
                      />

                      {formErrors && formErrors.status?.message && (
                        <Form.Text className='text-danger'>{formErrors.status?.message}</Form.Text>
                      )}
                    </>
                  )}
                />
              </Form.Group>
            </Row>

            <Row>
              <Form.Group as={Col} md={12}>
                <Form.Label htmlFor='description'>Description</Form.Label>

                <Controller
                  name='description'
                  control={form.control}
                  render={({ field }) => (
                    <>
                      <Form.Control
                        {...field}
                        as='textarea'
                        rows={1}
                        placeholder='Enter job description'
                      />

                      {formErrors && formErrors.description?.message && (
                        <Form.Text className='text-danger'>
                          {formErrors.description?.message}
                        </Form.Text>
                      )}
                    </>
                  )}
                />
              </Form.Group>

              {/* <Form.Group as={Col} md='6'>
            <Form.Label>Remarsk/Note</Form.Label>

            <Controller
              name='remarks'
              control={form.control}
              render={({ field }) => (
                <Form.Control
                  {...field}
                  as='textarea'
                  rows={3}
                  placeholder='Enter job remarks/notes'
                />
              )}
            />
          </Form.Group> */}
            </Row>

            <hr className='my-4' />
            <h4 className='mb-0'>Schedule</h4>
            <p className='text-muted fs-6'>Details about the job schedule.</p>

            <Row className='mb-3'>
              {/* <Form.Group as={Col} md='4'>
            <Form.Label>Team</Form.Label>

            <Controller
              name='team'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    value={teamOptions[0]}
                    styles={selectCustomStyles}
                    inputId='team'
                    instanceId='team'
                    onChange={(option) => field.onChange(option)}
                    options={teamOptions}
                    placeholder='Search by team'
                    noOptionsMessage={() => 'No team found'}
                    disabled
                  />

                  {formErrors && formErrors.team?.message && (
                    <Form.Text className='text-danger'>{formErrors.team?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group> */}
            </Row>

            <Row>
              <Form.Group as={Col} md='3'>
                <RequiredLabel label='Start Date' id='startDate' />

                <Controller
                  name='startDate'
                  control={form.control}
                  render={({ field }) => (
                    <>
                      <Form.Control {...field} type='date' min={format(new Date(), 'yyyy-MM-dd')} />

                      {formErrors && formErrors.startDate?.message && (
                        <Form.Text className='text-danger'>
                          {formErrors.startDate?.message}
                        </Form.Text>
                      )}
                    </>
                  )}
                />
              </Form.Group>

              <Form.Group as={Col} md='3'>
                <RequiredLabel label='Start Time' id='startTime' />

                <Controller
                  name='startTime'
                  control={form.control}
                  render={({ field }) => (
                    <>
                      <Form.Control {...field} type='time' />

                      {formErrors && formErrors.startTime?.message && (
                        <Form.Text className='text-danger'>
                          {formErrors.startTime?.message}
                        </Form.Text>
                      )}
                    </>
                  )}
                />
              </Form.Group>

              <Form.Group as={Col} md='3'>
                <RequiredLabel label='End Date' id='endDate' />

                <Controller
                  name='endDate'
                  control={form.control}
                  render={({ field }) => (
                    <>
                      <Form.Control {...field} type='date' min={format(new Date(), 'yyyy-MM-dd')} />

                      {formErrors && formErrors.endDate?.message && (
                        <Form.Text className='text-danger'>{formErrors.endDate?.message}</Form.Text>
                      )}
                    </>
                  )}
                />
              </Form.Group>

              <Form.Group as={Col} md='3'>
                <RequiredLabel label='End Time' id='endTime' />

                <Controller
                  name='endTime'
                  control={form.control}
                  render={({ field }) => (
                    <>
                      <Form.Control {...field} type='time' />

                      {formErrors && formErrors.endTime?.message && (
                        <Form.Text className='text-danger'>{formErrors.endTime?.message}</Form.Text>
                      )}
                    </>
                  )}
                />
              </Form.Group>
            </Row>
          </Form>

          <div className='mt-4 d-flex justify-content-between align-items-center'>
            <Button
              disabled={isLoading}
              type='button'
              variant='outline-primary'
              onClick={handlePrevious}
            >
              Previous
            </Button>

            <Button disabled={isLoading} type='button' onClick={handleNext}>
              Next
            </Button>
          </div>
        </Card.Body>
      </Card>
    </>
  );
};

export default JobSchedulingForm;
