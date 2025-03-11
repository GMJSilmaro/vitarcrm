import { TEST_LOADS } from '@/schema/calibration';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Database, Eye, EyeSlash } from 'react-bootstrap-icons';
import { useFormContext } from 'react-hook-form';
import styles from '../../mass.module.css';

import {
  formatScientific,
  formatToDicimalString,
  getArrayActualValues,
} from '@/utils/calibrations/data-formatter';
import {
  std,
  sqrt,
  mean,
  sum,
  bignumber,
  pow,
  multiply,
  divide,
  subtract,
  format,
  evaluate,
  max,
  abs,
} from 'mathjs';
import { Tab, Col, Row, Nav, Card, Table, Spinner, Button } from 'react-bootstrap';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/firebase';

const CalculationTable = () => {
  //? just edit the fields that thas (.value) in form because its not using fields from schema
  const form = useFormContext();

  const [showCalculationTables, setShowCalculationTables] = useState(false);
  const [showUncertaintyBudget, setShowUncertaintyBudget] = useState(false);

  const calibrationPointNo = useMemo(() => {
    const value = parseFloat(form.getValues('calibrationPointNo'));
    return isNaN(value) ? undefined : parseFloat(value);
  }, [form.watch('calibrationPointNo')]);

  const dfnv = useMemo(() => {
    const value = form.getValues('data.dfnv');
    return value && Array.isArray(value) ? value : [];
  }, [form.watch('data.dfnv')]);

  const nominalValues = useMemo(() => {
    const value = form.getValues('data.nominalValues');
    return value && Array.isArray(value) ? value : [];
  }, [form.watch('data.nominalValues')]);

  const resolution = useMemo(() => {
    const value = form.getValues('resolution');
    return value ? value : 0;
  }, [form.watch('resolution')]);

  const measuredValues = useMemo(() => {
    const value = form.getValues('data.measuredValues');
    return value && Array.isArray(value) ? value : [];
  }, [form.watch('data.measuredValues')]);

  const rtest = useMemo(() => {
    let actualValue = {};
    const value = form.getValues('data.rtest');

    if (value && !_.isEmpty(value)) {
      if (value?.half && Array.isArray(value.half) && value?.half?.length > 0) {
        const filteredValues = value?.half?.filter(
          (value) => value !== undefined && value !== null && value !== '' && value !== false
        );

        actualValue.half = filteredValues && filteredValues?.length > 0 ? filteredValues : [0];
      } else actualValue.half = [0];

      if (value?.max && Array.isArray(value.max) && value?.max?.length > 0) {
        const filteredValues = value?.max?.filter(
          (value) => value !== undefined && value !== null && value !== '' && value !== false
        );

        actualValue.max = filteredValues && filteredValues?.length > 0 ? filteredValues : [0];
      } else actualValue.max = [0];
    } else actualValue = { half: [0], max: [0] };

    return actualValue;
  }, [JSON.stringify(form.watch('data.rtest'))]);

  const etest = useMemo(() => {
    let actualValue = {};
    const value = form.getValues('data.etest');

    if (value && !_.isEmpty(value)) {
      if (value?.values && Array.isArray(value.values) && value?.values?.length > 0) {
        const filteredValues = value?.values?.filter(
          (value) => value !== undefined && value !== null && value !== '' && value !== false
        );

        actualValue.values = filteredValues && filteredValues?.length > 0 ? filteredValues : [0];
      } else actualValue.values = [0];

      actualValue = { ...value, ...actualValue };
    } else actualValue = { values: [0] };

    return actualValue;
  }, [JSON.stringify(form.watch('data.etest'))]);

  const getESDMValue = (measuredValue) => {
    const values = getArrayActualValues(measuredValue);
    return std(values) / sqrt(values.length);
  };

  const getMeasuredValueM = (measuredValue) => {
    const values = getArrayActualValues(measuredValue);
    return mean(values);
  };

  const d1 = useMemo(() => {
    const value = form.getValues('data.d1');
    return isNaN(value) ? 0 : value;
  }, [form.watch('data.d1')]);

  const d2 = useMemo(() => {
    const value = form.getValues('data.d2');
    return isNaN(value) ? 0 : value;
  }, [form.watch('data.d2')]);

  if (calibrationPointNo === undefined)
    return (
      <div>
        <h4>Calibration Point No. is not found</h4>
      </div>
    );

  return (
    <Tab.Container defaultActiveKey='0'>
      <Tab.Content className='h-100'>
        <Row>
          <Col className='px-0' md={12}>
            <Nav variant='pills' className='d-flex justify-content-center gap-3'>
              {calibrationPointNo &&
                Array.from({ length: calibrationPointNo }).map((_, pointIndex) => (
                  <Nav.Item key={`${pointIndex}-nav-item`} className='d-flex align-items-center'>
                    <Nav.Link eventKey={`${pointIndex}`}>
                      <Database size={18} />A{pointIndex + 1}
                    </Nav.Link>
                  </Nav.Item>
                ))}
            </Nav>

            <div className='d-flex justify-content-center align-items-center gap-3 mt-3'>
              <Button
                variant='outline-primary'
                className='text-decoration-none border-primary'
                onClick={() => setShowCalculationTables((prev) => !prev)}
              >
                {showCalculationTables ? (
                  <>
                    <EyeSlash size={18} className='me-2' /> Hide{' '}
                  </>
                ) : (
                  <>
                    <Eye size={18} className='me-2' /> Show{' '}
                  </>
                )}
                Calculation Summary Tables
              </Button>

              <Button
                variant='outline-primary'
                className='text-decoration-none border-primary'
                onClick={() => setShowUncertaintyBudget((prev) => !prev)}
              >
                {showUncertaintyBudget ? (
                  <>
                    <EyeSlash size={18} className='me-2' /> Hide{' '}
                  </>
                ) : (
                  <>
                    <Eye size={18} className='me-2' /> Show{' '}
                  </>
                )}
                Uncertainty Budget Table
              </Button>
            </div>
          </Col>
          <Col md={12} className='ps-0'>
            <Tab.Content className='w-100 h-100'>
              {Array.from({ length: calibrationPointNo }).map((_, pointIndex) => {
                return (
                  <Tab.Pane key={`${pointIndex}-tab-pane`} className='h-100' eventKey={pointIndex}>
                    <Card className='h-100 w-100'>
                      <Card.Body>
                        <Row className='position-relative'>
                          <Col
                            md={3}
                            style={{
                              padding: showCalculationTables ? undefined : '0',
                              width: showCalculationTables ? undefined : '0',
                              maxHeight: showCalculationTables ? '2160px' : '0',
                              position: 'sticky',
                              transition: 'all 0.5s ease-in-out',
                            }}
                          >
                            <div className='d-flex flex-column align-items-center gap-2'>
                              {/* //* block 1 */}
                              <Table className='text-center fs-6 align-middle' bordered responsive>
                                <tbody>
                                  <tr>
                                    <th>Nominal Value</th>
                                    <td>{formatToDicimalString(nominalValues?.[pointIndex])} g</td>
                                  </tr>
                                  <tr>
                                    <th>Resolution of The Balance</th>
                                    <td>{resolution} g</td>
                                  </tr>
                                </tbody>
                              </Table>

                              {/* //* block 2 */}
                              <Table className='text-center fs-6 align-middle' bordered responsive>
                                <tbody>
                                  <tr>
                                    <th rowSpan={4}>Departure From Nominal Value</th>
                                  </tr>

                                  {Array.from({ length: 3 }).map((_, measuredValueIndex) => (
                                    <tr>
                                      <td>
                                        {formatToDicimalString(
                                          measuredValues?.[pointIndex]?.[measuredValueIndex]
                                        )}{' '}
                                        g
                                      </td>
                                    </tr>
                                  ))}

                                  <tr>
                                    <th>ESDM</th>
                                    <td>
                                      {formatToDicimalString(
                                        getESDMValue(measuredValues?.[pointIndex])
                                      )}{' '}
                                      g
                                    </td>
                                  </tr>
                                </tbody>
                              </Table>

                              {/* //* block 3 */}
                              <Table className='text-center fs-6 align-middle' bordered responsive>
                                <thead>
                                  <tr>
                                    <th colSpan={2}>Result</th>
                                  </tr>
                                </thead>

                                <tbody>
                                  <tr>
                                    <th>Actual Weight</th>
                                    <td>
                                      {formatToDicimalString(
                                        form.watch(`data.totalActualWeight.${pointIndex}`),
                                        6
                                      )}{' '}
                                      g
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>Measured Value, M</th>
                                    <td>
                                      {formatToDicimalString(
                                        getMeasuredValueM(measuredValues?.[pointIndex])
                                      )}{' '}
                                      g
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>Correction</th>
                                    <td>
                                      {formatToDicimalString(
                                        form.watch(`data.corrections.${pointIndex}`),
                                        6
                                      )}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>Expanded Uncertainty</th>
                                    <td>
                                      <span className='me-2'>±</span>
                                      {formatToDicimalString(
                                        form.watch(`data.expandedUncertainties.${pointIndex}`),
                                        5
                                      )}{' '}
                                      g
                                    </td>
                                  </tr>
                                </tbody>
                              </Table>

                              {/* //* block 4 */}
                              <Table className='text-center fs-6 align-middle' responsive bordered>
                                <thead>
                                  <tr>
                                    <th colSpan={3}>Repeatability Test (g)</th>
                                  </tr>
                                  <tr>
                                    <th>No.</th>
                                    <th>≃ 1/2 Max</th>
                                    <th>≃ Max</th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {Array.from({ length: calibrationPointNo }).map((_, i) => (
                                    <tr key={`${i}-rtest`}>
                                      <th>#{i + 1}</th>
                                      <td>{formatToDicimalString(rtest?.half[i])} g</td>
                                      <td>{formatToDicimalString(rtest?.max[i])} g</td>
                                    </tr>
                                  ))}
                                  <tr>
                                    <th className='fst-italic'>u(R)</th>
                                    <td>{formatToDicimalString(std(rtest?.half))}</td>
                                    <td>{formatToDicimalString(std(rtest?.max))}</td>
                                  </tr>
                                </tbody>
                              </Table>

                              {/* //* block 5 */}
                              <Table className='text-center fs-6 align-middle' responsive bordered>
                                <thead>
                                  <tr>
                                    <th colSpan={3}>Eccentricity Test (g)</th>
                                  </tr>
                                  <tr>
                                    <th>Position</th>
                                    <th>≃ 1/3 Max</th>
                                    <th rowSpan={TEST_LOADS.length + 1}>&nbsp;</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {TEST_LOADS.map((testload, i) => (
                                    <tr key={`${testload}-${i}-etest`}>
                                      <th>{testload}</th>
                                      <td>{formatToDicimalString(etest.values[i])} g</td>
                                      {i === 0 && (
                                        <td rowSpan={TEST_LOADS.length}>
                                          <div className='d-flex flex-column align-items-center gap-2'>
                                            <div className='text-center fw-bold'>Max Error</div>
                                            <div className='text-center'>
                                              {formatToDicimalString(etest.maxError)}
                                            </div>
                                          </div>
                                        </td>
                                      )}
                                    </tr>
                                  ))}

                                  <tr>
                                    <th>d1</th>
                                    <td>{d1}</td>
                                    <td>mm</td>
                                  </tr>
                                  <tr>
                                    <th>d2</th>
                                    <td>{d2}</td>
                                    <td>mm</td>
                                  </tr>
                                </tbody>
                              </Table>

                              {/* //* block 6 */}
                              <Table
                                className='text-center fs-6 mb-0 align-middle'
                                bordered
                                responsive
                              >
                                <tbody>
                                  <tr>
                                    <th>Total Actual Weight</th>
                                    <td>
                                      {formatToDicimalString(
                                        form.watch(`data.totalActualWeight.${pointIndex}`, 6)
                                      )}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>Total MPE</th>
                                    <td>{form.watch(`data.totalMPE.${pointIndex}`)}</td>
                                  </tr>
                                  <tr>
                                    <th>
                                      u(M<sub>s</sub>))
                                    </th>
                                    <td>
                                      {resolution
                                        ? formatScientific(form.watch(`data.uM2.${pointIndex}`), 2)
                                        : ''}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      V<sub>eff</sub>
                                    </th>
                                    <td>
                                      {resolution
                                        ? formatScientific(form.watch(`data.vEff.${pointIndex}`), 1)
                                        : ''}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      Total U<sup>2</sup>
                                      <sub>i</sub>
                                    </th>
                                    <td>
                                      {formatScientific(
                                        form.watch(`data.totalUcert2g2.${pointIndex}`)
                                      )}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      Total U<sub>i</sub>
                                      <sup>2</sup>/ <small>v</small>
                                    </th>
                                    <td>
                                      {formatScientific(
                                        form.watch(`data.totalUcert4vG4.${pointIndex}`)
                                      )}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>Total U(Z)</th>
                                    <td>
                                      {formatScientific(
                                        form.watch(`data.totalUints2g2.${pointIndex}`)
                                      )}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      Total U(Z)<sup>4</sup>/<small>v</small>
                                    </th>
                                    <td>
                                      {formatScientific(
                                        form.watch(`data.totalUints4vG4.${pointIndex}`)
                                      )}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      Total U(Ms)<sup>mg</sup>
                                    </th>
                                    <td>{form.watch(`data.totalUncertainty.${pointIndex}`)}</td>
                                  </tr>
                                </tbody>
                              </Table>
                            </div>
                          </Col>

                          <Col
                            md={showCalculationTables ? 9 : 12}
                            style={{
                              maxHeight: showCalculationTables ? '2160px' : 'fit-content',
                              overflow: 'auto',
                              transition: 'all 0.5s ease-in-out',
                            }}
                          >
                            <RefTable
                              dfnv={dfnv}
                              pointIndex={pointIndex}
                              showUncertaintyBudget={showUncertaintyBudget}
                              rtest={rtest}
                              etest={etest}
                            />
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Tab.Pane>
                );
              })}
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Content>
    </Tab.Container>
  );
};

const RefTable = ({ dfnv, pointIndex, showUncertaintyBudget, rtest, etest }) => {
  const form = useFormContext();

  const [refTableData, setRefTableData] = useState({ data: [], isLoading: true, isError: false });
  const [flattenedData, setFlattenedData] = useState([]);
  const [cuswd, setCuswd] = useState({ data: [], isLoading: true, isError: false });
  const [mpe, setMpe] = useState({ data: [], isLoading: true, isError: false });

  //* get current calibration point data flatten it
  useEffect(() => {
    if (!dfnv || dfnv?.length < 1 || pointIndex == undefined) return;

    const dfnvDataCurrentPoint = dfnv.map((entry) => {
      if (!entry?.calibrationPoints[pointIndex]?.data) [];
      const flattenData = entry.calibrationPoints?.[pointIndex]?.data?.flat(Infinity);
      return { ...entry, flattenData: flattenData ? [...flattenData].sort((a, b) => a - b) : [] };
    });

    setFlattenedData(dfnvDataCurrentPoint);

    // console.log('trigger....');
  }, [JSON.stringify(form.watch('data')), form.watch('calibrationPointNo')]);

  //* query Correction, Uncertainty of the Standard Weight & Drift (CUSWD)
  useEffect(() => {
    const q = query(collection(db, 'jobCalibrationReferences', 'CR000001', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          setCuswd({
            data: snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })),
            isLoading: false,
            isError: false,
          });

          return;
        }

        setCuswd({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        setCuswd({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  //* query MPE table
  useEffect(() => {
    const q = query(collection(db, 'jobCalibrationReferences', 'CR000002', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          setMpe({
            data: snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })),
            isLoading: false,
            isError: false,
          });

          return;
        }

        setMpe({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        setMpe({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  //* setRefTable data
  useEffect(() => {
    const refData = flattenedData.map((entry) => {
      if (entry.flattenData?.length < 1) return { entry, data: [] };

      const data = entry.flattenData.map((value) => {
        // TODO: For now in CUSWD, only cater/comapre for number value
        //TODO: For now in MPE, only cater/comapre for the weight and for MPE code which is "M1", might change for other template
        const cuswdRef = cuswd.data.find((ref) => ref.tagId === String(value));
        const mpeRef = mpe.data.find((ref) => ref.weight === String(value) && ref.code === 'M1');

        return { weightUsed: value, ...cuswdRef, ...mpeRef };
      });

      return { entry, data };
    });

    // console.log({ refData, pointIndex });

    setRefTableData({ data: refData, isLoading: false, isError: false });
  }, [cuswd.data, mpe.data, JSON.stringify(flattenedData)]);

  const resolution = useMemo(() => {
    const value = form.getValues('resolution');
    return value ? value : 0;
  }, [form.watch('resolution')]);

  const calibrationPointNo = useMemo(() => {
    const value = parseFloat(form.getValues('calibrationPointNo'));
    return isNaN(value) ? 0 : value;
  }, [form.watch('calibrationPointNo')]);

  const nominalValue = useMemo(() => {
    const value = form.getValues(`data.nominalValues.${pointIndex}`);
    return isNaN(value) ? 0 : value;
  }, [pointIndex, form.watch('data.nominalValues')]);

  const measuredValue = useMemo(() => {
    const value = form.getValues(`data.measuredValues.${pointIndex}`);
    return value && Array.isArray(value) ? value : [0];
  }, [form.watch('data.measuredValues')]);

  const stdMeasuredValue = useMemo(() => {
    const values = getArrayActualValues(measuredValue);
    return std(values);
  }, [measuredValue]);

  const esdm = useMemo(() => {
    const values = getArrayActualValues(measuredValue);
    return std(values) / sqrt(values.length);
  }, [measuredValue]);

  const maxError = useMemo(() => {
    const values = form.getValues('data.etest.maxError');
    return isNaN(values) ? 0 : values;
  }, []);

  const rangeMaxCalibration = useMemo(() => {
    const value = parseFloat(form.getValues('rangeMaxCalibration'));
    return isNaN(value) ? 0 : value;
  }, [form.watch('rangeMaxCalibration')]);

  const stdRtestMax = useMemo(() => {
    const values = getArrayActualValues(rtest.max);
    return std(values);
  }, [rtest]);

  const stdRtestHalf = useMemo(() => {
    const values = getArrayActualValues(rtest.half);
    return std(values);
  }, [rtest]);

  const totalWeight = useMemo(() => {
    if (refTableData.data.length < 1) return 0;

    const values = refTableData.data
      .map((refData) => {
        if (refData.data.length < 1) return [0];
        return refData.data.map((ref) =>
          isNaN(parseFloat(ref?.lastYearActualValue)) ? 0 : parseFloat(ref.lastYearActualValue)
        );
      })
      .flat(Infinity);

    const result = sum(values);

    //* set temporary value used for view in table
    form.setValue(`data.totalActualWeight.${pointIndex}`, result);

    return result;
  }, [refTableData, pointIndex]);

  const totalMPE = useMemo(() => {
    if (refTableData.data.length < 1) return 0;

    const values = refTableData.data
      .map((refData) => {
        if (refData.data.length < 1) return [0];
        return refData.data.map((ref) => (isNaN(parseFloat(ref?.mpe)) ? 0 : parseFloat(ref.mpe)));
      })
      .flat(Infinity);

    const result = sum(values);

    //* set temporary value used for view in table
    form.setValue(`data.totalMPE.${pointIndex}`, result);

    return result;
  }, [refTableData, pointIndex]);

  const totalUcert2g2 = useMemo(() => {
    if (refTableData.data.length < 1) return 0;

    const values = refTableData.data
      .map((refData) => {
        if (refData.data.length < 1) return [0];

        return refData.data.map((ref) => {
          let value;

          try {
            value = bignumber(ref?.uCert2g2 || 0);
          } catch (error) {
            value = 0;
          }

          return value;
        });
      })
      .flat(Infinity);

    const result = sum(values);

    //* set temporary value used for view in table
    form.setValue(`data.totalUcert2g2.${pointIndex}`, result);

    return result;
  }, [refTableData, pointIndex]);

  const totalUcert4vG4 = useMemo(() => {
    if (refTableData.data.length < 1) return 0;

    const values = refTableData.data
      .map((refData) => {
        if (refData.data.length < 1) return [0];

        return refData.data.map((ref) => {
          let value;

          try {
            value = bignumber(ref?.uCert4vG4 || 0);
          } catch (error) {
            value = 0;
          }

          return value;
        });
      })
      .flat(Infinity);

    const result = sum(values);

    //* set temporary value used for view in table
    form.setValue(`data.totalUcert4vG4.${pointIndex}`, result);

    return result;
  }, [refTableData, pointIndex]);

  const totalUints2g2 = useMemo(() => {
    if (refTableData.data.length < 1) return 0;

    const values = refTableData.data
      .map((refData) => {
        if (refData.data.length < 1) return [0];

        return refData.data.map((ref) => {
          let value;

          try {
            value = bignumber(ref?.uInst2g2 || 0);
          } catch (error) {
            value = 0;
          }

          return value;
        });
      })
      .flat(Infinity);

    const result = sum(values);

    //* set temporary value used for view in table
    form.setValue(`data.totalUints2g2.${pointIndex}`, result);

    return result;
  }, [refTableData, pointIndex]);

  const totalUints4vG4 = useMemo(() => {
    if (refTableData.data.length < 1) return 0;

    const values = refTableData.data
      .map((refData) => {
        if (refData.data.length < 1) return [0];

        return refData.data.map((ref) => {
          let value;

          try {
            value = bignumber(ref?.uInst4vG4 || 0);
          } catch (error) {
            value = 0;
          }

          return value;
        });
      })
      .flat(Infinity);

    const result = sum(values);

    //* set temporary value used for view in table
    form.setValue(`data.totalUints4vG4.${pointIndex}`, result);

    return result;
  }, [refTableData, pointIndex]);

  const totalUncertainty = useMemo(() => {
    if (refTableData.data.length < 1) return 0;

    const values = refTableData.data
      .map((refData) => {
        if (refData.data.length < 1) return [0];
        return refData.data.map((ref) =>
          isNaN(parseFloat(ref?.uncertainty)) ? 0 : parseFloat(ref.uncertainty)
        );
      })
      .flat(Infinity);

    const result = sum(values);

    //* set temporary value used for view in table
    form.setValue(`data.totalUncertainty.${pointIndex}`, result);

    return result;
  }, [refTableData, pointIndex]);

  const uM2 = useMemo(() => {
    if (refTableData.data.length < 1) return 0;

    const result = sqrt(totalUcert2g2);

    //* set temporary value used for view in table
    form.setValue(`data.uM2.${pointIndex}`, result);

    return result;
  }, [refTableData, pointIndex, totalUcert2g2]);

  const vEff = useMemo(() => {
    if (refTableData.data.length < 1) return 0;

    const um2Pow4 = pow(uM2, 4);
    const result = um2Pow4 / totalUcert4vG4;

    //* set temporary value used for view in table
    form.setValue(`data.vEff.${pointIndex}`, result);

    return result;
  }, [refTableData, pointIndex, uM2, totalUcert4vG4]);

  const correction = useMemo(() => {
    if (refTableData.data.length < 1) return 0;

    const mValues = getArrayActualValues(measuredValue);

    const x = mean(mValues);
    const y = totalWeight;
    const result = subtract(x, y);

    //* set temporary value used for view in table
    form.setValue(`data.corrections.${pointIndex}`, result);
    form.setValue(`data.measuredValuesM.${pointIndex}`, x);

    return result;
  }, [refTableData, pointIndex, measuredValue, totalWeight]);

  const calculations = useMemo(() => {
    return {
      calibrationPointNo,
      resolution,
      rangeMaxCalibration,
      nominalValue,
      measuredValue,
      stdMeasuredValue,
      stdRtestMax,
      stdRtestHalf,
      maxError,
      esdm,
      totalWeight,
      totalMPE,
      totalUcert2g2,
      totalUcert4vG4,
      totalUints2g2,
      totalUints4vG4,
      totalUncertainty,
      uM2,
      vEff,
    };
  }, [
    calibrationPointNo,
    resolution,
    rangeMaxCalibration,
    nominalValue,
    measuredValue,
    stdMeasuredValue,
    stdRtestMax,
    stdRtestHalf,
    maxError,
    esdm,
    totalWeight,
    totalMPE,
    totalUcert2g2,
    totalUcert4vG4,
    totalUints2g2,
    totalUints4vG4,
    totalUncertainty,
    uM2,
    vEff,
  ]);

  // console.log({ cuswd, mpe, flattenedData, refTableData });

  return (
    <>
      {/* //* Table A */}
      <Table className='text-center fs-6 m-0 align-middle' bordered responsive>
        <thead>
          <tr>
            <th className='align-middle'>Instrument</th>
            <th className='align-middle'>Standard Weight(s) Used</th>
            <th className='align-middle'>Actual Weight</th>
            <th className='align-middle'>MPE(g)</th>
            <th className='align-middle'>
              U<sup>2</sup>
              <sub>i</sub>
            </th>
            <th className='align-middle'>
              U<sub>i</sub>
              <sup>2</sup>/ <small>v</small>
            </th>
            <th className='align-middle'>U(Z)</th>
            <th className='align-middle'>
              U(Z)<sup>4</sup>/<small>v</small>
            </th>
            <th className='align-middle'>
              U(Ms)<sup>mg</sup>
            </th>
          </tr>
        </thead>

        <tbody>
          {refTableData.data.length === 0 && !refTableData.isLoading && !refTableData.isError && (
            <tr>
              <td colSpan={9}>
                <div
                  className='d-flex justify-content-center align-items-center fs-6'
                  style={{ height: '100px' }}
                >
                  No data available
                </div>
              </td>
            </tr>
          )}

          {refTableData.isLoading && !refTableData.isError && (
            <tr>
              <td colSpan={9}>
                <div
                  className='d-flex justify-content-center align-items-center'
                  style={{ height: '100px' }}
                >
                  <Spinner className='me-2' animation='border' size='sm' /> Loading...
                </div>
              </td>
            </tr>
          )}

          {refTableData.isError && !refTableData.isLoading && (
            <tr>
              <td colSpan={9}>
                <div
                  className='d-flex justify-content-center align-items-center text-center py-5'
                  style={{ height: '100px' }}
                >
                  <div>
                    <h4 className='text-danger mb-0'>Error</h4>
                    <p className='text-muted fs-6'>Something went wrong. Please try again later.</p>
                  </div>
                </div>
              </td>
            </tr>
          )}

          {refTableData.data.length > 0 &&
            !refTableData.isLoading &&
            !refTableData.isError &&
            refTableData.data.map((refData, refDataIndex) => {
              return (
                <>
                  <tr key={`${refDataIndex}-refdata`}>
                    <td
                      className={`${styles.columnEquipment} align-top`}
                      rowSpan={refData.data.length + 1}
                    >
                      <div>{`${refData?.entry?.description || ''} - ${
                        refData?.entry?.tagId || ''
                      }`}</div>

                      <div
                        className='mt-2 d-inline-flex flex-wrap gap-1 justify-content-center'
                        style={{ maxWidth: '90%' }}
                      >
                        {refData?.entry?.ids?.length > 0 &&
                          refData?.entry?.ids?.map((id, idIndex) => (
                            <div className={`${styles.columnData}`} key={`${id}-${idIndex}`}>
                              <div className={styles.columnDataValue}>{id}</div>
                            </div>
                          ))}
                      </div>
                    </td>
                  </tr>

                  {refData?.data?.length > 0 &&
                    refData.data.map((ref, refIndex) => (
                      <tr key={`${refDataIndex}-${refIndex}`}>
                        <td>{ref.weightUsed}</td>
                        <td>{formatToDicimalString(parseFloat(ref?.currentYearActualValue))} g</td>
                        <td>{ref?.mpe || ''}</td>
                        <td>{ref?.uCert2g2 || ''}</td>
                        <td>{ref?.uCert4vG4 || ''}</td>
                        <td>{ref?.uInst2g2 || ''}</td>
                        <td>{ref?.uInst4vG4 || ''}</td>
                        <td>{ref.uncertainty || ''}</td>
                      </tr>
                    ))}
                </>
              );
            })}
        </tbody>
      </Table>

      <div
        style={{
          transition: 'all 0.5s ease-in-out',
          height: showUncertaintyBudget ? 'fit-content' : '0px',
          overflow: 'hidden',
        }}
      >
        <hr
          className='my-4 border border-primary border-3'
          style={{
            width: showUncertaintyBudget ? '100%' : '0',
            transition: 'all 0.5s ease-in-out',
          }}
        />

        <UncertaintyBudgetTable pointIndex={pointIndex} calculations={calculations} />
      </div>
    </>
  );
};

const UncertaintyBudgetTable = ({ pointIndex, calculations }) => {
  // TODO: make function for common calculations, just accept input
  const form = useFormContext();

  const [ck, setCk] = useState({ data: [], isLoading: true, isError: false });

  const vCommonValue = useMemo(() => {
    const x = divide(1, 2);
    const y = pow(divide(0.00001, 100), -2);
    return multiply(x, y);
  }, []);

  const resolutionHalf = useMemo(() => {
    const resolution = calculations.resolution;
    return divide(resolution ?? 0, 2);
  }, [calculations]);

  const squarRootOfThree = useMemo(() => {
    return sqrt(3);
  }, []);

  const resolutionWithoutOrWithLoadUi = useMemo(() => {
    const x = resolutionHalf;
    const y = squarRootOfThree;

    return divide(x, y);
  }, [resolutionHalf, squarRootOfThree]);

  const resolutionWithoutOrWithLoadCiUi2 = useMemo(() => {
    const x = resolutionWithoutOrWithLoadUi;
    const y = 1;
    const z = multiply(x, y);

    return pow(z, 2);
  }, [resolutionWithoutOrWithLoadUi]);

  const resolutionWithoutOrWithLoadCiUi4v = useMemo(() => {
    const x = vCommonValue;
    const y = 1;
    const z = multiply(resolutionWithoutOrWithLoadUi, y);
    const a = pow(z, 4);

    return divide(a, x);
  }, [vCommonValue, resolutionWithoutOrWithLoadUi]);

  const repeatedObservationCiUi2 = useMemo(() => {
    const x = calculations.esdm;
    const y = 1;
    const z = multiply(x, y);

    return pow(z, 2);
  }, [calculations]);

  const repeatObservationCiUi4v = useMemo(() => {
    const x = 2;
    const y = 1;
    const z = multiply(calculations.esdm, y);
    const a = pow(z, 4);

    return divide(a, x);
  }, []);

  const airBouyancyRelativeUncertainty = useMemo(() => {
    const totalMpe = calculations.totalMPE;
    const nominalValue = calculations.nominalValue;

    const x = 0.000015;
    const y = totalMpe / multiply(4, nominalValue);

    return sum(x, y);
  }, [calculations]);

  const airBouyancyU = useMemo(() => {
    const x = airBouyancyRelativeUncertainty;
    const y = calculations.nominalValue;
    return multiply(x, y);
  }, [calculations, airBouyancyRelativeUncertainty]);

  const airBouyancyUi = useMemo(() => {
    const x = airBouyancyU;
    const y = squarRootOfThree;

    return divide(x, y);
  }, [airBouyancyU, squarRootOfThree]);

  const airBouyancyCiUi2 = useMemo(() => {
    const x = airBouyancyUi;
    const y = 1;
    const z = multiply(x, y);

    return pow(z, 2);
  }, [airBouyancyUi]);

  const airBouyancyCiUi4v = useMemo(() => {
    const x = vCommonValue;
    const y = 1;
    const z = multiply(airBouyancyUi, y);
    const a = pow(z, 4);

    return divide(a, x);
  }, [airBouyancyUi, vCommonValue]);

  const balanceReadingUi = useMemo(() => {
    const x = sum(
      resolutionWithoutOrWithLoadCiUi2,
      resolutionWithoutOrWithLoadCiUi2,
      repeatedObservationCiUi2
    );
    return sqrt(x);
  }, [resolutionWithoutOrWithLoadCiUi2, repeatedObservationCiUi2]);

  const balanceReadingCiUi2 = useMemo(() => {
    const x = balanceReadingUi;
    const y = 1;
    const z = multiply(x, y);

    return pow(z, 2);
  }, [balanceReadingUi]);

  const balanceReadingV = useMemo(() => {
    const x = pow(balanceReadingUi, 4);
    const y = sum(
      resolutionWithoutOrWithLoadCiUi4v,
      resolutionWithoutOrWithLoadCiUi4v,
      repeatObservationCiUi4v
    );

    return divide(x, y);
  }, [balanceReadingUi, resolutionWithoutOrWithLoadCiUi4v, repeatObservationCiUi4v]);

  const balanceReadingCiUi4v = useMemo(() => {
    const x = balanceReadingV;
    const y = 1;
    const z = multiply(balanceReadingUi, y);
    const a = pow(z, 4);

    return divide(a, x);
  }, [balanceReadingV, balanceReadingUi]);

  const eccentricityTestRelativeUncertainty = useMemo(() => {
    const maxError = calculations.maxError;
    const rangeMaxCalibration = calculations.rangeMaxCalibration;

    const x = maxError;
    const y = rangeMaxCalibration;
    const y1 = multiply(2, y);
    const y2 = sqrt(3);
    const z = multiply(y1, y2);

    return divide(x, z);
  }, [calculations]);

  const eccentricityTestU = useMemo(() => {
    const x = calculations.nominalValue;
    const y = eccentricityTestRelativeUncertainty;
    const z = sqrt(3);

    return multiply(x, y, z);
  }, [calculations, eccentricityTestRelativeUncertainty]);

  const eccentricityTestUi = useMemo(() => {
    if (!calculations.resolution || calculations.resolution === 0) return '';

    const x = eccentricityTestU;
    const y = squarRootOfThree;

    return divide(x, y);
  }, [eccentricityTestU, squarRootOfThree, calculations]);

  const eccentricityTestCiUi2 = useMemo(() => {
    if (!calculations.resolution || calculations.resolution === 0) return '';

    const x = eccentricityTestUi;
    const y = 1;
    const z = multiply(x || 0, y);

    return pow(z, 2);
  }, [eccentricityTestUi]);

  const eccentricityTestCiUi4v = useMemo(() => {
    if (!calculations.resolution || calculations.resolution === 0) return '';

    const x = vCommonValue;
    const y = 1;
    const z = multiply(eccentricityTestUi, y);
    const a = pow(z, 4);

    return divide(a, x);
  }, [eccentricityTestUi, vCommonValue]);

  const repeatabilityTestV = useMemo(() => {
    if (!calculations.resolution || calculations.resolution === 0) return '';

    const calibrationPointNo = calculations.calibrationPointNo;

    return subtract(calibrationPointNo, 1);
  }, [calculations]);

  const repeatabilityTestCiUi2 = useMemo(() => {
    if (!calculations.resolution || calculations.resolution === 0) return '';

    const x = max(calculations.stdRtestHalf, calculations.stdRtestMax);
    const y = 1;
    const z = multiply(x, y);

    return pow(z, 2);
  }, [calculations]);

  const repeatabilityTestCiUi4v = useMemo(() => {
    if (!calculations.resolution || calculations.resolution === 0) return '';

    const x = repeatabilityTestV;
    const y = 1;
    const z = multiply(max(calculations.stdRtestHalf, calculations.stdRtestMax), y);
    const a = pow(z, 4);

    return divide(a, x || 0);
  }, [repeatabilityTestV, calculations]);

  const weightStandardU = useMemo(() => {
    const x = calculations.totalUncertainty;
    const y = 1000;
    return divide(x, y);
  }, [calculations]);

  const weightStandardUi = useMemo(() => {
    const x = weightStandardU;
    const y = 2;
    return divide(x, y);
  }, [weightStandardU]);

  const weightStandardCiUi2 = useMemo(() => {
    if (!calculations.resolution || calculations.resolution === 0) return '';

    const x = weightStandardUi;
    const y = 1;
    const z = multiply(x, y);

    return pow(z, 2);
  }, [weightStandardUi]);

  const weightStandardCiUi4v = useMemo(() => {
    if (!calculations.resolution || calculations.resolution === 0) return '';

    const x = calculations.vEff;
    const y = 1;
    const z = multiply(weightStandardUi, y);
    const a = pow(z, 4);

    return divide(a, x);
  }, [weightStandardUi, vCommonValue, calculations]);

  const driftU = useMemo(() => {
    if (!calculations.resolution || calculations.resolution === 0) return '';

    const x = formatScientific(calculations.totalUints4vG4);

    return multiply(x, '1E10');
  }, [calculations]);

  const driftUi = useMemo(() => {
    if (!calculations.resolution || calculations.resolution === 0) return '';

    const x = format(driftU, { notation: 'fixed', precision: 6 });
    const y = squarRootOfThree;

    return divide(x, y);
  }, [driftU, squarRootOfThree, calculations]);

  const driftCiUi2 = useMemo(() => {
    if (!calculations.resolution || calculations.resolution === 0) return '';

    const x = driftUi;
    const y = 1;
    const z = multiply(x, y);

    return pow(z, 2);
  }, [driftUi]);

  const driftCiUi4v = useMemo(() => {
    if (!calculations.resolution || calculations.resolution === 0) return '';

    const x = vCommonValue;
    const y = 1;
    const z = multiply(driftUi, y);
    const a = pow(z, 4);

    return divide(a, x);
  }, [driftUi, vCommonValue]);

  const totalCiUi2 = useMemo(() => {
    let values = [
      balanceReadingCiUi2,
      weightStandardCiUi2,
      airBouyancyCiUi2,
      repeatabilityTestCiUi2,
      eccentricityTestCiUi2,
      driftCiUi2,
    ].filter(Boolean);

    if (values.length < 1) values = [0];

    return sum(values);
  }, [
    balanceReadingCiUi2,
    weightStandardCiUi2,
    airBouyancyCiUi2,
    repeatabilityTestCiUi2,
    eccentricityTestCiUi2,
    driftCiUi2,
  ]);

  const totalCiUi4v = useMemo(() => {
    let values = [
      balanceReadingCiUi4v,
      weightStandardCiUi4v,
      airBouyancyCiUi4v,
      repeatabilityTestCiUi4v,
      eccentricityTestCiUi4v,
      driftCiUi4v,
    ].filter(Boolean);

    if (values.length < 1) values = [0];

    return sum(values);
  }, [
    balanceReadingCiUi4v,
    weightStandardCiUi4v,
    airBouyancyCiUi4v,
    repeatabilityTestCiUi4v,
    eccentricityTestCiUi4v,
    driftCiUi4v,
  ]);

  const balanceReadingPercent = useMemo(() => {
    const x = balanceReadingCiUi2;
    const y = totalCiUi2;

    return divide(x, y);
  }, [balanceReadingCiUi2, totalCiUi2]);

  const weightStandardPercent = useMemo(() => {
    const x = weightStandardCiUi2;
    const y = totalCiUi2;

    return divide(x, y);
  }, [weightStandardCiUi2, totalCiUi2]);

  const airBouyancyPercent = useMemo(() => {
    const x = airBouyancyCiUi2;
    const y = totalCiUi2;

    return divide(x, y);
  }, [airBouyancyCiUi2, totalCiUi2]);

  const repeatabilityTestPercent = useMemo(() => {
    const x = repeatabilityTestCiUi2;
    const y = totalCiUi2;

    return divide(x, y);
  }, [repeatabilityTestCiUi2, totalCiUi2]);

  const eccentricityTestPercent = useMemo(() => {
    const x = eccentricityTestCiUi2;
    const y = totalCiUi2;

    return divide(x, y);
  }, [eccentricityTestCiUi2, totalCiUi2]);

  const driftPercent = useMemo(() => {
    const x = driftCiUi2;
    const y = totalCiUi2;

    return divide(x, y);
  }, [driftCiUi2, totalCiUi2]);

  const totalPercent = useMemo(() => {
    let valuees = [
      balanceReadingPercent,
      weightStandardPercent,
      airBouyancyPercent,
      repeatabilityTestPercent,
      eccentricityTestPercent,
      driftPercent,
    ].filter(Boolean);

    if (valuees.length < 1) valuees = [0];

    return sum(valuees);
  }, [
    balanceReadingPercent,
    weightStandardPercent,
    airBouyancyPercent,
    repeatabilityTestPercent,
    eccentricityTestPercent,
    driftPercent,
  ]);

  const combineUncertainty = useMemo(() => {
    return sqrt(totalCiUi2);
  }, [totalCiUi2]);

  const effectiveNumberDegressOfFreedom = useMemo(() => {
    const x = pow(combineUncertainty, 4);
    const y = totalCiUi4v;

    return divide(x, y);
  }, [combineUncertainty, totalCiUi4v]);

  const findClosestDOF = useCallback(
    (inputDOF) => {
      return ck.data.reduce((prev, curr) => {
        const current = parseFloat(curr.dof);
        const previous = parseFloat(prev.dof);

        if (isNaN(current) || isNaN(previous)) return { value: 0, dof: 0 };

        return abs(current - inputDOF) < Math.abs(previous - inputDOF) ? curr : prev;
      });
    },
    [ck.data]
  );

  const coverageFactor = useMemo(() => {
    if (ck.data?.length < 1) return { value: 0, data: null };

    const value = evaluate(formatScientific(effectiveNumberDegressOfFreedom, 1));

    const result = findClosestDOF(value);

    const cf = isNaN(parseFloat(result.value)) ? 0 : parseFloat(result.value);

    return { value: cf, data: result };
  }, [effectiveNumberDegressOfFreedom, ck.data]);

  const expandedUncertainty = useMemo(() => {
    const x = combineUncertainty;
    const y = coverageFactor.value;

    const result = multiply(x, y);

    //* set temporary value used for view in table
    form.setValue(`data.expandedUncertainties.${pointIndex}`, result);

    return result;
  }, [combineUncertainty, coverageFactor, pointIndex]);

  const rtestMaxError = useMemo(() => {
    if (!calculations.resolution || calculations.resolution === 0) return '';

    const result = max(calculations.stdRtestHalf, calculations.stdRtestMax);

    //* set temporary value used for view in table
    form.setValue('data.rtest.maxError', result);

    return result;
  }, [calculations]);

  //* query CK Table
  useEffect(() => {
    const q = query(collection(db, 'jobCalibrationReferences', 'CR000003', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          setCk({
            data: snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })),
            isLoading: false,
            isError: false,
          });

          return;
        }

        setCk({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        setCk({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  // console.log({ calculations, pointIndex });

  return (
    <>
      <Table className='text-center fs-6 m-0 align-middle' bordered responsive>
        <thead>
          <tr>
            <th className='align-middle'>
              Symbol <br />
              <i>u(</i>X<sub>i</sub>)
            </th>
            <th className='align-middle'>Sources of Uncertainty</th>
            <th className='align-middle'>Units</th>
            <th className='align-middle'>Dist.</th>
            <th className='align-middle'>Type</th>
            <th className='align-middle'>
              Relative <br />
              Uncertainty
            </th>
            <th className='align-middle'>
              <i>v</i>
            </th>
            <th className='align-middle'>
              <i>U</i>
            </th>
            <th className='align-middle'>
              <i>k</i>
            </th>
            <th className='align-middle'>
              <i>u</i>
              <sub>i</sub>
            </th>
            <th className='align-middle'>
              <i>c</i>
              <sub>i</sub>
            </th>
            <th className='align-middle'>
              (<i>c</i>
              <sub>i</sub>
              <i>u</i>
              <sub>i</sub>)<sup>2</sup>
            </th>
            <th className='align-middle'>
              (<i>c</i>
              <sub>i</sub>
              <i>u</i>
              <sub>i</sub>)<sup>4</sup>/v
            </th>
            <th className='align-middle'>%</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <th rowSpan={4}>
              <i>u(M)</i>
            </th>
            <td className='text-start'>Balance reading</td>
            <td>gram</td>
            <td></td>
            <td></td>
            <td></td>
            <td>{formatScientific(balanceReadingV, 1)}</td>
            <td></td>
            <td></td>
            <td>{formatToDicimalString(balanceReadingUi, 5)}</td>
            <td>1</td>
            <td>{formatScientific(balanceReadingCiUi2, 3)}</td>
            <td>{formatScientific(balanceReadingCiUi4v, 3)}</td>
            <td>{format(balanceReadingPercent * 100, { notation: 'fixed', precision: 2 })}%</td>
          </tr>

          <tr>
            <td>Resolution without load</td>
            <td>gram</td>
            <td>Rect.</td>
            <td>B</td>
            <td></td>
            <td>{formatScientific(vCommonValue, 1)}</td>
            <td>{formatToDicimalString(resolutionHalf, 6)}</td>
            <td>{formatToDicimalString(squarRootOfThree, 2)}</td>
            <td>{formatToDicimalString(resolutionWithoutOrWithLoadUi, 5)}</td>
            <td>1</td>
            <td>{formatScientific(resolutionWithoutOrWithLoadCiUi2, 3)}</td>
            <td>{formatScientific(resolutionWithoutOrWithLoadCiUi4v, 3)}</td>
            <td rowSpan={3} />
          </tr>

          <tr>
            <td>Resolution with load</td>
            <td>gram</td>
            <td>Rect.</td>
            <td>B</td>
            <td></td>
            <td>{formatScientific(vCommonValue, 1)}</td>
            <td>{formatToDicimalString(resolutionHalf, 6)}</td>
            <td>{formatToDicimalString(squarRootOfThree, 2)}</td>
            <td>{formatToDicimalString(resolutionWithoutOrWithLoadUi, 5)}</td>
            <td>1</td>
            <td>{formatScientific(resolutionWithoutOrWithLoadCiUi2, 3)}</td>
            <td>{formatScientific(resolutionWithoutOrWithLoadCiUi4v, 3)}</td>
          </tr>

          <tr>
            <td>Repeated observations</td>
            <td>gram</td>
            <td>Normal</td>
            <td>A</td>
            <td></td>
            <td>2</td>
            <td>{formatToDicimalString(calculations.stdMeasuredValue, 6)}</td>
            <td>{formatToDicimalString(squarRootOfThree, 2)}</td>
            <td>{formatToDicimalString(calculations.esdm, 5)}</td>
            <td>1</td>
            <td>{formatScientific(repeatedObservationCiUi2, 3)}</td>
            <td>{formatScientific(repeatObservationCiUi4v, 3)}</td>
          </tr>

          <tr>
            <th>
              <i>
                u((M)<sub>s</sub>)
              </i>
            </th>
            <td>Weight standard</td>
            <td>gram</td>
            <td>Normal</td>
            <td>B</td>
            <td></td>
            <td>{calculations.resolution ? formatScientific(calculations.vEff, 1) : ''}</td>
            <td>{formatToDicimalString(weightStandardU, 6)}</td>
            <td>{formatToDicimalString(2, 2)}</td>
            <td>{formatToDicimalString(weightStandardUi, 5)}</td>
            <td>1</td>
            <td className='fw-bold'>{formatScientific(weightStandardCiUi2, 3)}</td>
            <td className='fw-bold'>{formatScientific(weightStandardCiUi4v, 3)}</td>
            <td>{format(weightStandardPercent * 100, { notation: 'fixed', precision: 2 })}%</td>
          </tr>

          <tr>
            <th>
              <i>u((W))</i>
            </th>
            <td>Air Bouyancy</td>
            <td>gram</td>
            <td>Rect.</td>
            <td>B</td>
            <td>{formatToDicimalString(airBouyancyRelativeUncertainty, 6)}</td>
            <td>{formatScientific(vCommonValue, 1)}</td>
            <td>{airBouyancyU}</td>
            <td>{formatToDicimalString(squarRootOfThree, 2)}</td>
            <td>{formatToDicimalString(airBouyancyUi, 5)}</td>
            <td>1</td>
            <td className='fw-bold'>{formatScientific(airBouyancyCiUi2, 3)}</td>
            <td className='fw-bold'>{formatScientific(airBouyancyCiUi4v, 3)}</td>
            <td>{format(airBouyancyPercent * 100, { notation: 'fixed', precision: 2 })}%</td>
          </tr>

          <tr>
            <th>
              <i>u((X))</i>
            </th>
            <td>Repeatability Test</td>
            <td>gram</td>
            <td>Normal</td>
            <td>A</td>
            <td></td>
            <td>{repeatabilityTestV}</td>
            <td></td>
            <td></td>
            <td>
              {formatToDicimalString(max(calculations.stdRtestHalf, calculations.stdRtestMax), 5)}
            </td>
            <td>1</td>
            <td className='fw-bold'>{formatScientific(repeatabilityTestCiUi2, 3)}</td>
            <td className='fw-bold'>{formatScientific(repeatabilityTestCiUi4v, 3)}</td>
            <td>{format(repeatabilityTestPercent * 100, { notation: 'fixed', precision: 2 })}%</td>
          </tr>

          <tr>
            <th>
              <i>u((Y))</i>
            </th>
            <td>Eccentricity Test</td>
            <td>gram</td>
            <td>Rect.</td>
            <td>B</td>
            <td>{formatToDicimalString(eccentricityTestRelativeUncertainty, 6)}</td>
            <td>{calculations.resolution ? formatScientific(vCommonValue, 1) : ''}</td>
            <td>{formatToDicimalString(eccentricityTestU, 6)}</td>
            <td>{formatToDicimalString(squarRootOfThree, 2)}</td>
            <td>{formatToDicimalString(eccentricityTestUi, 0)}</td>
            <td>1</td>
            <td className='fw-bold'>{formatScientific(eccentricityTestCiUi2, 3)}</td>
            <td className='fw-bold'>{formatScientific(eccentricityTestCiUi4v, 3)} </td>
            <td>{format(eccentricityTestPercent * 100, { notation: 'fixed', precision: 2 })}%</td>
          </tr>

          <tr>
            <th>
              <i>u((Z))</i>
            </th>
            <td>Drift</td>
            <td>gram</td>
            <td>Rect.</td>
            <td>B</td>
            <td></td>
            <td>{formatScientific(vCommonValue, 1)}</td>
            <td>{formatToDicimalString(driftU, 6)}</td>
            <td>{formatToDicimalString(squarRootOfThree, 2)}</td>
            <td>{formatToDicimalString(driftUi, 6)}</td>
            <td>1</td>
            <td className='fw-bold'>{formatScientific(driftCiUi2, 3)}</td>
            <td className='fw-bold'>{formatScientific(driftCiUi4v, 3)}</td>
            <td>{format(driftPercent * 100, { notation: 'fixed', precision: 2 })}%</td>
          </tr>

          <tr>
            <td></td>
            <td className='text-start' colSpan={10}>
              SUMS (only of those with bold letter)
            </td>
            <td>{formatScientific(totalCiUi2, 3)}</td>
            <td>{formatScientific(totalCiUi4v, 3)}</td>
            <td>{format(totalPercent * 100, { notation: 'fixed', precision: 2 })}%</td>
          </tr>

          <tr>
            <th>
              <i>
                u<sup>c</sup>(E)
              </i>
            </th>
            <td className='text-start fw-bold' colSpan={8}>
              Combined Uncertainty
            </td>
            <td className='fw-bold fs-5' colSpan={4}>
              <span className='me-2'>±</span>
              {formatToDicimalString(combineUncertainty, 5)} gram
            </td>
            <td rowSpan={4} />
          </tr>

          <tr>
            <th>
              <i>
                v[U<sub>c</sub>(E)]
              </i>
            </th>
            <td className='text-start' colSpan={8}>
              Effective Number of Degrees of Freedom
            </td>
            <td className='fw-bold fs-5' colSpan={4}>
              <span className='me-2'>±</span>
              {formatScientific(effectiveNumberDegressOfFreedom, 1)}
            </td>
          </tr>

          <tr>
            <th>
              <i>K</i>
            </th>
            <td className='text-start' colSpan={8}>
              Coverage Factor for 95% Confidence Interval
            </td>
            <td colSpan={4}>{formatToDicimalString(coverageFactor.value, 2)}</td>
          </tr>

          <tr>
            <th>
              <i>U</i>
            </th>
            <td className='text-start fw-bold' colSpan={8}>
              Expanded Uncertainty at 95% Confidence Level
            </td>
            <td className='fw-bold fs-5' colSpan={4}>
              <span className='me-2'>±</span>
              {formatToDicimalString(expandedUncertainty, 5)} gram
            </td>
          </tr>
        </tbody>
      </Table>
    </>
  );
};

export default CalculationTable;
