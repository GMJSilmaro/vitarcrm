import FormDebug from '@/components/Form/FormDebug';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import {
  CATEGORY_INVENTORY_ID_PREFIX_MAP,
  referenceEquipmentSchema,
} from '@/schema/referenceEquipment';
import { getFormDefaultValues } from '@/utils/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import _ from 'lodash';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { Save } from 'react-bootstrap-icons';
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';

const ReferenceEquipmentForm = ({ data }) => {
  const router = useRouter();
  const auth = useAuth();
  const { category } = router.query;

  const [isLoading, setIsLoading] = useState();
  const [isSavedNew, setIsSavedNew] = useState(false);

  const form = useForm({
    mode: 'onChange',
    defaultValues: { ...getFormDefaultValues(referenceEquipmentSchema), ...data },
    resolver: zodResolver(referenceEquipmentSchema),
  });

  const formErrors = form.formState.errors;

  const inventoryId = useWatch({ name: 'inventoryId', control: form.control });

  const categoryTitle =
    category
      ?.split(' ')
      ?.map((str) => _.capitalize(str))
      ?.join(' ') || '';

  const categoryObj = useMemo(() => {
    const categoryValue = String(category).toUpperCase();
    const prefix = CATEGORY_INVENTORY_ID_PREFIX_MAP[categoryValue];

    if (!category || !prefix) return null;

    return { value: categoryValue, prefix };
  }, [category]);

  if (!category || !categoryObj) return null;

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);

      if (!data || data?.tagId !== formData.tagId) {
        //* check if equipment tagId exist
        const q = query(
          collection(db, 'equipments'),
          where('tagId', '==', formData.tagId),
          limit(1)
        );

        const refEquipment = await getDocs(q);

        if (!refEquipment.empty) {
          form.setError('tagId', { type: 'custom', message: 'Tag ID already exist' });
          setIsLoading(false);
          setIsSavedNew(false);
          return;
        }
      }

      const collectionRef = collection(db, 'equipments');

      await setDoc(
        doc(collectionRef, formData.inventoryId),
        {
          ...formData,
          ...(!data && { createdAt: serverTimestamp(), createdBy: auth.currentUser }),
          updatedAt: serverTimestamp(),
          updatedBy: auth.currentUser,
        },
        { merge: true }
      );

      toast.success(
        `Reference equipment #${formData.inventoryId} ${
          data ? 'updated' : 'created'
        } successfully.`,
        { position: 'top-right' }
      );
      setIsLoading(false);

      if (isSavedNew) {
        window.location.assign(`/reference-equipment/${String(category).toLowerCase()}/create`);
      } else {
        router.push(
          `/reference-equipment/${String(category).toLowerCase()}/edit-reference-equipment/${
            formData.inventoryId
          }`
        );
      }
    } catch (error) {
      console.error('Error submitting reference equipment:', error);
      setIsLoading(false);
      setIsSavedNew(false);
      toast.error('Something went wrong. Please try again later.');
    }
  };

  //* query last reference equipment id regardless of category
  useEffect(() => {
    if (data) return;

    const q = query(collection(db, 'equipments'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const ids = snapshot.docs.map((doc) => doc.id.toString().replaceAll(/\D/g, ''));
          const idsNumber = ids.map((id) => parseInt(id)).sort((a, b) => a - b);

          const lastId = idsNumber.pop();
          const currentId = (lastId + 1).toString().padStart(6, '0');

          console.log({ ids, idsNumber, lastId });

          form.setValue('inventoryId', `${categoryObj.prefix}${currentId}`);
          form.setValue('category', categoryObj.value);
        } else form.setValue('inventoryId', `${categoryObj.prefix}000001`);
      },
      (err) => {
        console.error(err.message);
        toast.error('Error fetching current reference equipment id');
      }
    );

    return () => unsubscribe();
  }, [JSON.stringify(data), JSON.stringify(categoryObj)]);

  return (
    <>
      {/* <FormDebug form={form} /> */}

      <FormProvider {...form}>
        <Form onSubmit={form.handleSubmit(handleSubmit)}>
          <Card className='shadow-none'>
            <Card.Body>
              <h4 className='mb-0'>Reference Equipment</h4>
              <p className='text-muted fs-6'>
                Details about the reference equipment. This equipment will be used for calibration
              </p>

              <Row className='row-gap-3'>
                <Form.Group as={Col} md={3}>
                  <Form.Label>Inventory Id</Form.Label>
                  <Form.Control type='text' value={inventoryId} readOnly disabled />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <RequiredLabel label='Category' id='category' />
                  <Form.Control type='text' value={categoryTitle} readOnly disabled />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <RequiredLabel label='Tag Id' id='tagId' />

                  <Controller
                    name='tagId'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control {...field} id='tagId' placeholder='Enter Tag ID' />

                        {formErrors && formErrors.tagId?.message && (
                          <Form.Text className='text-danger'>{formErrors.tagId?.message}</Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='description'>Description</Form.Label>

                  <Controller
                    name='description'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='description'
                          placeholder='Enter description'
                          type='text'
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

                  <Controller
                    name='make'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control {...field} id='make' placeholder='Enter make' type='text' />

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
                        <Form.Control {...field} id='model' placeholder='Enter model' type='text' />

                        {formErrors && formErrors.model?.message && (
                          <Form.Text className='text-danger'>{formErrors.model?.message}</Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='serialNumber'>Serial Number</Form.Label>

                  <Controller
                    name='serialNumber'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='serialNumber'
                          placeholder='Enter serial number'
                          type='text'
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
                  <Form.Label htmlFor='type'>Type</Form.Label>

                  <Controller
                    name='type'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control {...field} id='type' placeholder='Enter type' type='text' />

                        {formErrors && formErrors.type?.message && (
                          <Form.Text className='text-danger'>{formErrors.type?.message}</Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='certificateNo'>Certificate No.</Form.Label>

                  <Controller
                    name='certificateNo'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='certificateNo'
                          placeholder='Enter certificate no.'
                          type='text'
                        />

                        {formErrors && formErrors.certificateNo?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.certificateNo?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='traceability'>Traceability</Form.Label>

                  <Controller
                    name='traceability'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='traceability'
                          placeholder='Enter traceability'
                          type='text'
                        />

                        {formErrors && formErrors.traceability?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.traceability?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <hr className='my-4' />

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='rangeMin'>Mininum Range</Form.Label>

                  <Controller
                    name='rangeMin'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='rangeMin'
                          placeholder='Enter minimum range'
                          type='text'
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
                  <Form.Label htmlFor='rangeMinPercent'>Mininum Range %</Form.Label>

                  <Controller
                    name='rangeMinPercent'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='rangeMinPercent'
                          placeholder='Enter minimum range %'
                          type='text'
                        />

                        {formErrors && formErrors.rangeMinPercent?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.rangeMinPercent?.message}
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
                          {...field}
                          id='rangeMax'
                          placeholder='Enter maximum range'
                          type='text'
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
                  <Form.Label htmlFor='rangeMaxPercent'>Maximum Range %</Form.Label>

                  <Controller
                    name='rangeMaxPercent'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='rangeMaxPercent'
                          placeholder='Enter maximum range %'
                          type='text'
                        />

                        {formErrors && formErrors.rangeMaxPercent?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.rangeMaxPercent?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='uncertainty'>Uncertainty</Form.Label>

                  <Controller
                    name='uncertainty'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='uncertainty'
                          placeholder='Enter uncertainty'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.uncertainty?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.uncertainty?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='uncertaintyUnit'>Uncertainty Unit</Form.Label>

                  <Controller
                    name='uncertaintyUnit'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='uncertaintyUnit'
                          placeholder='Enter uncertainty unit'
                          type='text'
                        />

                        {formErrors && formErrors.uncertaintyUnit?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.uncertaintyUnit?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='k'>K</Form.Label>

                  <Controller
                    name='k'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='k'
                          placeholder='Enter k'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.k?.message && (
                          <Form.Text className='text-danger'>{formErrors.k?.message}</Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='dueDate'>Due Date</Form.Label>

                  <Controller
                    name='dueDate'
                    control={form.control}
                    render={({ field }) => <Form.Control {...field} id='dueDate' type='date' />}
                  />
                </Form.Group>
              </Row>

              <div className='mt-4 d-flex justify-content-between align-items-center'>
                <Button
                  disabled={isLoading}
                  type='button'
                  variant='outline-danger'
                  onClick={() => router.push('/calibration-references/mass/ck')}
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
    </>
  );
};

export default ReferenceEquipmentForm;
