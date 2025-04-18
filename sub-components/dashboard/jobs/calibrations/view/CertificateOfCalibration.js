import CertificateOfCalibrationPDF from '@/components/pdf/CertificateOfCalibrationPDF';
import { TEST_LOADS, TRACEABILITY_MAP } from '@/schema/calibration';
import { formatToDicimalString } from '@/utils/calibrations/data-formatter';
import { usePDF } from '@react-pdf/renderer';
import { add, format } from 'date-fns';
import { ceil, divide, multiply, round } from 'mathjs';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Spinner, Table } from 'react-bootstrap';
import { Calendar4, Download, Printer } from 'react-bootstrap-icons';

const CertificateOfCalibration = ({ calibration, instruments }) => {
  const iframeRef = useRef(null);

  const [instance, updateInstance] = usePDF();

  const handleGetLocationValue = useCallback(() => {
    if (calibration.location) {
      const locationData = calibration.location;
      let value = locationData.siteName || '';

      if (locationData?.addresses && locationData?.addresses?.length > 0) {
        const defaultAddress = locationData.addresses.find((address) => address.isDefault);

        if (defaultAddress) {
          if (defaultAddress?.street1) value += ` ${defaultAddress.street1}`;
          else if (defaultAddress?.street2) value += ` ${defaultAddress.street2}`;
          else if (defaultAddress?.street3) value += ` ${defaultAddress.street3}`;

          if (defaultAddress?.city) value += ` ${defaultAddress.city}`;
          if (defaultAddress?.province) value += ` ${defaultAddress.province}`;
          if (defaultAddress?.postalCode) value += ` ${defaultAddress.postalCode}`;
          if (defaultAddress?.country) value += ` ${defaultAddress.country}`;
        }
      }

      return value;
    }

    return '';
  }, [calibration.location]);

  const calibrationPointNo = useMemo(() => {
    const value = parseFloat(calibration?.calibrationPointNo);
    return isNaN(value) ? undefined : value;
  }, [calibration]);

  const resolution = useMemo(() => {
    const value = parseFloat(calibration?.resolution);
    return isNaN(value) ? 0 : value;
  }, [calibration]);

  const rangeMaxCalibration = useMemo(() => {
    const value = parseFloat(calibration?.rangeMaxCalibration);
    return isNaN(value) ? 0 : value;
  }, [calibration]);

  const rtestStd = useMemo(() => {
    return calibration?.data?.rtest?.std || [];
  }, [calibration]);

  const rtestMaxDiffBetweenReadings = useMemo(() => {
    return calibration?.data?.rtest?.maxDiffBetweenReadings || [];
  }, [calibration]);

  const etestValues = useMemo(() => {
    return calibration?.data?.etest?.values || [];
  }, [calibration]);

  const unitUsedForCOC = useMemo(() => {
    return calibration?.unitUsedForCOC || 'gram';
  }, [calibration]);

  const unitUsedForCOCAcronym = useMemo(() => {
    if (!unitUsedForCOC) return 'g';
    if (unitUsedForCOC === 'kilogram') return 'kg';
    return 'g';
  }, [unitUsedForCOC]);

  const nominalValues = useMemo(() => {
    return calibration?.data?.nominalValues || [];
  }, [calibration]);

  const corrections = useMemo(() => {
    return calibration?.data?.corrections || [];
  }, [calibration]);

  const coverageFactors = useMemo(() => {
    return calibration?.data?.coverageFactors || [];
  }, [calibration]);

  const expandedUncertainties = useMemo(() => {
    return calibration?.data?.expandedUncertainties || [];
  }, [calibration]);

  const convertValueBasedOnUnit = useCallback(
    (value) => {
      const unit = unitUsedForCOC;

      if (typeof value === 'string' || value === undefined || value === null || isNaN(value)) {
        return '';
      }

      switch (unit) {
        case 'gram':
          return formatToDicimalString(value, 1);
        case 'kilogram':
          return formatToDicimalString(multiply(value, 0.001), 4);
        default:
          return value;
      }
    },
    [unitUsedForCOC]
  );

  const convertExpandedUncertaintyBasedOnUnit = useCallback(
    (value) => {
      if (typeof value === 'string' || value === undefined || value === null || isNaN(value)) {
        return '';
      }

      const unit = unitUsedForCOC;

      const factor = unit === 'gram' ? 1 : 0.001;
      const scaledResolution = resolution * factor;

      const result = ceil((value * factor) / scaledResolution) * scaledResolution;

      return unit === 'gram' ? formatToDicimalString(result, 1) : formatToDicimalString(result, 2);
    },
    [resolution]
  );

  const isPositive = (value) => {
    const parseValue = parseFloat(value);

    if (isNaN(parseValue)) return false;
    return parseValue > 0;
  };

  const dueDate = useMemo(() => {
    if (!calibration?.dueDateRequested || !calibration?.dateCalibrated) {
      return 'N/A';
    }

    if (calibration?.dueDateRequested === 'no') {
      if (calibration?.dueDate) return calibration.dueDate;
      else return 'N/A';
    }

    const dueDate = add(new Date(calibration.dateCalibrated), {
      months: calibration?.dueDateDuration || 0,
    });

    return format(dueDate, 'dd MMMM yyyy');
  }, [calibration]);

  const downloadPDF = useCallback(
    (id) => {
      const link = document.createElement('a');
      link.href = instance.url;
      link.download = `CALIBRATION-${id}-COC.pdf`;
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
    if (!instruments.isLoading && instruments.data.length > 0 && calibration) {
      //* trigger re-render for pdf
      updateInstance(
        <CertificateOfCalibrationPDF calibration={calibration} instruments={instruments} />
      );
      console.log('trigger re-render for pdf', instruments);
    }
  }, [instruments.isLoading, JSON.stringify(calibration), JSON.stringify(instruments.data)]);

  if (instance.loading || instruments.isLoading) {
    return (
      <Card className='border-0 shadow-none'>
        <Card.Body
          className='d-flex justify-content-center align-items-center'
          style={{ height: '70vh' }}
        >
          <Spinner animation='border' variant='primary' />
          <span className='ms-3'>Loading COC...</span>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className='border-0 shadow-none'>
      <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h4 className='mb-0'>Certificate of Calibration</h4>
            <p className='text-muted fs-6 mb-0'>
              Certicate generated based on the resuts and can be downloaded/print here.
            </p>
          </div>

          <div className='d-flex align-items-center gap-2'>
            <Button onClick={() => printPDF()}>
              <Printer size={18} className='me-2' />
              Print
            </Button>

            <iframe ref={iframeRef} style={{ display: 'none' }} />

            {instance.url && calibration.id && (
              <Button variant='outline-primary' onClick={() => downloadPDF(calibration.id)}>
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
              <th>CERTIFICATE NO.</th>
              <td colSpan={5} className='fs-4 fw-bold'>
                {calibration?.certificateNumber || ''}
              </td>
            </tr>
            <tr>
              <th>Submitted By</th>
              <td colSpan={5}>{`${
                calibration?.job?.customer?.name || ''
              } ${handleGetLocationValue()}`}</td>
            </tr>
            <tr>
              <th>Date Issued</th>
              <td colSpan={5}>{format(new Date(), 'dd MMMM yyyy')}</td>
            </tr>
            <tr>
              <th>Date Received</th>
              <td colSpan={5}>
                {calibration?.dateReceived
                  ? format(new Date(calibration.dateReceived), 'dd MMMM yyyy')
                  : ''}
              </td>
            </tr>
            <tr>
              <th>Date Calibrated</th>
              <td colSpan={5}>
                {calibration?.dateCalibrated
                  ? format(new Date(calibration.dateCalibrated), 'dd MMMM yyyy')
                  : ''}
              </td>
            </tr>
            <tr>
              <th>
                Recalibration Date <br />
                Specified By Client
              </th>
              <td colSpan={5}>{dueDate}</td>
            </tr>
            <tr>
              <td></td>
              <td colSpan={5}>
                {calibration?.dateReceived
                  ? 'The User should be aware that any number of factors may cause this instrument to drift out of calibration before the specified calibration interval has expired.'
                  : ''}
              </td>
            </tr>

            <tr>
              <td></td>
              <td colSpan={5} className='fs-4 fw-bold'>
                Instrument Description
              </td>
            </tr>

            <tr>
              <th>Description</th>
              <td colSpan={5}>{calibration?.description?.description || ''}</td>
            </tr>
            <tr>
              <th>Make</th>
              <td colSpan={5}>{calibration?.description?.make || ''}</td>
            </tr>
            <tr>
              <th>Model</th>
              <td colSpan={5}>{calibration?.description?.model || ''}</td>
            </tr>
            <tr>
              <th>Serial No.</th>
              <td colSpan={5}>{calibration?.description?.serialNumber || ''}</td>
            </tr>
            <tr>
              <th>Range</th>
              <td colSpan={5}>
                <div className='d-flex justify-content-center align-items-center'>
                  <div>{calibration?.rangeMinCalibration ?? 0}</div>
                  <div className='px-5'>to</div>
                  <div>{calibration?.rangeMaxCalibration ?? 0}</div>
                </div>
              </td>
            </tr>
            <tr>
              <th>Resolution</th>
              <td colSpan={5}>
                {calibration?.resolution || 0} {unitUsedForCOCAcronym}
              </td>
            </tr>

            {calibration?.calibrationLocation && (
              <tr>
                <th>Location</th>
                <td colSpan={5}>{calibration?.calibrationLocation}</td>
              </tr>
            )}

            <tr>
              <td></td>
              <td colSpan={5} className='px-5 py-3'>
                <div className='d-flex justify-content-center align-items-center flex-column flex-wrap gap-3'>
                  <div className='text-center'>
                    The result of calibration shown relates only to the instrument being calibrated
                    as described above.
                  </div>

                  <div className='d-flex flex-column align-items-start'>
                    <span className='fw-bold'>Instrument Condition When Received:</span>

                    <div className='w-100 d-flex flex-column gap-1 justify-content-center align-items-center'>
                      <p className='mt-1 text-center d-inline-block mb-0 w-100'>
                        <span className='me-2'>•</span>Physically good
                      </p>
                      <p className='text-center d-inline-block mb-0 w-100'>
                        <span className='me-2'>•</span> Balance is leveled
                      </p>
                    </div>
                  </div>

                  <div className='d-flex flex-column align-items-center'>
                    <span className='fw-bold'>Instrument Condition When Returned:</span>

                    <div className='w-100 d-flex flex-column gap-1 justify-content-center'>
                      <p className='mt-1 text-center d-inline-block mb-0 w-100'>
                        <span className='me-2'>•</span> Calibrated and tested serviceable
                      </p>
                    </div>
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td></td>
              <td colSpan={5} className='fs-4 fw-bold'>
                Environmental Condition
              </td>
            </tr>

            <tr>
              <th>Ambient Temperature</th>
              <td colSpan={5}>
                <div className='d-flex justify-content-center align-items-center gap-4'>
                  <div className='d-flex gap-2'>
                    <span className='fw-bold'>Max:</span>
                    <span>{calibration?.maxTemperature ?? 0} °C</span>
                  </div>

                  <div className='d-flex gap-2'>
                    <span className='fw-bold'>Min:</span>
                    <span>{calibration?.minTemperature ?? 0} °C</span>
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <th>Relative Humidity</th>
              <td colSpan={5}>
                <div className='d-flex justify-content-center align-items-center gap-4'>
                  <div className='d-flex gap-2'>
                    <span className='fw-bold'>Max:</span>
                    <span>{calibration?.rangeMaxRHumidity ?? 0} %rh</span>
                  </div>

                  <div className='d-flex gap-2'>
                    <span className='fw-bold'>Min:</span>
                    <span>{calibration?.rangeMinRHumidity ?? 0} %rh</span>
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td></td>
              <td colSpan={5}>
                The instrument has been calibrated on site under the environmental condition as
                stated above.
              </td>
            </tr>

            <tr>
              <th>Reference Method</th>
              <td colSpan={5}>The calibration was based upon Calibration Procedure CP-(M)A.</td>
            </tr>

            <tr>
              <td></td>
              <td colSpan={5}>{TRACEABILITY_MAP?.[calibration?.traceabilityType] || ''}</td>
            </tr>

            <tr>
              <th>Reference Standard</th>
              <th>ID. No.</th>
              <th>Serial No.</th>
              <th>Traceable</th>
              <th>Cert. No.</th>
              <th>Due Date</th>
            </tr>

            {instruments.data.length === 0 && !instruments.isLoading && !instruments.isError && (
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

            {instruments.isLoading && (
              <tr>
                <td colSpan={6}>
                  <div
                    className='d-flex justify-content-center align-items-center'
                    style={{ height: '100px' }}
                  >
                    <Spinner className='me-2' animation='border' size='sm' /> Loading...
                  </div>
                </td>
              </tr>
            )}

            {instruments.isError && (
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

            {instruments.data.length > 0 &&
              instruments.data.map((instrument) => (
                <tr key={instrument.id}>
                  <td>{instrument?.description || ''}</td>
                  <td>{instrument?.tagId || ''}</td>
                  <td>{instrument?.serialNumber || ''}</td>
                  <td>{instrument?.traceability || ''}</td>
                  <td>{instrument?.certificateNo || ''}</td>
                  <td>
                    {instrument?.dueDate ? format(new Date(instrument?.dueDate), 'dd-MM-yyyy') : ''}
                  </td>
                </tr>
              ))}
          </tbody>
        </Table>

        <Card.Header className='bg-transparent border-0 pt-4 pb-0'>
          <div className='d-flex justify-content-between align-items-center'>
            <div>
              <h4 className='mb-0'>Result of Caliberation</h4>
              <p className='text-muted fs-6 mb-0'>
                The result of calibration shown only relates to the range calibrated.
              </p>
            </div>
          </div>
        </Card.Header>

        <div className='d-flex flex-column gap-3'>
          <div className='mt-4 w-75 mx-auto'>
            <h5 className='mb-0'>Accuracy Test</h5>

            <Table className='text-center fs-6 align-middle mt-3 mb-5' bordered responsive>
              <thead>
                <tr>
                  <th>
                    Nominal Value <br />({unitUsedForCOCAcronym})
                  </th>
                  <th>
                    Correction <br />({unitUsedForCOCAcronym})
                  </th>
                  <th>
                    Expanded Uncertainty <br />({unitUsedForCOCAcronym})
                  </th>
                  <th>
                    Coverage <br />
                    Factor, <i>k</i>
                  </th>
                </tr>
              </thead>

              <tbody>
                {calibrationPointNo &&
                  Array.from({ length: calibrationPointNo }).map((_, i) => (
                    <tr key={i}>
                      <td>{convertValueBasedOnUnit(nominalValues?.[i] ?? 0)}</td>
                      <td>
                        {isPositive(corrections?.[i] ?? 0) ? '+' : ''}
                        {convertValueBasedOnUnit(corrections?.[i] ?? 0)}
                      </td>
                      <td>
                        {convertExpandedUncertaintyBasedOnUnit(expandedUncertainties?.[i] ?? 0)}
                      </td>
                      <td>{coverageFactors?.[i] || 0}</td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          </div>

          <div className='w-75 mx-auto'>
            <h5 className=' mb-0'>Repeatability Test</h5>

            <Table className='text-center fs-6 align-middle mt-3 mb-5' bordered responsive>
              <thead>
                <tr>
                  <th>
                    Nominal Value <br />({unitUsedForCOCAcronym})
                  </th>
                  <th>
                    Standard Deviation <br />({unitUsedForCOCAcronym})
                  </th>
                  <th>
                    Maximum Difference Between Readings <br />({unitUsedForCOCAcronym})
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>{convertValueBasedOnUnit(divide(rangeMaxCalibration, 2) ?? 0)}</td>
                  <td>{convertValueBasedOnUnit(rtestStd?.[0] ?? 0)}</td>
                  <td>{convertValueBasedOnUnit(rtestMaxDiffBetweenReadings?.[0])}</td>
                </tr>

                <tr>
                  <td>{convertValueBasedOnUnit(rangeMaxCalibration) ?? 0}</td>
                  <td>{convertValueBasedOnUnit(rtestStd?.[1]) ?? 0}</td>
                  <td>{convertValueBasedOnUnit(rtestMaxDiffBetweenReadings?.[1] ?? 0)}</td>
                </tr>
              </tbody>
            </Table>
          </div>

          <div className='w-75 mx-auto'>
            <h5 className=' mb-0'>Eccentricity Test ({unitUsedForCOC})</h5>

            <div className='d-flex flex-column flex-md-row gap-md-5 align-items-center justify-content-center'>
              <Table
                className='flex-grow-1 text-center fs-6 align-middle mt-3 mb-5'
                bordered
                responsive
              >
                <thead>
                  <tr>
                    <th>Test Load</th>
                    <th>{convertValueBasedOnUnit(calibration?.data?.etest?.testLoad ?? 0)}</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {TEST_LOADS.map((testload, i) => (
                    <tr key={`${testload}-${i}`}>
                      <td>{testload}</td>
                      <td>{convertValueBasedOnUnit(etestValues?.[i] ?? 0)}</td>
                      {i === 0 && (
                        <td rowSpan={TEST_LOADS.length}>
                          <div className='d-flex flex-column align-items-center gap-2'>
                            <div className='text-center fw-bold'>Max Error</div>
                            <div className='text-center'>
                              {convertValueBasedOnUnit(calibration?.data?.etest?.maxError ?? 0)}
                            </div>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </Table>

              <div className='d-flex justify-content-center align-items-center mt-1 gap-5'>
                {calibration?.typeOfBalance && (
                  <img src={`/images/balance-type-${calibration?.typeOfBalance}.png`} width={100} />
                )}
              </div>
            </div>

            <p className='text-muted text-center fst-italic'>
              "The expanded uncertainties and it's coverage factors for the calibration results
              above are based on an estimated confidence probability of not less than 95%."
            </p>

            <p className='text-muted fs-6 text-center'>
              Note : The result of calibration is obtained after the balance is leveled. If the
              balance is moved to different location, user should always ensure that the balance is
              leveled, where appropriate using the bubble level that is usually attached to the
              frame.
            </p>
            <p className='text-muted fs-6 text-center'>
              Care should always be taken in the selection of location as all balance will be
              affected to a greater or lesser extent by draughts, vibration, inadequate support
              surfaces and temperature changes, whether across the machine or with time.
            </p>

            <div className='d-flex justify-content-between my-5'>
              <div
                className='d-flex flex-column align-items-center gap-2'
                style={{ width: 'fit-content' }}
              >
                <div className='fw-medium'>Calibrated By</div>
                <div
                  className='text-center mt-5 border border-dark-subtle border-2 py-2 border-bottom-0 border-start-0 border-end-0'
                  style={{ maxWidth: 240 }}
                >
                  {calibration?.calibratedBy?.name || ''}
                </div>
              </div>

              <div
                className='d-flex flex-column align-items-center gap-2'
                style={{ width: 'fit-content' }}
              >
                <div className='fw-medium'>Approved By</div>
                <div
                  className='text-center mt-5 border border-dark-subtle border-2 py-2 border-bottom-0 border-start-0 border-end-0'
                  style={{ maxWidth: 240 }}
                >
                  {calibration?.approvedSignatory?.name || ''}
                </div>
              </div>
            </div>

            <p className='fw-bold mt-5 text-center'>
              The expanded uncertainty is stated as the standard measurement uncertainty multiplied
              by the coverage factor k, such that the coverage probability corresponds to
              approximately 95 %.
            </p>
          </div>

          <hr />

          <small className='text-center'>
            This certificate is issued in accordance with the laboratory accreditation requirements
            of Skim Akreditasi Makmal Malaysia ( SAMM ) of Standards Malaysia which is a signatory
            to the ILAC MRA. Copyright of this certificate is owned by the issuing laboratory and
            may not be reproduced other than in full except with the prior written approval of the
            Head of the issuing laboratory.
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default CertificateOfCalibration;
