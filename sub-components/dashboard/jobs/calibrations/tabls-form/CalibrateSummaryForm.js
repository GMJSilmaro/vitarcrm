import { TooltipContent } from '@/components/common/ToolTipContent';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import Select from '@/components/Form/Select';
import { db } from '@/firebase';
import { CALIBRATED_AT, CATEGORY, DUE_DATE_REQUESTED } from '@/schema/calibration';
import { add, format } from 'date-fns';
import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import _ from 'lodash';
import { useRouter } from 'next/router';
import React, { use, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, FormLabel, OverlayTrigger, Row, Tooltip } from 'react-bootstrap';
import { Controller, useFormContext } from 'react-hook-form';

const CalibrateSummaryForm = ({ job, data, isLoading, handleNext }) => {
  const router = useRouter();

  const [location, setLocation] = useState({ data: undefined, isLoading: true, isError: false });
  const [customer, setCustomer] = useState({ data: undefined, isLoading: true, isError: false });

  const [customerEquipmentsOptions, setCustomerEquipmentsOptions] = useState({ data: [], isLoading: false, isError: false }); //prettier-ignore
  const [usersOptions, setUsersOptions] = useState({ data: [], isLoading: true, isError: false });
  const [calibratedByOptions, setCalibratedByOptions] = useState([]);

  const [categoryOptions] = useState(CATEGORY.map((category) => ({ value: category, label: _.capitalize(category) }))); //prettier-ignore
  const [dueDateRequestedOptions] = useState(DUE_DATE_REQUESTED.map((dueDateRequested) => ({ value: dueDateRequested, label: _.capitalize(dueDateRequested) }))); //prettier-ignore

  const form = useFormContext();
  const formErrors = form.formState.errors;

  const handleDueDateRequestedChange = (option, field) => {
    field.onChange(option);
    form.clearErrors('dueDateDuration');
    form.clearErrors('dueDate');

    if (option.value === 'no') {
      //* clear the fields
      form.setValue('dueDateDuration', '');
      form.setValue('dueDate', '');

      //* delay to set null value
      setTimeout(() => {
        form.setValue('dueDateDuration', null);
        form.setValue('dueDate', 'N/A');
      }, 100);
    }
  };

  const handleGetLocationValue = useCallback(() => {
    if (location.isLoading && !location.isError) 'Loading...';

    if (location.data) {
      const locationData = location.data;
      let value = locationData.siteName || 'N/A';

      if (locationData?.addresses && locationData?.addresses?.length > 0) {
        const defaultAddress = locationData.addresses.find((address) => address.isDefault);

        if (defaultAddress) {
          if (defaultAddress?.street1) value += ` ${defaultAddress.street1}`;
          else if (defaultAddress?.street2) value += ` ${defaultAddress.street2}`;
          else if (defaultAddress?.street3) value += ` ${defaultAddress.street3}`;

          if (defaultAddress?.city) value += ` ${defaultAddress.city}`;
          if (defaultAddress?.province) value += ` ${defaultAddress.province}`;
          if (defaultAddress?.postalCode) value += ` ${defaultAddress.postalCode}`;
          if (defaultAddress?.country) value += ` ${defaultAddress.country}`;
        }
      }

      return value;
    }

    return 'N/A';
  }, [location]);

  const handleCalibratedByValue = useCallback(() => {
    if (job.isLoading && !job.isError) return 'Loading...';

    if (job.data) {
      const workers = job?.data?.workers || [];

      return workers.map((worker) => worker?.name || '').join(', ');
    }

    return '';
  }, [job]);

  //* query location
  useEffect(() => {
    if (!job.data) return;

    const jobLocationRef = doc(db, 'locations', job.data.location.id);

    getDoc(jobLocationRef)
      .then((doc) => {
        if (doc.exists()) {
          const locationData = doc.data();

          setLocation({
            data: { id: doc.id, ...locationData },
            isLoading: false,
            isError: false,
          });

          form.setValue('location', { id: doc.id, name: locationData.siteName });
          return;
        }

        setLocation({ data: null, isLoading: false, isError: false });
      })
      .catch((err) => {
        console.error(err.message);
        setLocation({ data: null, isLoading: false, isError: true });
      });
  }, [job.data]);

  //* query customer & customer equipments
  useEffect(() => {
    if (!job.data) return;

    const customerRef = doc(db, 'customers', job.data.customer.id);

    getDoc(customerRef)
      .then((customerSnapshot) => {
        if (customerSnapshot.exists()) {
          const customerData = customerSnapshot.data();

          setCustomer({
            data: { id: customerSnapshot.id, ...customerData },
            isLoading: false,
            isError: false,
          });

          form.setValue('submittedBy', {
            id: customerSnapshot.id,
            name: customerData.customerName,
          });

          return;
        }

        setCustomer({ data: null, isLoading: false, isError: false });
      })
      .catch((err) => {
        console.error(err.message);
        setCustomer({ data: null, isLoading: false, isError: true });
      });
  }, [job.data]);

  //* query users
  useEffect(() => {
    const q = query(collection(db, 'users'));

    getDocs(q)
      .then((snapshot) => {
        if (!snapshot.empty) {
          const userData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

          setUsersOptions({
            data: userData.map((user) => ({
              id: user.id,
              name: user.fullName,
              value: user.id,
              label: user.fullName,
            })),
            isLoading: false,
            isError: false,
          });
        }
      })
      .catch((err) => {
        console.error(err.message);
        setUsersOptions({ data: [], isLoading: false, isError: true });
      });
  }, []);

  //* query last calibrate id
  useEffect(() => {
    if (data) return;

    const q = query(collection(db, 'jobCalibrations'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const id = snapshot.docs.pop().id.replace('CA', '');
          const lastCalibrateId = parseInt(id, 10);

          form.setValue('calibrateId', `CA${(lastCalibrateId + 1).toString().padStart(6, '0')}`);
        } else form.setValue('calibrateId', 'CA000001');
      },
      (err) => {
        console.error(err.message);
        toast.error(err.message);
      }
    );

    return () => unsubscribe();
  }, [data]);

  //* query last certificate no.
  useEffect(() => {
    const category = !form.getValues('category') ? null : form.getValues('category').value;

    if (data || !category | job.data) return;

    const q = query(collection(db, 'jobCertificates'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const date = new Date();
        const categoryInitial = category?.split(' ')[0]?.charAt(0)?.toUpperCase() || '';
        const scopeInitial = job.data.scope?.charAt(0)?.toUpperCase() || '';

        const calibrationIdPrefix = `ST${categoryInitial}${format(date, 'yyMM')}-${scopeInitial}`;

        if (!snapshot.empty) {
          const id = snapshot.docs.pop().id.split('-')[1].replace('S', '');
          const lastCertificateNumber = parseInt(id, 10);

          form.setValue('certificateNumber',  `${calibrationIdPrefix}${(lastCertificateNumber + 1).toString().padStart(6, '0')}`); //prettier-ignore
        } else form.setValue('certificateNumber', `${calibrationIdPrefix}000001`);
      },
      (err) => {
        console.error(err.message);
        toast.error(err.message);
      }
    );

    return () => unsubscribe();
  }, [job, data, form.watch('category')]);

  //* logger user Effect
  useEffect(() => {
    console.log({ job, customer, customerEquipmentsOptions });
  }, [job.data, customer, customerEquipmentsOptions]);

  //* set calibrated by options
  useEffect(() => {
    if (usersOptions.data.length > 0) {
      const assignedWorkers = job?.data?.workers || [];
      const assignedWorkerIds = assignedWorkers.map((worker) => worker?.id || '');
      setCalibratedByOptions(
        usersOptions.data.filter((user) => assignedWorkerIds?.includes(user.id))
      );
    }
  }, [usersOptions, job.data]);

  //* set category, if data exist
  useEffect(() => {
    if (data && categoryOptions.length > 0) {
      const category = categoryOptions.find((option) => option.value === data.category);
      form.setValue('category', category);
    }
  }, [data, categoryOptions]);

  //* set approved signatory, if data exist
  useEffect(() => {
    console.log({ calibratedByOptions });
    if (data && usersOptions.data.length > 0) {
      const signatory = usersOptions.data.find((option) => option.id === data.approvedSignatory.id);
      form.setValue('approvedSignatory', signatory);
    }
  }, [data, usersOptions]);

  //* set calibrated by, if data exist
  useEffect(() => {
    if (data && calibratedByOptions.length > 0) {
      const calibratedBy = calibratedByOptions.find((option) => option.id === data.calibratedBy.id);
      form.setValue('calibratedBy', calibratedBy);
    }
  }, [data, calibratedByOptions]);

  //* set customer equipment, if data exist
  useEffect(() => {
    if (data && customerEquipmentsOptions.data.length > 0) {
      const selectedEquipment = customerEquipmentsOptions.data.find(
        (option) => option.id === data.description.id
      );
      form.setValue('description', selectedEquipment);
    }
  }, [data, customerEquipmentsOptions]);

  //* set due date request, if data exist
  useEffect(() => {
    if (data && dueDateRequestedOptions?.length > 0) {
      const selectedDueDateRequested = dueDateRequestedOptions.find(
        (option) => option.value === data.dueDateRequested
      );
      form.setValue('dueDate', data.dueDate);
      form.setValue('dueDateRequested', selectedDueDateRequested);
    }
  }, [data, dueDateRequestedOptions]);

  //* set customer equipments, filtered out based on selected category
  useEffect(() => {
    if (!job || job?.data?.customerEquipments?.length < 1) return;
    if (!form.getValues('category.value')) return;

    const selectedCategory = form.getValues('category.value')?.toLowerCase();
    const filteredCustomerEquipments = job?.data?.customerEquipments?.filter((eq) => {
      return eq.category?.toLowerCase() === selectedCategory;
    });

    setCustomerEquipmentsOptions({
      data:
        filteredCustomerEquipments?.length > 0
          ? filteredCustomerEquipments.map((equipment) => ({
              value: equipment.id,
              label: equipment.description,
              ...equipment,
            }))
          : [],
      isLoading: false,
      isError: false,
    });

    form.setValue('description', '');
  }, [job, form.watch('category.value')]);

  //* set default value for due due date requested, date duration,
  useEffect(() => {
    if (!data && dueDateRequestedOptions.length > 0) {
      console.log('trigeer 1');
      //* set default value to "no"
      form.setValue('dueDateRequested', dueDateRequestedOptions[1]);

      setTimeout(() => {
        form.setValue('dueDate', 'N/A');
        form.setValue('dueDateDuration', null);
      }, 100);
    }
  }, [data, dueDateRequestedOptions]);

  //* set due date based on no. of months in Due Date Duration and date calibrated
  useEffect(() => {
    const dueDateDuration = form.getValues('dueDateDuration');
    const dateCalibrated = form.getValues('dateCalibrated');
    const dueDateRequested = form.getValues('dueDateRequested');

    const value = isNaN(parseInt(dueDateDuration)) ? 1 : parseInt(dueDateDuration);

    if (dueDateRequested?.value === 'yes') {
      if (dueDateDuration && dateCalibrated && value >= 1 && value <= 999) {
        const dueDate = add(new Date(dateCalibrated), {
          months: value,
        });

        form.setValue('dueDate', format(dueDate, 'yyyy-MM-dd'));
      } else form.setValue('dueDate', 'N/A');
    }
  }, [form.watch('dueDateDuration'), form.watch('dateCalibrated'), form.watch('dueDateRequested')]);

  const make = useMemo(() => {
    return form.getValues('description.make') || '';
  }, [JSON.stringify(form.watch('description'))]);

  const model = useMemo(() => {
    return form.getValues('description.model') || '';
  }, [JSON.stringify(form.watch('description'))]);

  const serialNumber = useMemo(() => {
    return form.getValues('description.serialNumber') || '';
  }, [JSON.stringify(form.watch('description'))]);

  return (
    <>
      <Card className='shadow-none'>
        <Card.Body>
          <h4 className='mb-0'>Job</h4>
          <p className='text-muted fs-6'>Details about the job.</p>

          <Row className='mb-3 row-gap-3'>
            <Form.Group as={Col} md={3}>
              <Form.Label>Job ID</Form.Label>
              <Form.Control
                type='text'
                value={job.isLoading && !job.isError ? 'Loading...' : job?.data?.id || ''}
                readOnly
                disabled
              />
            </Form.Group>

            <Form.Group as={Col} md={9}>
              <Form.Label>Customer</Form.Label>
              <Form.Control
                type='text'
                value={
                  job.isLoading && !job.isError ? 'Loading...' : job?.data?.customer?.name || ''
                }
                readOnly
                disabled
              />
            </Form.Group>

            <Form.Group as={Col} md={12}>
              <Form.Label>Location</Form.Label>
              <Form.Control type='text' value={handleGetLocationValue()} readOnly disabled />
            </Form.Group>
          </Row>

          <hr className='my-4' />
          <h4 className='mb-0'>Calibration Info</h4>
          <p className='text-muted fs-6'>Details about the calibration.</p>

          <Row className='mb-3 row-gap-3'>
            <Form.Group as={Col} md={4}>
              <Form.Label>Calibrate ID</Form.Label>
              <Form.Control type='text' value={form.watch('calibrateId')} readOnly disabled />
            </Form.Group>

            <Form.Group as={Col} md={4}>
              <RequiredLabel label='Category' id='category' />
              <OverlayTrigger
                placement='right'
                overlay={
                  <Tooltip>
                    <TooltipContent
                      title='Calibration Category Search'
                      info={['Search by category']}
                    />
                  </Tooltip>
                }
              >
                <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
              </OverlayTrigger>

              <Controller
                name='category'
                control={form.control}
                render={({ field }) => (
                  <>
                    <Select
                      {...field}
                      inputId='category'
                      instanceId='category'
                      onChange={(option) => field.onChange(option)}
                      options={categoryOptions}
                      placeholder='Search by calibration category'
                      noOptionsMessage={() => 'No calibration category found'}
                    />

                    {formErrors && formErrors.category?.message && (
                      <Form.Text className='text-danger'>{formErrors.category?.message}</Form.Text>
                    )}
                  </>
                )}
              />
            </Form.Group>

            <Form.Group as={Col} md={4}>
              <Form.Label>Certificate No.</Form.Label>
              <Form.Control type='text' value={form.watch('certificateNumber')} readOnly disabled />
            </Form.Group>

            <Form.Group as={Col} md={6}>
              <Form.Label>Submitted By</Form.Label>
              <Form.Control
                type='text'
                value={
                  job.isLoading && !job.isError ? 'Loading...' : job?.data?.customer?.name || ''
                }
                readOnly
                disabled
              />
            </Form.Group>

            <Form.Group as={Col} md={6}>
              <RequiredLabel label='Approved Signatory' id='approvedSignatory' />
              <OverlayTrigger
                placement='right'
                overlay={
                  <Tooltip>
                    <TooltipContent
                      title='User search Search'
                      info={[
                        "Search by user's name",
                        'Required to proceed with calibration creation',
                      ]}
                    />
                  </Tooltip>
                }
              >
                <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
              </OverlayTrigger>

              <Controller
                name='approvedSignatory'
                control={form.control}
                render={({ field }) => (
                  <>
                    <Select
                      {...field}
                      inputId='approvedSignatory'
                      instanceId='approvedSignatory'
                      onChange={(option) => field.onChange(option)}
                      options={usersOptions.data}
                      placeholder={
                        usersOptions.isLoading ? 'Loading users...' : "Search by user's name"
                      }
                      isDisabled={usersOptions.isLoading}
                      noOptionsMessage={() =>
                        usersOptions.isLoading ? 'Loading...' : 'No user found'
                      }
                    />

                    {formErrors && formErrors.approvedSignatory?.message && (
                      <Form.Text className='text-danger'>
                        {formErrors.approvedSignatory?.message}
                      </Form.Text>
                    )}
                  </>
                )}
              />
            </Form.Group>

            <Form.Group as={Col} md={6}>
              <Form.Label>Calibrated At</Form.Label>
              <Form.Control
                type='text'
                value={
                  job.isLoading && !job.isError
                    ? 'Loading...'
                    : job?.data?.scope
                    ? _.capitalize(job?.data?.scope)
                    : ''
                }
                readOnly
                disabled
              />
            </Form.Group>

            <Form.Group as={Col} md={6}>
              <RequiredLabel label='Calibrated By' id='calibratedBy' />
              <OverlayTrigger
                placement='right'
                overlay={
                  <Tooltip>
                    <TooltipContent
                      title='Assigned Workers Search'
                      info={[
                        "Search by assigned worker's name",
                        'Required to proceed with calibration creation',
                      ]}
                    />
                  </Tooltip>
                }
              >
                <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
              </OverlayTrigger>

              <Controller
                name='calibratedBy'
                control={form.control}
                render={({ field }) => (
                  <>
                    <Select
                      {...field}
                      inputId='calibratedBy'
                      instanceId='calibratedBy'
                      onChange={(option) => field.onChange(option)}
                      options={calibratedByOptions}
                      placeholder={
                        usersOptions.isLoading
                          ? 'Loading assigned workers...'
                          : "Search by assigned worker's name"
                      }
                      isDisabled={usersOptions.isLoading}
                      noOptionsMessage={() =>
                        usersOptions.isLoading ? 'Loading...' : 'No assigned worker found'
                      }
                    />

                    {formErrors && formErrors.calibratedBy?.message && (
                      <Form.Text className='text-danger'>
                        {formErrors.calibratedBy?.message}
                      </Form.Text>
                    )}
                  </>
                )}
              />
            </Form.Group>
          </Row>

          <hr className='my-4' />
          <h4 className='mb-0'>Equipment to Calibrate</h4>
          <p className='text-muted fs-6'>Details about the customer's equipment to calibrate.</p>

          <Row className='mb-3 row-gap-3'>
            <Form.Group as={Col} md={3}>
              <RequiredLabel label='Description' id='description' />
              <OverlayTrigger
                placement='right'
                overlay={
                  <Tooltip>
                    <TooltipContent
                      title='Customer Equipments Search'
                      info={[
                        "Search by customer equipment's name",
                        'Required to proceed with calibration creation',
                      ]}
                    />
                  </Tooltip>
                }
              >
                <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
              </OverlayTrigger>

              <Controller
                name='description'
                control={form.control}
                render={({ field }) => (
                  <>
                    <Select
                      {...field}
                      inputId='description'
                      instanceId='description'
                      onChange={(option) => field.onChange(option)}
                      options={customerEquipmentsOptions.data}
                      placeholder={
                        customerEquipmentsOptions.isLoading
                          ? 'Loading equipments...'
                          : "Search by customer equipment's name"
                      }
                      isDisabled={
                        customerEquipmentsOptions.isLoading || !form.watch('category.value')
                      }
                      noOptionsMessage={() =>
                        customerEquipmentsOptions.isLoading
                          ? 'Loading...'
                          : 'No customer equipments found'
                      }
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

            <Form.Group as={Col} md={3}>
              <Form.Label htmlFor='make'>Make</Form.Label>
              <Form.Control id='make' type='text' value={make} readOnly disabled />
            </Form.Group>

            <Form.Group as={Col} md={3}>
              <Form.Label htmlFor='model'>Model</Form.Label>
              <Form.Control id='model' type='text' value={model} readOnly disabled />
            </Form.Group>

            <Form.Group as={Col} md={3}>
              <Form.Label htmlFor='serialNumber'>Serial No</Form.Label>
              <Form.Control id='serialNumber' type='text' value={serialNumber} readOnly disabled />
            </Form.Group>
          </Row>

          <hr className='my-4' />
          <h4 className='mb-0'>Date Tracking</h4>
          <p className='text-muted fs-6'>Date details related to the calibration.</p>

          <Row className='mb-3 row-gap-3'>
            {/* <Form.Group as={Col} md={4}>
              <RequiredLabel label='Date Issued' id='dateIssued' />

              <Controller
                name='dateIssued'
                control={form.control}
                render={({ field }) => (
                  <>
                    <Form.Control id='dateIssued' {...field} type='date' />

                    {formErrors && formErrors.dateIssued?.message && (
                      <Form.Text className='text-danger'>
                        {formErrors.dateIssued?.message}
                      </Form.Text>
                    )}
                  </>
                )}
              />
            </Form.Group> */}

            <Form.Group as={Col} md={6}>
              <RequiredLabel label='Date Received' id='dateReceived' />

              <Controller
                name='dateReceived'
                control={form.control}
                render={({ field }) => (
                  <>
                    <Form.Control {...field} id='dateReceived' type='date' />

                    {formErrors && formErrors.dateReceived?.message && (
                      <Form.Text className='text-danger'>
                        {formErrors.dateReceived?.message}
                      </Form.Text>
                    )}
                  </>
                )}
              />
            </Form.Group>

            <Form.Group as={Col} md={6}>
              <RequiredLabel label='Date Calibrated' id='dateCalibrated' />

              <Controller
                name='dateCalibrated'
                control={form.control}
                render={({ field }) => (
                  <>
                    <Form.Control {...field} id='dateCalibrated' type='date' />

                    {formErrors && formErrors.dateCalibrated?.message && (
                      <Form.Text className='text-danger'>
                        {formErrors.dateCalibrated?.message}
                      </Form.Text>
                    )}
                  </>
                )}
              />
            </Form.Group>

            <Form.Group as={Col} md={4}>
              <RequiredLabel label='Due Date Requested' id='dueDateRequested' />

              <Controller
                name='dueDateRequested'
                control={form.control}
                render={({ field }) => (
                  <>
                    <Select
                      {...field}
                      inputId='dueDateRequested'
                      instanceId='dueDateRequested'
                      onChange={(option) => handleDueDateRequestedChange(option, field)}
                      options={dueDateRequestedOptions}
                      placeholder='Select due date requested'
                      noOptionsMessage={() => 'No options found'}
                    />

                    {formErrors && formErrors.dueDateRequested?.message && (
                      <Form.Text className='text-danger'>
                        {formErrors.dueDateRequested?.message}
                      </Form.Text>
                    )}
                  </>
                )}
              />
            </Form.Group>

            <Form.Group as={Col} md={4}>
              <Form.Label htmlFor='dueDateDuration'>Due Date Duration (No. of Months)</Form.Label>

              <Controller
                name='dueDateDuration'
                control={form.control}
                render={({ field }) => (
                  <>
                    <Form.Control
                      {...field}
                      disabled={
                        !form.watch('dueDateRequested') ||
                        form.watch('dueDateRequested.value') === 'no' ||
                        !form.watch('dateCalibrated')
                      }
                      id='dueDateDuration'
                      type='number'
                      min='1'
                      onKeyDown={(e) => e.key === '.' && e.preventDefault()}
                      placeholder='Enter due date duration'
                    />

                    {formErrors && formErrors.dueDateDuration?.message && (
                      <Form.Text className='text-danger'>
                        {formErrors.dueDateDuration?.message}
                      </Form.Text>
                    )}
                  </>
                )}
              />
            </Form.Group>

            <Form.Group as={Col} md={4}>
              <Form.Label htmlFor='dueDate'>Due Date</Form.Label>

              <Controller
                name='dueDate'
                control={form.control}
                render={({ field }) => (
                  <>
                    {!form.watch('dueDateRequested') ||
                    form.watch('dueDateRequested.value') === 'no' ? (
                      <Form.Control {...field} id='dueDate' type='text' />
                    ) : (
                      <Form.Control {...field} disabled id='dueDate' type='date' />
                    )}

                    {formErrors && formErrors.dueDate?.message && (
                      <Form.Text className='text-danger'>{formErrors.dueDate?.message}</Form.Text>
                    )}
                  </>
                )}
              />
            </Form.Group>
          </Row>

          <div className='mt-4 d-flex justify-content-between align-items-center'>
            <Button
              disabled={isLoading}
              type='button'
              variant='outline-danger'
              onClick={() => router.push('/jobs')}
            >
              Cancel
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

export default CalibrateSummaryForm;
