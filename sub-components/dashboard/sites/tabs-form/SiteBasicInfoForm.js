import { TooltipContent } from '@/components/common/ToolTipContent';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import Select from '@/components/Form/Select';
import { isProd } from '@/constants/environment';
import { db } from '@/firebase';
import { STATUS } from '@/schema/location';
import { collection, getDocs, limit, onSnapshot, query, where } from 'firebase/firestore';
import _ from 'lodash';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { Badge, Button, Card, Col, Form, OverlayTrigger, Row, Tooltip } from 'react-bootstrap';
import { Controller, useFormContext } from 'react-hook-form';
import { toast } from 'react-toastify';

const SiteBasicInfoForm = ({ data, isLoading, handleNext }) => {
  const router = useRouter();

  const form = useFormContext();

  const formErrors = form.formState.errors;

  const [customersOptions, setCustomersOptions] = useState({ data: [], isLoading: true, isError: false }); //prettier-ignore
  const [statusesOptions] = useState(STATUS.map((status) => ({ value: status, label: _.capitalize(status) }))); //prettier-ignore

  const [lastSiteIdLoading, setLastSiteIdLoading] = useState(false);

  const handleCustomerChange = (option, field) => {
    field.onChange(option);
    form.setValue('contacts', []);
  };

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

  //* query & set last site id
  useEffect(() => {
    if (data) return;

    setLastSiteIdLoading(true);

    const q = query(collection(db, 'locations'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const lastSiteId = parseInt(snapshot.docs.pop().id.replace('S', ''), 10);

          form.setValue('siteId', `S${String(lastSiteId + 1).padStart(6, '0')}`);
          setLastSiteIdLoading(false);
        } else {
          form.setValue('siteId', 'S000000');
          setLastSiteIdLoading(false);
        }
      },
      (err) => {
        console.error(err.message);
        toast.error(err.message);
      }
    );

    return () => unsubscribe();
  }, [data]);

  //* query customers
  useEffect(() => {
    const constraints = [];

    if (!isProd) {
      const devQueryConstraint = [limit(20), where('customerId', '==', 'C003769')];
      devQueryConstraint.forEach((constraint) => constraints.push(constraint));
    }

    Promise.all([
      getDocs(query(collection(db, 'customers'), ...constraints)),
      getDocs(query(collection(db, 'contacts'))),
    ])
      .then(([customerSnapshot, contactsSnapshot]) => {
        const customerData = !customerSnapshot.empty ? customerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) : []; // prettier-ignore
        const contactsData = !contactsSnapshot.empty ? contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) : []; // prettier-ignore

        setCustomersOptions({
          data: customerData.map((customer) => {
            const contacts =
              customer?.contacts &&
              Array.isArray(customer?.contacts) &&
              contactsData.filter((contact) => customer?.contacts.includes(contact.id));

            return {
              id: customer.id,
              name: customer.customerName,
              value: customer.id,
              label: `${customer.customerId} - ${customer.customerName}`,
              locations: customer?.locations && Array.isArray(customer.locations) ? customer.locations : [], // prettier-ignore
              contacts,
            };
          }),
        });
      })
      .catch((err) => {
        console.error(err.message);
        setCustomersOptions({ data: [], isLoading: false, isError: true });
      });
  }, []);

  //* set default value
  useEffect(() => {
    form.setValue('status', statusesOptions[0]);
  }, []);

  //* set customers if data exist
  useEffect(() => {
    if (data && customersOptions.data.length > 0) {
      const customer = customersOptions.data.find((option) => option.value === data.customerId);
      form.setValue('customer', customer);
    }
  }, [data, customersOptions]);

  return (
    <>
      <Card className='shadow-none'>
        <Card.Body className='pb-0'>
          <Form>
            <h4 className='mb-0'>Basic Information</h4>
            <p className='text-muted fs-6'>Basic details about the site</p>

            <Row className='mb-3'>
              <Form.Group as={Col} md='6'>
                <Form.Label>ID</Form.Label>
                <Form.Control
                  required
                  type='text'
                  value={form.watch('siteId')}
                  readOnly
                  disabled
                  placeholder={lastSiteIdLoading ? 'Loading ID...' : ''}
                />
              </Form.Group>

              <Form.Group as={Col} md='6'>
                <RequiredLabel label='Name' id='siteName' />

                <Controller
                  name='siteName'
                  control={form.control}
                  render={({ field }) => (
                    <>
                      <Form.Control {...field} type='text' placeholder='Enter site name' />

                      {formErrors && formErrors.siteName?.message && (
                        <Form.Text className='text-danger'>
                          {formErrors.siteName?.message}
                        </Form.Text>
                      )}
                    </>
                  )}
                />
              </Form.Group>
            </Row>

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
                          'Selection will load related contacts',
                          'Required to proceed with location creation',
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
                        <Form.Text className='text-danger'>
                          {formErrors.customer?.message}
                        </Form.Text>
                      )}
                    </>
                  )}
                />
              </Form.Group>

              <Form.Group as={Col} md='6'>
                <RequiredLabel label='Status' id='status' />
                <OverlayTrigger
                  placement='right'
                  overlay={
                    <Tooltip>
                      <TooltipContent title='Site Status Search' info={['Search by site type']} />
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
                        inputId='status'
                        instanceId='status'
                        onChange={(option) => field.onChange(option)}
                        options={statusesOptions}
                        placeholder='Search by site status type'
                        noOptionsMessage={() => 'No site statuses found'}
                      />

                      {formErrors && formErrors.status?.message && (
                        <Form.Text className='text-danger'>{formErrors.status?.message}</Form.Text>
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
              variant='outline-danger'
              onClick={() => router.push('/sites')}
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

export default SiteBasicInfoForm;
