import { TooltipContent } from '@/components/common/ToolTipContent';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import Select from '@/components/Form/Select';
import { db } from '@/firebase';
import { CALIBRATED_AT, CATEGORY, DUE_DATE_REQUESTED } from '@/schema/calibration';
import { format } from 'date-fns';
import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import _, { add } from 'lodash';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useState } from 'react';
import { Button, Card, Col, Form, FormLabel, OverlayTrigger, Row, Tooltip } from 'react-bootstrap';
import { Controller, useFormContext } from 'react-hook-form';

const CalibrateInfoForm = ({ job, data, isLoading, handleNext }) => {
  const router = useRouter();

  const [location, setLocation] = useState({ data: undefined, isLoading: true, isError: false });
  const [customer, setCustomer] = useState({ data: undefined, isLoading: true, isError: false });

  const [customerEquipmentsOptions, setCustomerEquipmentsOptions] = useState({ data: [], isLoading: true, isError: false }); //prettier-ignore
  const [usersOptions, setUsersOptions] = useState({ data: [], isLoading: true, isError: false });

  const [categoryOptions] = useState(CATEGORY.map((category) => ({ value: category, label: _.capitalize(category) }))); //prettier-ignore
  const [calibratedAtOptions] = useState(CALIBRATED_AT.map((calibratedAt) => ({ value: calibratedAt, label: _.capitalize(calibratedAt) }))); //prettier-ignore
  const [dueDateRequestedOptions] = useState(DUE_DATE_REQUESTED.map((dueDateRequested) => ({ value: dueDateRequested, label: _.capitalize(dueDateRequested) }))); //prettier-ignore

  const form = useFormContext();
  const formErrors = form.formState.errors;

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
    const customerEquipmentsRef = query(
      collection(db, 'customerEquipments'),
      where('customerId', '==', job.data.customer.id)
    );

    Promise.all([getDoc(customerRef), getDocs(customerEquipmentsRef)])
      .then(([customerSnapshot, customerEquipmentsSnaphot]) => {
        if (customerSnapshot.exists()) {
          const customerData = customerSnapshot.data();
          const equipments = !customerEquipmentsSnaphot.empty ? customerEquipmentsSnaphot.docs.map(doc => ({ id: doc.id, ...doc.data() })) : []; // prettier-ignore

          setCustomer({
            data: { id: customerSnapshot.id, ...customerData },
            isLoading: false,
            isError: false,
          });

          if (equipments.length > 0) {
            setCustomerEquipmentsOptions({
              data: equipments.map((equipment) => ({
                value: equipment.id,
                label: equipment.description,
                ...equipment,
              })),
              isLoading: false,
              isError: false,
            });
          }

          form.setValue('submittedBy', {
            id: customerSnapshot.id,
            name: customerData.customerName,
          });

          return;
        }

        setCustomerEquipmentsOptions({ data: [], isLoading: false, isError: false });
        setCustomer({ data: null, isLoading: false, isError: false });
      })
      .catch((err) => {
        console.error(err.message);
        setCustomer({ data: null, isLoading: false, isError: true });
        setCustomerEquipmentsOptions({ data: [], isLoading: false, isError: false });
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

  //* set calibratedBy
  useEffect(() => {
    if (data) return;

    if (usersOptions.data.length > 0 && job.data) {
      const worker = usersOptions.data.find((option) => option.id === job.data.worker.id);
      form.setValue('calibratedBy', { id: job.data.worker.id, name: worker.name || '' });
    }
  }, [data, usersOptions, job.data]);

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
    if (data) return;

    const q = query(collection(db, 'jobCertificates'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const date = new Date();
        const calibrationIdPrefix = `STM${format(date, 'yyMM')}-S`;

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
  }, [data]);

  //* logger user Effect
  useEffect(() => {
    console.log({ job, customer, customerEquipmentsOptions });
  }, [job.data, customer, customerEquipmentsOptions]);

  const handleCustomerEquipmentsChange = (option, field) => {
    field.onChange(option);

    form.setValue('make', option?.make || '');
    form.setValue('model', option?.model || '');
    form.setValue('serialNumber', String(option?.serialNumber) || '');
  };

  const handleDueDateRequestedChange = (option, field) => {
    field.onChange(option);
    form.clearErrors('dueDateDuration');
    form.clearErrors('dueDate');

    if (option.value === 'no') {
      form.setValue('dueDateDuration', null);
      form.setValue('dueDate', null);
    }
  };

  const handleGetLocationValue = useCallback(() => {
    if (location.isLoading) 'Loading...';

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

  //* set category, if data exist
  useEffect(() => {
    if (data && categoryOptions.length > 0) {
      const category = categoryOptions.find((option) => option.value === data.category);
      form.setValue('category', category);
    }
  }, [data, categoryOptions]);

  //* set approved signatory, if data exist
  useEffect(() => {
    if (data && usersOptions.data.length > 0) {
      const signatory = usersOptions.data.find((option) => option.id === data.approvedSignatory.id);
      form.setValue('approvedSignatory', signatory);
    }
  }, [data, usersOptions]);

  //* set calibrated at, if data exist
  useEffect(() => {
    if (data && calibratedAtOptions.length > 0) {
      const calibratedAt = calibratedAtOptions.find((option) => option.value === data.calibratedAt);
      form.setValue('calibratedAt', calibratedAt);
    }
  }, [data, calibratedAtOptions]);

  //* set customer equipment, if data exist
  useEffect(() => {
    if (data && customerEquipmentsOptions.data.length > 0) {
      const selectedEquipment = customerEquipmentsOptions.data.find(
        (option) => option.id === data.description.id
      );
      form.setValue('description', selectedEquipment);
    }
  }, [data, customerEquipmentsOptions]);

  useEffect(() => {
    if (data && dueDateRequestedOptions.length > 0) {
      const selectedDueDateRequested = dueDateRequestedOptions.find(
        (option) => option.value === data.dueDateRequested
      );
      form.setValue('dueDateRequested', selectedDueDateRequested);
    }
  }, [data, dueDateRequestedOptions]);

  return (
    <>
      <Card className='shadow-none'>
        <Card.Body>
          <Row className='mb-3 row-gap-3'>
            <Form.Group as={Col} md={3}>
              <Form.Label htmlFor='jobId'>Job ID</Form.Label>
              <Form.Control required type='text' value={form.watch('jobId')} readOnly disabled />
            </Form.Group>

            <Form.Group as={Col} md={3}>
              <Form.Label htmlFor='jobId'>Calibrate ID</Form.Label>
              <Form.Control
                required
                type='text'
                value={form.watch('calibrateId')}
                readOnly
                disabled
              />
            </Form.Group>

            <Form.Group as={Col} md={3}>
              <Form.Label htmlFor='jobId'>Certificate No.</Form.Label>
              <Form.Control
                required
                type='text'
                value={form.watch('certificateNumber')}
                readOnly
                disabled
              />
            </Form.Group>

            <Form.Group as={Col} md='3'>
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

            <Form.Group as={Col} md={12}>
              <Form.Label htmlFor='siteId'>Location</Form.Label>
              <Form.Control
                required
                type='text'
                value={handleGetLocationValue()}
                readOnly
                disabled
              />
            </Form.Group>
          </Row>

          <Row className='mb-3 row-gap-3'>
            <Form.Group as={Col} md={3}>
              <Form.Label htmlFor='submittedBy'>Submitted By</Form.Label>
              <Form.Control
                id='submittedBy'
                type='text'
                value={form.watch('submittedBy.name')}
                readOnly
                disabled
              />
            </Form.Group>

            <Form.Group as={Col} md={3}>
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

            <Form.Group as={Col} md='3'>
              <RequiredLabel label='Calibrated At' id='calibratedAt' />
              <OverlayTrigger
                placement='right'
                overlay={
                  <Tooltip>
                    <TooltipContent
                      title='Calibrated At types Search'
                      info={['Search by type calibrated at types']}
                    />
                  </Tooltip>
                }
              >
                <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
              </OverlayTrigger>

              <Controller
                name='calibratedAt'
                control={form.control}
                render={({ field }) => (
                  <>
                    <Select
                      {...field}
                      inputId='calibratedAt'
                      instanceId='calibratedAt'
                      onChange={(option) => field.onChange(option)}
                      options={calibratedAtOptions}
                      placeholder='Search by type calibrated at types'
                      noOptionsMessage={() => 'No calibrated at types found'}
                    />

                    {formErrors && formErrors.calibratedAt?.message && (
                      <Form.Text className='text-danger'>
                        {formErrors.calibratedAt?.message}
                      </Form.Text>
                    )}
                  </>
                )}
              />
            </Form.Group>

            <Form.Group as={Col} md={3}>
              <Form.Label htmlFor='calibratedBy'> Calibrated By</Form.Label>
              <Form.Control
                required
                type='text'
                value={form.watch('calibratedBy.name')}
                readOnly
                disabled
              />
            </Form.Group>
          </Row>

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
                      onChange={(option) => handleCustomerEquipmentsChange(option, field)}
                      options={customerEquipmentsOptions.data}
                      placeholder={
                        customerEquipmentsOptions.isLoading
                          ? 'Loading equipments...'
                          : "Search by customer equipment's name"
                      }
                      isDisabled={customerEquipmentsOptions.isLoading}
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
              <Form.Control id='make' type='text' value={form.watch('make')} readOnly disabled />
            </Form.Group>

            <Form.Group as={Col} md={3}>
              <Form.Label htmlFor='model'>Model</Form.Label>
              <Form.Control id='model' type='text' value={form.watch('model')} readOnly disabled />
            </Form.Group>

            <Form.Group as={Col} md={3}>
              <Form.Label htmlFor='serialNumber'>Serial No</Form.Label>
              <Form.Control
                id='serialNumber'
                type='text'
                value={form.watch('serialNumber')}
                readOnly
                disabled
              />
            </Form.Group>
          </Row>

          <Row className='mb-3 row-gap-3'>
            <Form.Group as={Col} md={4}>
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
            </Form.Group>

            <Form.Group as={Col} md={4}>
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

            <Form.Group as={Col} md={4}>
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
              <Form.Label htmlFor='dueDateDuration'>Due Date Duration</Form.Label>

              <Controller
                name='dueDateDuration'
                control={form.control}
                render={({ field }) => (
                  <>
                    <Form.Control
                      {...field}
                      disabled={form.watch('dueDateRequested.value') === 'no'}
                      id='dueDateDuration'
                      type='number'
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
                    <Form.Control
                      {...field}
                      disabled={form.watch('dueDateRequested.value') === 'no'}
                      id='dueDate'
                      type='date'
                    />

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

export default CalibrateInfoForm;
