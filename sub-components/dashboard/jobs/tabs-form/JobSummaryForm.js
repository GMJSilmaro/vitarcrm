import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Col, Form, OverlayTrigger, Row, Tooltip } from 'react-bootstrap';
import { useForm, useFormContext, Controller } from 'react-hook-form';
import { TooltipContent } from '@/components/common/ToolTipContent';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import { zodResolver } from '@hookform/resolvers/zod';
import { equipmentSchema } from '@/schema/job';
import JobEquipmentList from '../JobEquipmentList';
import { db } from '@/firebase';
import { collection, doc, getDoc, limit, onSnapshot, query, where } from 'firebase/firestore';
import { orderBy } from 'lodash';
import Select from 'react-select';
import { isProd } from '@/constants/environment';

const JobSummaryForm = ({ data, isLoading, handleNext }) => {
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
    const constraints = [orderBy('customerId', 'asc')];

    if (!isProd) {
      const devQueryConstraint = [where('customerId', '==', 'C003769'), limit(10)];
      devQueryConstraint.forEach((constraint) => constraints.push(constraint));
    }

    const q = query(collection(db, 'customers'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          setCustomersOptions({
            data: snapshot.docs.map((doc) => {
              const data = doc.data();

              return {
                id: doc.id,
                name: data.customerName,
                value: doc.id,
                label: `${data.customerId} - ${data.customerName}`,
                locations: data?.locations && Array.isArray(data.locations) ? data.locations : [],
                contacts: data?.customerContact &&  Array.isArray(data.customerContact) ? data.customerContact : [], //prettier-ignore
              };
            }),
            isLoading: false,
            isError: false,
          });
        }
      },
      (err) => {
        console.error(err.message);
        setCustomersOptions({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
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
        }
      });
    }
  }, [form.watch('location.value')]);

  //* query equipments
  useEffect(() => {
    const constraints = [orderBy('inventoryId', 'asc')];

    if (!isProd) {
      const devQueryConstraint = [limit(10)];
      devQueryConstraint.forEach((constraint) => constraints.push(constraint));
    }

    const q = query(collection(db, 'equipments'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshop) => {
        if (!snapshop.empty) {
          setEquipmentsOptions({
            data: snapshop.docs.map((doc) => {
              const data = doc.data();

              return {
                value: doc.id,
                label: `${data.inventoryId} - ${data.tagId} - ${data.description}`,
                ...data,
              };
            }),
          });
        }
      },
      (err) => {
        console.error(err.message);
        setEquipmentsOptions({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  const formatCustomerOptionLabel = (data) => {
    return (
      <div className='d-flex justify-content-between align-items-center gap-2 text-capitalize'>
        <span>{data.label}</span>
        <span className='d-flex column-gap-2'>
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
    return (
      <div className='d-flex justify-content-between align-items-center gap-2 text-capitalize'>
        <span>{data.label}</span>
        <span className='d-flex column-gap-2'>
          <Badge bg='primary'>{data.category}</Badge>
          <Badge bg='warning'>{data.certificateNo}</Badge>
        </span>
      </div>
    );
  };

  const handleCustomerChange = (option, field) => {
    field.onChange(option);

    //* contact options
    const cOptions = option.contacts.map((contact) => ({
      value: contact.id,
      label: `${contact.firstName} ${contact.lastName}`,
      ...contact,
    }));

    //* location options
    const lOptions = option.locations.map((location) => ({
      value: location.siteId,
      label: `${location.siteId} - ${location.siteName}`,
      ...location,
    }));

    if (cOptions.length > 0) {
      setContactsOpions(cOptions);
      const defaultContact = cOptions.find(contact => contact.isDefault) //prettier-ignore
      if (defaultContact) {
        form.setValue('contact', defaultContact);
        form.clearErrors('contact');
      }
    }

    if (lOptions.length > 0) {
      setLocationsOptions(lOptions);
      const defaultLocation = lOptions.find(location => location.isDefault) //prettier-ignore
      if (defaultLocation) {
        form.setValue('location', defaultLocation);
        form.clearErrors('location');
      }
    }
  };

  const handleAddEquipment = () => {
    equipmentForm.trigger('equipment');
    const data = equipmentForm.getValues('equipment');
    if (!data) return;
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

  //* set customer, contact & location if data exist
  useEffect(() => {
    if (data && customersOptions.data.length > 0) {
      //* selected customer
      const customer = customersOptions.data.find((option) => option.value === data.customer.id);

      //* contact options
      const cOptions = customer.contacts.map((contact) => ({
        value: contact.id,
        label: `${contact.firstName} ${contact.lastName}`,
        ...contact,
      }));

      //* location options
      const lOptions = customer.locations.map((location) => ({
        value: location.siteId,
        label: `${location.siteId} - ${location.siteName}`,
        ...location,
      }));

      //* selected contact
      const contact = cOptions.find((contact) => contact.value === data.contact.id);
      //* selected location
      const location = lOptions.find((location) => location.value === data.location.id);

      //* set options
      setContactsOpions(cOptions);
      setLocationsOptions(lOptions);

      //* set form values
      form.setValue('customer', customer);
      form.setValue('contact', contact);
      form.setValue('location', location);
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

  return (
    <>
      <Row>
        <Form.Group as={Col} md='6'>
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
      <h5 className='mb-1'>Primary Contact</h5>
      <p className='text-muted'>Details about the customer contact.</p>
      <Row className='mb-3'>
        <Form.Group as={Col} md='6'>
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
            value={form.watch('contact.firstName')}
            readOnly
            disabled
          />
        </Form.Group>
        <Form.Group as={Col} md='3'>
          <Form.Label>Last name</Form.Label>
          <Form.Control
            required
            type='text'
            value={form.watch('contact.lastName')}
            readOnly
            disabled
          />
        </Form.Group>
        <Form.Group as={Col} md='3'>
          <Form.Label>Phone</Form.Label>
          <Form.Control
            required
            type='text'
            value={form.watch('contact.phone')}
            readOnly
            disabled
          />
        </Form.Group>
        <Form.Group as={Col} md='3'>
          <Form.Label>Phone</Form.Label>
          <Form.Control
            required
            type='text'
            value={form.watch('contact.email')}
            readOnly
            disabled
          />
        </Form.Group>
      </Row>
      <hr className='my-4' />
      <h5
        className='mb-1'
        style={{ cursor: 'pointer' }}
        onClick={() => setShowLocationFields((prev) => !prev)}
      >
        Job Address {showLocationFields ? '(-)' : '(+)'}
      </h5>
      <p className='text-muted'>Details about the location/site.</p>

      {showLocationFields && (
        <>
          <Row className='mb-3'>
            <Form.Group as={Col} md='6'>
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
                  locationIsLoading
                    ? 'Loading...'
                    : form.watch('location.additionalInformation.locationCoordinates.latitude')
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
                    : form.watch('location.additionalInformation.locationCoordinates.longitude')
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
                value={locationIsLoading ? 'Loading...' : form.watch('location.streetAddress1')}
                readOnly
                disabled
              />
            </Form.Group>
            <Form.Group as={Col} md='4'>
              <Form.Label>Street Address #2</Form.Label>
              <Form.Control
                required
                type='text'
                value={locationIsLoading ? 'Loading...' : form.watch('location.streetAddress2')}
                readOnly
                disabled
              />
            </Form.Group>
            <Form.Group as={Col} md='4'>
              <Form.Label>Street Address #3</Form.Label>
              <Form.Control
                required
                type='text'
                value={locationIsLoading ? 'Loading...' : form.watch('location.streetAddress3')}
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
                value={locationIsLoading ? 'Loading...' : form.watch('location.city')}
                readOnly
                disabled
              />
            </Form.Group>
            <Form.Group as={Col} md='4'>
              <Form.Label>Postal Code</Form.Label>
              <Form.Control
                required
                type='text'
                value={locationIsLoading ? 'Loading...' : form.watch('location.postalCode')}
                readOnly
                disabled
              />
            </Form.Group>
            <Form.Group as={Col} md='4'>
              <Form.Label>Province</Form.Label>
              <Form.Control
                required
                type='text'
                value={locationIsLoading ? 'Loading...' : form.watch('location.province')}
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
                value={locationIsLoading ? 'Loading...' : form.watch('location.country')}
                readOnly
                disabled
              />
            </Form.Group>
          </Row>
        </>
      )}
      <hr className='my-4' />
      <h5
        className='mb-1'
        style={{ cursor: 'pointer' }}
        onClick={() => setShowEquipmentFields((prev) => !prev)}
      >
        Job Equipments {showEquipmentFields ? '(-)' : '(+)'}
      </h5>
      <p className='text-muted'>Details about the equipment needed for the job.</p>

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
                        "Search by equipment's tag id, inventory id or description",
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
                        }}
                        formatOptionLabel={formatEquipmentOptionLabel}
                        options={equipmentsOptions.data}
                        isDisabled={equipmentsOptions.isLoading || equipmentsOptions.length < 1}
                        placeholder="Search by equipment's tag id, inventory id or description"
                        noOptionsMessage={() => 'No equipments found'}
                      />

                      <Button size='sm' onClick={() => handleAddEquipment()}>
                        Add
                      </Button>
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

      <div className='d-flex justify-content-end align-items-center'>
        <Button disabled={isLoading} type='button' className='mt-2' onClick={handleNext}>
          Next
        </Button>
      </div>
    </>
  );
};

export default JobSummaryForm;
