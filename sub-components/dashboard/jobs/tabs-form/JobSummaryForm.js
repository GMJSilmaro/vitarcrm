import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  OverlayTrigger,
  Row,
  Tooltip,
} from 'react-bootstrap';
import { useForm, useFormContext, Controller } from 'react-hook-form';
import { TooltipContent } from '@/components/common/ToolTipContent';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import { zodResolver } from '@hookform/resolvers/zod';
import { equipmentSchema } from '@/schema/job';
import JobEquipmentList from '../JobEquipmentList';
import { db } from '@/firebase';
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import Select from '@/components/Form/Select';
import { useRouter } from 'next/router';
import { ExclamationCircle } from 'react-bootstrap-icons';

const JobSummaryForm = ({ data, isLoading, handleNext, toDuplicateJob }) => {
  const router = useRouter();
  const { jobRequestId } = router.query;

  const form = useFormContext();

  const formErrors = form.formState.errors;

  const [jobs, setJobs] = useState({ data: [], isLoading: true, isError: false });
  const [jobRequestOptions, setJobRequestOptions] = useState({ data: [], isLoading: true, isError: false }); //prettier-ignore
  const [customersOptions, setCustomersOptions] = useState({ data: [], isLoading: true, isError: false }); //prettier-ignore

  const [locationIsLoading, setLocationIsLoading] = useState(false);
  const [locationsOptions, setLocationsOptions] = useState([]);
  const [contactsOptions, setContactsOpions] = useState([]);

  const selectedLocation = useMemo(() => {
    return form.watch('location');
  }, [JSON.stringify(form.watch('location'))]);

  const formatCustomerOptionLabel = (data) => {
    return (
      <div className='d-flex justify-content-between align-items-center gap-2 text-capitalize'>
        <span>{data.label}</span>
        <span className='d-flex column-gap-2'>
          <Badge bg='info'>{data.equipments?.length ?? 0} Equipment</Badge>
          <Badge bg='primary'>{data.contacts?.length ?? 0} Contact</Badge>
          <Badge bg='warning'>{data.locations?.length ?? 0} Location</Badge>
        </span>
      </div>
    );
  };

  const formatJobRequestOptionLabel = (data) => {
    return (
      <div className='d-flex justify-content-between align-items-center gap-2 text-capitalize'>
        <span>{data.label}</span>
        <span className='d-flex column-gap-2'>
          <Badge bg='primary'>{data?.jobRequest?.supervisor?.name || ''}</Badge>
          <Badge bg='info'>{data?.jobRequest?.customerEquipments?.length ?? 0} Equipment</Badge>
        </span>
      </div>
    );
  };

  const formatContactOptionLabel = (data) => {
    return (
      <div className='d-flex justify-content-between align-items-center gap-2 text-capitalize'>
        {data.label}
        <span className='d-flex column-gap-2'>
          {data?.isDefault && <Badge bg='primary'>Default</Badge>}
          <Badge bg='warning'>{data.role}</Badge>
        </span>
      </div>
    );
  };

  const formatLocationOptionLabel = (data) => {
    return (
      <div className='d-flex justify-content-between align-items-center gap-2 text-capitalize'>
        <span>{data.label}</span>
        {data?.isDefault && <Badge bg='primary'>Default</Badge>}
      </div>
    );
  };

  const handleCustomerChange = useCallback(
    (option, field) => {
      field.onChange(option);

      if (!data) {
        //* clear customer equipments
        form.setValue('customerEquipments', []);
      } else {
        if (data?.customer?.id !== option?.id) {
          form.setValue('customerEquipments', []);
        } else form.setValue('customerEquipments', data?.customerEquipments);
      }

      //* contact options
      const cOptions =
        option?.contacts?.length > 0
          ? option.contacts.map((contact) => ({
              value: contact.id,
              label: `${contact.firstName} ${contact.lastName}`,
              ...contact,
            }))
          : [];

      //* location options
      const lOptions =
        option?.locations?.length > 0
          ? option.locations.map((location) => ({
              value: location.siteId,
              label: `${location.siteId} - ${location.siteName}`,
              ...location,
            }))
          : [];

      if (cOptions.length > 0) {
        setContactsOpions(cOptions);
        const defaultContact = cOptions.find(contact => contact.isDefault) //prettier-ignore
        if (defaultContact) {
          form.setValue('contact', defaultContact);
          form.clearErrors('contact');
        }
      } else {
        form.setValue('contact', null);
        setContactsOpions([]);
      }

      if (lOptions.length > 0) {
        setLocationsOptions(lOptions);
        const defaultLocation = lOptions.find(location => location.isDefault) //prettier-ignore
        if (defaultLocation) {
          form.setValue('location', defaultLocation);
          form.clearErrors('location');
        }
      } else {
        form.setValue('location', null);
        setLocationsOptions([]);
      }
    },
    [data]
  );

  const populateJobRequestRelatedData = useCallback(
    (option) => {
      //* set customer
      const customer = customersOptions.data.find((c) => c.value === option?.jobRequest?.customer?.id); //prettier-ignore
      const customerEquipmentsFromJobRequest = option?.jobRequest?.customerEquipments || [];
      const tasksFromJobRequest = option?.jobRequest?.tasks || [];
      form.setValue('customer', customer);

      if (customer) {
        if (!data) {
          //* clear customer equipments
          form.setValue('customerEquipments', []);
        } else {
          if (data?.customer?.id !== option?.id) {
            form.setValue('customerEquipments', []);
          } else form.setValue('customerEquipments', data?.customerEquipments);
        }

        //* contact options
        const cOptions =
          customer?.contacts?.length > 0
            ? customer.contacts.map((contact) => ({
                value: contact.id,
                label: `${contact.firstName} ${contact.lastName}`,
                ...contact,
              }))
            : [];

        //* location options
        const lOptions =
          customer?.locations?.length > 0
            ? customer.locations.map((location) => ({
                value: location.siteId,
                label: `${location.siteId} - ${location.siteName}`,
                ...location,
              }))
            : [];

        if (cOptions.length > 0) {
          setContactsOpions(cOptions);

          const contactFromJobRequest = cOptions.find(contact => contact.value === option?.jobRequest?.contact?.id); //prettier-ignore

          //* if contactFromJobRequest exist set it, othwerwise set default contact, if has default contact
          if (contactFromJobRequest) {
            form.setValue('contact', contactFromJobRequest);
            form.clearErrors('contact');
          } else {
            const defaultContact = cOptions.find(contact => contact.isDefault) //prettier-ignore
            if (defaultContact) {
              form.setValue('contact', defaultContact);
              form.clearErrors('contact');
            }
          }
        } else {
          form.setValue('contact', null);
          setContactsOpions([]);
        }

        if (lOptions.length > 0) {
          setLocationsOptions(lOptions);

          const locationFromJobRequest = lOptions.find(location => location.value === option?.jobRequest?.location?.id); //prettier-ignore

          //* if locationFromJobRequest exist set it, othwerwise set default location, if has default location
          if (locationFromJobRequest) {
            form.setValue('location', locationFromJobRequest);
            form.clearErrors('location');
          } else {
            const defaultLocation = lOptions.find(location => location.isDefault) //prettier-ignore
            if (defaultLocation) {
              form.setValue('location', defaultLocation);
              form.clearErrors('location');
            }
          }
        } else {
          form.setValue('location', null);
          setLocationsOptions([]);
        }

        //* set customer equipments based on job request
        form.setValue('customerEquipments', customerEquipmentsFromJobRequest);

        //* set tasks based on job request
        form.setValue('tasks', tasksFromJobRequest);
      }
    },
    [data, JSON.stringify(customersOptions)]
  );

  const handleJobRequestChange = useCallback(
    (option, field) => {
      if (customersOptions.data.length > 0) {
        field.onChange(option);

        populateJobRequestRelatedData(option);
      }
    },
    [data, JSON.stringify(customersOptions)]
  );

  //* query customers
  useEffect(() => {
    Promise.all([
      getDocs(query(collection(db, 'customers'))),
      getDocs(query(collection(db, 'contacts'))),
      getDocs(query(collection(db, 'customerEquipments'))),
    ])
      .then(async ([customerSnapshot, contactsSnapshot, customerEquipmentsSnapshot]) => {
        const customerData = !customerSnapshot.empty ? customerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) : []; // prettier-ignore
        const contactsData = !contactsSnapshot.empty ? contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) : []; // prettier-ignore
        const customerEquipmentsData = !customerEquipmentsSnapshot.empty ? customerEquipmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) : []; // prettier-ignore

        //* set tempform data for customer equipments
        form.setValue('allCustomerEquipments', customerEquipmentsData);

        setCustomersOptions({
          data: customerData.map((customer) => {
            const contacts =
              customer?.contacts &&
              Array.isArray(customer?.contacts) &&
              customer?.contacts?.length > 0
                ? contactsData.filter((contact) => customer?.contacts?.includes(contact.id))
                : null;

            const equipments = customerEquipmentsData.filter((eq) => customer.id === eq.customerId);

            return {
              id: customer.id,
              name: customer.customerName,
              value: customer.id,
              label: `${customer.customerId} - ${customer.customerName}`,
              locations: customer?.locations && Array.isArray(customer.locations) ? customer.locations : [], // prettier-ignore
              contacts,
              equipments,
            };
          }),
          isLoading: false,
          isError: false,
        });
      })
      .catch((err) => {
        console.error(err.message);
        setCustomersOptions({ data: [], isLoading: false, isError: true });
      });
  }, []);

  //* query locations
  useEffect(() => {
    if (form.getValues('location.value')) {
      setLocationIsLoading(true);

      const docRef = doc(db, 'locations', form.watch('location.value'));
      getDoc(docRef).then((doc) => {
        if (doc.exists()) {
          form.setValue('location', { ...form.getValues('location'), ...doc.data() });
          setLocationIsLoading(false);
        } else {
          setLocationIsLoading(false);
        }
      });
    }
  }, [form.watch('location.value')]);

  //* set customer, contact & location if data exist
  useEffect(() => {
    if (data && customersOptions.data.length > 0) {
      //* selected customer
      const customer = customersOptions.data.find((option) => option.value === data.customer.id);

      //* set customer
      if (customer) form.setValue('customer', customer);

      if (customer?.contacts && Array.isArray(customer?.contacts)) {
        //* contact options
        // TODO: fetch all properties of contact, causes bug when option is selected twice because it does not all have the same properties from db
        const cOptions = customer.contacts.map((contact) => ({
          value: contact.id,
          label: `${contact.firstName} ${contact.lastName}`,
          ...contact,
        }));

        //* selected contact
        const contact = cOptions.find((contact) => contact.value === data?.contact?.id);

        //* set options
        setContactsOpions(cOptions);

        //* set contact
        form.setValue('contact', contact);
      }

      if (customer?.locations && Array.isArray(customer?.locations)) {
        //* location options
        // TODO: fetch all properties of location, causes bug when option is selected twice because it does not all have the same properties from db
        const lOptions = customer.locations.map((location) => ({
          value: location.siteId,
          label: `${location.siteId} - ${location.siteName}`,
          ...location,
        }));

        //* selected location
        const location = lOptions.find((location) => location.value === data.location.id);

        //* set options
        setLocationsOptions(lOptions);

        //* set location
        form.setValue('location', location);
      }
    }
  }, [data, customersOptions]);

  //* set jobRequestId if data exist or jobRequestId search params exists
  useEffect(() => {
    if (data && jobRequestOptions.data.length > 0) {
      const selectedJobRequest = jobRequestOptions.data.find(
        (jobRequest) => jobRequest.id === data.jobRequestId
      );
      form.setValue('jobRequestId', selectedJobRequest);
    }

    if (!data && jobRequestId && jobRequestOptions.data.length > 0) {
      const selectedJobRequest = jobRequestOptions.data.find(
        (jobRequest) => jobRequest.id === jobRequestId
      );
      form.setValue('jobRequestId', selectedJobRequest);

      populateJobRequestRelatedData(selectedJobRequest);
    }
  }, [data, jobRequestOptions]);

  //* query jobs
  useEffect(() => {
    const q = query(collection(db, 'jobHeaders'));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (!snapshot.empty) {
          setJobs({
            data: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
            isLoading: false,
            isError: false,
          });
          return;
        }

        setJobs({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        setJobs({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  //* query job request which are approved
  useEffect(() => {
    const q = query(collection(db, 'jobRequests'), where('status', '==', 'request-approved'));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (!snapshot.empty && jobs.data.length > 0) {
          const jobRequestData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

          const jobRequestWithNoAssociatedJob = jobRequestData.filter((jr) => {
            if (data && jr.id === data?.jobRequestId) return true;

            const isAssociatedJob = jobs.data.some((j) => j.jobRequestId === jr.id);
            return !isAssociatedJob;
          });

          setJobRequestOptions({
            data: jobRequestWithNoAssociatedJob.map((jr) => ({
              id: jr.id,
              value: jr.id,
              label: `${jr.id} - ${jr.customer.name}`,
              jobRequest: jr,
            })),
            isLoading: false,
            isError: false,
          });

          return;
        }

        setJobRequestOptions({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        setJobRequestOptions({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, [JSON.stringify(jobs), data]);

  //* set date if toDuplicateJob exists
  useEffect(() => {
    if (toDuplicateJob) {
      //* set job request id
      form.setValue('jobRequestId', null);

      //* set customer
      if (customersOptions.data.length > 0) {
        {
          //* selected customer
          const customer = customersOptions.data.find(
            (option) => option.value === toDuplicateJob.customer.id
          );

          //* set customer
          if (customer) form.setValue('customer', customer);

          if (customer?.contacts && Array.isArray(customer?.contacts)) {
            //* contact options
            // TODO: fetch all properties of contact, causes bug when option is selected twice because it does not all have the same properties from db
            const cOptions = customer.contacts.map((contact) => ({
              value: contact.id,
              label: `${contact.firstName} ${contact.lastName}`,
              ...contact,
            }));

            //* selected contact
            const contact = cOptions.find(
              (contact) => contact.value === toDuplicateJob?.contact?.id
            );

            //* set options
            setContactsOpions(cOptions);

            //* set contact
            form.setValue('contact', contact);
          }

          if (customer?.locations && Array.isArray(customer?.locations)) {
            //* location options
            // TODO: fetch all properties of location, causes bug when option is selected twice because it does not all have the same properties from db
            const lOptions = customer.locations.map((location) => ({
              value: location.siteId,
              label: `${location.siteId} - ${location.siteName}`,
              ...location,
            }));

            //* selected location
            const location = lOptions.find(
              (location) => location.value === toDuplicateJob.location.id
            );

            //* set options
            setLocationsOptions(lOptions);

            //* set location
            form.setValue('location', location);
          }
        }
      }
    }
  }, [toDuplicateJob, customersOptions]);

  return (
    <>
      <Card className='shadow-none'>
        <Card.Body className='pb-0'>
          {data && data?.status === 'job-cancel' && (
            <Alert
              className='mb-5 d-flex align-items-center gap-2'
              style={{ width: 'fit-content' }}
              variant='danger'
            >
              <ExclamationCircle className='flex-shrink-0 me-1' size={20} />{' '}
              <div>
                Job status is "<span className='fw-bold'>{_.startCase(data?.status)}." </span>
                {data?.reasonMessage ? (
                  <span>
                    Reason/message is "<span className='fw-bold'>{data?.reasonMessage}</span>
                    ."
                  </span>
                ) : (
                  ''
                )}
              </div>
            </Alert>
          )}

          <h4 className='mb-0'>Job Request</h4>
          <p className='text-muted fs-6'>Associate job request for this job.</p>

          <Row className='mb-3 row-gap-3'>
            <Form.Group as={Col} md={12}>
              <Form.Label className='me-1' id='jobRequestId'>
                Job Request
              </Form.Label>
              <OverlayTrigger
                placement='right'
                overlay={
                  <Tooltip>
                    <TooltipContent
                      title='Job Request Search'
                      info={[
                        "Search by job request's ID & supervisor's name",
                        'Selection will load customer and its related contacts and locations, calibration items and additional instructions',
                      ]}
                    />
                  </Tooltip>
                }
              >
                <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
              </OverlayTrigger>

              <Controller
                name='jobRequestId'
                control={form.control}
                render={({ field }) => (
                  <>
                    <Select
                      {...field}
                      inputId='jobRequestId'
                      instanceId='jobRequestId'
                      onChange={(option) => handleJobRequestChange(option, field)}
                      formatOptionLabel={formatJobRequestOptionLabel}
                      options={jobRequestOptions.data}
                      isLoading={jobs.isLoading || jobRequestOptions.isLoading}
                      placeholder={
                        jobs.isLoading || jobRequestOptions.isLoading || customersOptions.isLoading
                          ? 'Loading job requests...'
                          : "Search by job request's ID & supervisor's name"
                      }
                      isDisabled={jobs.isLoading || jobRequestOptions.isLoading}
                      noOptionsMessage={() =>
                        jobRequestOptions.isLoading ? 'Loading...' : 'No job request found'
                      }
                    />

                    {formErrors && formErrors.jobRequestId?.message && (
                      <Form.Text className='text-danger'>
                        {formErrors.jobRequestId?.message}
                      </Form.Text>
                    )}
                  </>
                )}
              />
            </Form.Group>

            <Form.Group as={Col} md={6}>
              <Form.Label>Supervisor</Form.Label>
              <Form.Control
                type='text'
                value={form.watch('jobRequestId.jobRequest.supervisor.name') || ''}
                readOnly
                disabled
              />
            </Form.Group>

            <Form.Group as={Col} md={6}>
              <Form.Label>Sales Person</Form.Label>
              <Form.Control
                type='text'
                value={form.watch('jobRequestId.jobRequest.createdBy.displayName') || ''}
                readOnly
                disabled
              />
            </Form.Group>
          </Row>

          <hr className='my-4' />
          <h4 className='mb-0'>Customer</h4>
          <p className='text-muted fs-6'>Basic customer details</p>

          <Row>
            <Form.Group as={Col} md={12}>
              <RequiredLabel label='Customer' id='customer' />
              <OverlayTrigger
                placement='right'
                overlay={
                  <Tooltip>
                    <TooltipContent
                      title='Customer Search'
                      info={[
                        "Search by customer's code or name",
                        'Selection will load related contacts and locations',
                        'Required to proceed with job creation',
                      ]}
                    />
                  </Tooltip>
                }
              >
                <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
              </OverlayTrigger>

              <Controller
                name='customer'
                control={form.control}
                render={({ field }) => (
                  <>
                    <Select
                      {...field}
                      inputId='customer'
                      instanceId='customer'
                      onChange={(option) => handleCustomerChange(option, field)}
                      formatOptionLabel={formatCustomerOptionLabel}
                      options={customersOptions.data}
                      isLoading={customersOptions.isLoading}
                      placeholder={
                        customersOptions.isLoading
                          ? 'Loading customers...'
                          : "Search by customer's code or name"
                      }
                      isDisabled={customersOptions.isLoading || form.watch('jobRequestId')}
                      noOptionsMessage={() =>
                        customersOptions.isLoading ? 'Loading...' : 'No customers found'
                      }
                    />

                    {formErrors && formErrors.customer?.message && (
                      <Form.Text className='text-danger'>{formErrors.customer?.message}</Form.Text>
                    )}
                  </>
                )}
              />
            </Form.Group>
          </Row>

          <hr className='my-4' />
          <h5 className='mb-0'>Primary Contact</h5>
          <p className='text-muted fs-6'>Details about the customer contact.</p>

          <Row className='mb-3'>
            <Form.Group as={Col} md={12}>
              <Form.Label id='contact'>Contact</Form.Label>

              <Controller
                name='contact'
                control={form.control}
                render={({ field }) => (
                  <>
                    <Select
                      {...field}
                      inputId='contact'
                      instanceId='contact'
                      onChange={(option) => field.onChange(option)}
                      formatOptionLabel={formatContactOptionLabel}
                      options={contactsOptions}
                      isDisabled={
                        customersOptions.isLoading ||
                        contactsOptions.length < 1 ||
                        form.watch('jobRequestId')
                      }
                      placeholder="Search by contact's name"
                      noOptionsMessage={() => 'No contacts found'}
                    />

                    {formErrors && formErrors.contact?.message && (
                      <Form.Text className='text-danger'>{formErrors.contact?.message}</Form.Text>
                    )}
                  </>
                )}
              />
            </Form.Group>
          </Row>

          <Row className='mb-3'>
            <Form.Group as={Col} md='3'>
              <Form.Label>First name</Form.Label>
              <Form.Control
                required
                type='text'
                value={form.watch('contact') ? form.watch('contact.firstName') : ''}
                readOnly
                disabled
              />
            </Form.Group>
            <Form.Group as={Col} md='3'>
              <Form.Label>Last name</Form.Label>
              <Form.Control
                required
                type='text'
                value={form.watch('contact') ? form.watch('contact.lastName') : ''}
                readOnly
                disabled
              />
            </Form.Group>
            <Form.Group as={Col} md='3'>
              <Form.Label>Phone</Form.Label>
              <Form.Control
                required
                type='text'
                value={form.watch('contact') ? form.watch('contact.phone') : ''}
                readOnly
                disabled
              />
            </Form.Group>
            <Form.Group as={Col} md='3'>
              <Form.Label>Email</Form.Label>
              <Form.Control
                required
                type='text'
                value={form.watch('contact') ? form.watch('contact.email') : ''}
                readOnly
                disabled
              />
            </Form.Group>
          </Row>

          <hr className='my-4' />
          <h4 className='mb-0' style={{ cursor: 'pointer' }}>
            Job Address
          </h4>
          <p className='text-muted fs-6'>Details about the location/site.</p>

          <Row className='mb-3'>
            <Form.Group as={Col} md={12}>
              <RequiredLabel label='Location' id='location' />
              <OverlayTrigger
                placement='right'
                overlay={
                  <Tooltip>
                    <TooltipContent
                      title='Location Search'
                      info={[
                        "Search by location's id or name",
                        'Required to proceed with job creation',
                      ]}
                    />
                  </Tooltip>
                }
              >
                <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
              </OverlayTrigger>

              <Controller
                name='location'
                control={form.control}
                render={({ field }) => (
                  <>
                    <Select
                      {...field}
                      inputId='location'
                      instanceId='location'
                      onChange={(option) => field.onChange(option)}
                      formatOptionLabel={formatLocationOptionLabel}
                      options={locationsOptions}
                      placeholder="Search by location's id or name"
                      isDisabled={
                        locationIsLoading ||
                        locationsOptions.length < 1 ||
                        form.watch('jobRequestId')
                      }
                      noOptionsMessage={() =>
                        locationsOptions.isLoading ? 'Loading...' : 'No locations found'
                      }
                    />

                    {formErrors && formErrors.location?.message && (
                      <Form.Text className='text-danger'>{formErrors.location?.message}</Form.Text>
                    )}
                  </>
                )}
              />
            </Form.Group>
          </Row>

          <Row className='mb-3'>
            <Form.Group as={Col} md='4'>
              <Form.Label>Name</Form.Label>
              <Form.Control
                required
                type='text'
                value={locationIsLoading ? 'Loading...' : selectedLocation?.siteName || ''}
                readOnly
                disabled
              />
            </Form.Group>
            <Form.Group as={Col} md='4'>
              <Form.Label>Latitude</Form.Label>
              <Form.Control
                required
                type='text'
                value={
                  locationIsLoading ? 'Loading...' : selectedLocation?.addresses?.[0].latitude || ''
                }
                readOnly
                disabled
              />
            </Form.Group>
            <Form.Group as={Col} md='4'>
              <Form.Label>Longitude</Form.Label>
              <Form.Control
                required
                type='text'
                value={
                  locationIsLoading
                    ? 'Loading...'
                    : selectedLocation?.addresses?.[0].longitude || ''
                }
                readOnly
                disabled
              />
            </Form.Group>
          </Row>

          <Row className='mb-3'>
            <Form.Group as={Col} md='4'>
              <Form.Label>Street Address #1</Form.Label>
              <Form.Control
                required
                type='text'
                value={
                  locationIsLoading ? 'Loading...' : selectedLocation?.addresses?.[0].street1 || ''
                }
                readOnly
                disabled
              />
            </Form.Group>
            <Form.Group as={Col} md='4'>
              <Form.Label>Street Address #2</Form.Label>
              <Form.Control
                required
                type='text'
                value={
                  locationIsLoading ? 'Loading...' : selectedLocation?.addresses?.[0].street2 || ''
                }
                readOnly
                disabled
              />
            </Form.Group>
            <Form.Group as={Col} md='4'>
              <Form.Label>Street Address #3</Form.Label>
              <Form.Control
                required
                type='text'
                value={
                  locationIsLoading ? 'Loading...' : selectedLocation?.addresses?.[0].street3 || ''
                }
                readOnly
                disabled
              />
            </Form.Group>
          </Row>

          <Row className='mb-3'>
            <Form.Group as={Col} md='4'>
              <Form.Label>City</Form.Label>
              <Form.Control
                required
                type='text'
                value={
                  locationIsLoading ? 'Loading...' : selectedLocation?.addresses?.[0].city || ''
                }
                readOnly
                disabled
              />
            </Form.Group>
            <Form.Group as={Col} md='4'>
              <Form.Label>Postal Code</Form.Label>
              <Form.Control
                required
                type='text'
                value={
                  locationIsLoading
                    ? 'Loading...'
                    : selectedLocation?.addresses?.[0].postalCode || ''
                }
                readOnly
                disabled
              />
            </Form.Group>
            <Form.Group as={Col} md='4'>
              <Form.Label>State</Form.Label>
              <Form.Control
                required
                type='text'
                value={
                  locationIsLoading ? 'Loading...' : selectedLocation?.addresses?.[0].province || ''
                }
                readOnly
                disabled
              />
            </Form.Group>
          </Row>

          <Row className='mb-3'>
            <Form.Group as={Col} md='4'>
              <Form.Label>Country</Form.Label>
              <Form.Control
                required
                type='text'
                value={
                  locationIsLoading ? 'Loading...' : selectedLocation?.addresses?.[0].country || ''
                }
                readOnly
                disabled
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

export default JobSummaryForm;
