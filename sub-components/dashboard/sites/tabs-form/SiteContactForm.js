import { RequiredLabel } from '@/components/Form/RequiredLabel';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { Badge, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { Dash, Plus, Save, X } from 'react-bootstrap-icons';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import Select from '@/components/Form/Select';

const SiteContactForm = ({ data, isLoading, handleNext, handlePrevious }) => {
  const router = useRouter();

  const [contactsOptions, setContactsOptions] = useState([]);

  const form = useFormContext();

  const formErrors = form.formState.errors;

  const { fields, append, remove } = useFieldArray({
    name: 'contacts',
    control: form.control,
  });

  const handleAddContact = () => {
    append({
      id: '',
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      isDefault: fields.length === 0,
      additionalInformation: {},
    });
  };

  const handleRemoveContact = (index) => {
    remove(index);
  };

  //* set contacts options
  useEffect(() => {
    if (form.getValues('customer')) {
      const customer = form.getValues('customer');

      if (customer.contacts && Array.isArray(customer.contacts) && customer.contacts.length > 0) {
        setContactsOptions(
          customer.contacts.map((contact) => {
            return {
              value: contact.id,
              label: `${contact.firstName} ${contact.lastName} - ${contact.email}`,
              ...contact,
            };
          })
        );
      }
    }
  }, [form.watch('customer')]);

  //* set contacts, if data exist
  useEffect(() => {
    if (data && contactsOptions.length > 0) {
      const selectedContactOptions = contactsOptions.filter((option) =>
        data?.contacts.includes(option.value)
      );

      form.setValue(
        'contacts',
        selectedContactOptions.map((option) => ({ ...option, id: option }))
      );
    }
  }, [data, contactsOptions]);

  return (
    <>
      <Card className='shadow-none'>
        <Card.Body className='pb-0'>
          <Form>
            <div className='d-flex justify-content-between align-items-center mb-3'>
              <div>
                <h4 className='mb-0'>Contact Details</h4>
                <p className='text-muted m-0'>Contacts Loaded from the selected customer</p>
              </div>

              <Button variant='primary' size='sm' className='ms-2' onClick={handleAddContact}>
                <Plus size={14} className='me-2' />
                Add Additional Contact
              </Button>
            </div>
          </Form>

          {fields.length === 0 && (
            <div className='text-center py-5'>
              <h4 className='mb-0'>No contact added yet.</h4>
              <p className='text-muted fs-6'>Click "Add Additional Contact" to begin.</p>
            </div>
          )}

          {fields.length > 0 &&
            fields.map((_field, i) => (
              <Card key={_field.id} className='border mb-4'>
                <Card.Header className='d-flex justify-content-between align-items-center bg-light'>
                  <div className='d-flex gap-2 align-items-end'>
                    <h6 className='mb-0'>Contact #{i + 1}</h6>

                    {_field.isDefault && (
                      <Badge className='me-2' bg='primary'>
                        Default
                      </Badge>
                    )}
                  </div>

                  {!_field.isDefault && (
                    <Button variant='link' className='p-0' onClick={() => handleRemoveContact(i)}>
                      <X size={20} className='text-danger' />
                    </Button>
                  )}
                </Card.Header>

                <Card.Body>
                  <Row>
                    <Col md={12}>
                      <Form.Group className='mb-3'>
                        <RequiredLabel label='Contact Details' id='contact' />

                        <Controller
                          key={_field.id}
                          name={`contacts.${i}.id`}
                          control={form.control}
                          render={({ field }) => (
                            <>
                              <Select
                                {...field}
                                inputId='contacts'
                                instanceId='contacts'
                                onChange={(option) => {
                                  field.onChange(option);
                                  form.setValue(`contacts.${i}.firstName`, option.firstName);
                                  form.setValue(`contacts.${i}.lastName`, option.lastName);
                                  form.setValue(`contacts.${i}.email`, option.email);
                                  form.setValue(`contacts.${i}.phone`, option.phone);
                                  form.setValue(`contacts.${i}.isDefault`, option.isDefault);
                                  form.setValue(`contacts.${i}.additionalInformation`, option.additionalInformation); // prettier-ignore
                                }}
                                options={contactsOptions}
                                placeholder='Search by contacts'
                                isDisabled={contactsOptions.length < 1}
                                noOptionsMessage={() => 'No contacts found'}
                              />

                              {formErrors && formErrors.contacts?.[i]?.id?.message && (
                                <Form.Text className='text-danger'>
                                  {formErrors.contacts?.[i]?.id?.message}
                                </Form.Text>
                              )}
                            </>
                          )}
                        />
                      </Form.Group>

                      {(!form.getValues(`contacts.${i}.id`) ||
                        form.getValues(`contacts.${i}.id`) !== 'create') && (
                        <Button
                          className='p-0'
                          variant='link'
                          onClick={() => {
                            form.setValue(`contacts.${i}.id`, 'create');
                            form.setValue(`contacts.${i}.firstName`, '');
                            form.setValue(`contacts.${i}.lastName`, '');
                            form.setValue(`contacts.${i}.email`, '');
                            form.setValue(`contacts.${i}.phone`, '');
                            form.setValue(`contacts.${i}.isDefault`, false);
                            form.setValue(`contacts.${i}.additionalInformation`, {}); // prettier-ignore
                            form.clearErrors(`contacts.${i}`);
                          }}
                        >
                          <Plus size={14} className='me-2' />
                          New Contact
                        </Button>
                      )}

                      {form.getValues(`contacts.${i}.id`) &&
                        form.getValues(`contacts.${i}.id`) === 'create' && (
                          <>
                            <Button
                              className='p-0'
                              variant='link'
                              onClick={() => {
                                form.setValue(`contacts.${i}.id`, '');
                                form.clearErrors(`contacts.${i}`);
                              }}
                            >
                              <Dash size={14} className='me-2' />
                              Remove Contact
                            </Button>

                            <Card className='mt-4 p-4 shadow-none bg-light'>
                              <Row>
                                <Col md={6}>
                                  <Form.Group className='mb-3'>
                                    <RequiredLabel label='First Name' id='firstName' />

                                    <Controller
                                      key={_field.id}
                                      name={`contacts.${i}.firstName`}
                                      control={form.control}
                                      render={({ field }) => (
                                        <>
                                          <Form.Control
                                            {...field}
                                            id='firstName'
                                            type='text'
                                            placeholder='Enter first name'
                                          />

                                          {formErrors &&
                                            formErrors.contacts?.[i]?.firstName?.message && (
                                              <Form.Text className='text-danger'>
                                                {formErrors.contacts?.[i]?.firstName?.message}
                                              </Form.Text>
                                            )}
                                        </>
                                      )}
                                    />
                                  </Form.Group>
                                </Col>

                                <Col md={6}>
                                  <Form.Group className='mb-3'>
                                    <RequiredLabel label='Last Name' id='lastName' />

                                    <Controller
                                      key={_field.id}
                                      name={`contacts.${i}.lastName`}
                                      control={form.control}
                                      render={({ field }) => (
                                        <>
                                          <Form.Control
                                            {...field}
                                            id='lastName'
                                            type='text'
                                            placeholder='Enter last name'
                                          />

                                          {formErrors &&
                                            formErrors.contacts?.[i]?.lastName?.message && (
                                              <Form.Text className='text-danger'>
                                                {formErrors.contacts?.[i]?.lastName?.message}
                                              </Form.Text>
                                            )}
                                        </>
                                      )}
                                    />
                                  </Form.Group>
                                </Col>

                                <Col md={6}>
                                  <Form.Group className='mb-3'>
                                    <RequiredLabel label='Email' id='email' />

                                    <Controller
                                      key={_field.id}
                                      name={`contacts.${i}.email`}
                                      control={form.control}
                                      render={({ field }) => (
                                        <>
                                          <Form.Control
                                            {...field}
                                            id='email'
                                            type='text'
                                            placeholder='Enter email'
                                          />

                                          {formErrors &&
                                            formErrors.contacts?.[i]?.email?.message && (
                                              <Form.Text className='text-danger'>
                                                {formErrors.contacts?.[i]?.email?.message}
                                              </Form.Text>
                                            )}
                                        </>
                                      )}
                                    />
                                  </Form.Group>
                                </Col>

                                <Col md={6}>
                                  <Form.Group className='mb-3'>
                                    <RequiredLabel label='Phone' id='phone' />

                                    <Controller
                                      key={_field.id}
                                      name={`contacts.${i}.phone`}
                                      control={form.control}
                                      render={({ field }) => (
                                        <>
                                          <Form.Control
                                            {...field}
                                            id='phone'
                                            type='text'
                                            placeholder='Enter phone'
                                          />

                                          {formErrors &&
                                            formErrors.contacts?.[i]?.phone?.message && (
                                              <Form.Text className='text-danger'>
                                                {formErrors.contacts?.[i]?.phone?.message}
                                              </Form.Text>
                                            )}
                                        </>
                                      )}
                                    />
                                  </Form.Group>
                                </Col>
                              </Row>
                            </Card>
                          </>
                        )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))}

          <div className='mt-4 d-flex justify-content-between align-items-center w-100'>
            <Button
              disabled={isLoading}
              type='button'
              variant='outline-primary'
              onClick={handlePrevious}
            >
              Previous
            </Button>

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
                  {data ? 'Update' : 'Create'} {' Site'}
                </>
              )}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </>
  );
};

export default SiteContactForm;
