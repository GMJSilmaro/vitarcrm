import { RequiredLabel } from '@/components/Form/RequiredLabel';

import { getFormDefaultValues } from '@/utils/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Col, Form, OverlayTrigger, Row, Spinner, Tooltip } from 'react-bootstrap';
import { Save } from 'react-bootstrap-icons';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { db } from '@/firebase';
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

import { CATEGORY, customerEquipmentSchema } from '@/schema/customerEquipment';
import FormDebug from '@/components/Form/FormDebug';
import toast from 'react-hot-toast';
import { TooltipContent } from '@/components/common/ToolTipContent';
import Select from '@/components/Form/Select';
import _ from 'lodash';

const CustomerEquipmentForm = ({ data }) => {
  const router = useRouter();
  const { customerId } = router.query;
  const auth = useAuth();

  const [isLoading, setIsLoading] = useState();
  const [isSavedNew, setIsSavedNew] = useState(false);

  const [categoryOptions] = useState(CATEGORY.map((category) => ({ value: category, label: category.split(' ').map(str => _.capitalize(str)).join(' ') }))); //prettier-ignore

  const form = useForm({
    mode: 'onChange',
    defaultValues: { ...getFormDefaultValues(customerEquipmentSchema), ...data },
    resolver: zodResolver(customerEquipmentSchema),
  });

  const formErrors = form.formState.errors;

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);

      await setDoc(
        doc(db, 'customerEquipments', formData.equipmentId),
        {
          ...formData,
          customerId,
          ...(!data && { createdAt: serverTimestamp(), createdBy: auth.currentUser }),
          updatedAt: serverTimestamp(),
          updatedBy: auth.currentUser,
        },
        { merge: true }
      );

      toast.success(
        `Customer #${customerId} Equipment ${data ? 'updated' : 'created'} successfully.`,
        { position: 'top-right' }
      );
      setIsLoading(false);

      if (isSavedNew) {
        window.location.assign(`/customers/${customerId}/equipment/create`);
      } else {
        router.push(
          `/customers/${customerId}/equipment/edit-customer-equipment/${formData.equipmentId}`
        );
      }
    } catch (error) {
      console.error('Error submitting customer equipment:', error);
      setIsLoading(false);
      setIsSavedNew(false);
      toast.error('Something went wrong. Please try again later.');
    }
  };

  //* query last customer equipment  id
  useEffect(() => {
    if (data) return;

    const q = query(collection(db, 'customerEquipments'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const id = snapshot.docs.pop().id.replace('CE', '');
          const lastEquipmentId = parseInt(id, 10);

          form.setValue('equipmentId', `CE${(lastEquipmentId + 1).toString().padStart(6, '0')}`);
        } else form.setValue('equipmentId', 'CE000001');
      },
      (err) => {
        console.error(err.message);
        toast.error(err.message);
      }
    );

    return () => unsubscribe();
  }, []);

  //* set category, if data exist
  useEffect(() => {
    if (data && categoryOptions.length > 0) {
      const category = categoryOptions.find((option) => option.value === data.category);
      form.setValue('category', category);
    }
  }, [data, categoryOptions]);

  return (
    <FormProvider {...form}>
      <Form onSubmit={form.handleSubmit(handleSubmit)}>
        <Card className='shadow-none'>
          <Card.Body>
            <h4 className='mb-0'>Equipment Info</h4>
            <p className='text-muted fs-6'>Details about the customer equipment.</p>

            <Row className='row-gap-3'>
              <Form.Group as={Col} md={3}>
                <Form.Label>Equipment ID</Form.Label>
                <Form.Control type='text' value={form.watch('equipmentId')} readOnly disabled />
              </Form.Group>

              <Form.Group as={Col} md={3}>
                <RequiredLabel label='Description' id='description' />

                <Controller
                  name='description'
                  control={form.control}
                  render={({ field }) => (
                    <>
                      <Form.Control {...field} id='description' placeholder='Enter description' />

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
                        <Form.Text className='text-danger'>
                          {formErrors.category?.message}
                        </Form.Text>
                      )}
                    </>
                  )}
                />
              </Form.Group>

              <Form.Group as={Col} md={3}>
                <Form.Label htmlFor='make'>Make</Form.Label>

                <Controller
                  name='make'
                  control={form.control}
                  render={({ field }) => (
                    <>
                      <Form.Control {...field} id='make' placeholder='Enter make' />

                      {formErrors && formErrors.make?.message && (
                        <Form.Text className='text-danger'>{formErrors.make?.message}</Form.Text>
                      )}
                    </>
                  )}
                />
              </Form.Group>

              <Form.Group as={Col} md={3}>
                <Form.Label htmlFor='model'>Model</Form.Label>

                <Controller
                  name='model'
                  control={form.control}
                  render={({ field }) => (
                    <>
                      <Form.Control {...field} id='model' placeholder='Enter model' />

                      {formErrors && formErrors.model?.message && (
                        <Form.Text className='text-danger'>{formErrors.model?.message}</Form.Text>
                      )}
                    </>
                  )}
                />
              </Form.Group>

              <Form.Group as={Col} md={3}>
                <RequiredLabel label='Serial Number' id='serialNumber' />

                <Controller
                  name='serialNumber'
                  control={form.control}
                  render={({ field }) => (
                    <>
                      <Form.Control
                        {...field}
                        id='serialNumber'
                        placeholder='Enter serial number'
                      />

                      {formErrors && formErrors.serialNumber?.message && (
                        <Form.Text className='text-danger'>
                          {formErrors.serialNumber?.message}
                        </Form.Text>
                      )}
                    </>
                  )}
                />
              </Form.Group>

              <Form.Group as={Col} md={3}>
                <Form.Label htmlFor='rangeMin'>Minimum Range</Form.Label>

                <Controller
                  name='rangeMin'
                  control={form.control}
                  render={({ field }) => (
                    <>
                      <Form.Control
                        type='number'
                        {...field}
                        id='rangeMin'
                        placeholder='Enter minimum range'
                      />

                      {formErrors && formErrors.rangeMin?.message && (
                        <Form.Text className='text-danger'>
                          {formErrors.rangeMin?.message}
                        </Form.Text>
                      )}
                    </>
                  )}
                />
              </Form.Group>

              <Form.Group as={Col} md={3}>
                <Form.Label htmlFor='rangeMax'>Maximum Range</Form.Label>

                <Controller
                  name='rangeMax'
                  control={form.control}
                  render={({ field }) => (
                    <>
                      <Form.Control
                        type='number'
                        {...field}
                        id='rangeMax'
                        placeholder='Enter maximum range'
                      />

                      {formErrors && formErrors.rangeMax?.message && (
                        <Form.Text className='text-danger'>
                          {formErrors.rangeMax?.message}
                        </Form.Text>
                      )}
                    </>
                  )}
                />
              </Form.Group>

              <Form.Group as={Col} md={3}>
                <Form.Label htmlFor='uom'>Unit of Measure</Form.Label>

                <Controller
                  name='uom'
                  control={form.control}
                  render={({ field }) => (
                    <>
                      <Form.Control {...field} id='uom' placeholder='Enter Unit of Measure' />

                      {formErrors && formErrors.uom?.message && (
                        <Form.Text className='text-danger'>{formErrors.uom?.message}</Form.Text>
                      )}
                    </>
                  )}
                />
              </Form.Group>

              <Form.Group as={Col} md={9}>
                <Form.Label htmlFor='uom'>Notes</Form.Label>

                <Controller
                  name='notes'
                  control={form.control}
                  render={({ field }) => (
                    <>
                      <Form.Control
                        {...field}
                        id='notes'
                        as='textarea'
                        rows={1}
                        placeholder='Enter notes'
                      />

                      {formErrors && formErrors.notes?.message && (
                        <Form.Text className='text-danger'>{formErrors.notes?.message}</Form.Text>
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
                onClick={() => router.push('/customers')}
              >
                Cancel
              </Button>

              <div className='d-flex gap-2 align-items-center'>
                <Button
                  disabled={isLoading}
                  type='submit'
                  variant='outline-primary'
                  onClick={() => setIsSavedNew(true)}
                >
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
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={14} className='me-2' />
                      Save & New
                    </>
                  )}
                </Button>

                <Button type='submit' disabled={isLoading}>
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
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={14} className='me-2' />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Form>
    </FormProvider>
  );
};

export default CustomerEquipmentForm;
