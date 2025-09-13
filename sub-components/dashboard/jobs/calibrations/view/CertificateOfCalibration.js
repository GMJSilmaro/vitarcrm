import CertificateOfCalibrationPDF1 from '@/components/pdf/CertificateOfCalibrationPDF1';
import CertificateOfCalibrationPDF2 from '@/components/pdf/CertificateOfCalibrationPDF2';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { useNotifications } from '@/hooks/useNotifications';
import {
  TEST_LOADS,
  TRACEABILITY_ACCREDITATION_BODY,
  TRACEABILITY_CALIBRATION_LAB,
  TRACEABILITY_COUNTRY,
  TRACEABILITY_MAP,
} from '@/schema/calibration';
import { formatToDicimalString } from '@/utils/calibrations/data-formatter';
import { countDecimals } from '@/utils/common';
import { usePDF } from '@react-pdf/renderer';
import { add, format } from 'date-fns';
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { ceil, divide, multiply, round } from 'mathjs';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Card, Image, Spinner, Table } from 'react-bootstrap';
import { Calendar4, Download, Printer } from 'react-bootstrap-icons';

const CertificateOfCalibration = ({ calibration, instruments }) => {
  const auth = useAuth();
  const notifications = useNotifications();

  const iframeRef = useRef(null);

  const [instance, updateInstance] = usePDF();

  const [calibrateBy, setCalibrateBy] = useState({
    data: {},
    isLoading: true,
    isError: false,
  });
  const [approvedSignatory, setApprovedSignatory] = useState({data: {}, isLoading: true, isError: false}); //prettier-ignore

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

  const rangeDetails = calibration?.rangeDetails || [];

  const unitUsedForCOCAcronym = (unit) => {
    if (!unit) return 'g';
    if (unit === 'kilogram') return 'kg';
    return 'g';
  };

  const cocInstruments = useMemo(() => {
    if (!instruments.data || instruments.data.length < 1) return [];
    const selectedInstruments = calibration?.cocInstruments || [];
    return instruments.data.filter((instrument) => selectedInstruments.includes(instrument.id));
  }, [calibration, instruments.data]);

  const convertValueBasedOnUnit = (value, resolutionToUsed, unitToUsed) => {
    if ((!resolutionToUsed && resolutionToUsed !== 0) || !unitToUsed) return '';

    if (typeof value === 'string' || value === undefined || value === null || isNaN(value)) {
      return '';
    }

    switch (unitToUsed) {
      case 'gram': {
        const precision = countDecimals(resolutionToUsed);
        return formatToDicimalString(value, precision);
      }
      case 'kilogram': {
        const result = multiply(value, 0.001);
        const precision = countDecimals(divide(resolutionToUsed, 1000));

        return formatToDicimalString(result, precision);
      }

      default:
        return value;
    }
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

  const dateReceived = useMemo(() => {
    if (!calibration.dateReceivedRequested || !calibration?.dateReceived) return 'N/A';

    if (calibration.dateReceivedRequested === 'no') {
      if (calibration.dateReceived) return calibration.dateReceived;
      else return 'N/A';
    }

    return format(new Date(calibration.dateReceived), 'dd MMMM yyyy');
  }, [calibration]);

  const traceability = useMemo(() => {
    if (!calibration?.traceabilityType) return '';

    if (calibration?.traceabilityType === '1' || calibration?.traceabilityType === '2') {
      return TRACEABILITY_MAP?.[calibration?.traceabilityType] || '';
    }

    if (calibration?.traceabilityType === '3') {
      const traceabilityCountry = calibration?.traceabilityCountry || TRACEABILITY_COUNTRY[0]; // prettier-ignore
      const traceabilityAccreditationBody = calibration?.traceabilityAccreditationBody || TRACEABILITY_ACCREDITATION_BODY[0]; // prettier-ignore
      const traceabilityCalibrationLabValues = calibration?.traceabilityCalibrationLab || [TRACEABILITY_CALIBRATION_LAB[4].value]; // prettier-ignore

      const selectedTraceabilityCalibrationLab = traceabilityCalibrationLabValues.map(value => TRACEABILITY_CALIBRATION_LAB.find(item => item.value === value)).filter(Boolean); // prettier-ignore
      const selectedAccreditationNos = selectedTraceabilityCalibrationLab.map(item => item.accreditationNo) // prettier-ignore
      const signatory = selectedTraceabilityCalibrationLab[0].signatory;

      let accreditationNos = '';
      if (selectedTraceabilityCalibrationLab.length >= 2) {
        const lastAccreditationNo = selectedAccreditationNos.pop();
        accreditationNos = `${selectedAccreditationNos.join(', ')} and ${lastAccreditationNo}`;
      } else {
        accreditationNos = selectedAccreditationNos[0];
      }

      const text = `The measurement results included in this document are traceable to ${traceabilityCountry}'s national standards through SAMM ${accreditationNos} via calibration	Certificate No. as indicated below. ${traceabilityAccreditationBody} is a signatory to the ${signatory}`;
      return text;
    }

    return '';
  }, [calibration]);

  const formatCertNo = (certNo) => {
    const parts = certNo.split('-');

    if (!certNo || parts.length < 3) return '';

    const part1 = parts[0];
    const initials = part1.substring(0, 3);
    const date = part1.slice(3);

    return [`${initials} - ${date}`, ...parts.slice(1)].join(' - ');
  };

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

  const printPDF = useCallback(
    async (id, jobId, status) => {
      try {
        const jobCalibrationRef = doc(db, 'jobCalibrations', id);

        const calibrationPrintStatus = !status
          ? 'printed'
          : status === 'printed'
          ? 'reprinted'
          : 'reprinted';

        await updateDoc(jobCalibrationRef, {
          printStatus: calibrationPrintStatus,
          updatedAt: serverTimestamp(),
          updatedBy: auth.currentUser,
        });

        //* notify admin & supervisor when printed
        await notifications.create({
          module: 'calibration',
          target: ['admin', 'supervisor'],
          title: `Certificate ${calibrationPrintStatus}`,
          message: `Certificate (#${id})'s certificate has been printed by ${auth.currentUser.displayName}.`,
          data: {
            redirectUrl: `/jobs/${jobId}/calibrations/view/${id}`,
          },
        });
      } catch (error) {
        console.error('Error printing certificate:', error);
      }

      if (iframeRef.current) {
        const iframe = iframeRef.current;
        iframe.src = instance.url;
        iframe.onload = () => iframe.contentWindow?.print();
      }
    },
    [instance.url, iframeRef]
  );

  //* set calibratedBy and approvedSignatory
  useEffect(() => {
    if (
      calibration?.calibratedBy &&
      calibration?.calibratedBy?.id &&
      calibration?.approvedSignatory &&
      calibration?.approvedSignatory?.id
    ) {
      getDocs(
        query(
          collection(db, 'users'),
          where('workerId', 'in', [
            calibration?.calibratedBy?.id ?? '',
            calibration?.approvedSignatory?.id ?? '',
          ])
        )
      )
        .then((snapshot) => {
          if (!snapshot.empty) {
            const docs = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            const calibrateByData = docs.find((doc) => doc.workerId === calibration.calibratedBy.id); //prettier-ignore
            const approvedSignatoryData = docs.find((doc) => doc.workerId === calibration.approvedSignatory.id); //prettier-ignore

            console.log({ calibrateByData, approvedSignatoryData });

            if (calibrateByData) setCalibrateBy({ data: calibrateByData, isLoading: false, isError: false }); //prettier-ignore
            if (approvedSignatoryData)  setApprovedSignatory({ data: approvedSignatoryData,isLoading: false, isError: false,}); //prettier-ignore
          }
        })
        .catch((err) => {
          console.error(err.message);
          setCalibrateBy({ data: {}, isLoading: false, isError: true });
          setApprovedSignatory({ data: {}, isLoading: false, isError: true });
        });
    } else {
      setCalibrateBy({ data: {}, isLoading: false, isError: false });
      setApprovedSignatory({ data: {}, isLoading: false, isError: false });
    }
  }, [calibration]);

  useEffect(() => {
    if (
      !instruments.isLoading &&
      instruments.data.length > 0 &&
      calibrateBy.data &&
      approvedSignatory.data &&
      calibration
    ) {
      //* trigger re-render for pdf
      updateInstance(
        <CertificateOfCalibrationPDF2 calibration={calibration} instruments={instruments} calibratedBy={calibrateBy} approvedSignatory={approvedSignatory} /> //prettier-ignore
      );
      console.log('trigger re-render for pdf', instruments);
    }
  }, [
    instruments.isLoading,
    calibrateBy.isLoading,
    approvedSignatory.isLoading,
    JSON.stringify(calibrateBy.data),
    JSON.stringify(approvedSignatory.data),
    JSON.stringify(calibration),
    JSON.stringify(instruments.data),
  ]);

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

  console.log({ calibration });

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

          {(auth.role === 'admin' || auth.role === 'supervisor') && (
            <div className='d-flex align-items-center gap-2'>
              <Button
                onClick={() => printPDF(calibration.id, calibration.jobId, calibration.printStatus)}
              >
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
          )}
        </div>
      </Card.Header>

      <Card.Body>
        <Table className='w-75 mx-auto text-center fs-6 align-middle mt-3 mb-5' bordered responsive>
          <tbody>
            <tr>
              <th>CERTIFICATE NO.</th>
              <td colSpan={5} className='fs-4 fw-bold'>
                {formatCertNo(calibration?.certificateNumber)}
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
              <td colSpan={5}>{dateReceived}</td>
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
                The User should be aware that any number of factors may cause this instrument to
                drift out of calibration before the specified calibration interval has expired.
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
                {rangeDetails?.length === 1 && (
                  <div className='d-flex justify-content-center align-items-center'>
                    <div>
                      {convertValueBasedOnUnit(
                        parseFloat(rangeDetails?.[0]?.rangeMinCalibration),
                        isNaN(rangeDetails?.[0]?.rangeMinCalibration)
                          ? 0
                          : parseFloat(rangeDetails?.[0]?.rangeMinCalibration),
                        rangeDetails?.[0]?.unitUsedForCOC
                      )}
                    </div>
                    <div className='px-5'>to</div>
                    <div>
                      {convertValueBasedOnUnit(
                        parseFloat(rangeDetails?.[0]?.rangeMaxCalibration),
                        isNaN(rangeDetails?.[0]?.rangeMaxCalibration)
                          ? 0
                          : parseFloat(rangeDetails?.[0]?.rangeMaxCalibration),
                        rangeDetails?.[0]?.unitUsedForCOC
                      )}
                    </div>
                    <div className='ps-2'>
                      {unitUsedForCOCAcronym(rangeDetails?.[0]?.unitUsedForCOC)}
                    </div>
                  </div>
                )}

                {rangeDetails?.length > 1 &&
                  rangeDetails?.map((range, i) => (
                    <div
                      key={`${i}-range`}
                      className='d-flex justify-content-center align-items-center'
                    >
                      <div className='pe-3 fw-bold'>Range {i + 1}: </div>
                      <div>
                        {convertValueBasedOnUnit(
                          parseFloat(range?.rangeMinCalibration),
                          isNaN(range?.rangeMinCalibration)
                            ? 0
                            : parseFloat(range?.rangeMinCalibration),
                          range?.unitUsedForCOC
                        )}
                      </div>
                      <div className='px-5'>to</div>
                      <div>
                        {convertValueBasedOnUnit(
                          parseFloat(range?.rangeMaxCalibration),
                          isNaN(range?.rangeMaxCalibration)
                            ? 0
                            : parseFloat(range?.rangeMaxCalibration),
                          range?.unitUsedForCOC
                        )}
                      </div>
                      <div className='ps-2'> {unitUsedForCOCAcronym(range?.unitUsedForCOC)}</div>
                    </div>
                  ))}
              </td>
            </tr>
            <tr>
              <th>Resolution</th>
              <td colSpan={5}>
                {rangeDetails?.length === 1 && (
                  <div className='d-flex justify-content-center align-content-center'>
                    <div className='ps-2'>
                      {convertValueBasedOnUnit(
                        parseFloat(rangeDetails?.[0]?.resolution),
                        isNaN(parseFloat(rangeDetails?.[0]?.resolution))
                          ? 0
                          : parseFloat(rangeDetails?.[0]?.resolution),
                        rangeDetails?.[0]?.unitUsedForCOC
                      )}
                    </div>
                    <div className='ps-2'>
                      {unitUsedForCOCAcronym(rangeDetails?.[0]?.unitUsedForCOC)}
                    </div>
                  </div>
                )}

                {rangeDetails?.length > 1 &&
                  rangeDetails?.map((range, i) => (
                    <div
                      key={`${i}-range`}
                      className='d-flex justify-content-center align-items-center'
                    >
                      <div className='pe-3 fw-bold'>Range {i + 1}: </div>
                      <div className='d-flex align-items-center'>
                        <div className='ps-2'>
                          {convertValueBasedOnUnit(
                            parseFloat(range?.resolution),
                            isNaN(parseFloat(range?.resolution))
                              ? 0
                              : parseFloat(range?.resolution),
                            range?.unitUsedForCOC
                          )}
                        </div>
                        <div className='ps-2'>{unitUsedForCOCAcronym(range?.unitUsedForCOC)}</div>
                      </div>
                    </div>
                  ))}
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
              <td colSpan={5}>{traceability}</td>
            </tr>

            <tr>
              <th>Reference Standard</th>
              <th>ID. No.</th>
              <th>Serial No.</th>
              <th>Traceable</th>
              <th>Cert. No.</th>
              <th>Due Date</th>
            </tr>

            {(instruments.data.length < 1 && !instruments.isLoading && !instruments.isError) ||
              (cocInstruments.length < 1 && (
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

            {cocInstruments.length > 0 &&
              cocInstruments.map((instrument) => (
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
          {rangeDetails.map((range, rangeIndex) => (
            <CertificateOfCalibrationResultContent
              calibration={calibration}
              currentRange={range}
              rangeIndex={rangeIndex}
              calibrateBy={calibrateBy}
              approvedSignatory={approvedSignatory}
            />
          ))}
        </div>
      </Card.Body>
    </Card>
  );
};

const CertificateOfCalibrationResultContent = ({
  calibration,
  currentRange,
  rangeIndex,
  calibrateBy,
  approvedSignatory,
}) => {
  const currentCalibrationData = useMemo(() => {
    return calibration?.data?.[rangeIndex];
  }, [JSON.stringify(calibration), rangeIndex]);

  const calibrationPointNo = useMemo(() => {
    const value = parseFloat(currentRange?.calibrationPointNo);
    return isNaN(value) ? undefined : value;
  }, [JSON.stringify(currentRange)]);

  const resolution = useMemo(() => {
    const value = parseFloat(currentRange?.resolution);
    return isNaN(value) ? 0 : value;
  }, [JSON.stringify(currentRange)]);

  const rangeMaxCalibration = useMemo(() => {
    const value = parseFloat(currentRange?.rangeMaxCalibration);
    return isNaN(value) ? 0 : value;
  }, [JSON.stringify(currentRange)]);

  const unitUsedForCOC = useMemo(() => {
    return currentRange?.unitUsedForCOC || 'gram';
  }, [JSON.stringify(currentRange)]);

  const typeOFBalance = useMemo(() => {
    return currentCalibrationData?.typeOfBalance || '';
  }, [JSON.stringify(currentCalibrationData)]);

  const formattedRangeMaxCalibration = useMemo(() => {
    if (unitUsedForCOC === 'gram') return rangeMaxCalibration;
    return rangeMaxCalibration / 1000; //* convert to kilogram
  }, [unitUsedForCOC]);

  const rtestStd = useMemo(() => {
    return currentCalibrationData?.rtest?.std || [];
  }, [JSON.stringify(currentCalibrationData)]);

  const rtestMaxDiffBetweenReadings = useMemo(() => {
    return currentCalibrationData?.rtest?.maxDiffBetweenReadings || [];
  }, [JSON.stringify(currentCalibrationData)]);

  const etestValues = useMemo(() => {
    return currentCalibrationData?.etest?.values || [];
  }, [JSON.stringify(currentCalibrationData)]);

  const nominalValues = useMemo(() => {
    return currentCalibrationData?.nominalValues || [];
  }, [JSON.stringify(currentCalibrationData)]);

  const corrections = useMemo(() => {
    return currentCalibrationData?.corrections || [];
  }, [JSON.stringify(currentCalibrationData)]);

  const coverageFactors = useMemo(() => {
    return currentCalibrationData?.coverageFactors || [];
  }, [JSON.stringify(currentCalibrationData)]);

  const expandedUncertainties = useMemo(() => {
    return currentCalibrationData?.expandedUncertainties || [];
  }, [JSON.stringify(currentCalibrationData)]);

  const unitUsedForCOCAcronym = useMemo(() => {
    if (!unitUsedForCOC) return 'g';
    if (unitUsedForCOC === 'kilogram') return 'kg';
    return 'g';
  }, [unitUsedForCOC]);

  const convertValueBasedOnUnit = useCallback(
    (value) => {
      const unit = unitUsedForCOC;

      if (typeof value === 'string' || value === undefined || value === null || isNaN(value)) {
        return '';
      }

      switch (unit) {
        case 'gram': {
          const precision = countDecimals(resolution);
          return formatToDicimalString(value, precision);
        }
        case 'kilogram': {
          const result = multiply(value, 0.001);
          const precision = countDecimals(divide(resolution, 1000));
          return formatToDicimalString(result, precision);
        }

        default:
          return value;
      }
    },
    [unitUsedForCOC, resolution]
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

      switch (unit) {
        case 'gram': {
          const precision = countDecimals(resolution);
          return formatToDicimalString(result, precision);
        }
        case 'kilogram': {
          const precision = countDecimals(divide(resolution, 1000));
          return formatToDicimalString(result, precision);
        }
        default:
          return value;
      }
    },
    [unitUsedForCOC, resolution]
  );

  const renderCorrectionValueWithSymbol = (value) => {
    const parseValue = parseFloat(value);

    if (isNaN(parseValue)) return value;

    if (parseValue > 0) {
      if (/^0+(\.0+)?$/.test(value)) return value;
      return `+${value}`;
    } else {
      if (value.includes('-')) {
        const valueWithoutSymbol = value.replace('-', '');
        if (/^0+(\.0+)?$/.test(valueWithoutSymbol)) return valueWithoutSymbol;
        return `-${valueWithoutSymbol}`;
      }

      return value;
    }
  };

  return (
    <>
      <div className='d-flex flex-column gap-3'>
        <div className='mt-4 w-75 mx-auto'>
          <div className='d-flex align-items-center gap-2'>
            <Table className='text-center fs-6 align-middle mt-3 mb-5' bordered responsive>
              <tbody>
                <tr>
                  <th>
                    Range {rangeIndex + 1} : {formattedRangeMaxCalibration} {unitUsedForCOCAcronym}
                  </th>
                  <th>
                    Resolution {convertValueBasedOnUnit(resolution)} {unitUsedForCOCAcronym}
                  </th>
                </tr>
              </tbody>
            </Table>
          </div>

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
                      {renderCorrectionValueWithSymbol(
                        convertValueBasedOnUnit(corrections?.[i] ?? 0)
                      )}
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
                  <th>{convertValueBasedOnUnit(currentCalibrationData?.etest?.testLoad ?? 0)}</th>
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
                            {convertValueBasedOnUnit(currentCalibrationData?.etest?.maxError ?? 0)}
                          </div>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>

            <div className='d-flex justify-content-center align-items-center mt-1 gap-5'>
              {typeOFBalance && (
                <img src={`/images/balance-type-${typeOFBalance}.png`} width={100} />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className='d-flex flex-column gap-3'>
        <div className='w-75 mx-auto'>
          <p className='text-muted text-center fst-italic'>
            "The expanded uncertainties and it's coverage factors for the calibration results above
            are based on an estimated confidence probability of not less than 95%."
          </p>

          <p className='text-muted fs-6 text-center'>
            Note : The result of calibration is obtained after the balance is leveled. If the
            balance is moved to different location, user should always ensure that the balance is
            leveled, where appropriate using the bubble level that is usually attached to the frame.
          </p>
          <p className='text-muted fs-6 text-center'>
            Care should always be taken in the selection of location as all balance will be affected
            to a greater or lesser extent by draughts, vibration, inadequate support surfaces and
            temperature changes, whether across the machine or with time.
          </p>

          <div className='d-flex justify-content-between my-5'>
            <div
              className='d-flex flex-column justify-content-end align-items-center gap-2'
              style={{ width: 'fit-content' }}
            >
              <div className='fw-medium'>Calibrated By</div>

              {calibrateBy?.data?.signature && (
                <div className='my-2' style={{ maxWidth: 80 }}>
                  <Image
                    className='w-100 h-100'
                    src={calibrateBy?.data?.signature}
                    alt='Calibrated By Signature'
                  />
                </div>
              )}

              <div
                className={
                  `text-center border border-dark-subtle border-2 py-2 border-bottom-0 border-start-0 border-end-0 ` +
                  `${calibrateBy?.data?.signature ? ' mt-2' : 'mt-5'}`
                }
                style={{ maxWidth: 240 }}
              >
                {calibration?.calibratedBy?.name || ''}
              </div>
            </div>

            <div
              className='d-flex flex-column justify-content-end align-items-center gap-2'
              style={{ width: 'fit-content' }}
            >
              <div className='fw-medium'>Approved Signatory</div>

              {approvedSignatory?.data?.signature && (
                <div className='my-2' style={{ maxWidth: 80 }}>
                  <Image
                    className='w-100 h-100'
                    src={approvedSignatory?.data?.signature}
                    alt='Approved Signatory Signature'
                  />
                </div>
              )}

              <div
                className={
                  `text-center border border-dark-subtle border-2 py-2 border-bottom-0 border-start-0 border-end-0 ` +
                  `${approvedSignatory?.data?.signature ? ' mt-2' : 'mt-5'}`
                }
                style={{ maxWidth: 240 }}
              >
                {calibration?.approvedSignatory?.name || ''}
              </div>
            </div>
          </div>

          <p className='fw-bold mt-5 text-center'>
            The expanded uncertainty is stated as the standard measurement uncertainty multiplied by
            the coverage factor k, such that the coverage probability corresponds to approximately
            95 %.
          </p>
        </div>

        <hr />

        <small className='text-center'>
          This certificate is issued in accordance with the laboratory accreditation requirements of
          Skim Akreditasi Makmal Malaysia ( SAMM ) of Standards Malaysia which is a signatory to the
          ILAC MRA. Copyright of this certificate is owned by the issuing laboratory and may not be
          reproduced other than in full except with the prior written approval of the Head of the
          issuing laboratory.
        </small>
      </div>
    </>
  );
};

export default CertificateOfCalibration;
