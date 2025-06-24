import TimesNewRomanRegular from 'public/fonts/times-new-roman/Times-New-Roman-Regular.ttf';
import TimesNewRomanBold from 'public/fonts/times-new-roman/Times-New-Roman-Bold.ttf';
import TimesNewRomanItalic from 'public/fonts/times-new-roman/Times-New-Roman-Italic.ttf';
import TimesNewRomanBoldItalic from 'public/fonts/times-new-roman/Times-New-Roman-Bold-Italic.ttf';

import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { format } from 'date-fns';
import { CATEGORY } from '@/schema/customerEquipment';

const styles = StyleSheet.create({
  body: {
    position: 'relative',
    fontFamily: 'TimesNewRomanRegular',
    width: '100%',
    height: '100%',
    paddingTop: 99.2088,
    paddingBottom: '100px',
    paddingLeft: 22.2,
    paddingRight: 22.2,
  },
  logoContainer: {
    position: 'absolute',
    top: 35,
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '550px',
    height: 'auto',
  },
  formNumber: {
    position: 'absolute',
    top: -10,
    left: 22,
    fontSize: 10,
  },
  title: {
    fontSize: 12,
    fontFamily: 'TimesNewRomanBold',
    textAlign: 'center',
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 19.836,
    paddingLeft: 22.2,
    paddingRight: 22.2,
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

const CmrPDF = ({
  job,
  customer,
  contact,
  location,
  customerEquipments,
  calibrations,
  worker,
  labRepresentative,
}) => {
  const [totalPages, setTotalPages] = useState(0);

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

  const prewrap = (text) => {
    if (!text) return null;

    let output = null;
    const lines = text.split('\n');

    output = lines.map((line, index) => {
      return <Text key={`line_${index}`}>{line || <>&nbsp;</>}</Text>;
    });

    return output;
  };

  const serializeToString = (value) => {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  };

  return (
    <Document
      onRender={(props) => {
        //* get total pages stored in a state
        const value = props?._INTERNAL__LAYOUT__DATA_?.children?.length || 0;
        setTotalPages(value);
      }}
    >
      <Page size='A4' debug={false} style={styles.body} wrap>
        <View fixed style={styles.logoContainer}>
          <Text style={styles.formNumber}>F508-000702</Text>
          <Image src='/images/VITARLOGO.png' style={styles.logo} />
        </View>

        <View fixed style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <Text style={styles.title}>CALIBRATION & MEASUREMENT REQUISITION</Text>

          <View style={{ fontSize: 10, marginLeft: 'auto' }}>
            <Text
              render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
              fixed
            />
          </View>
        </View>

        <View style={styles.container}>
          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text style={styles.blockContentBold}>CMR No.</Text>
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
                  <Text>{job?.jobId || ''}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Date</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>{format(job.startDate, 'dd MMMM yyyy')}</Text>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Scope</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>{scope}</Text>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Est. Date Done</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>{format(job.endDate, 'dd MMMM yyyy')}</Text>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Time</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>{job?.endByAt ? format(new Date(job.endByAt.toDate()), 'p') : ''}</Text>
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
            <Text>Company</Text>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Description</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>{customer?.data?.customerName || ''}</Text>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Address</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>{address}</Text>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Tel / Fax</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>{job?.telFax || ''}</Text>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text>P.I.C</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>{job?.pic || ''}</Text>
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
            <Text>Equipment Requested</Text>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-end',
              textDecoration: 'underline',
              fontFamily: 'TimesNewRomanBold',
              fontSize: 9.5,
              marginBottom: 4,
            }}
          >
            <View style={{ width: '22%' }}>
              <Text>Equipment</Text>
            </View>

            <View style={{ width: '22%' }}>
              <Text>Category</Text>
            </View>

            <View style={{ width: '10%' }}>
              <Text>Make</Text>
            </View>
            <View style={{ width: '10%' }}>
              <Text>Model</Text>
            </View>

            <View style={{ width: '14%' }}>
              <Text>Serial No</Text>
            </View>

            <View style={{ width: '12%' }}>
              <Text>Calibration</Text>
              <Text>Points/Range</Text>
            </View>

            <View style={{ width: '10%' }}>
              <Text>Tolerance</Text>
            </View>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {CATEGORY.map((category) => {
            const equipmentPerCategory =
              customerEquipments.data.length > 0
                ? customerEquipments.data.filter((eq) => eq.category === category)
                : [];

            return (
              equipmentPerCategory.length > 0 && (
                <View>
                  {equipmentPerCategory
                    .sort((a, b) => {
                      if (!a?.description || !b?.description) return 0;
                      return a?.description?.localeCompare(b?.description);
                    })
                    .map((eq, i) => {
                      const rangeMin = eq?.rangeMin ?? '';
                      const rangeMax = eq?.rangeMax ?? '';
                      const unit = eq?.uom || '';
                      const range = String(rangeMin) && String(rangeMax) ? `${rangeMin}${unit} - ${rangeMax}${unit}` : ''; // prettier-ignore

                      return (
                        <View
                          key={`${eq.id}-${i}`}
                          style={{
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'start',
                            fontSize: 9.5,
                          }}
                        >
                          <View style={{ width: '22%' }}>
                            <Text>{serializeToString(eq?.description)}</Text>
                          </View>

                          <View
                            style={{
                              width: '22%',
                              textTransform: 'capitalize',
                            }}
                          >
                            <Text>{serializeToString(eq?.category.toLowerCase())}</Text>
                          </View>

                          <View style={{ width: '10%' }}>
                            <Text>{serializeToString(eq?.make)}</Text>
                          </View>
                          <View style={{ width: '10%' }}>
                            <Text>{serializeToString(eq?.model)}</Text>
                          </View>

                          <View style={{ width: '14%' }}>
                            <Text>{serializeToString(eq?.serialNumber)}</Text>
                          </View>

                          <View style={{ width: '12%' }}>
                            <Text>{serializeToString(range)}</Text>
                          </View>

                          <View style={{ width: '10%' }}>
                            <Text>{serializeToString(eq?.tolerance)}</Text>
                          </View>
                        </View>
                      );
                    })}

                  <View
                    style={{
                      marginTop: 2,
                      textTransform: 'capitalize',
                      fontSize: 9.5,
                      display: 'flex',
                      flexDirection: 'row',
                      width: '100%',
                      gap: 4,
                      marginBottom: 6,
                    }}
                  >
                    <Text style={{ fontFamily: 'TimesNewRomanBold' }}>
                      Total ({category.toLowerCase()}):
                    </Text>
                    <Text style={{ fontFamily: 'TimesNewRomanBold' }}>
                      [ {equipmentPerCategory.length} ]
                    </Text>
                  </View>
                </View>
              )
            );
          })}
        </View>

        <View
          style={{
            marginTop: 8,
            width: '100%',
            fontSize: 9.5,
            fontFamily: 'TimesNewRomanBold',
            textDecoration: 'underline',
            marginBottom: 4,
          }}
          break={customerEquipments.length > 10 || completedEquipment.length > 10 ? true : false}
        >
          <Text>Equipment Completed</Text>
        </View>

        <View
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            textDecoration: 'underline',
            fontFamily: 'TimesNewRomanBold',
            fontSize: 9.5,
            marginBottom: 4,
          }}
        >
          <View style={{ width: '22%' }}>
            <Text>Equipment</Text>
          </View>

          <View style={{ width: '22%' }}>
            <Text>Category</Text>
          </View>

          <View style={{ width: '10%' }}>
            <Text>Make</Text>
          </View>
          <View style={{ width: '10%' }}>
            <Text>Model</Text>
          </View>

          <View style={{ width: '14%' }}>
            <Text>Serial No</Text>
          </View>

          <View style={{ width: '12%' }}>
            <Text>Calibration</Text>
            <Text>Points/Range</Text>
          </View>

          <View style={{ width: '10%' }}>
            <Text>Tolerance</Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {CATEGORY.map((category) => {
            const equipmentPerCategory =
              completedEquipment.length > 0
                ? completedEquipment.filter((eq) => eq.category === category)
                : [];

            return (
              equipmentPerCategory.length > 0 && (
                <View>
                  {equipmentPerCategory
                    .sort((a, b) => {
                      if (!a?.description || !b?.description) return 0;
                      return a?.description?.localeCompare(b?.description);
                    })
                    .map((eq, i) => {
                      const rangeMin = eq?.rangeMin ?? '';
                      const rangeMax = eq?.rangeMax ?? '';
                      const unit = eq?.uom || '';
                      const range = String(rangeMin) && String(rangeMax) ? `${rangeMin}${unit} - ${rangeMax}${unit}` : ''; // prettier-ignore

                      return (
                        <View
                          key={`${eq.id}-${i}`}
                          style={{
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'start',
                            fontSize: 9,
                          }}
                        >
                          <View style={{ width: '22%' }}>
                            <Text>{serializeToString(eq?.description)}</Text>
                          </View>

                          <View
                            style={{
                              width: '22%',
                              textTransform: 'capitalize',
                            }}
                          >
                            <Text>{serializeToString(eq?.category.toLowerCase())}</Text>
                          </View>

                          <View style={{ width: '10%' }}>
                            <Text>{serializeToString(eq?.make)}</Text>
                          </View>
                          <View style={{ width: '10%' }}>
                            <Text>{serializeToString(eq?.model)}</Text>
                          </View>

                          <View style={{ width: '14%' }}>
                            <Text>{serializeToString(eq?.serialNumber)}</Text>
                          </View>

                          <View style={{ width: '12%' }}>
                            <Text>{serializeToString(range)}</Text>
                          </View>

                          <View style={{ width: '10%' }}>
                            <Text>{serializeToString(eq?.tolerance)}</Text>
                          </View>
                        </View>
                      );
                    })}

                  <View
                    style={{
                      marginTop: 2,
                      textTransform: 'capitalize',
                      fontSize: 9.5,
                      display: 'flex',
                      flexDirection: 'row',
                      width: '100%',
                      gap: 4,
                      marginBottom: 6,
                    }}
                  >
                    <Text style={{ fontFamily: 'TimesNewRomanBold' }}>
                      Total ({category.toLowerCase()}):
                    </Text>
                    <Text style={{ fontFamily: 'TimesNewRomanBold' }}>
                      [ {equipmentPerCategory.length} ]
                    </Text>
                  </View>
                </View>
              )
            );
          })}
        </View>

        <View style={styles.container}>
          <View style={[styles.block, { marginTop: 10 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Recalibration Interval</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>
                {job?.recalibrationInterval
                  ? format(job?.recalibrationInterval, 'dd MMMM yyyy')
                  : ''}
              </Text>
            </View>
          </View>

          <View style={styles.block}>
            <View style={styles.blockContentLeft}>
              <Text>Accessories</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>{job?.accessories || ''}</Text>
            </View>
          </View>

          <View style={styles.block}>
            <View style={styles.blockContentLeft}>
              <Text>Remark</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View
              style={[
                styles.blockContentRight,
                {
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'start',
                },
              ]}
            >
              {prewrap(job?.remark)}
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Condition When</Text>
              <Text>Received</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>{job?.conditionWhenReceived || ''}</Text>
            </View>
          </View>

          <View
            style={{
              marginTop: 8,
              width: '100%',
              fontSize: 10,
              fontFamily: 'TimesNewRomanBold',
              textDecoration: 'underline',
              marginBottom: 4,
            }}
          >
            <Text>If Nonconforming Work</Text>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-end',
              textDecoration: 'underline',
              fontFamily: 'TimesNewRomanBold',
              fontSize: 10,
            }}
          >
            <View style={{ width: '15%' }}>
              <Text>Partial Range</Text>
            </View>

            <View style={{ width: '15%' }}>
              <Text>Non Accredited</Text>
            </View>

            <View style={{ width: '15%' }}>
              <Text>Open Wiring</Text>
              <Text>Connection</Text>
              <Text style={{ fontSize: 8 }}>(stop watch)</Text>
            </View>

            <View style={{ width: '18%' }}>
              <Text>Adjustments</Text>
              <Text style={{ fontSize: 8 }}>{`(Manufacturer's`} </Text>
              <Text style={{ fontSize: 8 }}>{`instructions Required)`} </Text>
            </View>

            <View style={{ width: '37%' }}>
              <Text>Others</Text>
              <Text style={{ fontSize: 8 }}>(Please specify)</Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              fontSize: 10,
            }}
          >
            <View style={{ width: '15%' }}>
              <Text>{job?.isPartialRange ? 'Yes' : 'No'}</Text>
            </View>

            <View style={{ width: '15%' }}>
              <Text>{job?.isNonAccredited ? 'Yes' : 'No'}</Text>
            </View>

            <View style={{ width: '15%' }}>
              <Text>{job?.isOpenWiringConnection ? 'Yes' : 'No'}</Text>
            </View>

            <View style={{ width: '18%' }}>
              <Text>{job?.isAdjustments ? 'Yes' : 'No'}</Text>
            </View>

            <View style={{ width: '37%' }}>
              <Text>{job?.others || ''}</Text>
            </View>
          </View>
        </View>

        {/* //* footer */}
        <View
          fixed
          style={styles.footer}
          render={({ pageNumber }) =>
            pageNumber === totalPages && (
              <View
                style={{
                  margin: '0 0 0 auto',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'stretch',
                  position: 'relative',
                  gap: 8,
                }}
              >
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    border: '1px solid #00000',
                    padding: 4,
                  }}
                >
                  {job?.salesSignature && (
                    <Image style={{ width: '60px', height: '40px' }} src={job?.salesSignature} />
                  )}
                  <Text style={{ fontSize: 8, marginTop: 5, textAlign: 'center' }}>
                    Laboratory Representative
                  </Text>
                  <Text style={{ fontSize: 8, maxWidth: 140, textAlign: 'center' }}>
                    {labRepresentative?.fullName || ''}
                  </Text>
                </View>

                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    border: '1px solid #00000',
                    padding: 4,
                  }}
                >
                  {job?.workerSignature && (
                    <Image style={{ width: '60px', height: '40px' }} src={job?.workerSignature} />
                  )}
                  <Text style={{ fontSize: 8, marginTop: 5, textAlign: 'center' }}>Reviewd By</Text>
                  <Text
                    style={{
                      fontSize: 8,
                      maxWidth: 140,
                      textAlign: 'center',
                    }}
                  >
                    {worker?.fullName || ''}
                  </Text>
                  <Text style={{ fontSize: 8, textAlign: 'center' }}>
                    {format(new Date(), 'dd MMMM yyyy')}
                  </Text>
                </View>

                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    border: '1px solid #00000',
                    padding: 4,
                  }}
                >
                  {job?.customerSignature && (
                    <Image style={{ width: '60px', height: '40px' }} src={job?.customerSignature} />
                  )}
                  <Text style={{ fontSize: 8, marginTop: 5, textAlign: 'center' }}>
                    Customer Chop & Sign
                  </Text>
                  <Text
                    style={{
                      fontSize: 8,
                      maxWidth: 140,
                      textAlign: 'center',
                    }}
                  >
                    {customer?.data?.customerName || ''}
                  </Text>
                </View>
              </View>
            )
          }
        />
      </Page>
    </Document>
  );
};

export default CmrPDF;
