import { TooltipContent } from '@/components/common/ToolTipContent';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import { isProd } from '@/constants/environment';
import { db } from '@/firebase';
import { PRIORITY_LEVELS, SCOPE_TYPE } from '@/schema/job';
import { collection, documentId, limit, onSnapshot, query, where } from 'firebase/firestore';
import _, { orderBy } from 'lodash';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Col, Form, OverlayTrigger, Row, Spinner, Tooltip } from 'react-bootstrap';
import { Save } from 'react-bootstrap-icons';
import { Controller, useFormContext } from 'react-hook-form';
import Select from 'react-select';
import { toast } from 'react-toastify';

const JobSchedulingForm = ({ isLoading, handleNext, data }) => {
  const router = useRouter();

  const { startDate, startTime } = router.query;

  const form = useFormContext();
  const formErrors = form.formState.errors;

  const [workersOptions, setWorkersOptions] = useState({ data: [], isLoading: true, isError: false }); //prettier-ignore
  const [prioritiesOptions] = useState(PRIORITY_LEVELS.map((prority) => ({ value: prority, label: _.capitalize(prority) }))); //prettier-ignore
  const [scopesOptions] = useState(SCOPE_TYPE.map((scope) => ({ value: scope, label: _.capitalize(scope) }))); //prettier-ignore
  const [teamOptions] = useState([{ value: 'individual', label: 'Individual' }]);

  //* query workers
  useEffect(() => {
    const constraints = [orderBy('workerId', 'asc'), where('role', '==', 'Worker')];

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
                id: doc.id,
                name: data.fullName,
                value: doc.id,
                label: `${data.workerId} - ${data.fullName}`,
              };
            }),
            isLoading: false,
            isError: false,
          });
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

    const q = query(collection(db, 'jobHeaders'), orderBy(documentId(), 'desc'), limit(1));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const lastJob = { jobId: snapshot.docs[0].id, ...snapshot.docs[0].data() };
          const lastJobId = parseInt(lastJob.jobId, 10);

          form.setValue('jobId', (lastJobId + 1).toString().padStart(6, '0'));
        } else form.setValue('jobId', '000001');
      },
      (err) => {
        console.error(err.message);
        toast.error(err.message);
      }
    );

    return () => unsubscribe();
  }, [data]);

  const formatWorkerOptionLabel = (data) => {
    return <div className='text-capitalize'>{data.label}</div>;
  };

  const selectCustomStyles = {
    control: (base) => ({
      ...base,
      paddingTop: '6px',
      paddingBottom: '6px',
    }),
  };

  useEffect(() => {
    if (startDate) form.setValue('startDate', startDate);
    if (startTime) form.setValue('startTime', startTime);
  }, [startDate, startTime]);

  //* set default value
  useEffect(() => {
    form.setValue('team', teamOptions[0]);
  }, []);

  //* set job id if data exist
  useEffect(() => {
    if (data) form.setValue('jobId', data.id);
  }, [data]);

  //* set worker if data exist
  useEffect(() => {
    if (data && workersOptions.data.length > 0) {
      const worker = workersOptions.data.find((option) => option.value === data.worker.id);
      form.setValue('worker', worker);
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

  return (
    <>
      <Form>
        {/* <div className='mb-4'> {JSON.stringify(form.watch(), null, 2)}</div> */}

        <h5 className='mb-1'>Job</h5>
        <p className='text-muted'>Details about the job.</p>

        <Row className='mb-3'>
          <Form.Group as={Col} md='4'>
            <Form.Label>ID</Form.Label>
            <Form.Control required type='text' value={form.watch('jobId')} readOnly disabled />
          </Form.Group>

          <Form.Group as={Col} md='4'>
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
                    styles={selectCustomStyles}
                    inputId='priority'
                    instanceId='priority'
                    onChange={(option) => field.onChange(option)}
                    options={prioritiesOptions}
                    placeholder='Search by job priority level'
                    noOptionsMessage={() => 'No job priority levels found'}
                  />

                  {formErrors && formErrors.priority?.message && (
                    <Form.Text className='text-danger'>{formErrors.priority?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md='4'>
            <RequiredLabel label='Scope' id='scope' />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent title='Job Scope Search' info={["Search by job's scope type"]} />
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
                    styles={selectCustomStyles}
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
        </Row>

        <Row>
          <Form.Group as={Col} md='6'>
            <RequiredLabel label='Description' id='description' />

            <Controller
              name='description'
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control
                    {...field}
                    as='textarea'
                    rows={3}
                    placeholder='Enter job description'
                  />

                  {formErrors && formErrors.description?.message && (
                    <Form.Text className='text-danger'>{formErrors.description?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md='6'>
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
          </Form.Group>
        </Row>

        <hr className='my-4' />
        <h5 className='mb-1'>Schedule</h5>
        <p className='text-muted'>Details about the job schedule.</p>

        <Row className='mb-3'>
          <Form.Group as={Col} md='4'>
            <RequiredLabel label='Assigned Worker' id='worker' />
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent
                    title='Worker Search'
                    info={[
                      "Search by worker's id or name",
                      'Required to proceed with job creation',
                    ]}
                  />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='worker'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    styles={selectCustomStyles}
                    inputId='worker'
                    instanceId='worker'
                    onChange={(option) => field.onChange(option)}
                    formatOptionLabel={formatWorkerOptionLabel}
                    options={workersOptions.data}
                    placeholder={
                      workersOptions.isLoading
                        ? 'Loading workers...'
                        : "Search by worker's id or name"
                    }
                    isDisabled={workersOptions.isLoading}
                    noOptionsMessage={() =>
                      workersOptions.isLoading ? 'Loading...' : 'No workers found'
                    }
                  />

                  {formErrors && formErrors.worker?.message && (
                    <Form.Text className='text-danger'>{formErrors.worker?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md='4'>
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
          </Form.Group>
        </Row>

        <Row>
          <Form.Group as={Col} md='3'>
            <RequiredLabel label='Start Date' id='startDate' />

            <Controller
              name='startDate'
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control {...field} type='date' />

                  {formErrors && formErrors.startDate?.message && (
                    <Form.Text className='text-danger'>{formErrors.startDate?.message}</Form.Text>
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
                    <Form.Text className='text-danger'>{formErrors.startTime?.message}</Form.Text>
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
                  <Form.Control {...field} type='date' />

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

      <div className='d-flex justify-content-end align-items-center'>
        <Button type='button' className='mt-2' onClick={handleNext}>
          {isLoading ? (
            <>
              <Spinner
                as='span'
                animation='border'
                size='sm'
                role='status'
                aria-hidden='true'
                className='me-2'
              />
              {data ? 'Updating' : 'Creating'}...
            </>
          ) : (
            <>
              <Save size={14} className='me-2' />
              {data ? 'Update' : 'Create'} {' Job'}
            </>
          )}
        </Button>
      </div>
    </>
  );
};

export default JobSchedulingForm;
