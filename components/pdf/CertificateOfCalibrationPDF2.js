import InterRegular from 'public/fonts/inter/Inter-Regular.ttf';
import InterBold from 'public/fonts/inter/Inter-Bold.ttf';
import InterItalic from 'public/fonts/inter/Inter-Italic.ttf';

import TimesNewRomanRegular from 'public/fonts/times-new-roman/Times-New-Roman-Regular.ttf';
import TimesNewRomanBold from 'public/fonts/times-new-roman/Times-New-Roman-Bold.ttf';
import TimesNewRomanItalic from 'public/fonts/times-new-roman/Times-New-Roman-Italic.ttf';
import TimesNewRomanBoldItalic from 'public/fonts/times-new-roman/Times-New-Roman-Bold-Italic.ttf';

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
import { ceil, divide, im, multiply, row } from 'mathjs';
import { countDecimals } from '@/utils/common';

const styles = StyleSheet.create({
  body: {
    fontFamily: 'TimesNewRomanRegular',
    width: '100%',
    height: '100%',
    paddingTop: 99.2088,
    paddingBottom: 19.836,
    paddingLeft: 54,
    paddingRight: 25.2,
  },
  title: {
    fontSize: 24,
    fontFamily: 'TimesNewRomanBold',
    textAlign: 'center',
    marginBottom: 10,
    borderBottom: '1px solid #000000',
    borderTop: '1px solid #000000',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    fontSize: 10,
    position: 'relative',
  },
  block: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  blockContentBold: {
    fontFamily: 'TimesNewRomanBold',
  },
  blockContentLeftFirst: {
    width: '110px',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  blockContentLeft: {
    width: '20%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  separator: {
    width: '4%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  blockContentRight: {
    width: '76%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    marginBottom: 30,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 19.836,
    paddingLeft: 54,
    paddingRight: 25.2,
  },
});

//? 1 inch = 72 pt

Font.register({
  family: 'TimesNewRomanRegular',
  src: TimesNewRomanRegular,
});

Font.register({
  family: 'TimesNewRomanBold',
  src: TimesNewRomanBold,
});

Font.register({
  family: 'TimesNewRomanItalic',
  src: TimesNewRomanItalic,
});

Font.register({
  family: 'TimesNewRomanBoldItalic',
  src: TimesNewRomanBoldItalic,
});

const CertificateOfCalibrationPDF2 = ({
  calibration,
  instruments,
  calibratedBy,
  approvedSignatory,
}) => {
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
      console.log({ value });
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

  const location = useMemo(() => {
    const l = calibration.location;
    let defaultAddress;

    if (l?.addresses && l?.addresses?.length > 0) {
      defaultAddress = l.addresses.find((address) => address.isDefault);
    }

    return { siteName: l?.siteName || '', defaultAddress };
  }, [calibration.location]);

  console.log('COC PDF', { resolution, calibratedBy, approvedSignatory });

  return (
    <Document>
      <Page size='A4' style={styles.body} wrap>
        <View>
          <Text style={styles.title}>CERTIFICATE OF CALIBRATION</Text>
        </View>

        <View style={styles.container}>
          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text style={styles.blockContentBold}>CERTIFICATE NO.</Text>
            </View>

            <View style={styles.separator}>
              <Text style={styles.blockContentBold}>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <View
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={[styles.blockContentBold, { flexGrow: 1 }]}>
                  <Text>{calibration?.certificateNumber || ''}</Text>
                </View>

                <View>
                  <Text
                    render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                    fixed
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text style={styles.blockContentBold}>Submitted By</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <View style={{ display: 'flex', flexDirection: 'column' }}>
                {location?.defaultAddress?.siteName && (
                  <Text>{location?.defaultAddress?.siteName}</Text>
                )}
                {location?.defaultAddress?.street1 && (
                  <Text>{location?.defaultAddress?.street1}</Text>
                )}
                {location?.defaultAddress?.street2 && (
                  <Text>{location?.defaultAddress?.street2}</Text>
                )}
                {location?.defaultAddress?.street3 && (
                  <Text>{location?.defaultAddress?.street3}</Text>
                )}
                <Text>{`${
                  location?.defaultAddress?.postalCode
                    ? `${location?.defaultAddress?.postalCode} `
                    : ''
                }${location?.defaultAddress?.city ? `${location?.defaultAddress?.city} ` : ''}${
                  location?.defaultAddress?.province ? `${location?.defaultAddress?.province} ` : ''
                }${location?.defaultAddress?.country || ''}`}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Date Issued</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>{format(new Date(), 'dd MMMM yyyy')}</Text>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Date Received</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>
                {calibration?.dateReceived
                  ? format(new Date(calibration.dateReceived), 'dd MMMM yyyy')
                  : ''}
              </Text>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 2 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Date Calibrated</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text style={{ paddingRight: 30 }}>
                  {calibration?.dateCalibrated
                    ? format(new Date(calibration.dateCalibrated), 'dd MMMM yyyy')
                    : ''}
                </Text>
                <Text>Recalibration Date Specified By Client</Text>
                <Text style={{ paddingLeft: 4, paddingRight: 4 }}>:</Text>
                <Text>{dueDate}</Text>
              </View>
            </View>
          </View>

          <View style={{ width: '100%', fontSize: 7, marginBottom: 8 }}>
            <Text>
              The User should be aware that any number of factors may cause this instrument to drift
              out of calibration before the specified calibration interval has expired.
            </Text>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 10,
              fontFamily: 'TimesNewRomanBold',
              textDecoration: 'underline',
              marginBottom: 4,
            }}
          >
            <Text>Instrument Description</Text>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Description</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>{calibration?.description?.description || ''}</Text>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Make</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>{calibration?.description?.make || ''}</Text>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Model</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>{calibration?.description?.model || ''}</Text>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Serial No.</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>{calibration?.description?.serialNumber || ''}</Text>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Range</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text>{calibration?.rangeMinCalibration}</Text>
                <Text style={{ paddingLeft: 20, paddingRight: 20 }}>to</Text>
                <Text>{calibration?.rangeMaxCalibration}</Text>
                <Text style={{ paddingLeft: 10 }}>g</Text>
              </View>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Resolution</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>
                {convertValueBasedOnUnit(resolution)} {unitUsedForCOCAcronym}
              </Text>
            </View>
          </View>

          <View style={{ width: '100%', fontSize: 7 }}>
            <Text>
              The result of calibration shown relates only to the instrument being calibrated as
              described above.
            </Text>
          </View>

          <View
            style={{
              fontSize: 10,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'start',
              marginBottom: 8,
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                paddingRight: 40,
              }}
            >
              <Text>Instrument Condition When Received :</Text>
              <Text>1. Physically good.</Text>
              <Text>2. Balance is leveled.</Text>
            </View>

            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
              }}
            >
              <Text>Instrument Condition When Returned :</Text>
              <Text>1. Calibrated and tested serviceable.</Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 10,
              fontFamily: 'TimesNewRomanBold',
              textDecoration: 'underline',
              marginBottom: 4,
            }}
          >
            <Text>Environmental Condition</Text>
          </View>

          <View style={styles.block}>
            <View style={styles.blockContentLeft}>
              <Text>Ambient Temperature</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <View style={{ display: 'flex', flexDirection: 'row' }}>
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 4,
                    paddingRight: 30,
                  }}
                >
                  <Text style={{ paddingRight: 20 }}>Max:</Text>
                  <Text>{calibration?.maxTemperature ?? 0} °C</Text>
                </View>

                <View style={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
                  <Text style={{ paddingRight: 20 }}>Min:</Text>
                  <Text>{calibration?.minTemperature ?? 0} °C</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.block}>
            <View style={styles.blockContentLeft}>
              <Text>Relative Humidity</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <View style={{ display: 'flex', flexDirection: 'row' }}>
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 4,
                    paddingRight: 30,
                  }}
                >
                  <Text style={{ paddingRight: 20 }}>Max:</Text>
                  <Text>{calibration?.rangeMaxRHumidity ?? 0} %rh</Text>
                </View>

                <View style={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
                  <Text style={{ paddingRight: 20 }}>Min:</Text>
                  <Text>{calibration?.rangeMinRHumidity ?? 0} %rh</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ width: '100%', fontSize: 7, marginBottom: 8 }}>
            <Text>
              The instrument has been calibrated on site under the environmental condition as stated
              above.
            </Text>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text
                style={{
                  fontFamily: 'TimesNewRomanBold',
                  textDecoration: 'underline',
                }}
              >
                Reference Method
              </Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>The calibration was based upon Calibration Procedure CP-(M)A.</Text>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 8, fontSize: 8 }]}>
            <Text>{traceability}</Text>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              textDecoration: 'underline',
              fontFamily: 'TimesNewRomanBold',
            }}
          >
            <View style={{ width: '22%' }}>
              <Text>Reference Standard</Text>
            </View>

            <View style={{ width: '16%' }}>
              <Text>ID. No. </Text>
            </View>

            <View style={{ width: '16%' }}>
              <Text>Serial No.</Text>
            </View>

            <View style={{ width: '12%' }}>
              <Text>Traceable</Text>
            </View>

            <View style={{ width: '22%' }}>
              <Text>Cert. No</Text>
            </View>

            <View style={{ width: '12%' }}>
              <Text>Due Date</Text>
            </View>
          </View>

          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
            break={cocInstruments.length > 6 ? true : false}
          >
            {cocInstruments.length > 0 &&
              cocInstruments.map((instrument) => (
                <View
                  style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ width: '22%' }}>
                    <Text>{instrument?.description || ''}</Text>
                  </View>

                  <View style={{ width: '16%' }}>
                    <Text>{instrument?.tagId || ''}</Text>
                  </View>

                  <View style={{ width: '16%' }}>
                    <Text>{instrument?.serialNumber || ''}</Text>
                  </View>

                  <View style={{ width: '12%' }}>
                    <Text>{instrument?.traceability || ''}</Text>
                  </View>

                  <View style={{ width: '22%' }}>
                    <Text>{instrument?.certificateNo || ''}</Text>
                  </View>

                  <View style={{ width: '12%' }}>
                    <Text>
                      {instrument?.dueDate
                        ? format(new Date(instrument?.dueDate), 'dd-MM-yyyy')
                        : ''}
                    </Text>
                  </View>
                </View>
              ))}
          </View>
        </View>

        <View break style={styles.container}>
          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text style={styles.blockContentBold}>CERTIFICATE NO.</Text>
            </View>

            <View style={styles.separator}>
              <Text style={styles.blockContentBold}>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <View
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={[styles.blockContentBold, { flexGrow: 1 }]}>
                  <Text>{calibration?.certificateNumber || ''}</Text>
                </View>

                <View>
                  <Text
                    render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                    fixed
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        <View
          style={{
            width: '100%',
            fontSize: 10,
            fontFamily: 'TimesNewRomanBold',
            textDecoration: 'underline',
            marginBottom: 8,
          }}
        >
          <Text>Result of Caliberation</Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            width: '80%',
            margin: '0 auto',
            fontSize: 10,
          }}
        >
          <View style={{ width: '100%', marginBottom: 7 }}>
            <Text>The result of calibration shown only relates to the range calibrated</Text>
          </View>

          <View>
            <Text style={{ fontFamily: 'TimesNewRomanBold', marginLeft: 4 }}>Accuracy Test</Text>
          </View>

          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: '1px solid #00000',
              marginBottom: 8,
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                borderBottom: '1px solid #00000',
              }}
            >
              <View style={{ width: '25%', textAlign: 'center' }}>
                <Text> </Text>
                <Text>Nominal Value</Text>
                <Text>({unitUsedForCOCAcronym})</Text>
                <Text> </Text>
              </View>
              <View
                style={{
                  width: '25%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                }}
              >
                <Text> </Text>
                <Text>Correction</Text>
                <Text>({unitUsedForCOCAcronym})</Text>
                <Text> </Text>
              </View>
              <View
                style={{
                  width: '30%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                }}
              >
                <Text> </Text>
                <Text>Expanded Uncertainty</Text>
                <Text>({unitUsedForCOCAcronym})</Text>
                <Text> </Text>
              </View>
              <View
                style={{
                  width: '20%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                }}
              >
                <Text> </Text>
                <Text>Coverage</Text>
                <Text>
                  Factor,
                  <Text style={{ fontFamily: 'TimesNewRomanItalic' }}>k</Text>
                </Text>
                <Text> </Text>
              </View>
            </View>

            {/* //* empty for space */}
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View style={{ width: '25%', textAlign: 'center' }}>
                <Text> </Text>
              </View>
              <View
                style={{
                  width: '25%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                }}
              >
                <Text> </Text>
              </View>
              <View
                style={{
                  width: '30%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                }}
              >
                <Text> </Text>
              </View>
              <View
                style={{
                  width: '20%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                }}
              >
                <Text> </Text>
              </View>
            </View>

            {calibrationPointNo &&
              Array.from({ length: calibrationPointNo }).map((_, i) => (
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ width: '25%', textAlign: 'center' }}>
                    <Text>{convertValueBasedOnUnit(nominalValues?.[i] ?? 0)}</Text>
                  </View>
                  <View
                    style={{
                      width: '25%',
                      borderLeft: '1px solid #00000',
                      textAlign: 'center',
                    }}
                  >
                    <Text>
                      {renderCorrectionValueWithSymbol(
                        convertValueBasedOnUnit(corrections?.[i] ?? 0)
                      )}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: '30%',
                      borderLeft: '1px solid #00000',
                      textAlign: 'center',
                    }}
                  >
                    <Text>
                      {convertExpandedUncertaintyBasedOnUnit(expandedUncertainties?.[i] ?? 0)}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: '20%',
                      borderLeft: '1px solid #00000',
                      textAlign: 'center',
                    }}
                  >
                    <Text>{coverageFactors?.[i] || 0}</Text>
                  </View>
                </View>
              ))}

            {/* //* empty for space */}
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View style={{ width: '25%', textAlign: 'center' }}>
                <Text> </Text>
              </View>
              <View
                style={{
                  width: '25%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                }}
              >
                <Text> </Text>
              </View>
              <View
                style={{
                  width: '30%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                }}
              >
                <Text> </Text>
              </View>
              <View
                style={{
                  width: '20%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                }}
              >
                <Text> </Text>
              </View>
            </View>
          </View>

          <View>
            <Text style={{ fontFamily: 'TimesNewRomanBold', marginLeft: 4 }}>
              Repeatability Test
            </Text>
          </View>

          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: '1px solid #00000',
              marginBottom: 8,
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                borderBottom: '1px solid #00000',
              }}
            >
              <View style={{ width: '30%', textAlign: 'center' }}>
                <Text> </Text>
                <Text>Nominal Value</Text>
                <Text>({unitUsedForCOCAcronym})</Text>
                <Text> </Text>
              </View>
              <View
                style={{
                  width: '30%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                }}
              >
                <Text> </Text>
                <Text>Standard Deviation</Text>
                <Text>({unitUsedForCOCAcronym})</Text>
                <Text> </Text>
              </View>
              <View
                style={{
                  width: '40%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                }}
              >
                <Text> </Text>
                <Text>Maximum Difference</Text>
                <Text>Between Readings ({unitUsedForCOCAcronym})</Text>
                <Text> </Text>
              </View>
            </View>

            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              {/* //* 1st row  */}
              <View style={{ width: '30%', textAlign: 'center' }}>
                <Text> </Text>
                <Text>{convertValueBasedOnUnit(divide(rangeMaxCalibration, 2) ?? 0)}</Text>
              </View>
              <View
                style={{
                  width: '30%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                }}
              >
                <Text> </Text>
                <Text>{convertValueBasedOnUnit(rtestStd?.[0] ?? 0)}</Text>
              </View>
              <View
                style={{
                  width: '40%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                }}
              >
                <Text> </Text>
                <Text>{convertValueBasedOnUnit(rtestMaxDiffBetweenReadings?.[0])}</Text>
              </View>
            </View>

            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              {/* //* 2nd row  */}
              <View style={{ width: '30%', textAlign: 'center' }}>
                <Text>{convertValueBasedOnUnit(rangeMaxCalibration) ?? 0}</Text>
                <Text> </Text>
              </View>
              <View
                style={{
                  width: '30%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                }}
              >
                <Text>{convertValueBasedOnUnit(rtestStd?.[1]) ?? 0}</Text>
                <Text> </Text>
              </View>
              <View
                style={{
                  width: '40%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                }}
              >
                <Text>{convertValueBasedOnUnit(rtestMaxDiffBetweenReadings?.[1] ?? 0)}</Text>
                <Text> </Text>
              </View>
            </View>
          </View>

          <View
            style={{
              width: '90%',
              display: 'flex',
              flexDirection: 'column',
              margin: '0 auto',
              marginBottom: 10,
            }}
          >
            <View>
              <Text style={{ fontFamily: 'TimesNewRomanBold', marginLeft: 4 }}>Accuracy Test</Text>
            </View>

            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: 10,
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  width: '70%',
                  marginRight: 20,
                }}
              >
                <View
                  style={{
                    width: '75%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      border: '1px solid #00000',
                      borderRight: 'none',
                    }}
                  >
                    <View style={{ width: '50%', textAlign: 'center' }}>
                      <Text>Test Load</Text>
                    </View>

                    <View
                      style={{
                        width: '50%',
                        borderLeft: '1px solid #00000',
                        textAlign: 'center',
                      }}
                    >
                      <Text>
                        {convertValueBasedOnUnit(calibration?.data?.etest?.testLoad ?? 0)}
                      </Text>
                    </View>
                  </View>

                  {TEST_LOADS.map((testload, i) => (
                    <View
                      key={i}
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',

                        borderBottom: '1px solid #00000',
                      }}
                    >
                      <View
                        style={{
                          width: '50%',
                          textAlign: 'center',
                          borderLeft: '1px solid #00000',
                        }}
                      >
                        <Text>{testload}</Text>
                      </View>

                      <View
                        style={{
                          width: '50%',
                          borderLeft: '1px solid #00000',
                          textAlign: 'center',
                        }}
                      >
                        <Text>{convertValueBasedOnUnit(etestValues?.[i] ?? 0)}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View
                  style={{
                    width: '25%',
                    border: '1px solid #000000',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 8,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'InterBold',
                      fontSize: 8,
                      marginBottom: 4,
                    }}
                  >
                    Max Error
                  </Text>
                  <Text style={{ fontSize: 8 }}>
                    {convertValueBasedOnUnit(calibration?.data?.etest?.maxError ?? 0)}
                  </Text>
                </View>
              </View>

              <View style={{ width: '30%' }}>
                {calibration?.typeOfBalance && (
                  <Image
                    style={{ width: '70px', height: 'auto' }}
                    src={`/images/balance-type-${calibration?.typeOfBalance}.png`}
                  />
                )}
              </View>
            </View>

            <View>
              <Text style={{ fontSize: 8 }}>
                The expanded uncertainties and it's coverage factors for the calibration results
                above are based on an estimated confidence probability of not less than 95%
              </Text>
            </View>
          </View>

          <View>
            <Text style={{ fontSize: 7 }}>
              Note : The result of calibration is obtained after the balance is leveled. If the
              balance is moved to different location, user should always ensure that the balance is
              leveled, where appropriate using the bubble level that is usually attached to the
              frame.
            </Text>
            <Text style={{ fontSize: 7 }}>
              Care should always be taken in the selection of location as all balance will be
              affected to a greater or lesser extent by draughts, vibration, inadequate support
              surfaces and temperature changes, whether across the machine or with time.
            </Text>
          </View>
        </View>

        {/* //* footer */}
        <View fixed style={styles.footer}>
          <View
            style={{
              width: '80%',
              margin: '0 auto',
              marginTop: 30,
              marginBottom: 10,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 8 }}>Calibrated By</Text>

              {calibratedBy?.data?.signature && (
                <Image
                  style={{ width: '32px', height: 'auto', marginTop: 7 }}
                  src={calibratedBy?.data?.signature}
                />
              )}

              <Text
                style={{
                  fontSize: 8,
                  marginTop: calibratedBy?.data?.signature ? 5 : 20,
                  padding: '8px 0',
                  borderTop: '1px dotted #00000',
                  maxWidth: 180,
                }}
              >
                {calibration?.calibratedBy?.name || ''}
              </Text>
            </View>

            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 8 }}>Approved Signatory</Text>

              {approvedSignatory?.data?.signature && (
                <Image
                  style={{ width: '32px', height: 'auto', marginTop: 7 }}
                  src={approvedSignatory?.data?.signature}
                />
              )}

              <Text
                style={{
                  fontSize: 8,
                  marginTop: approvedSignatory?.data?.signature ? 5 : 20,
                  padding: '8px 0',
                  borderTop: '1px dotted #00000',
                  maxWidth: 180,
                }}
              >
                {calibration?.approvedSignatory?.name || ''}
              </Text>
            </View>
          </View>

          <View style={{ width: '85%', margin: '0 auto' }}>
            <Text
              style={{
                fontSize: 7,
                textAlign: 'center',
                paddingBottom: '4px',
                fontFamily: 'TimesNewRomanBold',
              }}
              render={({ pageNumber, totalPages }) => {
                if (pageNumber === totalPages)
                  return (
                    <>
                      The expanded uncertainty is stated as the standard measurement uncertainty
                      multiplied by the coverage factor k, such that the coverage probability
                      corresponds to approximately 95 %.
                    </>
                  );

                return null;
              }}
            />
          </View>

          <Text
            style={{
              fontSize: 7,
              borderTop: '1px solid #00000',
              paddingTop: '2px',
            }}
          >
            This certificate is issued in accordance with the laboratory accreditation requirements
            of Skim Akreditasi Makmal Malaysia ( SAMM ) of Standards Malaysia which is a signatory
            to the ILAC MRA. Copyright of this certificate is owned by the issuing laboratory and
            may not be reproduced other than in full except with the prior written approval of the
            Head of the issuing laboratory.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default CertificateOfCalibrationPDF2;
