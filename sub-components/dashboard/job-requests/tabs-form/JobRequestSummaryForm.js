import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Col, Form, OverlayTrigger, Row, Tooltip } from 'react-bootstrap';
import { useFormContext, Controller } from 'react-hook-form';
import { TooltipContent } from '@/components/common/ToolTipContent';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import { db } from '@/firebase';
import { collection, doc, getDoc, getDocs, onSnapshot, query } from 'firebase/firestore';
import Select from '@/components/Form/Select';
import { useRouter } from 'next/router';
import _ from 'lodash';

const JobRequestSummaryForm = ({ data, isLoading, handleNext }) => {
  const router = useRouter();

  const form = useFormContext();

  const formErrors = form.formState.errors;

  const [customersOptions, setCustomersOptions] = useState({ data: [], isLoading: true, isError: false }); //prettier-ignore
  const [usersOptions, setUsersOptions] = useState({ data: [], isLoading: true, isError: false });

  const [locationIsLoading, setLocationIsLoading] = useState(false);
  const [locationsOptions, setLocationsOptions] = useState([]);
  const [contactsOptions, setContactsOpions] = useState([]);

  const selectedLocation = useMemo(() => {
    return form.watch('location');
  }, [JSON.stringify(form.watch('location'))]);

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

  //* query users
  useEffect(() => {
    const q = query(collection(db, 'users'));

    getDocs(q)
      .then((snapshot) => {
        if (!snapshot.empty) {
          const userData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

          setUsersOptions({
            data: userData.map((user) => ({
              id: user.workerId,
              name: user.fullName,
              value: user.workerId,
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

  //* query last job request id
  useEffect(() => {
    if (data) return;

    const q = query(collection(db, 'jobRequests'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const id = snapshot.docs.pop().id.replace('JR', '');
          const lastJobRequestId = parseInt(id, 10);

          form.setValue('jobRequestId', `JR${(lastJobRequestId + 1).toString().padStart(6, '0')}`);
        } else form.setValue('jobRequestId', 'JR000001');
      },
      (err) => {
        console.error(err.message);
        toast.error(err.message);
      }
    );

    return () => unsubscribe();
  }, [data]);

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

  //* set supervisor, if data exist
  useEffect(() => {
    if (data && usersOptions.data.length > 0) {
      const supervisor = usersOptions.data.find((option) => option.id === data.supervisor.id);
      form.setValue('supervisor', supervisor);
    }
  }, [data, usersOptions]);

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

  return (
    <>
      <Card className='shadow-none'>
        <Card.Body className='pb-0'>
          <Row className='mb-3'>
            <Form.Group as={Col} md={6}>
              <Form.Label>Job Request ID</Form.Label>
              <Form.Control type='text' value={form.watch('jobRequestId')} readOnly disabled />
            </Form.Group>

            <Form.Group as={Col} md={6}>
              <Form.Label>Status</Form.Label>
              <Form.Control
                type='text'
                value={_.capitalize(form.watch('status'))}
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
                      isDisabled={customersOptions.isLoading}
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

          <h4 className='mb-0'>Supervisor</h4>
          <p className='text-muted fs-6'>Assigned supervisor for the job request.</p>

          <Row className='mb-3'>
            <Form.Group as={Col} md={12}>
              <RequiredLabel label='Assigned Supervisor' id='supervisor' />
              <OverlayTrigger
                placement='right'
                overlay={
                  <Tooltip>
                    <TooltipContent
                      title='User search Search'
                      info={[
                        "Search by user's name",
                        'Required to proceed with job request creation',
                      ]}
                    />
                  </Tooltip>
                }
              >
                <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
              </OverlayTrigger>

              <Controller
                name='supervisor'
                control={form.control}
                render={({ field }) => (
                  <>
                    <Select
                      {...field}
                      inputId='supervisor'
                      instanceId='supervisor'
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

                    {formErrors && formErrors.supervisor?.message && (
                      <Form.Text className='text-danger'>
                        {formErrors.supervisor?.message}
                      </Form.Text>
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
                      isDisabled={customersOptions.isLoading || contactsOptions.length < 1}
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
              <Form.Label>Phone</Form.Label>
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
                      isDisabled={locationIsLoading || locationsOptions.length < 1}
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
              <Form.Label>Province</Form.Label>
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

export default JobRequestSummaryForm;
