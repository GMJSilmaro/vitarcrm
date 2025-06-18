import CmrPDF from '@/components/pdf/CmrPDF';
import { db } from '@/firebase';
import { usePDF } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Image, Table } from 'react-bootstrap';
import { Download, Printer } from 'react-bootstrap-icons';

const Cmr = ({ job, customer, contact, location, customerEquipments, calibrations }) => {
  const iframeRef = useRef(null);
  const [instance, updateInstance] = usePDF();

  const [worker, setWorker] = useState(null);
  const [isSettingWorker, setIsSettingWorker] = useState(false);
  const [labRepresentative, setLabRepresentative] = useState(null);
  const [isSettingLabRepresentative, setIsSettingLabRepresentative] = useState(false);

  const scope = useMemo(() => {
    const value = job?.scope;

    if (!value) return '';

    if (value === 'lab') return 'Permanent Lab. Calibration';
    else return 'On-site Calibration';
  }, [job]);

  const address = useMemo(() => {
    if (location.isLoading) return '';

    const locationData = location.data;

    if (!locationData) return '';

    const defaultAddress = locationData?.addresses?.find((a) => a.isDefault);
    if (!defaultAddress) return '';

    const fields = [
      defaultAddress?.street1,
      defaultAddress?.street2,
      defaultAddress?.street3,
      defaultAddress?.city,
      defaultAddress?.province,
      defaultAddress?.postalCode,
      defaultAddress?.country,
    ];

    return fields.filter(Boolean).join(' ');
  }, [location.data, location.isLoading]);

  const completedEquipment = useMemo(() => {
    if (customerEquipments.isLoading || calibrations.isLoading) return [];

    const result = calibrations.data
      .map((c) => customerEquipments.data.find((ce) => ce.id === c.description?.id))
      .filter(Boolean);

    return result;
  }, [
    customerEquipments.data,
    customerEquipments.isLoading,
    calibrations.data,
    calibrations.isLoading,
  ]);

  const downloadPDF = useCallback(
    (id) => {
      const link = document.createElement('a');
      link.href = instance.url;
      link.download = `JOB-${id}-CMR.pdf`;
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
    if (
      !customer.isLoading &&
      !location.isLoading &&
      !customerEquipments.isLoading &&
      !calibrations.isLoading &&
      job &&
      customer.data &&
      location.data &&
      customerEquipments.data &&
      calibrations.data
    ) {
      //* trigger re-render for pdf
      updateInstance(
        <CmrPDF
          job={job}
          customer={customer}
          contact={contact}
          location={location}
          customerEquipments={customerEquipments}
          calibrations={calibrations}
        />
      );
    }
  }, [
    customer.isLoading,
    location.isLoading,
    customerEquipments.isLoading,
    calibrations.isLoading,
    JSON.stringify(job),
    JSON.stringify(customer.data),
    JSON.stringify(location.data),
    JSON.stringify(customerEquipments.data),
    JSON.stringify(calibrations.data),
  ]);

  console.log('job', job);

  //* set lab representative if data exist,
  useEffect(() => {
    //* if no jobRequestId then set it as the createdBy of job else set is as the one who created the job request
    if (job) {
      setIsSettingLabRepresentative(true);

      if (!job?.jobRequestId) {
        const uid = job?.createdBy?.uid;

        if (uid) {
          //* query user
          getDoc(doc(db, 'users', uid))
            .then((snapshot) => {
              if (snapshot.exists()) {
                const user = { id: snapshot.id, ...snapshot.data() };
                setLabRepresentative(user);
              }
            })
            .catch((err) => {
              console.error('Failed to set lab representative:', err);
              setIsSettingLabRepresentative(false);
            });
        }
      } else {
        const jobRequestId = job?.jobRequestId;

        //* query job request
        getDoc(doc(db, 'jobRequests', jobRequestId))
          .then((snapshot) => {
            if (snapshot.exists()) {
              const jobRequest = snapshot.data();
              const uid = jobRequest?.createdBy?.uid;

              //* query user
              getDoc(doc(db, 'users', uid))
                .then((doc) => {
                  if (doc.exists()) {
                    const user = { id: doc.id, ...doc.data() };
                    setLabRepresentative(user);
                  }
                })
                .catch((err) => {
                  console.error('Failed to set lab representative:', err);
                  setIsSettingLabRepresentative(false);
                });
            }
          })
          .catch((err) => {
            console.error('Failed to set lab representative:', err);
            setIsSettingLabRepresentative(false);
          });
      }

      setIsSettingLabRepresentative(false);
    }
  }, [job]);

  //* set worker
  useEffect(() => {
    if (job) {
      setIsSettingWorker(true);

      //* set workerSignature based on the first worker assigned/selected in the job
      const worker = job?.workers?.[0];

      if (worker) {
        const id = worker?.id;

        if (id) {
          getDocs(query(collection(db, 'users'), where('workerId', '==', id)))
            .then((snapshot) => {
              if (!snapshot.empty) {
                const user = snapshot.docs[0].data();
                setWorker(user);
              }
            })
            .catch((err) => {
              console.error('Failed to set worker:', err);
              setIsSettingWorker(false);
            });
        }
      }

      setIsSettingWorker(false);
    }
  }, [job]);

  if (
    customer.isLoading ||
    location.isLoading ||
    customerEquipments.isLoading ||
    isSettingWorker ||
    isSettingLabRepresentative
  ) {
    return (
      <Card className='border-0 shadow-none'>
        <Card.Body
          className='d-flex justify-content-center align-items-center'
          style={{ height: '70vh' }}
        >
          <Spinner animation='border' variant='primary' />
          <span className='ms-3'>Loading CMR...</span>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className='border-0 shadow-none'>
      <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h4 className='mb-0'>Calibration & Measurement Requisition</h4>
            <p className='text-muted fs-6 mb-0'>
              Details about the job's CMR and can be downloaded/print here.
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
              <th>CMR No.</th>
              <td colSpan={6} className='fs-4 fw-bold'>
                {job.jobId}
              </td>
            </tr>
            <tr>
              <th>Date</th>
              <td colSpan={6}>{format(job.startDate, 'dd MMMM yyyy')}</td>
            </tr>
            <tr>
              <th>Scope</th>
              <td colSpan={6}>{scope}</td>
            </tr>
            <tr>
              <th>Est. Date Done</th>
              <td colSpan={6}>{format(job.endDate, 'dd MMMM yyyy')}</td>
            </tr>
            <tr>
              <th>Time</th>
              <td colSpan={6}>{job?.endByAt ? format(new Date(job.endByAt.toDate()), 'p') : ''}</td>
            </tr>

            <tr>
              <td></td>
              <td colSpan={6} className='fs-4 fw-bold'>
                Company
              </td>
            </tr>

            <tr>
              <th>Customer</th>
              <td colSpan={6}>{customer?.data?.customerName || ''}</td>
            </tr>
            <tr>
              <th>Address</th>
              <td colSpan={6}>{address}</td>
            </tr>
            <tr>
              <th>Tel / Fax</th>
              <td colSpan={6}>{job?.telFax || ''}</td>
            </tr>
            <tr>
              <th>P.I.C</th>
              <td colSpan={6}>{job?.pic || ''}</td>
            </tr>

            <tr>
              <td></td>
              <td colSpan={6} className='fs-4 fw-bold'>
                Equipment Requested
              </td>
            </tr>

            <tr>
              <th>Equipment</th>
              <th>Category</th>
              <th>Make</th>
              <th>Model</th>
              <th>Serial No.</th>
              <th>
                Calibration Points /<br />
                Range
              </th>
              <th>Tolerance</th>
            </tr>

            {(customerEquipments.data.length < 1 &&
              !customerEquipments.isLoading &&
              !customerEquipments.isError) ||
              (customerEquipments.length < 1 && (
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
              ))}

            {customerEquipments.isError && (
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

            {customerEquipments.data.length > 0 &&
              customerEquipments.data
                .sort((a, b) => {
                  if (!a?.description || !b?.description) return 0;
                  return a?.description?.localeCompare(b?.description);
                })
                .map((equipment, i) => {
                  const rangeMin = equipment?.rangeMin;
                  const rangeMax = equipment?.rangeMax;
                  const unit = equipment?.uom || '';
                  const range = rangeMin && rangeMax ? `${rangeMin}${unit} - ${rangeMax}${unit}` : ''; // prettier-ignore

                  return (
                    <tr key={`${equipment.id}-${i}`}>
                      <td>{equipment?.description || ''}</td>
                      <td className='text-capitalize'>
                        {equipment?.category ? equipment?.category.toLowerCase() : ''}
                      </td>
                      <td>{equipment?.make || ''}</td>
                      <td>{equipment?.model || ''}</td>
                      <td>{equipment?.serialNumber || ''}</td>
                      <td>{range}</td>
                      <td>{equipment?.tolerance || ''}</td>
                    </tr>
                  );
                })}

            <tr>
              <td></td>
              <td colSpan={6} className='fs-4 fw-bold'>
                Equipment Completed
              </td>
            </tr>

            <tr>
              <th>Equipment</th>
              <th>Category</th>
              <th>Make</th>
              <th>Model</th>
              <th>Serial Number</th>
              <th>Calibration Points / Range</th>
              <th>Tolerance</th>
            </tr>

            {(calibrations.data.length < 1 && !calibrations.isLoading && !calibrations.isError) ||
              (calibrations.length < 1 && completedEquipment.length < 1 && (
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
              ))}

            {calibrations.isError && (
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

            {completedEquipment.length > 0 &&
              completedEquipment
                .sort((a, b) => {
                  if (!a?.description || !b?.description) return 0;
                  return a?.description?.localeCompare(b?.description);
                })
                .map((equipment, i) => {
                  const rangeMin = equipment?.rangeMin;
                  const rangeMax = equipment?.rangeMax;
                  const unit = equipment?.uom || '';
                  const range = rangeMin && rangeMax ? `${rangeMin}${unit} - ${rangeMax}${unit}` : ''; // prettier-ignore

                  return (
                    <tr key={`${equipment.id}-${i}`}>
                      <td>{equipment?.description || ''}</td>
                      <td className='text-capitalize'>
                        {equipment?.category ? equipment?.category.toLowerCase() : ''}
                      </td>
                      <td>{equipment?.make || ''}</td>
                      <td>{equipment?.model || ''}</td>
                      <td>{equipment?.serialNumber || ''}</td>
                      <td>{range}</td>
                      <td>{equipment?.tolerance || ''}</td>
                    </tr>
                  );
                })}

            <tr>
              <th>Recalibration Interval</th>
              <td colSpan={6}>
                {job?.recalibrationInterval
                  ? format(job?.recalibrationInterval, 'dd MMMM yyyy')
                  : ''}
              </td>
            </tr>
            <tr>
              <th>Accessories</th>
              <td colSpan={6}>{job?.accessories || ''}</td>
            </tr>
            <tr>
              <th>Remark</th>
              <td colSpan={6} style={{ whiteSpace: 'pre-wrap' }}>
                {job?.remark || ''}
              </td>
            </tr>
            <tr>
              <th>Condition When Received</th>
              <td colSpan={6}>{job?.conditionWhenReceived || ''}</td>
            </tr>

            <tr>
              <td></td>
              <td colSpan={6} className='fs-4 fw-bold'>
                If Nonconforming Work
              </td>
            </tr>

            <tr>
              <th>Partial Range</th>
              <td colSpan={6}>{job?.isPartialRange ? 'Yes' : 'No'}</td>
            </tr>
            <tr>
              <th>Non Accredited</th>
              <td colSpan={6}>{job?.isNonAccredited ? 'Yes' : 'No'}</td>
            </tr>
            <tr>
              <th>
                Open Wiring Connection <br />
                <small className='text-muted'>(stop watch)</small>
              </th>
              <td colSpan={6}>{job?.isOpenWiringConnection ? 'Yes' : 'No'}</td>
            </tr>
            <tr>
              <th>
                Adjustments <br />
                <small className='text-muted'>(Manufacturer's instructions Required)</small>
              </th>
              <td colSpan={6}>{job?.isAdjustments ? 'Yes' : 'No'}</td>
            </tr>
            <tr>
              <th>Others</th>
              <td colSpan={6}>{job?.others || 'N/A'}</td>
            </tr>
          </tbody>
        </Table>

        <Card.Header className='bg-transparent border-0 pt-4 pb-0 mb-4'>
          <div className='d-flex justify-content-between align-items-center'>
            <div>
              <h4 className='mb-0'>Signatures</h4>
              <p className='text-muted fs-6 mb-0'>
                Signature details of laboratory representative, tecnician and customer.
              </p>
            </div>
          </div>
        </Card.Header>

        <div className='d-flex flex-wrap justify-content-center align-items-end w-75 mx-auto column-gap-5'>
          <div
            className='d-flex flex-column justify-content-center align-items-center'
            style={{ maxWidth: '300px' }}
          >
            <div className='container p-5 border rounded d-flex flex-column justify-content-center align-items-center'>
              {job?.salesSignature ? (
                <Image
                  className='w-100 h-100'
                  src={job?.salesSignature}
                  alt='Lab Representative Signature'
                />
              ) : (
                <>
                  <h1 className='fs-5 fw-bold mb-0'>No Data Yet</h1>
                  <p className='text-muted fs-6 mb-0'>Please update the the CMR in the job</p>
                </>
              )}
            </div>
            <div className='mt-2 fw-bold text-center'>Laboratory Representative</div>
            <div className='text-muted text-center'>{labRepresentative?.fullName || ''}</div>
          </div>

          <div
            className='d-flex flex-column justify-content-center align-items-center '
            style={{ maxWidth: '300px' }}
          >
            <div className='container p-5 border rounded d-flex flex-column justify-content-center align-items-center'>
              {job?.workerSignature ? (
                <Image className='w-100 h-100' src={job?.workerSignature} alt='worker' />
              ) : (
                <>
                  <h1 className='fs-5 fw-bold mb-0'>No Data Yet</h1>
                  <p className='text-muted fs-6 mb-0'>Please update the the CMR in the job</p>
                </>
              )}
            </div>
            <div className='mt-2 fw-bold'>Reviewd By</div>
            <div className='text-muted text-center'>{worker?.fullName || ''}</div>
            <div className='text-muted text-center'>{format(new Date(), 'dd MMMM yyyy')}</div>
          </div>

          <div
            className='d-flex flex-column justify-content-center align-items-center '
            style={{ maxWidth: '300px' }}
          >
            <div className='container p-5 border rounded d-flex flex-column justify-content-center align-items-center'>
              {job?.customerSignature ? (
                <Image className='w-100 h-100' src={job?.customerSignature} alt='customer' />
              ) : (
                <>
                  <h1 className='fs-5 fw-bold mb-0'>No Data Yet</h1>
                  <p className='text-muted fs-6 mb-0'>Please update the the CMR in the job</p>
                </>
              )}
            </div>
            <div className='mt-2 fw-bold'>Customer Chop & Sign</div>
            <div className='text-muted text-center'>{customer?.data?.customerName || ''}</div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default Cmr;
