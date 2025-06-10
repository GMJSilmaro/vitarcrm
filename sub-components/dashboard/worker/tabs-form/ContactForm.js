import { TooltipContent } from '@/components/common/ToolTipContent';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import Select from '@/components/Form/Select';
import { EMERGENCY_CONTACT_RELATIONSHIP } from '@/schema/users';
import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, InputGroup, OverlayTrigger, Row, Tooltip } from 'react-bootstrap';
import { Controller, useFormContext } from 'react-hook-form';

const ContactForm = ({ data, isLoading, handleNext, handlePrevious }) => {
  const form = useFormContext();
  const formErrors = form.formState.errors;

  const [emergencyRelationshipOptions] = useState(EMERGENCY_CONTACT_RELATIONSHIP.map((relationship) => ({ value: relationship, label: _.capitalize(relationship) }))); //prettier-ignore

  //* set emergency relationship if data exist
  useEffect(() => {
    if (data && emergencyRelationshipOptions.length > 0) {
      const emergencyRelationship = emergencyRelationshipOptions.find(
        (option) => option.value === data.emergencyRelationship
      );
      form.setValue('emergencyRelationship', emergencyRelationship);
    }
  }, [data, emergencyRelationshipOptions]);

  return (
    <Card className='shadow-none'>
      <Card.Body>
        <div>
          <h4 className='mb-0'>Contact Info</h4>
          <p className='text-muted fs-6'>Details about user's personal and emergency contacts.</p>
        </div>

        <Row className='mb-3 row-gap-3'>
          <Form.Group as={Col} md={4}>
            <RequiredLabel label='Primary Phone No.' id='primaryPhone' />

            <Controller
              name='primaryPhone'
              control={form.control}
              render={({ field: primaryPhoneField }) => (
                <>
                  {}
                  <InputGroup>
                    <Form.Control
                      {...primaryPhoneField}
                      style={{ marginTop: '1px' }}
                      id='primaryPhone'
                      placeholder='Enter Primary Phone No.'
                    />
                    <InputGroup.Text>
                      <Controller
                        name='isPrimaryPhoneActive'
                        control={form.control}
                        render={({ field }) => (
                          <Form.Check
                            className='align-items-end'
                            type='switch'
                            id='isPrimaryPhoneActive'
                            label='Active'
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                        )}
                      />
                    </InputGroup.Text>
                  </InputGroup>

                  {formErrors && formErrors.primaryPhone?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.primaryPhone?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <RequiredLabel label='Secondary Phone No.' id='secondaryPhone' />

            <Controller
              name='secondaryPhone'
              control={form.control}
              render={({ field: secondaryPhoneField }) => (
                <>
                  <InputGroup>
                    <Form.Control
                      {...secondaryPhoneField}
                      style={{ marginTop: '1px' }}
                      id='secondaryPhone'
                      placeholder='Enter Secondary Phone No.'
                    />
                    <InputGroup.Text>
                      <Controller
                        name='isSecondaryPhoneActive'
                        control={form.control}
                        render={({ field }) => (
                          <Form.Check
                            className='align-items-end'
                            type='switch'
                            id='isSecondaryPhoneActive'
                            label='Active'
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                        )}
                      />
                    </InputGroup.Text>
                  </InputGroup>
                </>
              )}
            />
          </Form.Group>
        </Row>

        <div>
          <h4 className='mb-0'>Emergency Contact</h4>
          <p className='text-muted fs-6'>Details about user's emergency contact.</p>
        </div>

        <Row className='row-gap-3'>
          <Form.Group as={Col} md={4}>
            <Form.Label htmlFor='emergencyContactName'>Name</Form.Label>

            <Controller
              name='emergencyContactName'
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control
                    {...field}
                    id='emergencyContactName'
                    type='text'
                    placeholder='Enter Name'
                  />
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <Form.Label htmlFor='emergencyContactPhone'>Phone No.</Form.Label>

            <Controller
              name='emergencyContactPhone'
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control
                    {...field}
                    id='emergencyContactPhone'
                    type='text'
                    placeholder='Enter Name'
                  />
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <Form.Label className='me-1' htmlFor='emergencyRelationship'>
              Relationship
            </Form.Label>
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  <TooltipContent title='Relationship Search' info={['Search by relationship']} />
                </Tooltip>
              }
            >
              <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
            </OverlayTrigger>

            <Controller
              name='emergencyRelationship'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    id='emergencyRelationship'
                    inputId='emergencyRelationship'
                    instanceId='emergencyRelationship'
                    onChange={(option) => field.onChange(option)}
                    options={emergencyRelationshipOptions}
                    placeholder='Select relationship'
                    noOptionsMessage={() => 'No relationship found'}
                  />

                  {formErrors && formErrors.emergencyRelationship?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.emergencyRelationship?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>
        </Row>

        <Row className='mb-3 row-gap-3'>
          <div>
            <hr className='my-4' />
            <h4 className='mb-0'>Address</h4>
            <p className='text-muted fs-6'>Details about user's permanent address.</p>
          </div>

          <Form.Group as={Col} md={4}>
            <Form.Label htmlFor='address.streetAddress'>Street Address</Form.Label>

            <Controller
              name='address.streetAddress'
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control
                    {...field}
                    id='address.streetAddress'
                    type='text'
                    placeholder='Enter Street Address'
                  />
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <Form.Label htmlFor='address.stateProvince'>State</Form.Label>

            <Controller
              name='address.stateProvince'
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control
                    {...field}
                    id='address.stateProvince'
                    type='text'
                    placeholder='Enter State'
                  />
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <Form.Label htmlFor='address.postalCode'>Postal Code</Form.Label>

            <Controller
              name='address.postalCode'
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control
                    {...field}
                    id='address.postalCode'
                    type='text'
                    placeholder='Enter Zip Code / Postal Code'
                  />
                </>
              )}
            />
          </Form.Group>
        </Row>

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
  );
};

export default ContactForm;
