import TimesNewRomanRegular from 'public/fonts/times-new-roman/Times-New-Roman-Regular.ttf';
import TimesNewRomanBold from 'public/fonts/times-new-roman/Times-New-Roman-Bold.ttf';
import TimesNewRomanItalic from 'public/fonts/times-new-roman/Times-New-Roman-Italic.ttf';
import TimesNewRomanBoldItalic from 'public/fonts/times-new-roman/Times-New-Roman-Bold-Italic.ttf';

import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  body: {
    position: 'relative',
    fontFamily: 'TimesNewRomanRegular',
    width: '100%',
    height: '100%',
    paddingTop: 99.2088,
    paddingBottom: '155px',
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

const CalibrationChecklistPDF = ({
  job,
  customer,
  takenByBefore,
  takenByAfter,
  verifiedByBefore,
  verifiedByAfter,
}) => {
  const [totalPages, setTotalPages] = useState(0);

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
          <Text style={styles.formNumber}>F704-000501</Text>
          <Image src='/images/VITARLOGO.png' style={styles.logo} />
        </View>

        <View fixed style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <Text style={styles.title}>CALIBRATION CHECKLIST FORM</Text>

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

        <View style={styles.container}>
          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Customer</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>{customer?.data?.customerName || ''}</Text>
            </View>
          </View>
        </View>

        <Text style={{ fontSize: 10, marginBottom: 8 }}>
          Fill in the column with approriate equipment:
        </Text>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            border: '1px solid #00000',
            borderBottom: 'none',
            fontSize: 9.5,
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
            <View
              style={{
                width: '4%',
                textAlign: 'center',
                height: '100%',
              }}
            >
              <Text style={{ fontFamily: 'TimesNewRomanBold', margin: 'auto 0' }}>NO</Text>
            </View>

            <View
              style={{
                width: '20%',
                borderLeft: '1px solid #00000',
                textAlign: 'center',
                height: '100%',
              }}
            >
              <Text style={{ fontFamily: 'TimesNewRomanBold', margin: 'auto 0' }}>EQUIPMENT</Text>
            </View>

            <View
              style={{
                width: '20%',
                borderLeft: '1px solid #00000',
                textAlign: 'center',
                height: '100%',
              }}
            >
              <Text style={{ fontFamily: 'TimesNewRomanBold', margin: 'auto 0' }}>
                EQUIPMENT ID
              </Text>
            </View>

            <View
              style={{
                width: '14%',
                borderLeft: '1px solid #00000',
                textAlign: 'center',
                height: '100%',
              }}
            >
              <Text style={{ fontFamily: 'TimesNewRomanBold', margin: 'auto 0' }}>NOMINAL</Text>
              <Text style={{ fontFamily: 'TimesNewRomanBold', margin: 'auto 0' }}>VALUE</Text>
            </View>

            <View
              style={{
                width: '14%',
                borderLeft: '1px solid #00000',
                textAlign: 'center',
                height: '100%',
              }}
            >
              <Text style={{ fontFamily: 'TimesNewRomanBold', margin: 'auto 0' }}>ACCEPTANCE</Text>
            </View>

            <View
              style={{
                width: '14%',
                borderLeft: '1px solid #00000',
                textAlign: 'center',
                height: '100%',
              }}
            >
              <Text style={{ fontFamily: 'TimesNewRomanBold', margin: 'auto 0' }}>RESULT</Text>
              <Text style={{ fontFamily: 'TimesNewRomanBold', margin: 'auto 0' }}>BEFORE</Text>
            </View>

            <View
              style={{
                width: '14%',
                borderLeft: '1px solid #00000',
                textAlign: 'center',
                height: '100%',
              }}
            >
              <Text style={{ fontFamily: 'TimesNewRomanBold', margin: 'auto 0' }}>RESULT</Text>
              <Text style={{ fontFamily: 'TimesNewRomanBold', margin: 'auto 0' }}>AFTER</Text>
            </View>
          </View>

          {job.checklistEquipments?.map((ce, i) => (
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                borderBottom: '1px solid #00000',
              }}
            >
              <View style={{ width: '4%', textAlign: 'center', margin: 'auto 0', height: '100%' }}>
                <Text>{i + 1}</Text>
              </View>

              <View
                style={{
                  width: '20%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                  height: '100%',
                }}
              >
                <Text style={{ margin: 'auto 0' }}>{ce.description}</Text>
              </View>

              <View
                style={{
                  width: '20%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                  height: '100%',
                }}
              >
                <Text style={{ margin: 'auto 0' }}>{ce.tagId}</Text>
              </View>

              <View
                style={{
                  width: '14%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                  height: '100%',
                }}
              >
                <Text style={{ margin: 'auto 0' }}>{ce.nominalValue}</Text>
              </View>

              <View
                style={{
                  width: '14%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                  height: '100%',
                }}
              >
                <Text style={{ margin: 'auto 0' }}>{ce.acceptance}</Text>
              </View>

              <View
                style={{
                  width: '14%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                  height: '100%',
                }}
              >
                <Text style={{ margin: 'auto 0' }}>{ce.resultBefore}</Text>
              </View>

              <View
                style={{
                  width: '14%',
                  borderLeft: '1px solid #00000',
                  textAlign: 'center',
                  height: '100%',
                }}
              >
                <Text style={{ margin: 'auto 0' }}>{ce.resultAfter}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* //* footer */}
        <View
          fixed
          style={styles.footer}
          render={({ pageNumber }) =>
            pageNumber === totalPages && (
              <View>
                <Text style={{ fontSize: 10, marginBottom: 8, fontFamily: 'TimesNewRomanItalic' }}>
                  *Acceptance value is baed on the accuracy/tolerance in manual (please refer
                  manual/datasheet of the equipment)
                </Text>

                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                  }}
                >
                  <View
                    style={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View style={{ width: '45%' }}>
                      <Text style={{ fontSize: 10, marginBottom: 4 }}>Taken by:</Text>
                    </View>

                    <View style={{ width: '45%' }}>
                      <Text style={{ fontSize: 10, marginBottom: 4 }}>
                        Verified by Lab In-charge:
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      border: '1px solid #00000',
                      borderBottom: 'none',
                      fontSize: 10,
                      width: '45%',
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
                      <Text
                        style={{
                          width: '50%',
                          textAlign: 'center',
                          fontFamily: 'TimesNewRomanBold',
                        }}
                      >
                        Before
                      </Text>
                      <Text
                        style={{
                          width: '50%',
                          textAlign: 'center',
                          textAlign: 'center',
                          fontFamily: 'TimesNewRomanBold',
                          borderLeft: '1px solid #00000',
                        }}
                      >
                        After
                      </Text>
                    </View>

                    <View
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderBottom: '1px solid #00000',
                        height: '80px',
                      }}
                    >
                      <View
                        style={{
                          width: '50%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: 4,
                          gap: 4,
                        }}
                      >
                        {takenByBefore?.signature && (
                          <Image
                            style={{ width: '50px', height: '30px' }}
                            src={takenByBefore?.signature}
                          />
                        )}

                        <Text style={{ fontSize: 8, textAlign: 'center' }}>
                          {takenByBefore?.fullName || ''}
                        </Text>
                      </View>
                      <View
                        style={{
                          width: '50%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderLeft: '1px solid #00000',
                          padding: 4,
                          gap: 4,
                        }}
                      >
                        {takenByAfter?.signature && (
                          <Image
                            style={{ width: '50px', height: '30px' }}
                            src={takenByAfter?.signature}
                          />
                        )}

                        <Text style={{ fontSize: 8, textAlign: 'center' }}>
                          {takenByAfter?.fullName || ''}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      border: '1px solid #00000',
                      borderBottom: 'none',
                      fontSize: 10,
                      width: '45%',
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
                      <Text
                        style={{
                          width: '50%',
                          textAlign: 'center',
                          fontFamily: 'TimesNewRomanBold',
                        }}
                      >
                        Before
                      </Text>
                      <Text
                        style={{
                          width: '50%',
                          textAlign: 'center',
                          textAlign: 'center',
                          fontFamily: 'TimesNewRomanBold',
                          borderLeft: '1px solid #00000',
                        }}
                      >
                        After
                      </Text>
                    </View>

                    <View
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderBottom: '1px solid #00000',
                        height: '80px',
                      }}
                    >
                      <View
                        style={{
                          width: '50%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: 4,
                          gap: 4,
                        }}
                      >
                        {verifiedByBefore?.signature && (
                          <Image
                            style={{ width: '50px', height: '30px' }}
                            src={verifiedByBefore?.signature}
                          />
                        )}

                        <Text style={{ fontSize: 8, textAlign: 'center' }}>
                          {verifiedByBefore?.fullName || ''}
                        </Text>
                      </View>
                      <View
                        style={{
                          width: '50%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderLeft: '1px solid #00000',
                          padding: 4,
                          gap: 4,
                        }}
                      >
                        {verifiedByAfter?.signature && (
                          <Image
                            style={{ width: '50px', height: '30px' }}
                            src={verifiedByAfter?.signature}
                          />
                        )}

                        <Text style={{ fontSize: 8, textAlign: 'center' }}>
                          {verifiedByAfter?.fullName || ''}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )
          }
        />
      </Page>
    </Document>
  );
};

export default CalibrationChecklistPDF;
