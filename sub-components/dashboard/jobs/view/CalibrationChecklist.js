import CalibrationChecklistPDF from '@/components/pdf/CalibrationChecklistPDF';
import { usePDF } from '@react-pdf/renderer';
import { format } from 'date-fns';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Button, Card, Image, Spinner, Table } from 'react-bootstrap';
import { Download, Printer } from 'react-bootstrap-icons';

const CalibrationChecklist = ({ job, customer, users }) => {
  const iframeRef = useRef(null);
  const [instance, updateInstance] = usePDF();

  const takenByBefore = useMemo(() => {
    const value = job?.takenByBefore || '';
    if (!value || users.isLoading) return null;

    return users.data.find((user) => user.id === value) || null;
  }, [job, JSON.stringify(users)]);

  const takenByAfter = useMemo(() => {
    const value = job?.takenByAfter || '';
    if (!value || users.isLoading) return null;

    return users.data.find((user) => user.id === value) || null;
  }, [job, JSON.stringify(users)]);

  const verifiedByBefore = useMemo(() => {
    const value = job?.verifiedByBefore || '';
    if (!value || users.isLoading) return null;

    return users.data.find((user) => user.id === value) || null;
  }, [job, JSON.stringify(users)]);

  const verifiedByAfter = useMemo(() => {
    const value = job?.verifiedByAfter || '';
    if (!value || users.isLoading) return null;

    return users.data.find((user) => user.id === value) || null;
  }, [job, JSON.stringify(users)]);

  const downloadPDF = useCallback(
    (id) => {
      const link = document.createElement('a');
      link.href = instance.url;
      link.download = `JOB-${id}-CALIBRATION-CHECKLIST.pdf`;
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
    if (job || !users.isLoading || !customer.isLoading) {
      //* trigger re-render for pdf
      updateInstance(
        <CalibrationChecklistPDF
          job={job}
          customer={customer}
          takenByBefore={takenByBefore}
          takenByAfter={takenByAfter}
          verifiedByBefore={verifiedByBefore}
          verifiedByAfter={verifiedByAfter}
        />
      );
    }
  }, [
    users.isLoading,
    customer.isLoading,
    JSON.stringify(job),
    JSON.stringify(users.data),
    JSON.stringify(customer.data),
    JSON.stringify(takenByBefore),
    JSON.stringify(takenByAfter),
    JSON.stringify(verifiedByBefore),
    JSON.stringify(verifiedByAfter),
  ]);

  if (customer.isLoading || users.isLoading) {
    return (
      <Card className='border-0 shadow-none'>
        <Card.Body
          className='d-flex justify-content-center align-items-center'
          style={{ height: '70vh' }}
        >
          <Spinner animation='border' variant='primary' />
          <span className='ms-3'>Loading Calibration Checklist...</span>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className='border-0 shadow-none'>
      <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h4 className='mb-0'>Calibration Checklist</h4>
            <p className='text-muted fs-6 mb-0'>
              Details of the reference equipment results before and after calibration, along with
              the person in charge of the equipment and its verification.
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
              <td colSpan={5}>{format(new Date(), 'dd MMMM yyyy')}</td>
            </tr>
            <tr>
              <th>Customer</th>
              <td colSpan={5}>{customer?.data?.customerName || ''}</td>
            </tr>

            <tr>
              <th>Equipment</th>
              <th>Equipment ID</th>
              <th>Nominal Value</th>
              <th>Acceptannce</th>
              <th>Result Before</th>
              <th>Result After</th>
            </tr>

            {job.checklistEquipments?.map((ce) => (
              <tr key={ce.id}>
                <td>{ce?.description || ''}</td>
                <td>{ce?.tagId || ''}</td>
                <td>{ce?.nominalValue || ''}</td>
                <td>{ce?.acceptance || ''}</td>
                <td>{ce?.resultBefore || ''}</td>
                <td>{ce?.resultAfter || ''}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>

      <Card.Header className='bg-transparent border-0 pt-4 pb-0 mb-4'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h4 className='mb-0'>Taken By</h4>
            <p className='text-muted fs-6 mb-0'>
              Details about checklist's taken by before and after calibration.
            </p>
          </div>
        </div>
      </Card.Header>

      <div className='d-flex flex-wrap justify-content-center align-items-end w-75 mx-auto column-gap-5'>
        {takenByBefore && (
          <div
            className='d-flex flex-column justify-content-center align-items-center'
            style={{ maxWidth: '300px' }}
          >
            <div className='container p-5 border rounded d-flex flex-column justify-content-center align-items-center'>
              {takenByBefore?.signature ? (
                <Image
                  className='w-100 h-100'
                  src={takenByBefore?.signature}
                  alt='Lab Representative Signature'
                />
              ) : (
                <>
                  <h1 className='fs-5 fw-bold mb-0'>No Signature Available</h1>
                  <p className='text-muted fs-6 mb-0'>Please upload the necessary signature</p>
                </>
              )}
            </div>
            <div className='mt-2 fw-bold text-center'>Before</div>
            <div className='text-muted text-center'>{takenByBefore?.fullName || ''}</div>
          </div>
        )}

        {takenByAfter && (
          <div
            className='d-flex flex-column justify-content-center align-items-center'
            style={{ maxWidth: '300px' }}
          >
            <div className='container p-5 border rounded d-flex flex-column justify-content-center align-items-center'>
              {takenByAfter?.signature ? (
                <Image
                  className='w-100 h-100'
                  src={takenByAfter?.signature}
                  alt='Lab Representative Signature'
                />
              ) : (
                <>
                  <h1 className='fs-5 fw-bold mb-0'>No Signature Available</h1>
                  <p className='text-muted fs-6 mb-0'>Please upload the necessary signature</p>
                </>
              )}
            </div>
            <div className='mt-2 fw-bold text-center'>Before</div>
            <div className='text-muted text-center'>{takenByAfter?.fullName || ''}</div>
          </div>
        )}
      </div>

      <Card.Header className='bg-transparent border-0 pt-4 pb-0 mb-4'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h4 className='mb-0'>Verified by Lab In-charge</h4>
            <p className='text-muted fs-6 mb-0'>
              Details about checklist's verified by lab in-charge before and after calibration.
            </p>
          </div>
        </div>
      </Card.Header>

      <div className='d-flex flex-wrap justify-content-center align-items-end w-75 mx-auto column-gap-5'>
        {verifiedByBefore && (
          <div
            className='d-flex flex-column justify-content-center align-items-center'
            style={{ maxWidth: '300px' }}
          >
            <div className='container p-5 border rounded d-flex flex-column justify-content-center align-items-center'>
              {verifiedByBefore?.signature ? (
                <Image
                  className='w-100 h-100'
                  src={verifiedByBefore?.signature}
                  alt='Lab Representative Signature'
                />
              ) : (
                <>
                  <h1 className='fs-5 fw-bold mb-0'>No Signature Available</h1>
                  <p className='text-muted fs-6 mb-0'>Please upload the necessary signature</p>
                </>
              )}
            </div>
            <div className='mt-2 fw-bold text-center'>Before</div>
            <div className='text-muted text-center'>{verifiedByBefore?.fullName || ''}</div>
          </div>
        )}

        {verifiedByAfter && (
          <div
            className='d-flex flex-column justify-content-center align-items-center'
            style={{ maxWidth: '300px' }}
          >
            <div className='container p-5 border rounded d-flex flex-column justify-content-center align-items-center'>
              {verifiedByAfter?.signature ? (
                <Image
                  className='w-100 h-100'
                  src={verifiedByAfter?.signature}
                  alt='Lab Representative Signature'
                />
              ) : (
                <>
                  <h1 className='fs-5 fw-bold mb-0'>No Signature Available</h1>
                  <p className='text-muted fs-6 mb-0'>Please upload the necessary signature</p>
                </>
              )}
            </div>
            <div className='mt-2 fw-bold text-center'>Before</div>
            <div className='text-muted text-center'>{verifiedByAfter?.fullName || ''}</div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default CalibrationChecklist;
