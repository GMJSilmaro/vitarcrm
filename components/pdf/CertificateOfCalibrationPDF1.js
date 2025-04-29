import InterRegular from 'public/fonts/inter/Inter-Regular.ttf';
import InterBold from 'public/fonts/inter/Inter-Bold.ttf';
import InterItalic from 'public/fonts/inter/Inter-Italic.ttf';

import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { useCallback, useMemo } from 'react';
import { add, format } from 'date-fns';
import {
  TEST_LOADS,
  TRACEABILITY_ACCREDITATION_BODY,
  TRACEABILITY_CALIBRATION_LAB,
  TRACEABILITY_COUNTRY,
  TRACEABILITY_MAP,
} from '@/schema/calibration';
import { formatToDicimalString } from '@/utils/calibrations/data-formatter';
import { ceil, divide, multiply, row } from 'mathjs';
import { countDecimals } from '@/utils/common';

const styles = StyleSheet.create({
  body: {
    fontFamily: 'InterRegular',
    padding: '20px 40px 75px 40px',
    width: '100%',
    height: '100%',
  },
  center: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'InterBold',
    textAlign: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'InterBold',
    textAlign: 'left',
    marginBottom: 4,
  },
  sectionSubTitle: {
    fontSize: 12,
    fontFamily: 'InterRegular',
    textAlign: 'left',
  },
  heading: {
    fontSize: 12,
    fontFamily: 'InterBold',
    textAlign: 'left',
    marginBottom: 12,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 12,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#adadad',
  },
  footer: {
    marginBottom: 30,
    padding: '0px 40px 0px 40px',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  rowContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    borderBottom: '1px solid #e2e8f0',
  },
  firstRow: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    borderTop: '1px solid #e2e8f0',
    borderBottom: '1px solid #e2e8f0',
  },
  textCenter: {
    textAlign: 'center',
  },
  label: {
    fontSize: 8,
    padding: 12,
    width: '18%',
    fontFamily: 'InterBold',
    border: '1px solid #e2e8f0',
    borderTop: 'none',
    borderBottom: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  value: {
    fontSize: 8,
    padding: 12,
    width: '82%',
    fontFamily: 'InterRegular',
    border: '1px solid #e2e8f0',
    borderTop: 'none',
    borderBottom: 'none',
    borderLeft: 'none',
    flexGrow: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    flexDirection: 'row',
  },
  cellHeader: {
    fontSize: 8,
    padding: 12,
    fontFamily: 'InterBold',
    border: '1px solid #e2e8f0',
    borderTop: 'none',
    borderBottom: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  cell: {
    fontSize: 8,
    padding: 12,
    fontFamily: 'InterRegular',
    border: '1px solid #e2e8f0',
    borderTop: 'none',
    borderBottom: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  bulletPoint: {
    fontSize: 10,
    marginRight: 4,
  },
});

Font.register({
  family: 'InterRegular',
  src: InterRegular,
});

Font.register({
  family: 'InterBold',
  src: InterBold,
});

Font.register({
  family: 'InterItalic',
  src: InterItalic,
});

const CertificateOfCalibrationPDF1 = ({ calibration, instruments }) => {
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

  const cocInstruments = useMemo(() => {
    if (!instruments.data || instruments.data.length < 1) return [];
    const selectedInstruments = calibration?.cocInstruments || [];
    return instruments.data.filter((instrument) => selectedInstruments.includes(instrument.id));
  }, [calibration, instruments.data]);

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
    [resolution]
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

  return (
    <Document>
      <Page debug={false} style={styles.body} wrap>
        <View fixed>
          <Text style={styles.title}>CERTIFICATE OF CALIBRATION</Text>
        </View>

        <View style={styles.rowContainer}>
          <View style={styles.firstRow}>
            <View style={styles.label}>
              <Text>CERTIFICATE NO.</Text>
            </View>
            <View style={[styles.value, { fontFamily: 'InterBold', fontSize: 12 }]}>
              <Text>{calibration?.certificateNumber || ''}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.label}>
              <Text>Submitted By</Text>
            </View>
            <View style={styles.value}>
              <Text>{`${calibration?.job?.customer?.name || ''} ${handleGetLocationValue()}`}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.label}>
              <Text>Date Issued</Text>
            </View>
            <View style={styles.value}>
              <Text>{format(new Date(), 'dd MMMM yyyy')}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.label}>
              <Text>Date Received</Text>
            </View>
            <View style={styles.value}>
              <Text>
                {calibration?.dateReceived
                  ? format(new Date(calibration.dateReceived), 'dd MMMM yyyy')
                  : ''}
              </Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.label}>
              <Text>Date Calibrated</Text>
            </View>
            <View style={styles.value}>
              <Text>
                {calibration?.dateCalibrated
                  ? format(new Date(calibration.dateCalibrated), 'dd MMMM yyyy')
                  : ''}
              </Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.label}>
              <Text>Recalibration Date</Text>
              <Text>Specified By Client</Text>
            </View>
            <View style={styles.value}>
              <Text>{dueDate}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.label}></View>
            <View style={styles.value}>
              <Text>
                {calibration?.dateReceived
                  ? 'The User should be aware that any number of factors may cause this instrument to drift out of calibration before the specified calibration interval has expired.'
                  : ''}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.label}></View>
            <View style={[styles.value, { fontFamily: 'InterBold', fontSize: 12 }]}>
              <Text>Instrument Description</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.label}>
              <Text>Description</Text>
            </View>
            <View style={styles.value}>
              <Text>{calibration?.description?.description || ''}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.label}>
              <Text>Make</Text>
            </View>
            <View style={styles.value}>
              <Text>{calibration?.description?.make || ''}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.label}>
              <Text>Model</Text>
            </View>
            <View style={styles.value}>
              <Text>{calibration?.description?.model || ''}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.label}>
              <Text>Serial No.</Text>
            </View>
            <View style={styles.value}>
              <Text>{calibration?.description?.serialNumber || ''}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.label}>
              <Text>Range</Text>
            </View>
            <View style={styles.value}>
              <Text>{calibration?.rangeMinCalibration}</Text>
              <Text style={{ paddingLeft: 20, paddingRight: 20 }}>to</Text>
              <Text>{calibration?.rangeMaxCalibration}</Text>
              <Text style={{ paddingLeft: 10 }}>{unitUsedForCOCAcronym}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.label}>
              <Text>Resolution</Text>
            </View>
            <View style={styles.value}>
              <Text>
                {convertValueBasedOnUnit(resolution)} {unitUsedForCOCAcronym}
              </Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.label}></View>
            <View style={[styles.value, { flexDirection: 'column' }]}>
              <Text>
                The result of calibration shown relates only to the instrument being calibrated as
                described above.
              </Text>

              <Text style={{ fontFamily: 'InterBold', marginTop: 6 }}>
                Instrument Condition When Received:
              </Text>

              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  marginTop: 6,
                  alignItems: 'center',
                }}
              >
                <View style={styles.bulletPoint}>
                  <Text>•</Text>
                </View>
                <View>
                  <Text>Physically good</Text>
                </View>
              </View>

              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  marginTop: 6,
                  alignItems: 'center',
                }}
              >
                <View style={styles.bulletPoint}>
                  <Text>•</Text>
                </View>
                <View>
                  <Text>Balance is leveled</Text>
                </View>
              </View>

              <Text style={{ fontFamily: 'InterBold', marginTop: 6 }}>
                Instrument Condition When Returned:
              </Text>

              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  marginTop: 6,
                  alignItems: 'center',
                }}
              >
                <View style={styles.bulletPoint}>
                  <Text>•</Text>
                </View>
                <View>
                  <Text>Calibrated and tested serviceable</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.firstRow} break>
            <View style={styles.label}></View>
            <View style={[styles.value, { fontFamily: 'InterBold', fontSize: 12 }]}>
              <Text>Environmental Condition</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.label}>
              <Text>Ambient</Text>
              <Text>Temperature</Text>
            </View>
            <View style={[styles.value, { flexDirection: 'row', gap: 20 }]}>
              <View style={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
                <Text style={{ fontFamily: 'InterBold' }}>Max:</Text>
                <Text>{calibration?.maxTemperature ?? 0} °C</Text>
              </View>

              <View style={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
                <Text style={{ fontFamily: 'InterBold' }}>Min:</Text>
                <Text>{calibration?.minTemperature ?? 0} °C</Text>
              </View>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.label}>
              <Text>Relative Humidity</Text>
            </View>
            <View style={[styles.value, { flexDirection: 'row', gap: 20 }]}>
              <View style={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
                <Text style={{ fontFamily: 'InterBold' }}>Max:</Text>
                <Text>{calibration?.rangeMaxRHumidity ?? 0} %rh</Text>
              </View>

              <View style={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
                <Text style={{ fontFamily: 'InterBold' }}>Min:</Text>
                <Text>{calibration?.rangeMinRHumidity ?? 0} %rh</Text>
              </View>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.label}></View>
            <View style={styles.value}>
              <Text>
                The instrument has been calibrated on site under the environmental condition as
                stated above.
              </Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.label}>
              <Text>Reference Method</Text>
            </View>
            <View style={styles.value}>
              <Text>The calibration was based upon Calibration Procedure CP-(M)A.</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.label}></View>
            <View style={styles.value}>
              <Text>{traceability}</Text>
            </View>
          </View>
        </View>

        <View style={styles.rowContainer} break={cocInstruments.length > 6 ? true : false}>
          <View style={styles.row}>
            <View style={[styles.cellHeader, { width: '18%' }]}>
              <Text>Reference</Text>
              <Text>Standard</Text>
            </View>
            <View style={[styles.cellHeader, { borderLeft: 'none', width: '16%' }]}>
              <Text>ID. No. </Text>
            </View>
            <View style={[styles.cellHeader, { borderLeft: 'none', width: '16%' }]}>
              <Text>Serial No.</Text>
            </View>
            <View style={[styles.cellHeader, { borderLeft: 'none', width: '16%' }]}>
              <Text>Traceable</Text>
            </View>
            <View style={[styles.cellHeader, { borderLeft: 'none', width: '22%' }]}>
              <Text>Cert. No</Text>
            </View>
            <View style={[styles.cellHeader, { borderLeft: 'none', width: '12%' }]}>
              <Text>Due Date</Text>
            </View>
          </View>

          {cocInstruments.length > 0 &&
            cocInstruments.map((instrument) => (
              <View style={styles.row}>
                <View style={[styles.cell, { width: '18%' }]}>
                  <Text>{instrument?.description || ''}</Text>
                </View>
                <View style={[styles.cell, { borderLeft: 'none', width: '16%' }]}>
                  <Text>{instrument?.tagId || ''}</Text>
                </View>
                <View style={[styles.cell, { borderLeft: 'none', width: '16%' }]}>
                  <Text>{instrument?.serialNumber || ''}</Text>
                </View>
                <View style={[styles.cell, { borderLeft: 'none', width: '16%' }]}>
                  <Text>{instrument?.traceability || ''}</Text>
                </View>
                <View style={[styles.cell, { borderLeft: 'none', width: '22%' }]}>
                  <Text>{instrument?.certificateNo || ''}</Text>
                </View>
                <View style={[styles.cell, { borderLeft: 'none', width: '12%' }]}>
                  <Text>
                    {instrument?.dueDate ? format(new Date(instrument?.dueDate), 'dd-MM-yyyy') : ''}
                  </Text>
                </View>
              </View>
            ))}
        </View>

        {/* //* footer */}
        <View fixed style={styles.footer}>
          <Text
            style={{
              fontFamily: 'InterRegular',
              fontSize: 8,
              color: '#64748b',
            }}
          >
            This certificate is issued in accordance with the laboratory accreditation requirements
            of Skim Akreditasi Makmal Malaysia ( SAMM ) of Standards Malaysia which is a signatory
            to the ILAC MRA. Copyright of this certificate is owned by the issuing laboratory and
            may not be reproduced other than in full except with the prior written approval of the
            Head of the issuing laboratory.
          </Text>
        </View>

        <View break style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <View>
            <Text style={styles.sectionTitle}>Result of Caliberation</Text>
            <Text style={styles.sectionSubTitle}>
              The result of calibration shown only relates to the range calibrated.
            </Text>
          </View>

          <View>
            <View>
              <Text style={styles.heading}>Accuracy Test</Text>
            </View>

            <View style={styles.rowContainer}>
              <View style={styles.firstRow}>
                <View style={[styles.cellHeader, { width: '25%' }]}>
                  <Text>Nominal Value</Text>
                  <Text>({unitUsedForCOCAcronym})</Text>
                </View>
                <View style={[styles.cellHeader, { borderLeft: 'none', width: '25%' }]}>
                  <Text>Correction</Text>
                  <Text>({unitUsedForCOCAcronym})</Text>
                </View>
                <View style={[styles.cellHeader, { borderLeft: 'none', width: '30%' }]}>
                  <Text>Expanded Uncertainty</Text>
                  <Text>({unitUsedForCOCAcronym})</Text>
                </View>
                <View style={[styles.cellHeader, { borderLeft: 'none', width: '20%' }]}>
                  <Text>Coverage</Text>
                  <Text>
                    Factor,
                    <Text style={{ fontFamily: 'InterItalic' }}>k</Text>
                  </Text>
                </View>
              </View>

              {calibrationPointNo &&
                Array.from({ length: calibrationPointNo }).map((_, i) => (
                  <View style={styles.row}>
                    <View style={[styles.cell, { width: '25%' }]}>
                      <Text>{convertValueBasedOnUnit(nominalValues?.[i] ?? 0)}</Text>
                    </View>
                    <View style={[styles.cell, { borderLeft: 'none', width: '25%' }]}>
                      <Text>
                        {renderCorrectionValueWithSymbol(
                          convertValueBasedOnUnit(corrections?.[i] ?? 0)
                        )}
                      </Text>
                    </View>
                    <View style={[styles.cell, { borderLeft: 'none', width: '30%' }]}>
                      <Text>
                        {convertExpandedUncertaintyBasedOnUnit(expandedUncertainties?.[i] ?? 0)}
                      </Text>
                    </View>
                    <View style={[styles.cell, { borderLeft: 'none', width: '20%' }]}>
                      <Text>{coverageFactors?.[i] || 0}</Text>
                    </View>
                  </View>
                ))}
            </View>
          </View>

          <View>
            <View>
              <Text style={styles.heading}>Repeatability Test</Text>
            </View>

            <View style={styles.rowContainer}>
              <View style={styles.firstRow}>
                <View style={[styles.cellHeader, { width: '30%' }]}>
                  <Text>Nominal Value</Text>
                  <Text>({unitUsedForCOCAcronym})</Text>
                </View>
                <View style={[styles.cellHeader, { borderLeft: 'none', width: '30%' }]}>
                  <Text>Standard Deviation</Text>
                  <Text>({unitUsedForCOCAcronym})</Text>
                </View>
                <View style={[styles.cellHeader, { borderLeft: 'none', width: '40%' }]}>
                  <Text>Maximum Difference Between Readings</Text>
                  <Text>({unitUsedForCOCAcronym})</Text>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.cell, { width: '30%' }]}>
                <Text>{convertValueBasedOnUnit(divide(rangeMaxCalibration, 2) ?? 0)}</Text>
              </View>
              <View style={[styles.cell, { borderLeft: 'none', width: '30%' }]}>
                <Text>{convertValueBasedOnUnit(rtestStd?.[0] ?? 0)}</Text>
              </View>
              <View style={[styles.cell, { borderLeft: 'none', width: '40%' }]}>
                <Text>{convertValueBasedOnUnit(rtestMaxDiffBetweenReadings?.[0])}</Text>
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.cell, { width: '30%' }]}>
                <Text>{convertValueBasedOnUnit(rangeMaxCalibration) ?? 0}</Text>
              </View>
              <View style={[styles.cell, { borderLeft: 'none', width: '30%' }]}>
                <Text>{convertValueBasedOnUnit(rtestStd?.[1]) ?? 0}</Text>
              </View>
              <View style={[styles.cell, { borderLeft: 'none', width: '40%' }]}>
                <Text>{convertValueBasedOnUnit(rtestMaxDiffBetweenReadings?.[1] ?? 0)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View break style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <View>
            <Text style={styles.sectionTitle}>Result of Caliberation</Text>
            <Text style={styles.sectionSubTitle}>
              The result of calibration shown only relates to the range calibrated.
            </Text>
          </View>

          <View>
            <View>
              <Text style={styles.heading}>Eccentricity Test ({unitUsedForCOC})</Text>
            </View>

            <View style={{ display: 'flex', flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <View style={{ display: 'flex', flexDirection: 'row', width: '85%' }}>
                <View style={[styles.rowContainer, { width: '75%' }]}>
                  <View style={styles.firstRow}>
                    <View style={[styles.cellHeader, { width: '50%' }]}>
                      <Text>Test Load</Text>
                    </View>
                    <View style={[styles.cellHeader, { borderLeft: 'none', width: '50%' }]}>
                      <Text>
                        {convertValueBasedOnUnit(calibration?.data?.etest?.testLoad ?? 0)}
                      </Text>
                    </View>
                  </View>

                  {TEST_LOADS.map((testload, i) => (
                    <View key={i} style={styles.row}>
                      <View style={[styles.cell, { width: '50%' }]}>
                        <Text>{testload}</Text>
                      </View>
                      <View style={[styles.cell, { borderLeft: 'none', width: '50%' }]}>
                        <Text>{convertValueBasedOnUnit(etestValues?.[i] ?? 0)}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View
                  style={{
                    width: '25%',
                    border: '1px solid #e2e8f0',
                    borderLeft: 'none',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 8,
                  }}
                >
                  <Text style={{ fontFamily: 'InterBold', fontSize: 8, marginBottom: 4 }}>
                    Max Error
                  </Text>
                  <Text style={{ fontSize: 8 }}>
                    {convertValueBasedOnUnit(calibration?.data?.etest?.maxError ?? 0)}
                  </Text>
                </View>
              </View>

              <View style={{ width: '15%' }}>
                {calibration?.typeOfBalance && (
                  <Image src={`/images/balance-type-${calibration?.typeOfBalance}.png`} />
                )}
              </View>
            </View>
          </View>

          <View>
            <View
              style={{
                width: '85%',
                margin: '0 auto',
              }}
            >
              <View style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Text style={{ fontFamily: 'InterItalic', fontSize: 8, textAlign: 'center' }}>
                  "The expanded uncertainties and it's coverage factors for the calibration results
                  above are based on an estimated confidence probability of not less than 95%."
                </Text>
                <Text
                  style={{
                    fontFamily: 'InterRegular',
                    fontSize: 7,
                    color: '#64748b',
                    textAlign: 'center',
                  }}
                >
                  Note : The result of calibration is obtained after the balance is leveled. If the
                  balance is moved to different location, user should always ensure that the balance
                  is leveled, where appropriate using the bubble level that is usually attached to
                  the frame.
                </Text>
                <Text
                  style={{
                    fontFamily: 'InterRegular',
                    fontSize: 7,
                    color: '#64748b',
                    textAlign: 'center',
                  }}
                >
                  Care should always be taken in the selection of location as all balance will be
                  affected to a greater or lesser extent by draughts, vibration, inadequate support
                  surfaces and temperature changes, whether across the machine or with time.
                </Text>
              </View>

              <View
                style={{
                  marginTop: 30,
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'InterBold', fontSize: 8 }}>Calibrated By</Text>
                  <Text
                    style={{
                      fontFamily: 'InterRegular',
                      fontSize: 8,
                      marginTop: 20,
                      padding: '8px 0',
                      borderTop: '2px solid #64748b',
                      maxWidth: 180,
                    }}
                  >
                    {calibration?.calibratedBy?.name || ''}
                  </Text>
                </View>

                <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'InterBold', fontSize: 8 }}>Approved Signatory</Text>
                  <Text
                    style={{
                      fontFamily: 'InterRegular',
                      fontSize: 8,
                      marginTop: 20,
                      padding: '8px 0',
                      borderTop: '2px solid #64748b',
                      maxWidth: 180,
                    }}
                  >
                    {calibration?.approvedSignatory?.name || ''}
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: 40 }}>
                <Text style={{ fontFamily: 'InterBold', fontSize: 8, textAlign: 'center' }}>
                  The expanded uncertainty is stated as the standard measurement uncertainty
                  multiplied by the coverage factor k, such that the coverage probability
                  corresponds to approximately 95 %.
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
};

export default CertificateOfCalibrationPDF1;
