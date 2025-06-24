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

function OnSiteCalibrationSurveyPDF({ job, customer, surveyQuestions }) {
  const startByAt = useMemo(() => {
    if (!job?.startByAt) return '';
    return format(new Date(job.startByAt.toDate()), 'dd MMMM yyyy hh:mm a');
  }, [job]);

  const endByAt = useMemo(() => {
    if (!job?.endByAt) return '';
    return format(new Date(job.endByAt.toDate()), 'dd MMMM yyyy hh:mm a');
  }, [job]);

  const surveyResponses = useMemo(() => {
    return job?.surveyResponses || [];
  }, [job]);

  const renderWorkers = useMemo(() => {
    const value = job?.workers?.map((worker) => worker?.name).filter(Boolean) || [] // prettier-ignore

    if (value.length < 1) return '';

    if (value.length >= 2) {
      const lastWorker = value.pop();

      return (
        <>
          {value.map((worker) => (
            <Text>
              <Text style={{ fontFamily: 'TimesNewRomanBold', textDecoration: 'underline' }}>
                {worker}
              </Text>
              ,{' '}
            </Text>
          ))}
          and{' '}
          <Text style={{ fontFamily: 'TimesNewRomanBold', textDecoration: 'underline' }}>
            {lastWorker}
          </Text>
        </>
      );
    } else
      return (
        <Text style={{ fontFamily: 'TimesNewRomanBold', textDecoration: 'underline' }}>
          {value[0]}
        </Text>
      );
  }, [job]);

  return (
    <Document>
      <Page size='A4' debug={false} style={styles.body} wrap>
        <View fixed style={styles.logoContainer}>
          <Image src='/images/VITARLOGO.png' style={styles.logo} />
        </View>

        <View fixed style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <Text style={styles.title}>On-Site Calibration Survey</Text>

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
              <Text>To</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>{job?.surveyTo || ''}</Text>
            </View>
          </View>
        </View>

        <View style={styles.container}>
          <View style={[styles.block, { marginBottom: 8 }]}>
            <View style={styles.blockContentLeft}>
              <Text>Company</Text>
            </View>

            <View style={styles.separator}>
              <Text>:</Text>
            </View>

            <View style={styles.blockContentRight}>
              <Text>{customer?.data?.customerName || ''}</Text>
            </View>
          </View>
        </View>

        <View style={{ fontSize: 10, marginBottom: 20, marginTop: 10 }}>
          <Text>Dear Most Valued Customer,</Text>

          <Text style={{ marginBottom: 10 }}>
            In order for us to serve you better, kindly assist us in completing this survey. Your
            comment and perception of us is highly appreciated. Thank you very much for your
            valuation time and feedback.
          </Text>

          <Text style={{ display: 'flex', flexDirection: 'row', marginBottom: 4 }}>
            Please allow Mr / Miss {renderWorkers} from Vitar-Segatec Sdn. Bhd. to carry out the
            calibration job at your company.
          </Text>

          <Text>Please verify the time in and time out of our team at your company.</Text>
        </View>

        <View
          style={{
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'stretch',
            position: 'relative',
            gap: 20,
            marginBottom: 20,
          }}
        >
          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              border: '1px solid #00000',
              padding: 8,
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 8, fontFamily: 'TimesNewRomanBold' }}>Time In: </Text>
              <Text style={{ fontSize: 8 }}>{startByAt}</Text>
            </View>

            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                padding: 4,
              }}
            >
              {job?.surveyCustomerTimeInSignature && (
                <Image
                  style={{ width: '60px', height: '40px' }}
                  src={job?.surveyCustomerTimeInSignature}
                />
              )}
            </View>

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

          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              border: '1px solid #00000',
              padding: 8,
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 8, fontFamily: 'TimesNewRomanBold' }}>Time Out: </Text>
              <Text style={{ fontSize: 8 }}>{startByAt}</Text>
            </View>

            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                padding: 4,
              }}
            >
              {job?.surveyCustomerTimeOutSignature && (
                <Image
                  style={{ width: '60px', height: '40px' }}
                  src={job?.surveyCustomerTimeOutSignature}
                />
              )}
            </View>

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

        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 10 }}>Please answer the following survey questions.</Text>
        </View>

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
                width: '60%',
                borderLeft: '1px solid #00000',
                textAlign: 'center',
                height: '100%',
              }}
            >
              <Text style={{ fontFamily: 'TimesNewRomanBold', margin: 'auto 0' }}>CRITERIA</Text>
            </View>

            <View
              style={{
                width: '36%',
                borderLeft: '1px solid #00000',
                textAlign: 'center',
                height: '100%',
              }}
            >
              <Text style={{ fontFamily: 'TimesNewRomanBold', margin: 'auto 0' }}>
                SATISFACTION LEVEL
              </Text>
            </View>
          </View>

          {surveyQuestions.data.map((q, i) => {
            if (q.type === 'radio') {
              return (
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
                    <Text style={{ margin: 'auto 0' }}>{i + 1}</Text>
                  </View>

                  <View
                    style={{
                      width: '60%',
                      borderLeft: '1px solid #00000',
                      textAlign: 'center',
                      height: '100%',
                    }}
                  >
                    <Text style={{ margin: 'auto 0' }}>{q.question}</Text>
                  </View>

                  <View
                    style={{
                      width: '36%',
                      borderLeft: '1px solid #00000',
                      textAlign: 'center',
                      height: '100%',
                    }}
                  >
                    <Text style={{ fontFamily: 'TimesNewRomanBold', margin: 'auto 0' }}>
                      {_.startCase(
                        surveyResponses?.find((response) => response.questionId === q.questionId)
                          ?.response
                      )}
                    </Text>
                  </View>
                </View>
              );
            }

            if (q.type === 'text') {
              return (
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
                    <Text style={{ margin: 'auto 0' }}>{i + 1}</Text>
                  </View>

                  <View
                    style={{
                      width: '96%',
                      borderLeft: '1px solid #00000',
                      textAlign: 'center',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ margin: 'auto 0' }}>{q.question}</Text>
                    <Text style={{ fontFamily: 'TimesNewRomanBold', margin: 'auto 0' }}>
                      {surveyResponses?.find((response) => response.questionId === q.questionId)
                        ?.response || ''}
                    </Text>
                  </View>
                </View>
              );
            }

            return null;
          })}
        </View>
      </Page>
    </Document>
  );
}

export default OnSiteCalibrationSurveyPDF;
