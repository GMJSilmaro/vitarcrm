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
});

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

import React from 'react';

const CustomerNotificationPDF = ({
  jobCn,
  job,
  customer,
  customerEquipments,
  worker,
  forVitarLabUseAuthorizeBy,
}) => {
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

  return (
    <Document>
      <Page size='A4' debug={false} style={styles.body} wrap>
        <View fixed style={styles.logoContainer}>
          <Text style={styles.formNumber}>F408-000401</Text>
          <Image src='/images/VITARLOGO.png' style={styles.logo} />
        </View>

        <View fixed style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <Text style={styles.title}>CUSTOMER NOTIFICATION</Text>

          <View style={{ fontSize: 10, marginLeft: 'auto' }}>
            <Text
              render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
              fixed
            />
          </View>
        </View>

        <View style={styles.container}>
          <View style={[styles.block, { marginBottom: 4 }]}>
            <View style={{ width: '50%' }}>
              <View style={[styles.block]}>
                <View style={styles.blockContentLeft}>
                  <Text>To</Text>
                </View>

                <View style={styles.separator}>
                  <Text>:</Text>
                </View>

                <View style={styles.blockContentRight}>
                  <Text>{jobCn?.to || ''}</Text>
                </View>
              </View>
            </View>

            <View style={{ width: '50%' }}>
              <View style={[styles.block]}>
                <View style={styles.blockContentLeft}>
                  <Text>Your Ref</Text>
                </View>

                <View style={styles.separator}>
                  <Text>:</Text>
                </View>

                <View style={styles.blockContentRight}>
                  <Text>{jobCn?.yourRef || ''}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.container}>
            <View style={[styles.block, { marginBottom: 4 }]}>
              <View style={[styles.blockContentLeft, { width: '9%' }]}>
                <Text>Company</Text>
              </View>

              <View style={[styles.separator]}>
                <Text>:</Text>
              </View>

              <View style={[styles.blockContentRight, { marginLeft: '-5px' }]}>
                <Text>{customer?.data?.customerName || ''}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.block, { marginBottom: 4 }]}>
            <View style={{ width: '50%' }}>
              <View style={[styles.block]}>
                <View style={styles.blockContentLeft}>
                  <Text>Attention</Text>
                </View>

                <View style={styles.separator}>
                  <Text>:</Text>
                </View>

                <View style={styles.blockContentRight}>
                  <Text>{jobCn?.attention || ''}</Text>
                </View>
              </View>
            </View>

            <View style={{ width: '50%' }}>
              <View style={[styles.block]}>
                <View style={styles.blockContentLeft}>
                  <Text>Fax No</Text>
                </View>

                <View style={styles.separator}>
                  <Text>:</Text>
                </View>

                <View style={styles.blockContentRight}>
                  <Text>{jobCn?.faxNo || ''}</Text>
                </View>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.block,
              {
                rowGap: 4,
                flexWrap: 'wrap',
                paddingTop: 6,
                marginTop: 6,
                marginBottom: 18,
                paddingBottom: 6,
                borderTop: '1px solid #00000',
                borderBottom: '1px solid #00000',
              },
            ]}
          >
            <View style={{ width: '50%' }}>
              <View style={[styles.block]}>
                <View style={styles.blockContentLeft}>
                  <Text>From</Text>
                </View>

                <View style={styles.separator}>
                  <Text>:</Text>
                </View>

                <View style={styles.blockContentRight}>
                  <Text>VITAR – SEGATEC SDN. BHD.</Text>
                </View>
              </View>
            </View>

            <View style={{ width: '50%' }}>
              <View style={[styles.block]}>
                <View style={styles.blockContentLeft}>
                  <Text>Our Ref</Text>
                </View>

                <View style={styles.separator}>
                  <Text>:</Text>
                </View>

                <View style={styles.blockContentRight}>
                  <Text>{jobCn.cnId}</Text>
                </View>
              </View>
            </View>

            <View style={{ width: '50%' }}>
              <View style={[styles.block]}>
                <View style={styles.blockContentLeft}>
                  <Text>Date</Text>
                </View>

                <View style={styles.separator}>
                  <Text>:</Text>
                </View>

                <View style={styles.blockContentRight}>
                  <Text>{format(new Date(), 'dd MMMM yyyy')}</Text>
                </View>
              </View>
            </View>
          </View>

          <View
            style={{
              textAlign: 'center',
              width: '100%',
              fontSize: 10,
              fontFamily: 'TimesNewRomanBold',
              textDecoration: 'underline',
              marginBottom: 18,
            }}
          >
            <Text>INFORMATION ON EQUIPMENT CONDITION / REQUIREMENT</Text>
          </View>

          <View
            style={[
              styles.block,
              {
                flexWrap: 'wrap',
                rowGap: 4,
                marginBottom: 6,
                paddingBottom: 6,
                borderBottom: '1px solid #00000',
              },
            ]}
          >
            <View style={{ width: '50%' }}>
              <View style={[styles.block]}>
                <View style={[styles.blockContentLeft, { width: '40%' }]}>
                  <Text>Before Calibration</Text>
                </View>

                <View style={styles.separator}>
                  <Text>:</Text>
                </View>

                <View style={styles.blockContentRight}>
                  <Text>{jobCn?.isBeforeCalibration ? 'Yes' : 'No'}</Text>
                </View>
              </View>
            </View>

            <View style={{ width: '50%' }}>
              <View style={[styles.block]}>
                <View style={[styles.blockContentLeft, { width: '40%' }]}>
                  <Text>During Calibration</Text>
                </View>

                <View style={styles.separator}>
                  <Text>:</Text>
                </View>

                <View style={styles.blockContentRight}>
                  <Text>{jobCn?.isDuringCalibration ? 'Yes' : 'No'}</Text>
                </View>
              </View>
            </View>

            <View style={{ width: '50%' }}>
              <View style={[styles.block]}>
                <View style={[styles.blockContentLeft, { width: '40%' }]}>
                  <Text>After Calibration</Text>
                </View>

                <View style={styles.separator}>
                  <Text>:</Text>
                </View>

                <View style={styles.blockContentRight}>
                  <Text>{jobCn?.isAfterCalibration ? 'Yes' : 'No'}</Text>
                </View>
              </View>
            </View>

            <View style={{ width: '50%' }}>
              <View style={[styles.block]}>
                <View style={styles.blockContentLeft}>
                  <Text>CMR No</Text>
                </View>

                <View style={styles.separator}>
                  <Text>:</Text>
                </View>

                <View style={styles.blockContentRight}>
                  <Text>{jobCn.jobId}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.container}>
          {calibratedInstruments.length > 0 &&
            calibratedInstruments
              .filter((ci) => ci.isSelected)
              .sort((a, b) => {
                if (!a?.description || !b?.description) return 0;
                return a?.description?.localeCompare(b?.description);
              })
              .map((equipment, i) => (
                <View
                  key={`${equipment.equipmentId}-${i}`}
                  style={[
                    styles.block,
                    {
                      flexWrap: 'wrap',
                      rowGap: 4,
                      marginBottom: 6,
                      paddingBottom: 6,
                      alignItems: 'flex-end',
                      borderBottom: '1px solid #00000',
                    },
                  ]}
                >
                  {/* //* Row 1 */}
                  <View style={{ width: '34%' }}>
                    <View style={[styles.block, { alignItems: 'flex-end' }]}>
                      <View style={[styles.blockContentLeft, { width: '30%' }]}>
                        <Text>No</Text>
                      </View>

                      <View style={[styles.separator, { width: '15%' }]}>
                        <Text>:</Text>
                      </View>

                      <View style={styles.blockContentRight}>
                        <Text>{i + 1}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ width: '32%' }}>
                    <View style={[styles.block, { alignItems: 'flex-end' }]}>
                      <View style={[styles.blockContentLeft, { width: '30%' }]}>
                        <Text>Cert No.</Text>
                      </View>

                      <View style={[styles.separator, { width: '15%' }]}>
                        <Text>:</Text>
                      </View>

                      <View style={styles.blockContentRight}>
                        <Text>{equipment?.certificateNumber || ''}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ width: '34%' }}>
                    <View style={[styles.block, { alignItems: 'flex-end' }]}>
                      <View style={[styles.blockContentLeft, { width: '35%' }]}>
                        <Text>Instrument</Text>
                      </View>

                      <View style={[styles.separator, { width: '15%' }]}>
                        <Text>:</Text>
                      </View>

                      <View style={styles.blockContentRight}>
                        <Text>{equipment?.description || ''}</Text>
                      </View>
                    </View>
                  </View>

                  {/* //* Row 2 */}
                  <View style={{ width: '34%' }}>
                    <View style={[styles.block, { alignItems: 'flex-end' }]}>
                      <View style={[styles.blockContentLeft, { width: '30%' }]}>
                        <Text>Serial No</Text>
                      </View>

                      <View style={[styles.separator, { width: '15%' }]}>
                        <Text>:</Text>
                      </View>

                      <View style={styles.blockContentRight}>
                        <Text>{equipment?.serialNumber || ''}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ width: '32%' }}>
                    <View style={[styles.block, { alignItems: 'flex-end' }]}>
                      <View style={[styles.blockContentLeft, { width: '30%' }]}>
                        <Text>Maker</Text>
                      </View>

                      <View style={[styles.separator, { width: '15%' }]}>
                        <Text>:</Text>
                      </View>

                      <View style={styles.blockContentRight}>
                        <Text>{equipment?.make || ''}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ width: '34%' }}>
                    <View style={[styles.block, { alignItems: 'flex-end' }]}>
                      <View style={[styles.blockContentLeft, { width: '35%' }]}>
                        <Text>Model</Text>
                      </View>

                      <View style={[styles.separator, { width: '15%' }]}>
                        <Text>:</Text>
                      </View>

                      <View style={styles.blockContentRight}>
                        <Text>{equipment?.model || ''}</Text>
                      </View>
                    </View>
                  </View>

                  {/* //* Row 3 */}
                  <View style={{ width: '34%' }}>
                    <View style={[styles.block, { alignItems: 'flex-end' }]}>
                      <View style={[styles.blockContentLeft, { width: '30%' }]}>
                        <Text>Broken</Text>
                      </View>

                      <View style={[styles.separator, { width: '15%' }]}>
                        <Text>:</Text>
                      </View>

                      <View style={[styles.blockContentRight]}>
                        <Text>{equipment?.isBroken ? 'Yes' : 'No'}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ width: '32%' }}>
                    <View style={[styles.block, { alignItems: 'flex-end' }]}>
                      <View style={[styles.blockContentLeft, { width: '50%' }]}>
                        <Text>Inoperative</Text>
                      </View>

                      <View style={[styles.separator, { width: '15%' }]}>
                        <Text>:</Text>
                      </View>

                      <View style={[styles.blockContentRight]}>
                        <Text>{equipment?.isInOperative ? 'Yes' : 'No'}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ width: '34%' }}>
                    <View style={[styles.block, { alignItems: 'flex-end' }]}>
                      <View style={[styles.blockContentLeft, { width: '75%' }]}>
                        <Text>Require Accessories</Text>
                      </View>

                      <View style={[styles.separator, { width: '15%' }]}>
                        <Text>:</Text>
                      </View>

                      <View style={[styles.blockContentRight]}>
                        <Text>{equipment?.isRequireAccessories ? 'Yes' : 'No'}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ width: '100%' }}>
                    <View style={[styles.block, { alignItems: 'flex-end' }]}>
                      <View style={[styles.blockContentLeft, { width: '8.5%' }]}>
                        <Text>Others</Text>
                      </View>

                      <View style={styles.separator}>
                        <Text>:</Text>
                      </View>

                      <View style={[styles.blockContentRight]}>
                        <Text>{equipment?.others || ''}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
        </View>

        <View
          style={{
            textAlign: 'center',
            width: '100%',
            fontSize: 10,
            fontFamily: 'TimesNewRomanBold',
            textDecoration: 'underline',
            marginBottom: 7,
          }}
          break
        >
          <Text>PLEASE ACT SOONEST TO:</Text>
        </View>

        <View style={styles.container}>
          <View
            style={[
              styles.block,
              {
                rowGap: 4,
                columnGap: 6,
                marginBottom: 6,
                paddingBottom: 10,
                borderBottom: '1px solid #00000',
                alignItems: 'flex-end',
              },
            ]}
          >
            <View
              style={{
                width: '65%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <View style={{ width: '100%' }}>
                <View style={[styles.block, { alignItems: 'flex-end' }]}>
                  <View style={[styles.blockContentLeft, { width: '72%' }]}>
                    <Text>Send the accessories as above mentioned as soon as possible.</Text>
                  </View>

                  <View style={[styles.separator, { width: '10%' }]}>
                    <Text>:</Text>
                  </View>

                  <View style={[styles.blockContentRight, { width: '5%' }]}>
                    <Text>{jobCn?.isSendTheAccessories ? 'Yes' : 'No'}</Text>
                  </View>
                </View>
              </View>

              <View style={{ width: '100%' }}>
                <View style={[styles.block, { alignItems: 'flex-end' }]}>
                  <View style={[styles.blockContentLeft, { width: '72%' }]}>
                    <Text>Acknowledge / Confirm. </Text>
                  </View>

                  <View style={[styles.separator, { width: '10%' }]}>
                    <Text>:</Text>
                  </View>

                  <View style={[styles.blockContentRight, { width: '5%' }]}>
                    <Text>{jobCn?.isAcknowledgeConfirm ? 'Yes' : 'No'}</Text>
                  </View>
                </View>
              </View>

              <View style={{ width: '100%' }}>
                <View style={[styles.block, { alignItems: 'flex-end' }]}>
                  <View style={[styles.blockContentLeft, { width: '72%' }]}>
                    <Text>Arrange for collection of this equipment</Text>
                  </View>

                  <View style={[styles.separator, { width: '10%' }]}>
                    <Text>:</Text>
                  </View>

                  <View style={[styles.blockContentRight, { width: '5%' }]}>
                    <Text>{jobCn?.isArrangeForCollection ? 'Yes' : 'No'}</Text>
                  </View>
                </View>
              </View>

              <View style={{ width: '100%' }}>
                <View style={[styles.block, { alignItems: 'flex-end' }]}>
                  <View style={[styles.blockContentLeft, { width: '8.5%' }]}>
                    <Text>Others</Text>
                  </View>

                  <View style={[styles.separator, { width: '8.5%' }]}>
                    <Text>:</Text>
                  </View>

                  <View style={[styles.blockContentRight]}>
                    <Text>{jobCn?.isOthers ? jobCn?.others || '' : 'N/A'}</Text>
                  </View>
                </View>
              </View>

              <View
                style={{
                  width: '100%',
                  marginTop: 6,
                  marginBottom: 8,
                }}
              >
                <Text>
                  Should you have any further queries on the above mentioned, please contact{' '}
                  <Text style={{ fontFamily: 'TimesNewRomanBold' }}>Mr Avinaash Palanisamy.</Text>{' '}
                  Thank you.
                </Text>
              </View>
            </View>

            <View
              style={{
                width: '35%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
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
                {worker?.data?.signature && (
                  <Image style={{ width: '60px', height: '40px' }} src={worker?.data?.signature} />
                )}
                <Text style={{ fontSize: 8, marginTop: 5, textAlign: 'center' }}>Technician</Text>
                <Text style={{ fontSize: 8, maxWidth: 140, textAlign: 'center' }}>
                  {worker?.data?.fullName || ''}
                </Text>
              </View>
            </View>
          </View>

          {/* //* customer reply section */}
          <View style={styles.container}>
            <View
              style={{
                marginBottom: 7,
              }}
            >
              <Text
                style={{
                  textAlign: 'center',
                  width: '100%',
                  fontSize: 10,
                  fontFamily: 'TimesNewRomanBold',
                  textDecoration: 'underline',
                }}
              >
                CUSTOMER REPLY SECTION
              </Text>
            </View>

            <View style={{ marginTop: 4, marginBottom: 8 }}>
              <Text style={{ textAlign: 'center' }}>
                We acknowledge the information given / required:
              </Text>
            </View>

            <View
              style={[
                styles.block,
                {
                  rowGap: 4,
                  marginBottom: 6,
                  paddingBottom: 10,
                  alignItems: 'center',
                  columnGap: 6,
                  borderBottom: '1px solid #00000',
                },
              ]}
            >
              <View
                style={{
                  width: '65%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <View style={{ width: '100%' }}>
                  <View style={[styles.block, { alignItems: 'flex-end' }]}>
                    <View style={[styles.blockContentLeft, { width: '25%' }]}>
                      <Text>Remarks: (if any)</Text>
                    </View>

                    <View style={styles.separator}>
                      <Text>:</Text>
                    </View>

                    <View style={[styles.blockContentRight]}>
                      <Text>{jobCn?.customerReplyRemarks || ''}</Text>
                    </View>
                  </View>
                </View>

                <View
                  style={{
                    width: '100%',
                    marginTop: 10,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontFamily: 'TimesNewRomanBold',
                    }}
                  >
                    Important Notice
                  </Text>

                  <Text style={{ marginTop: 5 }}>
                    Please inform us if you have any objection and if we do not received any reply
                    within <Text style={{ fontFamily: 'TimesNewRomanBold' }}>3 working days</Text>,
                    we assumed that you have agreed our explanation or action.
                  </Text>
                </View>
              </View>

              <View
                style={{
                  width: '35%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
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
                  {jobCn?.customerReplyAuthorizeSignature && (
                    <Image
                      style={{ width: '60px', height: '40px' }}
                      src={jobCn?.customerReplyAuthorizeSignature}
                    />
                  )}
                  <Text style={{ fontSize: 8, marginTop: 5, textAlign: 'center' }}>
                    Authorized By
                  </Text>
                  <Text style={{ fontSize: 8, maxWidth: 140, textAlign: 'center' }}>
                    {jobCn?.to || ''}
                  </Text>
                  <Text style={{ fontSize: 8, textAlign: 'center' }}>
                    {format(new Date(), 'dd MMMM yyyy')}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* //* for vitar lab use only */}
          <View style={styles.container}>
            <View
              style={{
                marginBottom: 7,
              }}
            >
              <Text
                style={{
                  textAlign: 'center',
                  width: '100%',
                  fontSize: 10,
                  fontFamily: 'TimesNewRomanBold',
                  textDecoration: 'underline',
                }}
              >
                FOR VITAR-SEGATEC LAB USE ONLY
              </Text>
              <Text
                style={{
                  textAlign: 'center',
                  width: '100%',
                  fontSize: 8,
                }}
              >
                (After Customer Reply)
              </Text>
            </View>

            <View style={{ marginTop: 4, marginBottom: 8 }}>
              <Text style={{ textAlign: 'center' }}>
                Information provided above have been reviewed. Action to be taken:
              </Text>
            </View>

            <View
              style={[
                styles.block,
                {
                  rowGap: 4,
                  columnGap: 6,
                  marginBottom: 6,
                  paddingBottom: 10,

                  alignItems: 'center',
                },
              ]}
            >
              <View
                style={{
                  width: '65%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <View style={{ width: '100%' }}>
                  <View style={[styles.block, { alignItems: 'flex-end' }]}>
                    <View style={[styles.blockContentLeft, { width: '65%' }]}>
                      <Text>Proceed with calibration</Text>
                    </View>

                    <View style={[styles.separator, { width: '10%' }]}>
                      <Text>:</Text>
                    </View>

                    <View style={[styles.blockContentRight, { width: '5%' }]}>
                      <Text>{jobCn?.forVitarLabUseIsProceed ? 'Yes' : 'No'}</Text>
                    </View>
                  </View>
                </View>

                <View style={{ width: '100%' }}>
                  <View style={[styles.block, { alignItems: 'flex-end' }]}>
                    <View style={[styles.blockContentLeft, { width: '65%' }]}>
                      <Text>No calibration required & return back to the customer</Text>
                    </View>

                    <View style={[styles.separator, { width: '10%' }]}>
                      <Text>:</Text>
                    </View>

                    <View style={[styles.blockContentRight, { width: '5%' }]}>
                      <Text>{jobCn?.forVitarLabUseIsNoCalibrationRequired ? 'Yes' : 'No'}</Text>
                    </View>
                  </View>
                </View>

                <View style={{ width: '100%' }}>
                  <View style={[styles.block, { alignItems: 'flex-end' }]}>
                    <View style={[styles.blockContentLeft, { width: '8.5%' }]}>
                      <Text>Others</Text>
                    </View>

                    <View style={styles.separator}>
                      <Text>:</Text>
                    </View>

                    <View style={[styles.blockContentRight]}>
                      <Text>
                        {jobCn?.forVitarLabUseIsOthers ? jobCn?.forVitarLabUseOthers || '' : 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View
                style={{
                  width: '35%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
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
                  {forVitarLabUseAuthorizeBy?.data?.signature && (
                    <Image
                      style={{ width: '60px', height: '40px' }}
                      src={forVitarLabUseAuthorizeBy?.data?.signature}
                    />
                  )}
                  <Text style={{ fontSize: 8, marginTop: 5, textAlign: 'center' }}>
                    Authorized by Head of Section
                  </Text>
                  <Text style={{ fontSize: 8, maxWidth: 140, textAlign: 'center' }}>
                    {forVitarLabUseAuthorizeBy?.data?.fullName || ''}
                  </Text>
                  <Text style={{ fontSize: 8, textAlign: 'center' }}>
                    {format(new Date(), 'dd MMMM yyyy')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default CustomerNotificationPDF;
