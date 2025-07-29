import SignatureField from '@/components/common/SignaturePad';
import Select from '@/components/Form/Select';
import { db } from '@/firebase';
import { format } from 'date-fns';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, Row, Spinner, Table } from 'react-bootstrap';
import { Save } from 'react-bootstrap-icons';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

function JobOnSiteCalibrationSurveyForm({ data, isLoading, handleNext, handlePrevious }) {
  const form = useFormContext();
  const formErrors = form.formState.errors;

  const [surveyQuestions, setSurveyQuestions] = useState({
    data: [],
    isLoading: true,
    isError: false,
  });

  const { fields, update, replace } = useFieldArray({
    name: 'surveyResponses',
    control: form.control,
  });

  const startByAt = useMemo(() => {
    if (!data?.startByAt) return '';
    return format(new Date(data.startByAt.toDate()), 'dd MMMM yyyy hh:mm a');
  }, [data]);

  const endByAt = useMemo(() => {
    if (!data?.endByAt) return '';
    return format(new Date(data.endByAt.toDate()), 'dd MMMM yyyy hh:mm a');
  }, [data]);

  const renderWorkers = useMemo(() => {
    const value = form.watch('workers')?.map((worker) => worker?.name).filter(Boolean) || [] // prettier-ignore

    if (value.length < 1) return '';

    if (value.length >= 2) {
      const lastWorker = value.pop();

      return (
        <>
          {value.map((worker) => (
            <span>
              <span className='fw-bold text-decoration-underline'>{worker}</span>,{' '}
            </span>
          ))}
          and <span className='fw-bold text-decoration-underline'>{lastWorker}</span>
        </>
      );
    } else return <span>{value[0]}</span>;
  }, [form.watch('workers')]);

  //* query survey questions
  useEffect(() => {
    if (data) {
      const q = query(
        collection(db, 'surveyQuestions'),
        where('category', '==', 'on-site-calibration-survey')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const surveyQuestionsData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            setSurveyQuestions({
              data: surveyQuestionsData,
              isLoading: false,
              isError: false,
            });
            return;
          }

          setSurveyQuestions({
            data: [],
            isLoading: false,
            isError: false,
          });
        },
        (err) => {
          console.error(err.message);
          setSurveyQuestions({ data: [], isLoading: false, isError: true });
        }
      );

      return () => unsubscribe();
    }
  }, [data]);

  //* surveyTo default to pic,
  useEffect(() => {
    if (data) {
      if (form.getValues('pic')) form.setValue('surveyTo', form.getValues('pic'));
      else form.setValue('surveyTo', data?.surveyTo || '');
    }
  }, [data, form.watch('pic')]);

  //* set surveyResponses if data exist
  useEffect(() => {
    if (data) {
      if (data?.surveyResponses?.length > 0) {
        const values = data?.surveyResponses?.map(item => ({...item, value: item?.response, label: _.startCase(item.response)})) || [] // prettier-ignore
        replace(values || []);
      }
    }
  }, [data]);

  return (
    <Card className='shadow-none'>
      <Card.Body className='pb-0'>
        <Row className='mb-3 row-gap-3'>
          <Form.Group as={Col} md={6}>
            <Form.Label htmlFor='surveyTo'>To</Form.Label>

            <Controller
              name='surveyTo'
              control={form.control}
              render={({ field }) => (
                <Form.Control {...field} id='surveyTo' placeholder='Enter to' />
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={6}>
            <Form.Label>Date</Form.Label>
            <Form.Control
              required
              type='text'
              value={format(form.watch('startDate'), 'dd-MM-yyyy')}
              readOnly
              disabled
            />
          </Form.Group>

          <Form.Group as={Col} md={12}>
            <Form.Label>Company</Form.Label>
            <Form.Control
              required
              type='text'
              value={form.watch('customer.name')}
              readOnly
              disabled
            />
          </Form.Group>
        </Row>

        <div className='my-5'>
          <p className='text-muted mb-1'>Dear Most Valued Customer,</p>

          <p className='text-muted mb-1'>
            In order for us to serve you better, kindly assist us in completing this survey. Your
            comment and perception of us is highly appreciated. Thank you very much for your
            valuation time and feedback.
          </p>

          <p className='text-muted mb-1'>
            Please allow Mr / Miss <span className='fw-bold'>{renderWorkers}</span> from
            Vitar-Segatec Sdn. Bhd. to carry out the calibration job at your company.
          </p>

          <p className='text-muted mb-1'>
            Please verify the time in and time out of our team at your company.
          </p>
        </div>

        {/* {JSON.stringify(fields, null, 2)} */}

        <Row className='mb-3 row-gap-4'>
          <Form.Group
            className='d-flex flex-column justify-content-center align-items-center'
            as={Col}
          >
            <Controller
              name='surveyCustomerSignature'
              control={form.control}
              render={({ field }) => (
                <div className='d-flex justify-content-center flex-column align-items-center text-center'>
                  <div className='d-flex gap-2'>
                    <span className='fw-bold'>Time In:</span>
                    <span>{startByAt}</span>
                  </div>

                  <div className='d-flex gap-2 mb-2'>
                    <span className='fw-bold'>Time Out:</span>
                    <span>{endByAt}</span>
                  </div>

                  <SignatureField onChange={field.onChange} value={field.value} />
                  <div className='text-muted'>{form.watch('customer.name')}</div>
                </div>
              )}
            />
          </Form.Group>
        </Row>

        <p className='mt-10'>Please answer the following survey questions.</p>

        <Table className='text-center align-middle' bordered responsive>
          <thead>
            <tr>
              <th style={{ width: '5%' }}>No.</th>
              <th style={{ width: '60%' }}>Criteria</th>
              <th>Satisfaction Level</th>
            </tr>
          </thead>

          <tbody>
            {surveyQuestions.isLoading && (
              <tr>
                <td colSpan={3}>
                  <div
                    className='d-flex justify-content-center align-items-center py-5'
                    style={{ height: '100px' }}
                  >
                    <Spinner className='me-2' s animation='border' size='sm' /> Loading...
                  </div>
                </td>
              </tr>
            )}

            {surveyQuestions.data.length < 1 &&
              !surveyQuestions.isLoading &&
              !surveyQuestions.isError && (
                <tr>
                  <td colSpan={6}>
                    <div
                      className='d-flex justify-content-center align-items-center fs-6'
                      style={{ height: '100px' }}
                    >
                      No data available
                    </div>
                  </td>
                </tr>
              )}

            {surveyQuestions.isError && (
              <tr>
                <td colSpan={6}>
                  <div
                    className='d-flex justify-content-center align-items-center text-center py-5'
                    style={{ height: '100px' }}
                  >
                    <div>
                      <h4 className='text-danger mb-0'>Error</h4>
                      <p className='text-muted fs-6'>
                        Something went wrong. Please try again later.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {!surveyQuestions.isLoading &&
              !surveyQuestions.error &&
              surveyQuestions.data
                .sort((a, b) => a.order - b.order)
                .map((q, index) => {
                  if (q.type === 'radio') {
                    return (
                      <tr key={q.questionId}>
                        <td>{q.order}</td>
                        <td>{q.question}</td>
                        <td>
                          <Controller
                            name={`surveyResponses.${index}.response`}
                            control={form.control}
                            render={({ field }) => (
                              <Select
                                {...field}
                                value={fields?.[index] || ''}
                                inputId={`surveyResponses.${index}.response`}
                                instanceId={`surveyResponses.${index}.response`}
                                onChange={(option) => {
                                  update(index, {
                                    questionId: q.questionId,
                                    response: option.value,
                                    ...option,
                                  });
                                }}
                                options={q.options.map((option) => ({
                                  label: _.startCase(option),
                                  value: option,
                                }))}
                                placeholder='Select response'
                                noOptionsMessage={() => 'No options found'}
                              />
                            )}
                          />
                        </td>
                      </tr>
                    );
                  }

                  if (q.type === 'text') {
                    return (
                      <tr key={q.questionId}>
                        <td>{q.order}</td>
                        <td colSpan={2}>
                          <div className='d-flex flex-column gap-2'>
                            <div>{q.question}</div>
                            <div>
                              <Controller
                                key={q.questionId}
                                name={`surveyResponses.${index}.response`}
                                control={form.control}
                                render={({ field }) => (
                                  <Form.Control
                                    {...field}
                                    value={fields?.[index]?.response || ''}
                                    as='textarea'
                                    rows={2}
                                    className='fs-5 text-center'
                                    onChange={(e) =>
                                      update(index, {
                                        questionId: q.questionId,
                                        response: e.target.value,
                                      })
                                    }
                                    placeholder='Enter response'
                                  />
                                )}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return null;
                })}
          </tbody>
        </Table>

        <div className='mt-4 d-flex justify-content-between align-items-center'>
          <Button
            disabled={isLoading}
            type='button'
            variant='outline-primary'
            onClick={handlePrevious}
          >
            Previous
          </Button>

          <Button type='button' onClick={handleNext} disabled={isLoading}>
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
                {data ? 'Update' : 'Create'} {' Job'}
              </>
            )}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}

export default JobOnSiteCalibrationSurveyForm;
