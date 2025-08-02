import CustomerNotificationPDF from '@/components/pdf/CustomerNotificationPDF';
import { db } from '@/firebase';
import { usePDF } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Table, Image, Spinner } from 'react-bootstrap';
import { Download, Printer } from 'react-bootstrap-icons';

const CustomerNotification = ({ jobCn, job, customer }) => {
  const iframeRef = useRef(null);
  const [instance, updateInstance] = usePDF();

  const [worker, setWorker] = useState({ data: null, isLoading: true, isError: false });
  const [forVitarLabUseAuthorizeBy, setForVitarLabUseAuthorizeBy] = useState({ data: null, isLoading: true, isError: false }); //prettier-ignore

  const downloadPDF = useCallback(
    (id) => {
      const link = document.createElement('a');
      link.href = instance.url;
      link.download = `JOB-CN-${id}.pdf`;
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

  const customerEquipments = useMemo(() => {
    if (!customer?.data?.equipments || customer?.data?.equipments?.length < 1) {
      return { data: [], isLoading: false, isError: false };
    }

    return { data: customer?.data?.equipments, isLoading: false, isError: false };
  }, [JSON.stringify(customer)]);

  const calibratedInstruments = useMemo(() => {
    if (
      !customerEquipments ||
      customerEquipments.isLoading ||
      customerEquipments?.data?.length < 1 ||
      jobCn?.calibrationItems?.length < 1
    ) {
      return [];
    }

    return (
      jobCn?.calibrationItems
        ?.map((ci) => {
          const equipment = customerEquipments.data.find((ce) => ce.id === ci?.equipmentId);

          if (equipment) {
            return {
              ...ci,
              description: equipment.description,
              serialNumber: equipment.serialNumber,
              make: equipment.make,
              model: equipment.model,
            };
          }

          return null;
        })
        ?.filter(Boolean) || []
    );
  }, [JSON.stringify(customerEquipments), JSON.stringify(jobCn)]);

  //* set worker
  useEffect(() => {
    if (!jobCn?.worker) {
      setWorker({ data: null, isLoading: false, isError: false });
      return;
    }

    getDoc(doc(db, 'users', jobCn.worker))
      .then((snapshot) => {
        if (snapshot.exists()) {
          setWorker({
            data: {
              id: snapshot.id,
              ...snapshot.data(),
            },
            isLoading: false,
            isError: false,
          });

          return;
        }

        setWorker({ data: null, isLoading: false, isError: false });
      })
      .catch((err) => {
        console.error(err.message);
        setWorker({ data: null, isLoading: false, isError: true });
      });
  }, [JSON.stringify(jobCn)]);

  //* set authorized head section
  useEffect(() => {
    if (!jobCn?.forVitarLabUseAuthorizeBy) {
      setForVitarLabUseAuthorizeBy({ data: null, isLoading: false, isError: false });
      return;
    }

    getDoc(doc(db, 'users', jobCn.forVitarLabUseAuthorizeBy))
      .then((snapshot) => {
        if (snapshot.exists()) {
          setForVitarLabUseAuthorizeBy({
            data: {
              id: snapshot.id,
              ...snapshot.data(),
            },
            isLoading: false,
            isError: false,
          });

          return;
        }

        setForVitarLabUseAuthorizeBy({ data: null, isLoading: false, isError: false });
      })
      .catch((err) => {
        console.error(err.message);
        setForVitarLabUseAuthorizeBy({ data: null, isLoading: false, isError: true });
      });
  }, [JSON.stringify(jobCn)]);

  useEffect(() => {
    console.log('xxxxxxxx', { customerEquipments });
  }, [JSON.stringify(customerEquipments)]);

  //* render pdf
  useEffect(() => {
    if (
      !job.isLoading &&
      !customer.isLoading &&
      !customerEquipments.isLoading &&
      !worker.isLoading &&
      !forVitarLabUseAuthorizeBy.isLoading
    ) {
      //* trigger re-render for pdf
      updateInstance(
        <CustomerNotificationPDF
          jobCn={jobCn}
          job={job}
          customer={customer}
          customerEquipments={customerEquipments}
          worker={worker}
          forVitarLabUseAuthorizeBy={forVitarLabUseAuthorizeBy}
        />
      );
    }
  }, [
    JSON.stringify(job),
    JSON.stringify(customer),
    JSON.stringify(customerEquipments),
    JSON.stringify(worker),
    JSON.stringify(forVitarLabUseAuthorizeBy),
  ]);

  if (
    job.isLoading ||
    customer.isLoading ||
    customerEquipments.isLoading ||
    worker.isLoading ||
    forVitarLabUseAuthorizeBy.isLoading
  ) {
    return (
      <Card className='border-0 shadow-none'>
        <Card.Body
          className='d-flex justify-content-center align-items-center'
          style={{ height: '70vh' }}
        >
          <Spinner animation='border' variant='primary' />
          <span className='ms-3'>Loading Job CN...</span>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className='border-0 shadow-none'>
      <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h4 className='mb-0'>Customer Notification</h4>
            <p className='text-muted fs-6 mb-0'>
              Details about the job's customer notification and can be downloaded/print here.
            </p>
          </div>

          <div className='d-flex align-items-center gap-2'>
            <Button onClick={() => printPDF()}>
              <Printer size={18} className='me-2' />
              Print
            </Button>

            <iframe ref={iframeRef} style={{ display: 'none' }} />

            {instance.url && jobCn.id && (
              <Button variant='outline-primary' onClick={() => downloadPDF(jobCn.id)}>
                <Download size={18} className='me-2' />
                Download
              </Button>
            )}
          </div>
        </div>
      </Card.Header>

      <Card.Body className='pb-0'>
        <Table className='w-75 mx-auto text-center fs-6 align-middle mt-3' bordered responsive>
          <tbody>
            <tr>
              <th>To</th>
              <td colSpan={8}>{jobCn?.to || ''}</td>
            </tr>
            <tr>
              <th>Your Ref</th>
              <td colSpan={8}>{jobCn?.yourRef || ''}</td>
            </tr>
            <tr>
              <th>Company</th>
              <td colSpan={8}>{customer?.data?.customerName || ''}</td>
            </tr>
            <tr>
              <th>Attention</th>
              <td colSpan={8}>{jobCn?.attention || ''}</td>
            </tr>
            <tr>
              <th>Fax No</th>
              <td colSpan={8}>{jobCn?.faxNo || ''}</td>
            </tr>
          </tbody>
        </Table>
      </Card.Body>

      <Card.Body className='py-0'>
        <Table className='w-75 mx-auto text-center fs-6 align-middle mt-3' bordered responsive>
          <tbody>
            <tr>
              <th>From</th>
              <td colSpan={8}>VITAR – SEGATEC SDN. BHD.</td>
            </tr>
            <tr>
              <th>Our Ref</th>
              <td colSpan={8}>{jobCn.cnId}</td>
            </tr>
            <tr>
              <th>Date</th>
              <td colSpan={8}>{format(new Date(), 'dd MMMM yyyy')}</td>
            </tr>
          </tbody>
        </Table>
      </Card.Body>

      <Card.Body className='py-0'>
        <Table className='w-75 mx-auto text-center fs-6 align-middle mt-3' bordered responsive>
          <tbody>
            <tr>
              <td></td>
              <td colSpan={8} className='fs-4 fw-bold'>
                Information on Equipment Condition / Requirement
              </td>
            </tr>
            <tr>
              <th>Before Calibration</th>
              <td colSpan={8}>{jobCn?.isBeforeCalibration ? 'Yes' : 'No'}</td>
            </tr>
            <tr>
              <th>During Calibration</th>
              <td colSpan={8}>{jobCn?.isDuringCalibration ? 'Yes' : 'No'}</td>
            </tr>
            <tr>
              <th>After Calibration</th>
              <td colSpan={8}>{jobCn?.isAfterCalibration ? 'Yes' : 'No'}</td>
            </tr>
            <tr>
              <th>CMR No</th>
              <td colSpan={8}>{jobCn.jobId}</td>
            </tr>

            <tr>
              <td></td>
              <td colSpan={8} className='fs-4 fw-bold'>
                Calibrated Instruments
              </td>
            </tr>

            <tr>
              <th>Cert No.</th>
              <th>Instrument Name</th>
              <th>Serial No.</th>
              <th>
                Maker / <br />
                Manufacturer
              </th>
              <th>Model</th>
              <th>Broken</th>
              <th>Inoperative</th>
              <th>Require Accessories</th>
              <th>Others</th>
            </tr>

            {calibratedInstruments.length < 1 && (
              <tr>
                <td colSpan={9}>
                  <div
                    className='d-flex justify-content-center align-items-center fs-6'
                    style={{ height: '100px' }}
                  >
                    No data available
                  </div>
                </td>
              </tr>
            )}

            {customerEquipments.isError && (
              <tr>
                <td colSpan={9}>
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

            {calibratedInstruments.length > 0 &&
              calibratedInstruments
                .filter((ci) => ci.isSelected)
                .sort((a, b) => {
                  if (!a?.description || !b?.description) return 0;
                  return a?.description?.localeCompare(b?.description);
                })
                .map((equipment, i) => (
                  <tr key={`${equipment.equipmentId}-${i}`}>
                    <td>{equipment?.certificateNumber || ''}</td>
                    <td>{equipment?.description || ''}</td>
                    <td>{equipment?.serialNumber || ''}</td>
                    <td>{equipment?.make || ''}</td>
                    <td>{equipment?.model || ''}</td>
                    <td>{equipment?.isBroken ? 'Yes' : 'No'}</td>
                    <td>{equipment?.isInOperative ? 'Yes' : 'No'}</td>
                    <td>{equipment?.isRequireAccessories ? 'Yes' : 'No'}</td>
                    <td>{equipment?.others || ''}</td>
                  </tr>
                ))}
          </tbody>
        </Table>
      </Card.Body>

      <Card.Body className='pt-0'>
        <Table className='w-75 mx-auto text-center fs-6 align-middle mt-3' bordered responsive>
          <tbody>
            <tr>
              <td></td>
              <td colSpan={8} className='fs-4 fw-bold'>
                Please act soonest to
              </td>
            </tr>
            <tr>
              <th style={{ maxWidth: '150px' }}>
                Send the accessories as above mentioned as soon as possible.
              </th>
              <td colSpan={8}>{jobCn?.isSendTheAccessories ? 'Yes' : 'No'}</td>
            </tr>
            <tr>
              <th style={{ maxWidth: '150px' }}>Acknowledge / Confirm.</th>
              <td colSpan={8}>{jobCn?.isAcknowledgeConfirm ? 'Yes' : 'No'}</td>
            </tr>
            <tr>
              <th style={{ maxWidth: '150px' }}>Arrange for collection of this equipment.</th>
              <td colSpan={8}>{jobCn?.isArrangeForCollection ? 'Yes' : 'No'}</td>
            </tr>

            <tr>
              <th style={{ maxWidth: '150px' }}>Others</th>
              <td colSpan={8}>{jobCn?.isOthers ? jobCn?.others || '' : 'N/A'}</td>
            </tr>
          </tbody>
        </Table>
      </Card.Body>

      <p className='text-muted mb-4 d-inline-block w-100 text-center'>
        Should you have any further queries on the above mentioned, please contact{' '}
        <span className='fw-bold'>Mr. Avinaash Palanisamy.</span> Thank you.
      </p>

      <div className='d-flex flex-wrap justify-content-center align-items-end w-75 mx-auto column-gap-5 pb-5'>
        <div
          className='d-flex flex-column justify-content-center align-items-center '
          style={{ maxWidth: '300px' }}
        >
          <div className='container p-5 border rounded d-flex flex-column justify-content-center align-items-center'>
            {worker?.data?.signature ? (
              <Image className='w-100 h-100' src={worker?.data?.signature} alt='worker' />
            ) : (
              <>
                <h1 className='fs-5 fw-bold mb-0'>No Data Yet</h1>
                <p className='text-muted fs-6 mb-0 text-center'>Please update the the job CN</p>
              </>
            )}
          </div>
          <div className='mt-2 fw-bold'>Technician</div>
          <div className='text-muted text-center'>{worker?.data?.fullName || ''}</div>
        </div>
      </div>

      <Card.Header className='bg-transparent border-0 pt-4 pb-0 mb-4'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h4 className='mb-0'>Customer Reply Section</h4>
            <p className='text-muted fs-6 mb-0'>Customer authorization and remarks details</p>
          </div>
        </div>
      </Card.Header>

      <Card.Body className='pb-0'>
        <p className='text-muted mb-4 d-inline-block w-100 text-center'>
          We acknowledge the information given / required
        </p>

        <Table className='w-75 mx-auto text-center fs-6 align-middle' bordered responsive>
          <tbody>
            <tr>
              <th>Remarks</th>
              <td colSpan={8}>{jobCn?.customerReplyRemarks || ''}</td>
            </tr>
          </tbody>
        </Table>

        <div className='d-flex flex-wrap justify-content-center align-items-end w-75 mx-auto column-gap-5 pt-4'>
          <div
            className='d-flex flex-column justify-content-center align-items-center '
            style={{ maxWidth: '300px' }}
          >
            <div className='container p-5 border rounded d-flex flex-column justify-content-center align-items-center'>
              {jobCn?.customerReplyAuthorizeSignature ? (
                <Image
                  className='w-100 h-100'
                  src={jobCn?.customerReplyAuthorizeSignature}
                  alt='customerReplyAuthorizeSignature'
                />
              ) : (
                <>
                  <h1 className='fs-5 fw-bold mb-0'>No Data Yet</h1>
                  <p className='text-muted fs-6 mb-0 text-center'>Please update the the job CN</p>
                </>
              )}
            </div>
            <div className='mt-2 fw-bold'>Authorize by:</div>
            <div className='text-muted text-center'>{jobCn?.to || ''}</div>
            <div className='text-muted text-center'>{format(new Date(), 'dd MMMM yyyy')}</div>
          </div>
        </div>

        <Card.Header className='bg-transparent border-0 pt-4 pb-0 mb-4'>
          <div className='d-flex justify-content-center align-items-center'>
            <div style={{ maxWidth: '600px' }}>
              <h4 className='mb-0 text-center'>Important Notice</h4>
              <p className='text-muted fs-6 mb-0 text-center'>
                Please inform us if you have any objection and if we do not received any reply
                within <span className='fw-bold'>3 working days</span>, we assumed that you have
                agreed our explanation or action.
              </p>
            </div>
          </div>
        </Card.Header>

        <Card.Header className='bg-transparent border-0 pt-4 pb-0 mb-4'>
          <div className='d-flex justify-content-between align-items-center'>
            <div>
              <h4 className='mb-0'>For Vitar-Segatec Lab Use Only</h4>
              <p className='text-muted fs-6 mb-0'>(After Customer Reply)</p>
            </div>
          </div>
        </Card.Header>

        <Card.Body className='pt-0'>
          <Table className='w-75 mx-auto text-center fs-6 align-middle mt-3' bordered responsive>
            <tbody>
              <tr>
                <td></td>
                <td colSpan={8} className='fs-4 fw-bold'>
                  Information provided above have been reviewed. <br /> Action to be taken
                </td>
              </tr>
              <tr>
                <th style={{ maxWidth: '150px' }}>Proceed with calibration</th>
                <td colSpan={8}>{jobCn?.forVitarLabUseIsProceed ? 'Yes' : 'No'}</td>
              </tr>
              <tr>
                <th style={{ maxWidth: '150px' }}>
                  No calibration required & return back to the customer.
                </th>
                <td colSpan={8}>{jobCn?.forVitarLabUseIsNoCalibrationRequired ? 'Yes' : 'No'}</td>
              </tr>

              <tr>
                <th style={{ maxWidth: '150px' }}>Others</th>
                <td colSpan={8}>
                  {jobCn?.forVitarLabUseIsOthers ? jobCn?.forVitarLabUseOthers || '' : 'N/A'}
                </td>
              </tr>
            </tbody>
          </Table>

          <div className='d-flex flex-wrap justify-content-center align-items-end w-75 mx-auto column-gap-5 pt-4'>
            <div
              className='d-flex flex-column justify-content-center align-items-center '
              style={{ maxWidth: '300px' }}
            >
              <div className='container p-5 border rounded d-flex flex-column justify-content-center align-items-center'>
                {forVitarLabUseAuthorizeBy?.data?.signature ? (
                  <Image
                    className='w-100 h-100'
                    src={forVitarLabUseAuthorizeBy?.data?.signature}
                    alt='forVitarLabUseAuthorizeBy'
                  />
                ) : (
                  <>
                    <h1 className='fs-5 fw-bold mb-0'>No Data Yet</h1>
                    <p className='text-muted fs-6 mb-0 text-center'>Please update the the job CN</p>
                  </>
                )}
              </div>
              <div className='mt-2 fw-bold'>Authorized by Head of Section</div>
              <div className='text-muted text-center'>
                {forVitarLabUseAuthorizeBy?.data?.fullName || ''}
              </div>
            </div>
          </div>
        </Card.Body>
      </Card.Body>
    </Card>
  );
};

export default CustomerNotification;
