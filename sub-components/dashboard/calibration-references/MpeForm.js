import { TooltipContent } from '@/components/common/ToolTipContent';
import FormDebug from '@/components/Form/FormDebug';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import Select from '@/components/Form/Select';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { CLASS_TYPE, mpeSchema } from '@/schema/calibrationReferences';
import { getFormDefaultValues } from '@/utils/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, OverlayTrigger, Row, Spinner, Tooltip } from 'react-bootstrap';
import { Save } from 'react-bootstrap-icons';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const MpeForm = ({ data }) => {
  const router = useRouter();
  const auth = useAuth();

  const [isLoading, setIsLoading] = useState();
  const [isSavedNew, setIsSavedNew] = useState(false);

  const [classTypeOptions] = useState(CLASS_TYPE.map((classType) => ({ value: classType, label: classType }))); //prettier-ignore

  const form = useForm({
    mode: 'onChange',
    defaultValues: { ...getFormDefaultValues(mpeSchema), ...data },
    resolver: zodResolver(mpeSchema),
  });

  const formErrors = form.formState.errors;

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);

      const collectionRef = collection(db, 'jobCalibrationReferences', 'CR000002', 'data');

      await setDoc(
        doc(collectionRef, formData.refId),
        {
          ...formData,
          ...(!data && { createdAt: serverTimestamp(), createdBy: auth.currentUser }),
          updatedAt: serverTimestamp(),
          updatedBy: auth.currentUser,
        },
        { merge: true }
      );

      toast.success(
        `Reference data #${formData.refId} ${data ? 'updated' : 'created'} successfully.`,
        { position: 'top-right' }
      );
      setIsLoading(false);

      if (isSavedNew) {
        window.location.assign(`/calibration-references/mass/mpe/create`);
      } else {
        router.push(`/calibration-references/mass/mpe/edit-mpe/${formData.refId}`);
      }
    } catch (error) {
      console.error('Error submitting reference data:', error);
      setIsLoading(false);
      setIsSavedNew(false);
      toast.error('Something went wrong. Please try again later.');
    }
  };

  //* query last mpe ref id
  useEffect(() => {
    if (data) return;

    const q = query(collection(db, 'jobCalibrationReferences', 'CR000002', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const id = snapshot.docs.pop().id.replace('CR', '');
          const lastMpeRefId = parseInt(id, 10);

          form.setValue('refId', `CR${(lastMpeRefId + 1).toString().padStart(6, '0')}`);
        } else {
          form.setValue('refId', 'CR000001');
        }
      },
      (err) => {
        console.error(err.message);
        toast.error(err.message);
      }
    );

    return () => unsubscribe();
  }, []);

  //* set code type, if data exist
  useEffect(() => {
    if (data && classTypeOptions.length > 0) {
      const classType = classTypeOptions.find((option) => option.value === data.code);
      form.setValue('code', classType);
    }
  }, [data, classTypeOptions]);

  return (
    <>
      {/* <FormDebug form={form} /> */}

      <FormProvider {...form}>
        <Form onSubmit={form.handleSubmit(handleSubmit)}>
          <Card className='shadow-none'>
            <Card.Body>
              <h4 className='mb-0'>MPE Info</h4>
              <p className='text-muted fs-6'>Details about the MPE.</p>

              <Row className='row-gap-3'>
                <Form.Group as={Col} md={3}>
                  <Form.Label>Reference Id</Form.Label>
                  <Form.Control type='text' value={form.watch('refId')} readOnly disabled />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <RequiredLabel label='Code' id='code' />
                  <OverlayTrigger
                    placement='right'
                    overlay={
                      <Tooltip>
                        <TooltipContent title='Code Search' info={['Search by code']} />
                      </Tooltip>
                    }
                  >
                    <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
                  </OverlayTrigger>

                  <Controller
                    name='code'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Select
                          {...field}
                          inputId='code'
                          instanceId='code'
                          id='code'
                          onChange={(option) => field.onChange(option)}
                          options={classTypeOptions}
                          placeholder='Search by code'
                          noOptionsMessage={() => 'No code found'}
                        />

                        {formErrors && formErrors.code?.message && (
                          <Form.Text className='text-danger'>{formErrors.code?.message}</Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <RequiredLabel label='Weight' id='weight' />

                  <Controller
                    name='weight'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/[^0-9.*]/.test(value)) return;
                            field.onChange(value);
                          }}
                          id='weight'
                          placeholder='Enter Weight'
                          type='string'
                        />

                        {formErrors && formErrors.weight?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.weight?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <RequiredLabel label='MPE' id='mpe' />

                  <Controller
                    name='mpe'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='mpe'
                          placeholder='Enter MPE'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.mpe?.message && (
                          <Form.Text className='text-danger'>{formErrors.mpe?.message}</Form.Text>
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
                          placeholder='Enter Uncertainty'
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
              </Row>

              <div className='mt-4 d-flex justify-content-between align-items-center'>
                <Button
                  disabled={isLoading}
                  type='button'
                  variant='outline-danger'
                  onClick={() => router.push('/calibration-references/mass/mpe')}
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

export default MpeForm;
