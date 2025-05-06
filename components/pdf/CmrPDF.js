import TimesNewRomanRegular from 'public/fonts/times-new-roman/Times-New-Roman-Regular.ttf';
import TimesNewRomanBold from 'public/fonts/times-new-roman/Times-New-Roman-Bold.ttf';
import TimesNewRomanItalic from 'public/fonts/times-new-roman/Times-New-Roman-Italic.ttf';
import TimesNewRomanBoldItalic from 'public/fonts/times-new-roman/Times-New-Roman-Bold-Italic.ttf';

import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  body: {
    position: 'relative',
    fontFamily: 'TimesNewRomanRegular',
    width: '100%',
    height: '100%',
    paddingTop: 99.2088,
    paddingBottom: 19.836,
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
    marginBottom: 10,
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
    paddingLeft: 25.2,
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

const CmrPDF = ({ job, customer, contact, location, customerEquipments, calibrations }) => {
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

  return (
    <Document>
      <Page size='A4' debug={false} style={styles.body} wrap>
        <View fixed style={styles.logoContainer}>
          <Text style={styles.formNumber}>F508-000702</Text>
          <Image src='/images/VITARLOGO.png' style={styles.logo} />
        </View>

        <View fixed>
          <Text style={styles.title}>CALIBRATION & MEASUREMENT REQUISITION</Text>
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
              <Text>{format(new Date(`1900-01-01T${job.endTime}`), 'p')}</Text>
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
              alignItems: 'center',
              textDecoration: 'underline',
              fontFamily: 'TimesNewRomanBold',
              fontSize: 9,
            }}
          >
            <View style={{ width: '22%' }}>
              <Text>Equipment</Text>
            </View>

            <View style={{ width: '15%' }}>
              <Text>Category</Text>
            </View>

            <View style={{ width: '14%' }}>
              <Text>Make</Text>
            </View>
            <View style={{ width: '14%' }}>
              <Text>Model</Text>
            </View>

            <View style={{ width: '14%' }}>
              <Text>Serial No</Text>
            </View>

            <View style={{ width: '11%' }}>
              <Text>Calibration</Text>
              <Text>Points/Range</Text>
            </View>

            <View style={{ width: '10%' }}>
              <Text>Tolerance</Text>
            </View>
          </View>
        </View>

        <View style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {customerEquipments.data.length > 0 &&
            customerEquipments.data
              .sort((a, b) => {
                if (!a?.description || !b?.description) return 0;
                return a?.description?.localeCompare(b?.description);
              })
              .map((eq, i) => {
                const rangeMin = eq?.rangeMin;
                const rangeMax = eq?.rangeMax;
                const range = rangeMin && rangeMax ? `${rangeMin} - ${rangeMax}` : '';

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
                      <Text>{eq?.description || ''}</Text>
                    </View>

                    <View style={{ width: '15%', textTransform: 'capitalize' }}>
                      <Text>{eq?.category ? eq?.category.toLowerCase() : ''}</Text>
                    </View>

                    <View style={{ width: '14%' }}>
                      <Text>{eq?.make || ''}</Text>
                    </View>
                    <View style={{ width: '14%' }}>
                      <Text>{eq?.model || ''}</Text>
                    </View>

                    <View style={{ width: '14%' }}>
                      <Text>{eq?.serialNumber || ''}</Text>
                    </View>

                    <View style={{ width: '11%' }}>
                      <Text>{range}</Text>
                    </View>

                    <View style={{ width: '10%' }}>
                      <Text>{eq?.tolerance || ''}</Text>
                    </View>
                  </View>
                );
              })}
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
          break={customerEquipments.length > 10 || completedEquipment.length > 10 ? true : false}
        >
          <Text>Equipment Completed</Text>
        </View>

        <View
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            textDecoration: 'underline',
            fontFamily: 'TimesNewRomanBold',
            fontSize: 9,
          }}
        >
          <View style={{ width: '22%' }}>
            <Text>Equipment</Text>
          </View>

          <View style={{ width: '15%' }}>
            <Text>Category</Text>
          </View>

          <View style={{ width: '14%' }}>
            <Text>Make</Text>
          </View>
          <View style={{ width: '14%' }}>
            <Text>Model</Text>
          </View>

          <View style={{ width: '14%' }}>
            <Text>Serial No</Text>
          </View>

          <View style={{ width: '11%' }}>
            <Text>Calibration</Text>
            <Text>Points/Range</Text>
          </View>

          <View style={{ width: '10%' }}>
            <Text>Tolerance</Text>
          </View>
        </View>

        <View style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {completedEquipment.length > 0 &&
            completedEquipment
              .sort((a, b) => {
                if (!a?.description || !b?.description) return 0;
                return a?.description?.localeCompare(b?.description);
              })
              .map((eq, i) => {
                const rangeMin = eq?.rangeMin;
                const rangeMax = eq?.rangeMax;
                const range = rangeMin && rangeMax ? `${rangeMin} - ${rangeMax}` : '';

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
                      <Text>{eq?.description || ''}</Text>
                    </View>

                    <View style={{ width: '15%', textTransform: 'capitalize' }}>
                      <Text>{eq?.category ? eq?.category.toLowerCase() : ''}</Text>
                    </View>

                    <View style={{ width: '14%' }}>
                      <Text>{eq?.make || ''}</Text>
                    </View>
                    <View style={{ width: '14%' }}>
                      <Text>{eq?.model || ''}</Text>
                    </View>

                    <View style={{ width: '14%' }}>
                      <Text>{eq?.serialNumber || ''}</Text>
                    </View>

                    <View style={{ width: '11%' }}>
                      <Text>{range}</Text>
                    </View>

                    <View style={{ width: '10%' }}>
                      <Text>{eq?.tolerance || ''}</Text>
                    </View>
                  </View>
                );
              })}
        </View>

        <View style={styles.container}>
          <View style={[styles.block, { marginTop: 16 }]}>
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

            <View style={styles.blockContentRight}>
              <Text>{job?.remark || ''}</Text>
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
              alignItems: 'center',
              textDecoration: 'underline',
              fontFamily: 'TimesNewRomanBold',
              fontSize: 10,
            }}
          >
            <View style={{ width: '25%' }}>
              <Text>Partial Range</Text>
            </View>

            <View style={{ width: '25%' }}>
              <Text>Non Accredited</Text>
            </View>

            <View style={{ width: '25%' }}>
              <Text>Open Wiring Connection</Text>
              <Text style={{ fontSize: 8 }}>(stop watch)</Text>
            </View>

            <View style={{ width: '25%' }}>
              <Text>Adjustments</Text>
              <Text style={{ fontSize: 8 }}>(Manufacturer's instructions Required)</Text>
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
            <View style={{ width: '25%' }}>
              <Text>{job?.isPartialRange ? 'Yes' : 'No'}</Text>
            </View>

            <View style={{ width: '25%' }}>
              <Text>{job?.isNonAccredited ? 'Yes' : 'No'}</Text>
            </View>

            <View style={{ width: '25%' }}>
              <Text>{job?.isOpenWiringConnection ? 'Yes' : 'No'}</Text>
            </View>

            <View style={{ width: '25%' }}>
              <Text>{job?.isAdjustments ? 'Yes' : 'No'}</Text>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 8, marginTop: 12 }]}>
            <View style={styles.blockContentLeft}>
              <View style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Text>Others</Text>
                <Text style={{ fontSize: 8 }}>(Please specify)</Text>
              </View>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>{job?.others || ''}</Text>
            </View>
          </View>
        </View>

        {/* //* footer */}
        <View fixed style={styles.footer}>
          <View
            style={{
              width: '80%',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {job?.salesSignature && (
              <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Image style={{ width: '70px', height: 'auto' }} src={job?.salesSignature} />
                <Text style={{ fontSize: 8, marginTop: 5, textAlign: 'center' }}>
                  Laboratory Representative
                </Text>
                <Text style={{ fontSize: 8, maxWidth: 140, textAlign: 'center' }}>
                  {labRepresentative?.fullName || ''}
                </Text>
              </View>
            )}

            {job?.workerSignature && (
              <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Image style={{ width: '70px', height: 'auto' }} src={job?.workerSignature} />
                <Text style={{ fontSize: 8, marginTop: 5, textAlign: 'center' }}>Reviewd By</Text>
                <Text style={{ fontSize: 8, maxWidth: 140, textAlign: 'center' }}>
                  {worker?.fullName || ''}
                </Text>
                <Text style={{ fontSize: 8, textAlign: 'center' }}>
                  Date: {format(new Date(), 'dd MMMM yyyy')}
                </Text>
              </View>
            )}

            {job?.customerSignature && (
              <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Image style={{ width: '70px', height: 'auto' }} src={job?.customerSignature} />
                <Text style={{ fontSize: 8, marginTop: 5, textAlign: 'center' }}>
                  Customer Chop & Sign
                </Text>
                <Text style={{ fontSize: 8, maxWidth: 140, textAlign: 'center' }}>
                  {customer?.data?.customerName || ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default CmrPDF;
