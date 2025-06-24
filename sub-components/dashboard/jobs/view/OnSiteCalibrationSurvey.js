import OnSiteCalibrationSurveyPDF from '@/components/pdf/OnSiteCalibrationSurveyPDF';
import { usePDF } from '@react-pdf/renderer';
import { format } from 'date-fns';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Button, Card, Image, Spinner, Table } from 'react-bootstrap';
import { Download, Printer } from 'react-bootstrap-icons';

function OnSiteCalibrationSurvey({ job, customer, surveyQuestions }) {
  const iframeRef = useRef(null);
  const [instance, updateInstance] = usePDF();

  const startByAt = useMemo(() => {
    if (!job?.startByAt) return '';
    return format(new Date(job.startByAt.toDate()), 'dd MMMM yyyy hh:mm a');
  }, [job]);

  const endByAt = useMemo(() => {
    if (!job?.endByAt) return '';
    return format(new Date(job.endByAt.toDate()), 'dd MMMM yyyy hh:mm a');
  }, [job]);

  const surveyResponses = useMemo(() => {
    return job?.surveyResponses || [];
  }, [job]);

  const renderWorkers = useMemo(() => {
    const value = job?.workers?.map((worker) => worker?.name).filter(Boolean) || [] // prettier-ignore

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
    } else return <span className='fw-bold text-decoration-underline'>{value[0]}</span>;
  }, [job]);

  const downloadPDF = useCallback(
    (id) => {
      const link = document.createElement('a');
      link.href = instance.url;
      link.download = `JOB-${id}-ONSITE-CALIBRATION-SURVEY.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [instance.url]
  );

  const printPDF = useCallback(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      iframe.src = instance.url;
      iframe.onload = () => iframe.contentWindow?.print();
    }
  }, [instance.url, iframeRef]);

  useEffect(() => {
    if (job && customer.data && surveyQuestions.data) {
      //* trigger re-render for pdf
      updateInstance(
        <OnSiteCalibrationSurveyPDF
          job={job}
          customer={customer}
          surveyQuestions={surveyQuestions}
        />
      );
    }
  }, [
    customer.isLoading,
    surveyQuestions.isLoading,
    JSON.stringify(job),
    JSON.stringify(customer.data),
    JSON.stringify(surveyQuestions.data),
  ]);

  if (customer.isLoading || surveyQuestions.isLoading) {
    return (
      <Card className='border-0 shadow-none'>
        <Card.Body
          className='d-flex justify-content-center align-items-center'
          style={{ height: '70vh' }}
        >
          <Spinner animation='border' variant='primary' />
          <span className='ms-3'>Loading On-Site Calibration Survey...</span>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className='border-0 shadow-none'>
      <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h4 className='mb-0'>On-Site Calibration Survey</h4>
            <p className='text-muted fs-6 mb-0'>
              Details about the job's on-site calibration survey and can be downloaded/print here.
            </p>
          </div>

          <div className='d-flex align-items-center gap-2'>
            <Button onClick={() => printPDF()}>
              <Printer size={18} className='me-2' />
              Print
            </Button>

            <iframe ref={iframeRef} style={{ display: 'none' }} />

            {instance.url && job.id && (
              <Button variant='outline-primary' onClick={() => downloadPDF(job.id)}>
                <Download size={18} className='me-2' />
                Download
              </Button>
            )}
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <Table className='w-75 mx-auto text-center fs-6 align-middle mt-3 mb-5' bordered responsive>
          <tbody>
            <tr>
              <th>Date</th>
              <td colSpan={6}>{format(new Date(), 'dd MMMM yyyy')}</td>
            </tr>
            <tr>
              <th>To</th>
              <td colSpan={6}>{job?.surveyTo || ''}</td>
            </tr>
            <tr>
              <th>Company</th>
              <td colSpan={6}>{customer?.data?.customerName || ''}</td>
            </tr>
          </tbody>
        </Table>
      </Card.Body>

      <Card.Body>
        <div>
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
      </Card.Body>

      <Card.Header className='bg-transparent border-0 pt-4 pb-0 mb-4'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h4 className='mb-0'>Time In / Time Out</h4>
            <p className='text-muted fs-6 mb-0'>
              Details about the time in and time out of assigned technician/s and signatures of the
              customer.
            </p>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <div className='d-flex flex-wrap justify-content-center align-items-end w-75 mx-auto column-gap-5'>
          <div
            className='d-flex flex-column justify-content-center align-items-center '
            style={{ maxWidth: '300px' }}
          >
            <div className='d-flex gap-2 mb-2'>
              <span className='fw-bold'>Time In:</span>
              <span>{startByAt}</span>
            </div>
            <div className='container p-5 border rounded d-flex flex-column justify-content-center align-items-center'>
              {job?.surveyCustomerTimeInSignature ? (
                <Image
                  className='w-100 h-100'
                  src={job?.surveyCustomerTimeInSignature}
                  alt='customer'
                />
              ) : (
                <>
                  <h1 className='fs-5 fw-bold mb-0'>No Data Yet</h1>
                  <p className='text-muted fs-6 mb-0 text-center'>
                    Please update the the On-Site Calibration Survey in the job
                  </p>
                </>
              )}
            </div>
            <div className='text-muted text-center mt-2'>{customer?.data?.customerName || ''}</div>
          </div>

          <div
            className='d-flex flex-column justify-content-center align-items-center '
            style={{ maxWidth: '300px' }}
          >
            <div className='d-flex gap-2 mb-2'>
              <span className='fw-bold'>Time Out:</span>
              <span>{endByAt}</span>
            </div>
            <div className='container p-5 border rounded d-flex flex-column justify-content-center align-items-center'>
              {job?.surveyCustomerTimeOutSignature ? (
                <Image
                  className='w-100 h-100'
                  src={job?.surveyCustomerTimeOutSignature}
                  alt='customer'
                />
              ) : (
                <>
                  <h1 className='fs-5 fw-bold mb-0'>No Data Yet</h1>
                  <p className='text-muted fs-6 mb-0 text-center'>
                    Please update the the On-Site Calibration Survey in the job
                  </p>
                </>
              )}
            </div>
            <div className='text-muted text-center mt-2'>{customer?.data?.customerName || ''}</div>
          </div>
        </div>
      </Card.Body>

      <Card.Header className='bg-transparent border-0 pt-4 pb-0 mb-4'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h4 className='mb-0'>Survey Responses</h4>
            <p className='text-muted fs-6 mb-0'>Details about the survey responses.</p>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
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
                        <td className='fw-bold'>
                          {_.startCase(
                            surveyResponses?.find(
                              (response) => response.questionId === q.questionId
                            )?.response
                          )}
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
                            <div className='fw-bold'>
                              {surveyResponses?.find(
                                (response) => response.questionId === q.questionId
                              )?.response || ''}
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
      </Card.Body>
    </Card>
  );
}

export default OnSiteCalibrationSurvey;
