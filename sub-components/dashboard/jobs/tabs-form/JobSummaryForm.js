import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Col, Form, OverlayTrigger, Row, Tooltip } from 'react-bootstrap';
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

const JobSummaryForm = ({ data, isLoading, handleNext }) => {
  const router = useRouter();

  const form = useFormContext();

  const formErrors = form.formState.errors;

  const equipmentForm = useForm({
    mode: 'onChange',
    resolver: zodResolver(equipmentSchema),
  });

  const equipments = useMemo(() => {
    return form.getValues('equipments');
  }, [form.watch('equipments')]);

  const [customersOptions, setCustomersOptions] = useState({ data: [], isLoading: true, isError: false }); //prettier-ignore
  const [equipmentsOptions, setEquipmentsOptions] = useState({ data: [], isLoading: true, isError: false }); //prettier-ignore

  const [locationIsLoading, setLocationIsLoading] = useState(false);
  const [locationsOptions, setLocationsOptions] = useState([]);
  const [contactsOptions, setContactsOpions] = useState([]);

  const [showLocationFields, setShowLocationFields] = useState(true);
  const [showEquipmentFields, setShowEquipmentFields] = useState(true);

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

  //* query equipments
  useEffect(() => {
    const q = query(collection(db, 'equipments'));

    const unsubscribe = onSnapshot(
      q,
      (snapshop) => {
        if (!snapshop.empty) {
          setEquipmentsOptions({
            data: snapshop.docs.map((doc) => {
              const data = doc.data();

              return {
                value: doc.id,
                label:  `${data?.inventoryId || ''} - ${data?.tagId || ''} - ${data?.description || '' } - ${data?.category || ''} - ${data?.certificateNo || ''}`, //prettier-ignore
                ...data,
              };
            }),
          });
        } else {
          setEquipmentsOptions({ data: [], isLoading: false, isError: false });
        }
      },
      (err) => {
        console.error(err.message);
        setEquipmentsOptions({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  //* set customer, contact & location if data exist
  useEffect(() => {
    if (data && customersOptions.data.length > 0) {
      //* selected customer
      const customer = customersOptions.data.find((option) => option.value === data.customer.id);

      //* set customer
      if (customer) form.setValue('customer', customer);

      if (customer?.contacts && Array.isArray(customer?.contacts)) {
        //* contact options
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

  //* set equipments if data exist
  useEffect(() => {
    if (data && equipmentsOptions.data.length > 0) {
      const equipmentsIds = data.equipments.map((equipment) => equipment.id);

      //* selected equipments
      const equipments = equipmentsOptions.data.filter((equipment) =>
        equipmentsIds.includes(equipment.value)
      );

      //* set form values
      form.setValue('equipments', equipments);
    }
  }, [data, equipmentsOptions]);

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

  const formatEquipmentOptionLabel = (data) => {
    const currentEquipments = form.getValues('equipments') || [];
    const isAvailable = data?.qty > 0;

    const getLabel = (data) => {
      if (!data) return '';

      let label = '';
      if (data?.inventoryId) label += `${data.inventoryId} - `;
      if (data?.tagId) label += `${data.tagId} - `;
      if (data?.description) label += `${data.description}`;

      return label;
    };

    return (
      <div className='d-flex justify-content-between align-items-center gap-2 text-capitalize'>
        <span>{getLabel(data)}</span>
        <span className='d-flex column-gap-2'>
          <Badge bg={isAvailable ? 'success' : 'danger'}>
            {isAvailable ? 'Available' : 'Unavailable'}{' '}
          </Badge>

          <Badge bg='primary'>{data.category}</Badge>
          <Badge bg='warning'>{data.certificateNo}</Badge>
        </span>
      </div>
    );
  };

  const handleCustomerChange = (option, field) => {
    field.onChange(option);

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
    }
  };

  const handleAddEquipment = () => {
    equipmentForm.trigger('equipment');
    const data = equipmentForm.getValues('equipment');
    if (!data) return;

    const currentEquipments = form.getValues('equipments');

    const isExist = currentEquipments.find(
      (equipment) => equipment.inventoryId === data.inventoryId
    );

    const isAvailable = data?.qty > 0;

    if (isExist) {
      toast.error('Equipment already selected');
      return;
    }

    if (!isAvailable) {
      toast.error('Equipment is not available');
      return;
    }

    form.setValue('equipments', [...equipments, data]);
    form.clearErrors('equipments');
    equipmentForm.setValue('equipment', null);
  };

  const handleRemoveEquipment = (id) => {
    form.setValue(
      'equipments',
      equipments.filter((equipment) => equipment.inventoryId !== id)
    );
  };

  return (
    <>
      <Card className='shadow-none'>
        <Card.Body className='pb-0'>
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
          <h4
            className='mb-0'
            style={{ cursor: 'pointer' }}
            onClick={() => setShowLocationFields((prev) => !prev)}
          >
            Job Address {showLocationFields ? '(-)' : '(+)'}
          </h4>
          <p className='text-muted fs-6'>Details about the location/site.</p>

          {showLocationFields && (
            <>
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
                          <Form.Text className='text-danger'>
                            {formErrors.location?.message}
                          </Form.Text>
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
                    value={locationIsLoading ? 'Loading...' : form.watch('location.siteName')}
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
                      locationIsLoading ? 'Loading...' : form.watch('location.addresses.0.latitude')
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
                        : form.watch('location.addresses.0.longitude')
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
                      locationIsLoading ? 'Loading...' : form.watch('location.addresses.0.street1')
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
                      locationIsLoading ? 'Loading...' : form.watch('location.addresses.0.street2')
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
                      locationIsLoading ? 'Loading...' : form.watch('location.addresses.0.street3')
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
                      locationIsLoading ? 'Loading...' : form.watch('location.addresses.0.city')
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
                        : form.watch('location.addresses.0.postalCode')
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
                      locationIsLoading ? 'Loading...' : form.watch('location.addresses.0.province')
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
                      locationIsLoading ? 'Loading...' : form.watch('location.addresses.0.country')
                    }
                    readOnly
                    disabled
                  />
                </Form.Group>
              </Row>
            </>
          )}

          <hr className='my-4' />
          <h4
            className='mb-0'
            style={{ cursor: 'pointer' }}
            onClick={() => setShowEquipmentFields((prev) => !prev)}
          >
            Job Equipments {showEquipmentFields ? '(-)' : '(+)'}
          </h4>
          <p className='text-muted fs-6'>Details about the equipment needed for the job.</p>

          {showEquipmentFields && (
            <>
              <Row className='mb-3 gap-0 align-items-center'>
                <Form.Group as={Col} md='12'>
                  <RequiredLabel label='Equipments' id='equipment' />
                  <OverlayTrigger
                    placement='right'
                    overlay={
                      <Tooltip>
                        <TooltipContent
                          title='Equipments Search'
                          info={[
                            "Search by equipment's tag id, inventory id or description, category or certificate no.",
                            'Required to proceed with job creation',
                          ]}
                        />
                      </Tooltip>
                    }
                  >
                    <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
                  </OverlayTrigger>

                  <Controller
                    name='equipment'
                    control={equipmentForm.control}
                    render={({ field }) => (
                      <>
                        <div className='d-flex gap-2 w-100 align-items-center'>
                          <Select
                            className='w-100'
                            {...field}
                            inputId='equipment'
                            instanceId='equipment'
                            onChange={(option) => {
                              field.onChange(option);
                              form.clearErrors('equipments');

                              handleAddEquipment();
                            }}
                            formatOptionLabel={formatEquipmentOptionLabel}
                            options={equipmentsOptions.data}
                            isDisabled={equipmentsOptions.isLoading || equipmentsOptions.length < 1}
                            placeholder="Search by equipment's tag id, inventory id or description, category or certificate no."
                            noOptionsMessage={() => 'No equipments found'}
                          />
                        </div>

                        {equipmentForm.formState.errors &&
                          equipmentForm.formState.errors.equipment?.message && (
                            <Form.Text className='text-danger'>
                              {equipmentForm.formState.errors.equipment?.message}
                            </Form.Text>
                          )}
                      </>
                    )}
                  />
                </Form.Group>
              </Row>

              <JobEquipmentList
                height={426}
                data={form.watch('equipments')}
                handleRemoveEquipment={handleRemoveEquipment}
              />

              <Row>
                {formErrors && formErrors.equipments?.message && (
                  <Form.Text className='text-danger'>{formErrors.equipments?.message}</Form.Text>
                )}
              </Row>
            </>
          )}

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
