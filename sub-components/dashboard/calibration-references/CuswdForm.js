import { TooltipContent } from '@/components/common/ToolTipContent';
import FormDebug from '@/components/Form/FormDebug';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import Select from '@/components/Form/Select';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { CLASS_TYPE, cuswdSchema } from '@/schema/calibrationReferences';
import { getFormDefaultValues } from '@/utils/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, OverlayTrigger, Row, Spinner, Tooltip } from 'react-bootstrap';
import { Save } from 'react-bootstrap-icons';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const CuswdForm = ({ data }) => {
  const router = useRouter();
  const auth = useAuth();

  const [isLoading, setIsLoading] = useState();
  const [isSavedNew, setIsSavedNew] = useState(false);

  const [classTypeOptions] = useState(CLASS_TYPE.map((classType) => ({ value: classType, label: classType }))); //prettier-ignore

  const form = useForm({
    mode: 'onChange',
    defaultValues: { ...getFormDefaultValues(cuswdSchema), ...data },
    resolver: zodResolver(cuswdSchema),
  });

  const formErrors = form.formState.errors;

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);

      const collectionRef = collection(db, 'jobCalibrationReferences', 'CR000001', 'data');

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
        window.location.assign(`/calibration-references/mass/cuswd/create`);
      } else {
        router.push(`/calibration-references/mass/cuswd/edit-cuswd/${formData.refId}`);
      }
    } catch (error) {
      console.error('Error submitting reference data:', error);
      setIsLoading(false);
      setIsSavedNew(false);
      toast.error('Something went wrong. Please try again later.');
    }
  };

  //* query last cuswd ref id
  useEffect(() => {
    if (data) return;

    const q = query(collection(db, 'jobCalibrationReferences', 'CR000001', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const id = snapshot.docs.pop().id.replace('CR', '');
          const lastCuswdRefId = parseInt(id, 10);

          form.setValue('refId', `CR${(lastCuswdRefId + 1).toString().padStart(6, '0')}`);
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

  //* set class type, if data exist
  useEffect(() => {
    if (data && classTypeOptions.length > 0) {
      const classType = classTypeOptions.find((option) => option.value === data.class);
      form.setValue('class', classType);
    }
  }, [data, classTypeOptions]);

  return (
    <>
      {/* <FormDebug form={form} /> */}

      <FormProvider {...form}>
        <Form onSubmit={form.handleSubmit(handleSubmit)}>
          <Card className='shadow-none'>
            <Card.Body>
              <h4 className='mb-0'>Correction, Uncertainty of the Standard Weight & Drift Info</h4>
              <p className='text-muted fs-6'>
                Details about the correction, uncertainty of the standard weight & drift.
              </p>

              <Row className='row-gap-3'>
                <Form.Group as={Col} md={3}>
                  <Form.Label>Reference Id</Form.Label>
                  <Form.Control type='text' value={form.watch('refId')} readOnly disabled />
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
                  <RequiredLabel label='Class' id='class' />
                  <OverlayTrigger
                    placement='right'
                    overlay={
                      <Tooltip>
                        <TooltipContent title='Class type Search' info={['Search by class type']} />
                      </Tooltip>
                    }
                  >
                    <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
                  </OverlayTrigger>

                  <Controller
                    name='class'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Select
                          {...field}
                          inputId='class'
                          instanceId='class'
                          onChange={(option) => field.onChange(option)}
                          options={classTypeOptions}
                          placeholder='Search by class'
                          noOptionsMessage={() => 'No class found'}
                        />

                        {formErrors && formErrors.class?.message && (
                          <Form.Text className='text-danger'>{formErrors.class?.message}</Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <RequiredLabel label='Nominal Value' id='nominalValue' />

                  <Controller
                    name='nominalValue'
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
                          id='nominalValue'
                          placeholder='Enter Nominal Value'
                          type='string'
                        />

                        {formErrors && formErrors.nominalValue?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.nominalValue?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='currentYearError'>Current Year Error (mg)</Form.Label>

                  <Controller
                    name='currentYearError'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='currentYearError'
                          placeholder='Enter Current Year Error (mg)'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.currentYearError?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.currentYearError?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='currentYearActualValue'>
                    Current Year Actual Value (g)
                  </Form.Label>

                  <Controller
                    name='currentYearActualValue'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='currentYearActualValue'
                          placeholder='Enter Current Year Actual Value (g)'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.currentYearActualValue?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.currentYearActualValue?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='lastYearError'>Last Year Year Error (mg)</Form.Label>

                  <Controller
                    name='lastYearError'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='lastYearError'
                          placeholder='Enter Last Year Error (mg)'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.lastYearError?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.lastYearError?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='lastYearActualValue'>Last Year Actual Value (g)</Form.Label>

                  <Controller
                    name='lastYearActualValue'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='lastYearActualValue'
                          placeholder='Enter Last Year Actual Value (g)'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.lastYearActualValue?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.lastYearActualValue?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='eUncertainty'>E. Uncertainty (mg)</Form.Label>

                  <Controller
                    name='eUncertainty'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='eUncertainty'
                          placeholder='Enter E. Uncertainty (mg)'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.eUncertainty?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.eUncertainty?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='uCertg'>
                    <div className='d-flex align-items-center gap-1'>
                      <div>
                        U<sub>cert</sub>
                      </div>
                      <div>(g)</div>
                    </div>
                  </Form.Label>

                  <Controller
                    name='uCertg'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='uCertg'
                          placeholder='Enter Ucert (g)'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.uCertg?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.uCertg?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='uCert2g2'>
                    <div className='d-flex align-items-center gap-1'>
                      <div>
                        U
                        <sub>
                          cert<sup>2</sup>
                        </sub>
                      </div>
                      <div>
                        (g<sup>2</sup>)
                      </div>
                    </div>
                  </Form.Label>

                  <Controller
                    name='uCert2g2'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='uCert2g2'
                          placeholder='Enter Ucert2 (g2)'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.uCert2g2?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.uCert2g2?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='uCert4vG4'>
                    <div className='d-flex align-items-center gap-1'>
                      <div>
                        U
                        <sub>
                          cert<sup>4</sup>
                        </sub>{' '}
                        / <small>V</small>
                      </div>
                      <div>
                        (g<sup>4</sup>)
                      </div>
                    </div>
                  </Form.Label>

                  <Controller
                    name='uCert4vG4'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='uCert4vG4'
                          placeholder='Enter Ucert4 / v (g4)'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.uCert4vG4?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.uCert4vG4?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='uInstg'>
                    <div className='d-flex align-items-center gap-1'>
                      <div>
                        U<sub>inst</sub>
                      </div>
                      <div>(g)</div>
                    </div>
                  </Form.Label>

                  <Controller
                    name='uInstg'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='uInstg'
                          placeholder='Enter Uinst (g)'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.uInstg?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.uInstg?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='uInst2g2'>
                    <div className='d-flex align-items-center gap-1'>
                      <div>
                        U
                        <sub>
                          inst<sup>2</sup>
                        </sub>
                      </div>
                      <div>
                        (g<sup>2</sup>)
                      </div>
                    </div>
                  </Form.Label>

                  <Controller
                    name='uInst2g2'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='uInst2g2'
                          placeholder='Enter Uints2 (g2)'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.uInst2g2?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.uInst2g2?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='uInst4vG4'>
                    <div className='d-flex align-items-center gap-1'>
                      <div>
                        U
                        <sub>
                          inst<sup>4</sup>
                        </sub>{' '}
                        / <small>V</small>
                      </div>
                      <div>
                        (g<sup>4</sup>)
                      </div>
                    </div>
                  </Form.Label>

                  <Controller
                    name='uInst4vG4'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='uInst4vG4'
                          placeholder='Enter Uints4 / v (g4)'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.uInst4vG4?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.uInst4vG4?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='prKgMn3'>
                    <div className='d-flex align-items-center gap-1'>
                      <div>
                        P<sub>r</sub>
                      </div>
                      <div>
                        (kg m<sup>-3</sup>)
                      </div>
                    </div>
                  </Form.Label>

                  <Controller
                    name='prKgMn3'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='prKgMn3'
                          placeholder='Enter Pr (kg m-3)'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.prKgMn3?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.prKgMn3?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='uPrKgMn3'>
                    <div className='d-flex align-items-center gap-1'>
                      <div>
                        <sup>U</sup>(P<sub>r</sub>)
                      </div>
                      <div>
                        (kg m<sup>-3</sup>)
                      </div>
                    </div>
                  </Form.Label>

                  <Controller
                    name='uPrKgMn3'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='uPrKgMn3'
                          placeholder='Enter U(Pr) (kg m-3)'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.uPrKgMn3?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.uPrKgMn3?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label htmlFor='driftg'>Drift (g)</Form.Label>

                  <Controller
                    name='driftg'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control
                          {...field}
                          id='driftg'
                          placeholder='Enter Drift (g)'
                          type='number'
                          step='any'
                        />

                        {formErrors && formErrors.driftg?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.driftg?.message}
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
                  onClick={() => router.push('/calibration-references/mass/cuswd')}
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

export default CuswdForm;
