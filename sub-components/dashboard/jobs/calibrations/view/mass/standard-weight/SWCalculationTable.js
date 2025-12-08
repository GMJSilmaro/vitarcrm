import { useCallback, useEffect, useMemo, useState } from 'react';
import { Database, Eye, EyeSlash } from 'react-bootstrap-icons';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  formatScientific,
  formatToDicimalString,
} from '@/utils/calibrations/data-formatter';
import {
  sqrt,
  mean,
  sum,
  bignumber,
  pow,
  multiply,
  divide,
  subtract,
  max,
  floor,
  abs,
  min,
  isBigNumber,
  exp,
} from 'mathjs';
import {
  Tab,
  Col,
  Row,
  Nav,
  Card,
  Table,
  Spinner,
  Button,
} from 'react-bootstrap';
import { safeParseFloat } from '@/utils/common';
import { add } from 'lodash';

const SWCalculationTable = ({ data }) => {
  const form = useFormContext();

  const [showCalculationTables, setShowCalculationTables] = useState(false);
  const [showUncertaintyBudget, setShowUncertaintyBudget] = useState(false);

  const minTemprature = useWatch({ name: 'minTemperature' });
  const maxTemprature = useWatch({ name: 'maxTemperature' });
  const minRHumidity = useWatch({ name: 'minRHumidity' });
  const maxRHumidity = useWatch({ name: 'maxRHumidity' });
  const minAPressure = useWatch({ name: 'minAPressure' });
  const maxAPressure = useWatch({ name: 'maxAPressure' });

  const averageTemprature = useMemo(() => {
    const x = safeParseFloat(minTemprature);
    const y = safeParseFloat(maxTemprature);
    return mean(x, y);
  }, [minTemprature, maxTemprature]);

  const averageRHumidity = useMemo(() => {
    const x = safeParseFloat(minRHumidity);
    const y = safeParseFloat(maxRHumidity);
    return mean(x, y);
  }, [minRHumidity, maxRHumidity]);

  const averageAPressure = useMemo(() => {
    const x = safeParseFloat(minAPressure);
    const y = safeParseFloat(maxAPressure);
    return mean(x, y);
  }, [minAPressure, maxAPressure]);

  const densityOfMoistAir = useMemo(() => {
    const a = 0.34848;
    const b = 0.009;
    const c = 100;
    const d = 0.061;
    const e = 273.15;

    const x1 = multiply(a, averageAPressure);
    const x2 = multiply(b, averageRHumidity);
    const x3 = exp(multiply(d, averageTemprature));
    const x4 = multiply(divide(x2, c), x3);

    const x = subtract(x1, x4);
    const y = add(e, averageTemprature);

    const result = divide(x, y);

    //* set temporary value
    form.setValue('densityOfMoistAir', result);

    return result;
  }, [averageTemprature, averageRHumidity, averageAPressure]);

  const testWeightNo = useMemo(() => {
    return safeParseFloat(form.getValues('testWeightNo'));
  }, [JSON.stringify(form.watch('testWeightNo'))]);

  if (testWeightNo === undefined) {
    return (
      <div className='p-5 d-flex justify-content-center align-items-center'>
        <h4>Test Weight No. is not found</h4>
      </div>
    );
  }

  return (
    <Tab.Container defaultActiveKey='0'>
      <Tab.Content className='h-100'>
        <Row>
          <Col className='px-0' md={12}>
            <Nav
              variant='pills'
              className='d-flex justify-content-center gap-3'
            >
              {testWeightNo &&
                Array.from({ length: testWeightNo }).map((_, pointIndex) => (
                  <Nav.Item
                    key={`${pointIndex}-nav-item`}
                    className='d-flex align-items-center'
                  >
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
              {Array.from({ length: testWeightNo }).map((_, pointIndex) => {
                const nominalValue = form.watch(`nominalValues.${pointIndex}`);
                const isNominalValueNotZero = nominalValue && nominalValue > 0;

                return (
                  <Tab.Pane
                    key={`${pointIndex}-tab-pane`}
                    className='h-100'
                    eventKey={pointIndex}
                  >
                    <Card className='h-100 w-100 shadow-none'>
                      <Card.Body>
                        <Row className='position-relative'>
                          <Col
                            lg={3}
                            style={{
                              padding: showCalculationTables ? undefined : '0',
                              width: showCalculationTables ? undefined : '0',
                              maxHeight: showCalculationTables ? '2160px' : '0',
                              overflow: 'auto',
                              position: 'sticky',
                              transition: 'all 0.5s ease-in-out',
                            }}
                          >
                            <div className='d-flex flex-column align-items-center gap-2'>
                              {/* //* block 1 */}
                              <Table
                                className='text-center fs-6 align-middle'
                                bordered
                                responsive
                              >
                                <tbody>
                                  <tr>
                                    <th>Nominal Value</th>
                                    <td>
                                      {formatToDicimalString(
                                        form.watch(
                                          `nominalValues.${pointIndex}`
                                        ),
                                        5
                                      )}{' '}
                                      g g
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>Resolution of comparator</th>
                                    <td>
                                      {
                                        form.watch(
                                          `massComparatorRefEquipment.${pointIndex}`
                                        )?.uncertainty
                                      }{' '}
                                      g
                                    </td>
                                  </tr>
                                </tbody>
                              </Table>

                              {/* //* block 2*/}
                              <Table
                                className='text-center fs-6 align-middle'
                                bordered
                                responsive
                              >
                                <tbody>
                                  <tr>
                                    <th>
                                      Density of test Weight P<sub>t</sub>
                                    </th>
                                    <td>
                                      {form.watch(`ptKgMn3s.${pointIndex}`)} kg
                                      m<sup>-3</sup>
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      u(P<sub>t</sub>)
                                    </th>
                                    <td>
                                      {form.watch(`uPtKgMn3s.${pointIndex}`)} kg
                                      m<sup>-3</sup>
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      Density of Moist Air, P<sub>a</sub>
                                    </th>
                                    <td>
                                      {formatToDicimalString(
                                        form.watch(`densityOfMoistAir`),
                                        4
                                      )}{' '}
                                      kg m<sup>-3</sup>
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      u(P<sub>a</sub>)
                                    </th>
                                    <td>
                                      {formatToDicimalString(
                                        form.watch(`data.${pointIndex}.uPa`),
                                        4
                                      )}{' '}
                                      kg m<sup>-3</sup>
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      U<sub>F</sub>
                                    </th>
                                    <td>
                                      {formatToDicimalString(
                                        form.watch(`data.${pointIndex}.uF`),
                                        5
                                      )}{' '}
                                      kg m<sup>-3</sup>
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      U<sub>p</sub>
                                    </th>
                                    <td>
                                      {form.watch(`data.${pointIndex}.uP`)} Pa
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      U<sub>t</sub>
                                    </th>
                                    <td>
                                      {form.watch(`data.${pointIndex}.uT`)} K
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      U<sub>hr</sub>
                                    </th>
                                    <td>
                                      {form.watch(`data.${pointIndex}.uHr`)}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>Corr. Factor for air buoyancy, C</th>
                                    <td>
                                      {formatScientific(
                                        form.watch(
                                          `data.${pointIndex}.corrFactorForAirBuoyancy`
                                        ),
                                        3
                                      )}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      U<sub>b</sub>
                                    </th>
                                    <td>
                                      {formatScientific(
                                        form.watch(`data.${pointIndex}.uB`),
                                        3
                                      )}{' '}
                                      g
                                    </td>
                                  </tr>
                                </tbody>
                              </Table>

                              {/* //* block 3*/}
                              <Table
                                className='text-center fs-6 align-middle'
                                bordered
                                responsive
                              >
                                <tbody>
                                  <tr>
                                    <th colSpan={2}>Result</th>
                                  </tr>
                                  <tr>
                                    <th>Actual Weight</th>
                                    <th>
                                      {formatToDicimalString(
                                        form.watch(
                                          `data.${pointIndex}.totalActualWeight`
                                        ),
                                        6
                                      )}{' '}
                                      g
                                    </th>
                                  </tr>
                                  <tr>
                                    <th>
                                      Ave. Weighing diff., △m<sub>c</sub>
                                    </th>
                                    <th>
                                      {formatToDicimalString(
                                        form.watch(
                                          `data.${pointIndex}.averageMci`
                                        ),
                                        6
                                      )}{' '}
                                      g
                                    </th>
                                  </tr>
                                  <tr>
                                    <th>Test Weight</th>
                                    <th>
                                      {formatToDicimalString(
                                        form.watch(
                                          `data.${pointIndex}.testWeight`
                                        ),
                                        6
                                      )}{' '}
                                      g
                                    </th>
                                  </tr>
                                  <tr>
                                    <th>Expanded Uncertainty</th>
                                    <th>
                                      {formatToDicimalString(
                                        form.watch(
                                          `resultExpandedUncertainties.${pointIndex}`
                                        ),
                                        6
                                      )}{' '}
                                      g
                                    </th>
                                  </tr>
                                </tbody>
                              </Table>

                              {/* //* block 4 */}
                              <Table
                                className='text-center fs-6 align-middle'
                                bordered
                                responsive
                              >
                                <tbody>
                                  <tr>
                                    <th>Total Actual Weight</th>
                                    <td>
                                      {formatToDicimalString(
                                        form.watch(
                                          `data.${pointIndex}.totalActualWeight`
                                        ),
                                        6
                                      )}
                                    </td>
                                  </tr>
                                </tbody>
                              </Table>

                              {/* //* block 5 */}
                              <Table
                                className='text-center fs-6 align-middle'
                                bordered
                                responsive
                              >
                                <tbody>
                                  <tr>
                                    <th>
                                      Total U<sub>cert</sub> <br />
                                      (g)
                                    </th>
                                    <td>
                                      {formatToDicimalString(
                                        form.watch(
                                          `data.${pointIndex}.totalUcertg`
                                        ),
                                        6
                                      )}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      Total U<sub>cert</sub>
                                      <sup>2</sup> <br />
                                      (g<sup>2</sup>)
                                    </th>
                                    <td>
                                      {formatScientific(
                                        form.watch(
                                          `data.${pointIndex}.totalUcert2g2`
                                        ),
                                        3
                                      )}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      Total U<sub>cert</sub>
                                      <sup>4 / v</sup>
                                      <br />
                                      (g<sup>4</sup>)
                                    </th>
                                    <td>
                                      {formatScientific(
                                        form.watch(
                                          `data.${pointIndex}.totalUcert4g4`
                                        ),
                                        3
                                      )}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>Total Uncertainty of Master Used</th>
                                    <td>
                                      {formatToDicimalString(
                                        form.watch(
                                          `data.${pointIndex}.totalUncertaintyOfMasterUsed`
                                        ),
                                        7
                                      )}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      U<sub>cert</sub>
                                      <sup>
                                        (m<sub>cr</sub>)
                                      </sup>
                                    </th>
                                    <td>
                                      {isNominalValueNotZero
                                        ? formatToDicimalString(
                                            form.watch(
                                              `data.${pointIndex}.uCertMcr`
                                            ),
                                            6
                                          )
                                        : ''}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      V<sub>eff</sub>
                                    </th>
                                    <td>
                                      {isNominalValueNotZero
                                        ? formatScientific(
                                            form.watch(
                                              `data.${pointIndex}.uCert4g4Veff`
                                            ),
                                            3
                                          )
                                        : ''}
                                    </td>
                                  </tr>
                                </tbody>
                              </Table>

                              {/* //* block 6 */}
                              <Table
                                className='text-center fs-6 align-middle'
                                bordered
                                responsive
                              >
                                <tbody>
                                  <tr>
                                    <th>
                                      Total U<sub>inst</sub>
                                      <sup>2</sup> <br />
                                      (g<sup>2</sup>)
                                    </th>
                                    <td>
                                      {formatScientific(
                                        form.watch(
                                          `data.${pointIndex}.totalUinst2g2`
                                        ),
                                        3
                                      )}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      Total U<sub>inst</sub>
                                      <sup>4 / v</sup>
                                      <br />
                                      (g<sup>4</sup>)
                                    </th>
                                    <td>
                                      {formatScientific(
                                        form.watch(
                                          `data.${pointIndex}.totalUinst4vG4`
                                        ),
                                        3
                                      )}
                                    </td>
                                  </tr>

                                  <tr>
                                    <th>
                                      Total Drift <br /> (g)
                                    </th>
                                    <td>
                                      {formatToDicimalString(
                                        form.watch(
                                          `data.${pointIndex}.totalDriftg`
                                        ),
                                        6
                                      )}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      U<sub>inst</sub>
                                      <sup>
                                        (m<sub>cr</sub>)
                                      </sup>
                                    </th>
                                    <td>
                                      {isNominalValueNotZero
                                        ? formatToDicimalString(
                                            form.watch(
                                              `data.${pointIndex}.uInstMcr`
                                            ),
                                            6
                                          )
                                        : ''}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      V<sub>eff</sub>
                                    </th>
                                    <td>
                                      {isNominalValueNotZero
                                        ? formatScientific(
                                            form.watch(
                                              `data.${pointIndex}.uInst4g4Veff`
                                            ),
                                            3
                                          )
                                        : ''}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>Total Drift / √ 3</th>
                                    <td>
                                      {formatScientific(
                                        form.watch(
                                          `data.${pointIndex}.totalDriftgDivideSqrtOf3`
                                        ),
                                        5
                                      )}
                                    </td>
                                  </tr>
                                </tbody>
                              </Table>

                              {/* //* block 7 */}
                              <Table
                                className='text-center fs-6 align-middle'
                                bordered
                                responsive
                              >
                                <tbody>
                                  <tr>
                                    <th>
                                      min( △<em>m</em>
                                      <sub>ci</sub>)
                                    </th>
                                    <td>
                                      {formatToDicimalString(
                                        form.watch(`data.${pointIndex}.minMci`),
                                        6
                                      )}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      max( △<em>m</em>
                                      <sub>ci</sub>)
                                    </th>
                                    <td>
                                      {formatToDicimalString(
                                        form.watch(`data.${pointIndex}.maxMci`),
                                        6
                                      )}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      <span
                                        style={{ borderTop: '1px solid black' }}
                                      >
                                        <span>△</span>
                                        <em>m</em>
                                        <sub>c</sub>
                                      </span>
                                    </th>
                                    <td>
                                      {formatToDicimalString(
                                        form.watch(
                                          `data.${pointIndex}.averageMci`
                                        ),
                                        6
                                      )}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      U<sub>w</sub>
                                      <span
                                        style={{ borderTop: '1px solid black' }}
                                      >
                                        <span>(△</span>
                                        <em>m</em>
                                        <sub
                                          style={{ textDecoration: 'unset' }}
                                        >
                                          c
                                        </sub>
                                        <span>)</span>
                                      </span>
                                    </th>
                                    <td>
                                      {formatToDicimalString(
                                        form.watch(`data.${pointIndex}.uwMci`),
                                        6
                                      )}
                                    </td>
                                  </tr>
                                </tbody>
                              </Table>
                            </div>
                          </Col>

                          <Col
                            lg={showCalculationTables ? 9 : 12}
                            style={{
                              maxHeight: showCalculationTables
                                ? '2160px'
                                : 'fit-content',
                              overflow: 'auto',
                              transition: 'all 0.5s ease-in-out',
                            }}
                          >
                            <RefTable
                              testWeightNo={testWeightNo}
                              pointIndex={pointIndex}
                              showUncertaintyBudget={showUncertaintyBudget}
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

const RefTable = ({ testWeightNo, pointIndex, showUncertaintyBudget }) => {
  const form = useFormContext();

  const cData = useWatch({ control: form.control, name: 'data' });

  const densityOfMoistAir =
    useWatch({ control: form.control, name: 'densityOfMoistAir' }) || 0;

  const envUP = useWatch({ control: form.control, name: 'envUP' });
  const envUT = useWatch({ control: form.control, name: 'envUT' });
  const envUHr = useWatch({ control: form.control, name: 'envUHr' });

  const cuswd  = useWatch({control: form.control, name: 'cuswd'}) || { data: [], isLoading: true, isError: false }; //prettier-ignore
  const acr = useWatch({ control: form.control, name: 'acr' }) || { data: [], isLoading: true, isError: false }; //prettier-ignore

  const [refTableData, setRefTableData] = useState({
    data: [],
    isLoading: true,
    isError: false,
  });

  const [entryData, setEntryData] = useState(null);

  const firstRefData = useMemo(() => {
    if (refTableData.data.length < 1) return null;

    return refTableData.data?.[0];
  }, [JSON.stringify(refTableData)]);

  const accuracyClass = useMemo(() => {
    const value = form.getValues('accuracyClass');
    return value;
  }, [JSON.stringify(form.watch('accuracyClass'))]);

  const nominalValues = useMemo(() => {
    const result =  cData?.map(v => safeParseFloat(v?.nominalValue?.value)) || []; // prettier-ignore

    //* set temporary value
    form.setValue(`nominalValues`, result);

    return result;
  }, [JSON.stringify(cData)]);

  const isNominalValueWithAsterisks = useMemo(() => {
    const result = cData?.map(v => v?.isNominalValueWithAsterisk) || []; // prettier-ignore

    //* set temporary value
    form.setValue(`isNominalValueWithAsterisks`, result);

    return result;
  }, [JSON.stringify(cData)]);

  const massComparatorRefEquipment = useMemo(() => {
    const result = cData?.map(v => v?.massComparatorRefEquipmentId || '') || []; // prettier-ignore

    //* set temporary value
    form.setValue(`massComparatorRefEquipment`, result);

    return result;
  }, [JSON.stringify(cData)]);

  const testWeights = useMemo(() => {
    const result = cData?.map(v => safeParseFloat(v?.testWeight)) || []; // prettier-ignore

    //* set temporary value
    form.setValue(`testWeights`, result);

    return result;
  }, [JSON.stringify(cData)]);

  const conventionalValues = useMemo(() => {
    const result = Array.from({ length: testWeightNo }).map((_, i) => {
      const testWeight = safeParseFloat(testWeights?.[i]);
      const nominalValue = safeParseFloat(nominalValues?.[i]);

      return subtract(testWeight, nominalValue);
    });

    //* set temporary value
    form.setValue(`conventionalValues`, result);

    return result;
  }, [
    testWeightNo,
    JSON.stringify(nominalValues),
    JSON.stringify(testWeights),
  ]);

  const mpes = useMemo(() => {
    if (acr?.data?.length < 1) return [];

    const acClass = String(accuracyClass).toLowerCase();

    const result = Array.from({ length: testWeightNo }).map((_, i) => {
      if (accuracyClass === 'N/A') return divide(0, 1000);

      const nominalValue = nominalValues?.[i];

      const acrRef = acr.data.find((acrRef) => acrRef.code == nominalValue)?.[
        acClass
      ];

      return divide(safeParseFloat(acrRef), 1000);
    });

    //* set temporary value
    form.setValue(`mpes`, result);

    return result;
  }, [
    accuracyClass,
    JSON.stringify(testWeightNo),
    JSON.stringify(nominalValues),
    JSON.stringify(acr),
  ]);

  const ptKgMn3s = useMemo(() => {
    const result = cData?.map(v => safeParseFloat(v?.material?.ptKgMn3) || '') || []; // prettier-ignore

    //* set temporary value
    form.setValue(`ptKgMn3s`, result);

    return result;
  }, [JSON.stringify(cData)]);

  const uPtKgMn3s = useMemo(() => {
    const result = cData?.map(v => safeParseFloat(v?.material?.uPtKgMn3) || '') || []; // prettier-ignore

    //* set temporary value
    form.setValue(`uPtKgMn3s`, result);

    return result;
  }, [JSON.stringify(cData)]);

  const uF = useMemo(() => {
    const x = 0.0001;
    const y = densityOfMoistAir;

    const result = multiply(x, y);

    //* set temporary value
    form.setValue(`data.${pointIndex}.uF`, result);

    return result;
  }, [densityOfMoistAir, pointIndex]);

  const uP = useMemo(() => {
    const result = safeParseFloat(envUP?.u);

    //* set temporary value
    form.setValue(`data.${pointIndex}.uP`, result);

    return result;
  }, [JSON.stringify(envUP), pointIndex]);

  const uT = useMemo(() => {
    const result = safeParseFloat(envUT?.u);

    //* set temporary value
    form.setValue(`data.${pointIndex}.uT`, result);

    return result;
  }, [JSON.stringify(envUT), pointIndex]);

  const uHr = useMemo(() => {
    const value = safeParseFloat(envUHr?.u);

    const result = divide(value, 100);

    //* set temporary value
    form.setValue(`data.${pointIndex}.uHr`, result);

    return result;
  }, [JSON.stringify(envUHr), pointIndex]);

  const corrFactorForAirBuoyancy = useMemo(() => {
    const a = safeParseFloat(ptKgMn3s?.[pointIndex]);
    const b = safeParseFloat(densityOfMoistAir);
    const c = safeParseFloat(firstRefData?.data?.prKgMn3);

    const y1 = divide(1, a);
    const y2 = divide(1, c);

    const x = subtract(b, 1.2);
    const y = subtract(y1, y2);

    const result = multiply(x, y);

    //* set temporary value
    form.setValue(`data.${pointIndex}.corrFactorForAirBuoyancy`, result);

    return result;
  }, [
    JSON.stringify(ptKgMn3s),
    JSON.stringify(firstRefData),
    pointIndex,
    densityOfMoistAir,
  ]);

  const totalActualWeight = useMemo(() => {
    if (refTableData.data.length < 1) return 0;

    const values = refTableData.data.map((refData) => {
      return safeParseFloat(refData?.data?.currentYearActualValue);
    });

    const result = sum(values);

    //* set temporary value
    form.setValue(`data.${pointIndex}.totalActualWeight`, result);

    return result;
  }, [JSON.stringify(refTableData), pointIndex]);

  const uPa = useMemo(() => {
    const a = pow(uF, 2);
    const b = pow(multiply(pow(10, -5), densityOfMoistAir, uP), 2);
    const c = pow(multiply(-0.0034, densityOfMoistAir, uT), 2);
    const d = pow(multiply(-0.01, densityOfMoistAir, uHr), 2);

    const result = pow(sum(a, b, c, d), 0.5);

    //* set temporary value
    form.setValue(`data.${pointIndex}.uPa`, result);

    return result;
  }, [densityOfMoistAir, uF, uP, uT, uHr, pointIndex]);

  const uB = useMemo(() => {
    const prKgMn3 = safeParseFloat(firstRefData?.data?.prKgMn3);
    const uPrKgMn3 = safeParseFloat(firstRefData?.data?.uPrKgMn3);

    const ptKgMn3 = safeParseFloat(ptKgMn3s?.[pointIndex]);
    const uPtKgMn3 = safeParseFloat(uPtKgMn3s?.[pointIndex]);

    const a1 = subtract(prKgMn3, ptKgMn3);
    const a2 = multiply(prKgMn3, ptKgMn3);
    const a3 = divide(a1, a2);
    const a = pow(multiply(totalActualWeight, a3, uPa), 2);

    const b1 = pow(
      multiply(totalActualWeight, subtract(densityOfMoistAir, 1.2)),
      2
    );
    const b2 = divide(pow(uPtKgMn3, 2), pow(ptKgMn3, 4));
    const b = multiply(b1, b2);

    const c1 = pow(totalActualWeight, 2);
    const c2 = subtract(densityOfMoistAir, 1.2);
    const c3 = subtract(c2, multiply(2, c2));
    const c4 = divide(pow(uPrKgMn3, 2), pow(prKgMn3, 4));
    const c = multiply(c1, c2, c3, c4);

    const result = pow(sum(a, b, c), 0.5);

    // * set temporary value
    form.setValue(`data.${pointIndex}.uB`, result);

    return result;
  }, [
    JSON.stringify(ptKgMn3s),
    JSON.stringify(uPtKgMn3s),
    JSON.stringify(firstRefData),
    densityOfMoistAir,
    uPa,
    totalActualWeight,
    pointIndex,
  ]);

  const testWeightData = useMemo(() => {
    const values = cData?.[pointIndex]?.testWeightData || [];

    //* create new test weight data table number[][]
    //? 1st element - column Ir1
    //? 2nd element - column It1
    //? 3rd element - column It2
    //? 4th elemment - column Ir2
    //? 5th element - column Ii
    //? 6th element - column Mci

    let result = [];

    for (let i = 0; i < values.length; i++) {
      let col1 = 0;
      let col2 = 0;
      let col3 = 0;
      let col4 = 0;
      let col5 = 0;
      let col6 = 0;

      const row = values[i];

      if (i === 0) col1 = safeParseFloat(row[i]);
      else col1 = safeParseFloat(values?.[i - 1]?.[3]);

      col2 = safeParseFloat(row[1]);
      col3 = safeParseFloat(row[2]);
      col4 = safeParseFloat(row[3]);

      col5 = (col2 - col1 - col4 + col3) / 2;

      const x = col5;
      const y = multiply(totalActualWeight, corrFactorForAirBuoyancy);

      col6 = sum(x, y);

      result.push([col1, col2, col3, col4, col5, col6]);
    }

    return result;
  }, [
    JSON.stringify(cData?.[pointIndex]?.testWeightData),
    pointIndex,
    totalActualWeight,
    corrFactorForAirBuoyancy,
  ]);

  const minMci = useMemo(() => {
    const values = testWeightData.map((row) => safeParseFloat(row[5]));
    const result = min(values?.length > 0 ? values : [0]);

    //* set temporary value
    form.setValue(`data.${pointIndex}.minMci`, result);

    return result;
  }, [JSON.stringify(testWeightData), pointIndex]);

  const maxMci = useMemo(() => {
    const values = testWeightData.map((row) => safeParseFloat(row[5]));
    const result = max(values?.length > 0 ? values : [0]);

    //* set temporary value
    form.setValue(`data.${pointIndex}.maxMci`, result);

    return result;
  }, [JSON.stringify(testWeightData), pointIndex]);

  const averageMci = useMemo(() => {
    const values = testWeightData.map((row) => safeParseFloat(row[5]));
    const result = mean(values?.length > 0 ? values : [0]);

    //* set temporary value
    form.setValue(`data.${pointIndex}.averageMci`, result);

    return result;
  }, [JSON.stringify(testWeightData), pointIndex]);

  const uWMci = useMemo(() => {
    const a = subtract(maxMci, minMci);
    const b = multiply(2, pow(3, 0.5));
    const c = pow(5, 0.5);

    const result = a / b / c;

    //* set temporary value
    form.setValue(`data.${pointIndex}.uwMci`, result);

    return result;
  }, [minMci, maxMci]);

  const testWeight = useMemo(() => {
    const result = sum(totalActualWeight, averageMci);

    //* set temporary value
    form.setValue(`data.${pointIndex}.testWeight`, result);

    return result;
  }, [totalActualWeight, averageMci]);

  const totalUcertg = useMemo(() => {
    if (refTableData.data.length < 1) return 0;

    const values = refTableData.data.map((refData) =>
      safeParseFloat(refData?.data?.uCertg)
    );

    const result = sum(values);

    //* set temporary value
    form.setValue(`data.${pointIndex}.totalUcertg`, result);

    return result;
  }, [JSON.stringify(refTableData.data), pointIndex]);

  const totalUcert2g2 = useMemo(() => {
    if (refTableData.data.length < 1) return 0;

    const values = refTableData.data.map((refData) => {
      let value;

      try {
        value = bignumber(refData?.data?.uCert2g2 || 0);
      } catch (error) {
        value = 0;
      }

      return value;
    });

    const result = sum(values);

    //* set temporary value
    form.setValue(`data.${pointIndex}.totalUcert2g2`, result);

    return result;
  }, [JSON.stringify(refTableData.data), pointIndex]);

  const totalUcert4g4 = useMemo(() => {
    if (refTableData.data.length < 1) return 0;

    const values = refTableData.data.map((refData) => {
      let value;

      try {
        value = bignumber(refData?.data?.uCert4vG4 || 0);
      } catch (error) {
        value = 0;
      }

      return value;
    });

    const result = sum(values);

    //* set temporary value
    form.setValue(`data.${pointIndex}.totalUcert4g4`, result);

    return result;
  }, [JSON.stringify(refTableData.data), pointIndex]);

  const totalUncertaintyOfMasterUsed = useMemo(() => {
    const result = divide(totalUcertg, 2);

    //* set temporary value
    form.setValue(`data.${pointIndex}.totalUncertaintyOfMasterUsed`, result);

    return result;
  }, [totalUcertg]);

  const uCertMcr = useMemo(() => {
    const result = sqrt(totalUcert2g2);

    //* set temporary value
    form.setValue(`data.${pointIndex}.uCertMcr`, result);

    return result;
  }, [totalUcert2g2, pointIndex]);

  const uCert4g4Veff = useMemo(() => {
    const result = divide(pow(uCertMcr, 4), totalUcert4g4);

    //* set temporary value
    form.setValue(`data.${pointIndex}.uCert4g4Veff`, result);

    return result;
  }, [totalUcert4g4, uCertMcr, pointIndex]);

  const totalUinst2g2 = useMemo(() => {
    if (refTableData.data.length < 1) return 0;

    const values = refTableData.data.map((refData) => {
      let value;

      try {
        value = bignumber(refData?.data?.uInst2g2 || 0);
      } catch (error) {
        value = 0;
      }

      return value;
    });

    const result = sum(values);

    //* set temporary value
    form.setValue(`data.${pointIndex}.totalUinst2g2`, result);

    return result;
  }, [JSON.stringify(refTableData.data), pointIndex]);

  const totalUinst4vG4 = useMemo(() => {
    if (refTableData.data.length < 1) return 0;

    const values = refTableData.data.map((refData) => {
      let value;

      try {
        value = bignumber(refData?.data?.uInst4vG4 || 0);
      } catch (error) {
        value = 0;
      }

      return value;
    });

    const result = sum(values);

    //* set temporary value
    form.setValue(`data.${pointIndex}.totalUinst4vG4`, result);

    return result;
  }, [JSON.stringify(refTableData.data), pointIndex]);

  const uInstMcr = useMemo(() => {
    const result = sqrt(totalUinst2g2);

    //* set temporary value
    form.setValue(`data.${pointIndex}.uInstMcr`, result);

    return result;
  }, [totalUinst2g2, pointIndex]);

  const uInst4g4Veff = useMemo(() => {
    const result = divide(pow(uInstMcr, 4), totalUinst4vG4);

    //* set temporary value
    form.setValue(`data.${pointIndex}.uInst4g4Veff`, result);

    return result;
  }, [totalUinst4vG4, uInstMcr, pointIndex]);

  const totalDriftg = useMemo(() => {
    if (refTableData.data.length < 1) return 0;

    const values = refTableData.data.map((refData) =>
      safeParseFloat(refData?.data?.driftg)
    );

    const result = sum(values);

    //* set temporary value
    form.setValue(`data.${pointIndex}.totalDriftg`, result);

    return result;
  }, [JSON.stringify(refTableData.data), pointIndex]);

  const totalDriftgDivideSqrtOf3 = useMemo(() => {
    const result = divide(totalDriftg, sqrt(3));

    //* set temporary value
    form.setValue(`data.${pointIndex}.totalDriftgDivideSqrtOf3`, result);

    return result;
  }, [totalDriftg]);

  const calculations = useMemo(() => {
    return {
      ptKgMn3s,
      uPtKgMn3s,
      uF,
      uP,
      uT,
      uHr,
      uPa,
      uB,
      corrFactorForAirBuoyancy,
      minMci,
      maxMci,
      averageMci,
      uWMci,
      testWeight,
      totalActualWeight,
      totalUcertg,
      totalUcert2g2,
      totalUcert4g4,
      totalUncertaintyOfMasterUsed,
      uCertMcr,
      uCert4g4Veff,
      totalUinst2g2,
      totalUinst4vG4,
      uInstMcr,
      uInst4g4Veff,
      totalDriftg,
      totalDriftgDivideSqrtOf3,
    };
  }, [
    ptKgMn3s,
    uPtKgMn3s,
    uF,
    uP,
    uT,
    uHr,
    uPa,
    uB,
    corrFactorForAirBuoyancy,
    minMci,
    maxMci,
    averageMci,
    uWMci,
    testWeight,
    totalActualWeight,
    totalUcertg,
    totalUcert2g2,
    totalUcert4g4,
    totalUncertaintyOfMasterUsed,
    uCertMcr,
    uCert4g4Veff,
    totalUinst2g2,
    totalUinst4vG4,
    uInstMcr,
    uInst4g4Veff,
    totalDriftg,
    totalDriftgDivideSqrtOf3,
  ]);

  //* set entry data
  useEffect(() => {
    if (!cData || cData?.length < 1 || pointIndex === undefined) return;

    const testWeightCurrentPoint = cData?.[pointIndex] || null;

    if (testWeightCurrentPoint) setEntryData({ ...testWeightCurrentPoint });
  }, [JSON.stringify(cData), pointIndex]);

  //* setRefTable data
  useEffect(() => {
    if (!entryData) {
      setRefTableData({ data: [], isLoading: false, isError: false });
      return;
    }

    const weights = entryData?.weights || [];
    const tagId = entryData?.tagId?.value || '';

    const refData = weights.map((weight) => {
      //* criteria lookup
      //* based on the weight and tagId search the cuswd data match tagId and nominal value
      const cuswdRef = cuswd.data.find(
        (ref) => ref?.tagId === tagId && ref?.nominalValue === weight
      );

      const data = { weightUsed: weight, ...(cuswdRef ?? {}) };

      return { entry: entryData, data };
    });

    setRefTableData({ data: refData, isLoading: false, isError: false });
  }, [JSON.stringify(entryData), JSON.stringify(cuswd.data)]);

  // useEffect(() => {
  //   console.log({
  //     category: 'mass',
  //     testWeightData,
  //     variant: 'standard-weight',
  //     cData,
  //     entryData,
  //     refTableData,
  //     cuswd,
  //     pointIndex,
  //     firstRefData,
  //     testWeightData,
  //   });
  // }, [
  //   JSON.stringify(entryData),
  //   JSON.stringify(refTableData),
  //   JSON.stringify(cuswd),
  //   pointIndex,
  //   JSON.stringify(firstRefData),
  // ]);

  return (
    <>
      {/* //* Table A */}
      <Table className='text-center fs-6 m-0 align-middle' bordered responsive>
        <thead>
          <tr>
            <th className='align-middle'>
              Standard <br />
              Weight(s) Used
            </th>
            <th className='align-middle'>
              Actual Weight <br />
              (g)
            </th>
            <th className='align-middle'>
              P<sub>r</sub>
              <br />
              (Kg m<sup>-3</sup>)
            </th>
            <th className='align-middle'>
              U(P<sub>r</sub>)
              <br />
              (Kg m<sup>-3</sup>)
            </th>
            <th className='align-middle'>
              U<sub>cert</sub>
              <br />
              (g)
            </th>
            <th className='align-middle'>
              U<sub>cert</sub>
              <sup>2</sup> <br />
              (g<sup>2</sup>)
            </th>
            <th className='align-middle'>
              U<sub>cert</sub>
              <sup>4 / v</sup>
              <br />
              (g<sup>4</sup>)
            </th>
            <th className='align-middle'>
              U<sub>inst</sub>
              <br />
              (g)
            </th>
            <th className='align-middle'>
              U<sub>inst</sub>
              <sup>2</sup>
              <br />
              (g<sup>2</sup>)
            </th>
            <th className='align-middle'>
              U<sub>inst</sub>
              <sup>4 / v</sup>
              <br />
              (g<sup>4</sup>)
            </th>
            <th className='align-middle'>Drift (g)</th>
          </tr>
        </thead>
        <tbody>
          {refTableData.data.length === 0 &&
            !refTableData.isLoading &&
            !refTableData.isError && (
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
                  <Spinner className='me-2' animation='border' size='sm' />{' '}
                  Loading...
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
                    <p className='text-muted fs-6'>
                      Something went wrong. Please try again later.
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          )}

          {refTableData.data.length > 0 &&
            !refTableData.isLoading &&
            !refTableData.isError &&
            refTableData.data.map(({ data: ref, entry }, refDataIndex) => {
              return (
                <>
                  {ref && (
                    <tr key={`${refDataIndex}`}>
                      <td>{ref?.weightUsed || ''}</td>
                      <td>
                        {formatToDicimalString(
                          safeParseFloat(ref?.currentYearActualValue),
                          6
                        )}
                      </td>
                      <td>{ref?.prKgMn3 || ''}</td>
                      <td>{ref?.uPrKgMn3 || ''}</td>
                      <td>{ref?.uCertg || ''}</td>
                      <td>{ref?.uCert2g2 || ''}</td>
                      <td>{ref?.uCert4vG4 || ''}</td>
                      <td>{ref?.uInstg || ''}</td>
                      <td>{ref?.uInst2g2 || ''}</td>
                      <td>{ref?.uInst4vG4 || ''}</td>
                      <td>
                        {formatToDicimalString(safeParseFloat(ref?.driftg), 6)}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
        </tbody>
      </Table>

      {/* //* Table B */}
      <Table
        className='mt-5 text-center fs-6 m-0 align-middle'
        bordered
        responsive
      >
        <thead>
          <tr>
            <th>
              <em>I</em>
              <sub>r1</sub>
            </th>
            <th>
              <em>I</em>
              <sub>t1</sub>
            </th>
            <th>
              <em>I</em>
              <sub>t2</sub>
            </th>
            <th>
              <em>I</em>
              <sub>r2</sub>
            </th>
            <th>
              △<em>I</em>
              <sub>i</sub>
            </th>
            <th>
              △<em>m</em>
              <sub>ci</sub>
            </th>
          </tr>
        </thead>

        <tbody>
          {testWeightData.map((twData, rowIndex) => {
            return (
              <tr key={`${rowIndex}-row-inspection-point-calculation-table`}>
                <td>{formatToDicimalString(twData[0], 5)}</td>
                <td>{formatToDicimalString(twData[1], 5)}</td>
                <td>{formatToDicimalString(twData[2], 5)}</td>
                <td>{formatToDicimalString(twData[3], 5)}</td>
                <td>{formatToDicimalString(twData[4], 5)}</td>
                <td>{formatToDicimalString(twData[5], 5)}</td>
              </tr>
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

        <UncertaintyBudgetTable
          pointIndex={pointIndex}
          calculations={calculations}
        />
      </div>
    </>
  );
};

const UncertaintyBudgetTable = ({ pointIndex, calculations }) => {
  //* Common Constant values
  const COMMON_RELATIVE_UNCERTAINTY = 0.00001;
  const COMMON_V_VALUE = 4;
  const COMMON_K_VALUE1 = 2;
  const COMMON_K_VALUE2 = sqrt(3);
  const COMMON_CI_VALUE = 1;

  const form = useFormContext();

  const ck = useWatch({ control: form.control, name: 'ck' }) || { data: [], isLoading: true, isError: false }; //prettier-ignore
  const rscmc = useWatch({ control: form.control, name: 'rscmc' }) || { data: [], isLoading: true, isError: false }; //prettier-ignore

  const nominalValues =
    useWatch({ control: form.control, name: 'nominalValues' }) || [];
  const massComparatorRefEquipment = useWatch({control: form.control, name: 'massComparatorRefEquipment'}) || []; //prettier-ignore

  const nominalValue = useMemo(() => {
    return nominalValues?.[pointIndex] || 0;
  }, [JSON.stringify(nominalValues), pointIndex]);

  const rscmcRefValue = useMemo(() => {
    if (rscmc?.data?.length < 1) return 0;

    const matchRscmc = rscmc.data.find(
      (ref) => ref.nominalValue == nominalValue
    );

    const result = safeParseFloat(matchRscmc?.value);

    //* set temporary value
    form.setValue(`rscmcRefValues.${pointIndex}`, result);

    return result;
  }, [nominalValue, JSON.stringify(rscmc), pointIndex]);

  const massComparatorRefEquipmentObj = useMemo(() => {
    const value = massComparatorRefEquipment?.[pointIndex] || '';
    return value;
  }, [JSON.stringify(massComparatorRefEquipment), pointIndex]);

  const commonValueV = useMemo(() => {
    if (nominalValue === '0') return '';

    const x = divide(1, 2);
    const y = pow(divide(COMMON_RELATIVE_UNCERTAINTY, 100), -2);

    return multiply(x, y);
  }, [COMMON_RELATIVE_UNCERTAINTY, nominalValue]);

  const weighingProcessUi = useMemo(() => {
    return calculations.uWMci;
  }, [calculations.uWMci]);

  const weighingProcessCiUi2 = useMemo(() => {
    return pow(multiply(weighingProcessUi, COMMON_CI_VALUE), 2);
  }, [weighingProcessUi, COMMON_CI_VALUE]);

  const weighingProcessCiUi4v = useMemo(() => {
    const x = multiply(weighingProcessUi, COMMON_CI_VALUE);
    const y = pow(x, 4);
    return divide(y, COMMON_V_VALUE);
  }, [COMMON_V_VALUE, COMMON_CI_VALUE, weighingProcessUi]);

  const calibrationCertificateV = useMemo(() => {
    return calculations.uCert4g4Veff;
  }, [nominalValue, calculations.uCert4g4Veff]);

  const calibrationCertificateUi = useMemo(() => {
    return calculations.totalUncertaintyOfMasterUsed;
  }, [nominalValue, calculations.totalUncertaintyOfMasterUsed]);

  const calibrationCertificateCiUi2 = useMemo(() => {
    const calibrationCertificateCi = nominalValue === 0 ? 0 : COMMON_CI_VALUE;

    return pow(multiply(calibrationCertificateUi, calibrationCertificateCi), 2);
  }, [nominalValue, calibrationCertificateUi]);

  const calibrationCertificateCiUi4v = useMemo(() => {
    const calibrationCertificateCi = nominalValue === 0 ? 0 : COMMON_CI_VALUE;

    const x = multiply(calibrationCertificateUi, calibrationCertificateCi);
    const y = bignumber(pow(x, 4));
    return divide(y, calibrationCertificateV);
  }, [nominalValue, calibrationCertificateUi, calibrationCertificateV]);

  const instabilityDriftUi = useMemo(() => {
    if (nominalValue === 0) return '';

    return calculations.uInstMcr;
  }, [nominalValue, calculations.uInstMcr]);

  const instabilityDriftCiUi2 = useMemo(() => {
    const instabilityDriftCi = nominalValue === 0 ? 0 : COMMON_CI_VALUE;

    return pow(multiply(instabilityDriftUi, instabilityDriftCi), 2);
  }, [nominalValue, instabilityDriftUi]);

  const instabilityDriftV = useMemo(() => {
    return divide(pow(instabilityDriftUi, 4), calculations.totalUinst4vG4);
  }, [instabilityDriftUi, calculations.totalUinst4vG4]);

  const instabilityDriftCiUi4v = useMemo(() => {
    const instabilityDriftCi = nominalValue === 0 ? 0 : COMMON_CI_VALUE;

    const x = multiply(instabilityDriftUi, instabilityDriftCi);
    const y = pow(x, 4);
    return divide(y, instabilityDriftV);
  }, [instabilityDriftUi, COMMON_CI_VALUE, instabilityDriftV]);

  const airBouyancyCorrectionUi = useMemo(() => {
    return divide(calculations.uB, COMMON_K_VALUE2);
  }, [calculations.uB, COMMON_K_VALUE2]);

  const airBouyancyCorrectionCiUi2 = useMemo(() => {
    const airBouyancyCorrectionCi = nominalValue === 0 ? 0 : COMMON_CI_VALUE;

    return pow(multiply(airBouyancyCorrectionUi, airBouyancyCorrectionCi), 2);
  }, [nominalValue, airBouyancyCorrectionUi]);

  const airBouyancyCorrectionCiUi4v = useMemo(() => {
    const airBouyancyCorrectionCi = nominalValue === 0 ? 0 : COMMON_CI_VALUE;

    const x = multiply(airBouyancyCorrectionUi, airBouyancyCorrectionCi);
    const y = pow(x, 4);
    return divide(y, commonValueV);
  }, [airBouyancyCorrectionUi, COMMON_CI_VALUE, commonValueV]);

  const displayResolutionOfComparitorU = useMemo(() => {
    const x1 = massComparatorRefEquipmentObj?.uncertainty || 0;
    const x = divide(x1, 2);
    const y = pow(2, 0.5);

    return multiply(x, y);
  }, [massComparatorRefEquipmentObj]);

  const displayResolutionOfComparitorUi = useMemo(() => {
    return divide(displayResolutionOfComparitorU, COMMON_K_VALUE2);
  }, [displayResolutionOfComparitorU, COMMON_K_VALUE2]);

  const displayResolutionOfComparitorCiUi2 = useMemo(() => {
    const displayResolutionOfComparitorCi = COMMON_CI_VALUE;

    return pow(
      multiply(
        displayResolutionOfComparitorUi,
        displayResolutionOfComparitorCi
      ),
      2
    );
  }, [nominalValue, displayResolutionOfComparitorUi]);

  const displayResolutionOfComparitorCiUi4v = useMemo(() => {
    const displayResolutionOfComparitorCi = COMMON_CI_VALUE;

    const x = multiply(
      displayResolutionOfComparitorUi,
      displayResolutionOfComparitorCi
    );
    const y = pow(x, 4);
    return divide(y, commonValueV);
  }, [displayResolutionOfComparitorUi, COMMON_CI_VALUE, commonValueV]);

  const referenceWeightUi = useMemo(() => {
    const x = bignumber(calibrationCertificateCiUi2);
    const y = bignumber(instabilityDriftCiUi2);

    return sqrt(sum(x, y));
  }, [calibrationCertificateCiUi2, instabilityDriftCiUi2]);

  const referenceWeightCiUi2 = useMemo(() => {
    const referenceWeightCi = COMMON_CI_VALUE;

    return pow(multiply(referenceWeightUi, referenceWeightCi), 2);
  }, [nominalValue, referenceWeightUi]);

  const referenceWeightV = useMemo(() => {
    const x = pow(referenceWeightUi, 4);
    const y = sum(calibrationCertificateCiUi4v, instabilityDriftCiUi4v);
    return divide(x, y);
  }, [referenceWeightUi, calibrationCertificateCiUi4v, instabilityDriftCiUi4v]);

  const referenceWeightCiUi4v = useMemo(() => {
    const referenceWeightCi = COMMON_CI_VALUE;

    const x = multiply(referenceWeightUi, referenceWeightCi);
    const y = pow(x, 4);
    return divide(y, referenceWeightV);
  }, [referenceWeightUi, COMMON_CI_VALUE, referenceWeightV]);

  const totalCiUi2 = useMemo(() => {
    let values = [
      weighingProcessCiUi2,
      referenceWeightCiUi2,
      airBouyancyCorrectionCiUi2,
      displayResolutionOfComparitorCiUi2,
    ]
      .filter(Boolean)
      .map((v) => {
        try {
          if (isBigNumber(v)) return v;
          return bignumber(v);
        } catch (error) {
          return 0;
        }
      });

    if (values.length < 1) values = [0];

    return sum(values);
  }, [
    weighingProcessCiUi2,
    referenceWeightCiUi2,
    airBouyancyCorrectionCiUi2,
    displayResolutionOfComparitorCiUi2,
  ]);

  const totalCiUi4v = useMemo(() => {
    let values = [
      bignumber(weighingProcessCiUi4v),
      bignumber(referenceWeightCiUi4v),
      airBouyancyCorrectionCiUi4v,
      bignumber(displayResolutionOfComparitorCiUi4v),
    ]
      .filter(Boolean)
      .map((v) => {
        try {
          if (isBigNumber(v)) return v;
          return bignumber(v);
        } catch (error) {
          return 0;
        }
      });

    if (values.length < 1) values = [0];

    return sum(values);
  }, [
    weighingProcessCiUi4v,
    referenceWeightCiUi4v,
    airBouyancyCorrectionCiUi4v,
    displayResolutionOfComparitorCiUi4v,
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
    (value) => {
      if ((!value && value !== 0) || ck?.data?.length < 1) {
        return { value: 0, dof: 0 };
      }

      // * sort ck data by DOF
      const sortedCK = [...ck.data].sort(
        (a, b) => safeParseFloat(a.dof) - safeParseFloat(b.dof)
      );

      //* If value is less than the first DOF, return the first entry
      if (value < safeParseFloat(sortedCK[0]?.dof)) {
        return sortedCK[0];
      }

      //* Find the closest matching or lower DOF
      const closest = sortedCK.find((entry, index) => {
        const current = safeParseFloat(entry.dof);
        const next = safeParseFloat(sortedCK[index + 1]?.dof);

        //* Return exact match immediately
        if (value === current) return true;

        //* If value falls between current and next, return current
        if (!isNaN(next) && value > current && value < next) return true;

        return false;
      });

      //* If no match was found, return the last element (highest DOF)
      return closest || sortedCK[sortedCK.length - 1];
    },
    [JSON.stringify(ck)]
  );

  const coverageFactor = useMemo(() => {
    if (ck?.data?.length < 1) return { value: 0, data: null };

    const isBigNumberValue = isBigNumber(effectiveNumberDegressOfFreedom);

    const value = isBigNumberValue
      ? floor(effectiveNumberDegressOfFreedom.toNumber())
      : floor(effectiveNumberDegressOfFreedom);

    const result = findClosestDOF(value);

    const cf = isNaN(parseFloat(result.value)) ? 0 : parseFloat(result.value);

    //* set temporary value
    form.setValue(`coverageFactors.${pointIndex}`, cf);

    return { value: cf, data: result };
  }, [effectiveNumberDegressOfFreedom, JSON.stringify(ck), pointIndex]);

  const expandedUncertainty = useMemo(() => {
    const x = combineUncertainty;
    const y = coverageFactor.value;

    const result = multiply(x, y);

    //* set temporary value
    form.setValue(`expandedUncertainties.${pointIndex}`, result);

    return result;
  }, [combineUncertainty, coverageFactor.value, pointIndex]);

  const resultExpandedUncertainty = useMemo(() => {
    let result;

    if (expandedUncertainty > rscmcRefValue) result = expandedUncertainty;
    else result = rscmcRefValue;

    //* set temporary value
    form.setValue(`resultExpandedUncertainties.${pointIndex}`, result);

    return result;
  }, [expandedUncertainty, rscmcRefValue, pointIndex]);

  // console.log({
  //   pointIndex,
  //   combineUncertainty,
  //   effectiveNumberDegressOfFreedom,
  //   coverageFactor,
  //   expandedUncertainty,
  // });

  return (
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
            <sub>i</sub>)<sup>{COMMON_V_VALUE}</sup>/v
          </th>
        </tr>
      </thead>

      <tbody>
        <tr>
          <td className='fw-bold'>
            U(X<sub>i</sub>)
          </td>
          <td className='text-start'>Weighing Process</td>
          <td>gram</td>
          <td>Normal</td>
          <td>A</td>
          <td></td>
          <td>4</td>
          <td></td>
          <td></td>
          <td>{formatToDicimalString(weighingProcessUi, 6)}</td>
          <td>{COMMON_CI_VALUE}</td>
          <td className='fw-bold'>
            {formatScientific(weighingProcessCiUi2, 3)}
          </td>
          <td className='fw-bold'>
            {formatScientific(weighingProcessCiUi4v, 3)}
          </td>
        </tr>

        <tr>
          <td className='fw-bold'>
            U
            <sup>
              (m<sub>cr</sub>)
            </sup>
          </td>
          <td className='text-start'>Reference Weight</td>
          <td>gram</td>
          <td></td>
          <td></td>
          <td></td>
          <td>{formatScientific(referenceWeightV, 3)}</td>
          <td></td>
          <td></td>
          <td>{formatToDicimalString(referenceWeightUi, 6)}</td>
          <td>{COMMON_CI_VALUE}</td>
          <td className='fw-bold'>
            {formatScientific(referenceWeightCiUi2, 3)}
          </td>
          <td className='fw-bold'>
            {formatScientific(referenceWeightCiUi4v, 3)}
          </td>
        </tr>

        <tr>
          <td className='fw-bold'>
            U<sub>cert</sub>
            <sup>
              (m<sub>cr</sub>)
            </sup>
          </td>
          <td className='text-start'>
            &nbsp;&nbsp;&nbsp;&nbsp;Calibration Certificate
          </td>
          <td>gram</td>
          <td>Normal</td>
          <td>B</td>
          <td></td>
          <td>{formatScientific(calibrationCertificateV, 3)}</td>
          <td></td>
          <td>{formatToDicimalString(COMMON_K_VALUE1, 2)}</td>
          <td>{formatToDicimalString(calibrationCertificateUi, 6)}</td>
          <td>{nominalValue === 0 ? '' : COMMON_CI_VALUE}</td>
          <td>{formatScientific(calibrationCertificateCiUi2, 3)}</td>
          <td>{formatScientific(calibrationCertificateCiUi4v, 3)}</td>
        </tr>

        <tr>
          <td className='fw-bold'>
            U<sub>inst</sub>
            <sup>
              (m<sub>cr</sub>)
            </sup>
          </td>
          <td className='text-start'>
            &nbsp;&nbsp;&nbsp;&nbsp;Instability / Drift
          </td>
          <td>gram</td>
          <td>Rect.</td>
          <td>B</td>
          <td></td>
          <td>{formatScientific(instabilityDriftV, 3)}</td>
          <td></td>
          <td>{formatToDicimalString(COMMON_K_VALUE2, 2)}</td>
          <td>{formatToDicimalString(instabilityDriftUi, 6)}</td>
          <td>{nominalValue === 0 ? '' : COMMON_CI_VALUE}</td>
          <td>{formatScientific(instabilityDriftCiUi2, 3)}</td>
          <td>{formatScientific(instabilityDriftCiUi4v, 3)}</td>
        </tr>

        <tr>
          <td className='fw-bold'>
            U<sub>b</sub>
          </td>
          <td className='text-start'>Air Buoyancy Correction</td>
          <td>gram</td>
          <td>Rect.</td>
          <td>B</td>
          <td>0.00001</td>
          <td>{formatScientific(commonValueV, 3)}</td>
          <td>{formatScientific(calculations.uB, 3)}</td>
          <td>{formatToDicimalString(COMMON_K_VALUE2, 2)}</td>
          <td>{formatScientific(airBouyancyCorrectionUi, 3)}</td>
          <td>{nominalValue === 0 ? '' : COMMON_CI_VALUE}</td>
          <td className='fw-bold'>
            {formatScientific(airBouyancyCorrectionCiUi2, 3)}
          </td>
          <td className='fw-bold'>
            {formatScientific(airBouyancyCorrectionCiUi4v, 3)}
          </td>
        </tr>

        <tr>
          <td className='fw-bold'>ud</td>
          <td className='text-start'>Display resolution of comparator</td>
          <td>gram</td>
          <td>Rect.</td>
          <td>B</td>
          <td>0.00001</td>
          <td>{formatScientific(commonValueV, 3)}</td>
          <td>{formatToDicimalString(displayResolutionOfComparitorU, 6)}</td>
          <td>{formatToDicimalString(COMMON_K_VALUE2, 2)}</td>
          <td>{formatToDicimalString(displayResolutionOfComparitorUi, 6)}</td>
          <td>1</td>
          <td className='fw-bold'>
            {formatScientific(displayResolutionOfComparitorCiUi2, 3)}
          </td>
          <td className='fw-bold'>
            {formatScientific(displayResolutionOfComparitorCiUi4v, 3)}
          </td>
        </tr>

        <tr>
          <td></td>
          <td className='text-start' colSpan={10}>
            SUMS (only of those with bold letter)
          </td>
          <td>{formatScientific(totalCiUi2, 3)}</td>
          <td>{formatScientific(totalCiUi4v, 3)}</td>
        </tr>

        <tr>
          <th>
            <i>
              u<sub>c</sub>(m<sub>ct</sub>)
            </i>
          </th>
          <td className='text-start fw-bold' colSpan={8}>
            Combined Uncertainty
          </td>
          <td className='fw-bold fs-5' colSpan={4}>
            <span className='me-2'>
              ± {formatToDicimalString(combineUncertainty, 6)} gram
            </span>
          </td>
        </tr>

        <tr>
          <th>
            <i>
              v[u<sub>c</sub>(m<sub>ct</sub>)]
            </i>
          </th>
          <td className='text-start' colSpan={8}>
            Effective Number of Degrees of Freedom
          </td>
          <td className='fw-bold fs-5' colSpan={4}>
            <span className='me-2'>
              ±{formatScientific(effectiveNumberDegressOfFreedom, 3)}
            </span>
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
            {formatToDicimalString(expandedUncertainty, 6)} gram
          </td>
        </tr>
      </tbody>
    </Table>
  );
};

export default SWCalculationTable;
