import { useCallback, useEffect, useMemo, useRef } from 'react';
import { max } from 'mathjs';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import styles from '../../mass.module.css';
import { NOMINAL_VALUE } from '@/schema/calibration';
import { Form, Tab, Table } from 'react-bootstrap';
import { useDebouncedCallback } from 'use-debounce';

const DFNVTest = ({ data }) => {
  const isMounted = useRef(false);

  const form = useFormContext();
  const formErrors = form.formState.errors;

  const { fields, append, update, replace } = useFieldArray({
    name: 'data.dfnv',
    control: form.control,
  });

  const instruments = useMemo(() => {
    return form.getValues('instruments');
  }, [form.watch('instruments')]);

  const calibrationPointNo = useMemo(() => {
    const value = parseFloat(form.getValues('calibrationPointNo')?.value);
    return isNaN(value) ? undefined : value;
  }, [form.watch('calibrationPointNo')]);

  const handleValueSubmit = ({
    value,
    entry,
    entryIndex,
    calibrationPointIndex,
    dataColumnIndex,
    key,
  }) => {
    const existingDataArray = entry.calibrationPoints[calibrationPointIndex].data[dataColumnIndex]; //prettier-ignore
    const newValue = [...existingDataArray, value];

    //* update data
    entry.calibrationPoints[calibrationPointIndex].data[dataColumnIndex] = newValue; //prettier-ignore

    //* update field
    update(entryIndex, entry);

    //* reset
    form.setValue(key, '');
  };

  const handleIdValueSubmit = ({ value, entry, entryIndex, key }) => {
    const existingIdsArray = entry.ids;
    const newValue = [...existingIdsArray, value];

    //* update ids
    entry.ids = newValue;

    //* update field
    update(entryIndex, entry);

    //* reset
    form.setValue(key, '');

    //* clear errors
    form.clearErrors(`data.dfnv.${entryIndex}.ids`);
  };

  const handleEditData = ({
    value,
    entry,
    entryIndex,
    calibrationPointIndex,
    dataColumnIndex,
    dataIndex,
  }) => {
    if (!value.match(/^\d+$/)) return;

    const existingDataArray = entry.calibrationPoints[calibrationPointIndex].data[dataColumnIndex]; //prettier-ignore

    //* remove data from array
    existingDataArray.splice(dataIndex, 1, Number(value));
    //* update data
    entry.calibrationPoints[calibrationPointIndex].data[dataColumnIndex] = existingDataArray; //prettier-ignore
    //* update field
    update(entryIndex, entry);
  };

  const handleEditId = ({ value, entry, entryIndex, idIndex }) => {
    const existingIdsArray = entry.ids;

    //* remove data from array
    existingIdsArray.splice(idIndex, 1, value);
    //* update data
    entry.ids = existingIdsArray;
    //* update field
    update(entryIndex, entry);
  };

  const debouncedHandleEditId = useDebouncedCallback(handleEditId, 500);
  const debouncedHandleEditData = useDebouncedCallback(handleEditData, 500);

  const handleRemoveData = ({
    entry,
    entryIndex,
    calibrationPointIndex,
    dataColumnIndex,
    dataIndex,
  }) => {
    const existingDataArray = entry.calibrationPoints[calibrationPointIndex].data[dataColumnIndex]; //prettier-ignore

    //* remove data from array
    existingDataArray.splice(dataIndex, 1);
    //* update data
    entry.calibrationPoints[calibrationPointIndex].data[dataColumnIndex] = existingDataArray; //prettier-ignore
    //* update field
    update(entryIndex, entry);
  };

  const handleRemoveIds = ({ entry, entryIndex, idIndex }) => {
    const existingIdsArray = entry.ids;

    //* remove data from array
    existingIdsArray.splice(idIndex, 1);
    //* update data
    entry.ids = existingIdsArray;
    //* update field
    update(entryIndex, entry);
  };

  const handleOnPasteData = (e) => {
    const pastedText = event.clipboardData.getData('text');
    if (!/^\d*\.?\d+$/.test(pastedText)) e.preventDefault();
  };

  const handleKeyDownData = (e) => {
    //*Allow: Numbers (0-9), Backspace, Arrow keys, Delete, Enter, and Tab.
    if (
      !/[0-9.]/.test(e.key) &&
      !['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(e.key)
    ) {
      //* Allow Ctrl + A (Select All). Ctrl + C (Copy). Ctrl + V (Paste),
      if (
        (e.ctrlKey && e.key.toLowerCase() === 'a') ||
        (e.ctrlKey && e.key.toLowerCase() === 'c') | (e.ctrlKey && e.key.toLowerCase() === 'v')
      )
        return;

      e.preventDefault(); //* Block keypress
    }
  };

  const dataInputOnKeyDown = useCallback(
    ({ event, key, entry, entryIndex, calibrationPointIndex: pointIndex, dataColumnIndex }) => {
      const value = form.getValues(key);

      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();

        if (value) {
          handleValueSubmit({
            value,
            entry,
            entryIndex,
            calibrationPointIndex: pointIndex,
            dataColumnIndex,
            key,
          });
        }
      }
    },
    [form.watch('data.dfnv')]
  );

  const idsInputOnKeyDown = useCallback(
    ({ event, entry, entryIndex, key }) => {
      const value = form.getValues(key);

      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();

        if (value) {
          handleIdValueSubmit({
            value,
            entry,
            entryIndex,
            key,
          });
        }
      }
    },
    [form.watch('data.dfnv')]
  );

  //* set iniitial DFNV data
  useEffect(() => {
    //* if data exist and calibration point no is same as data's dont dont something, else set initial data
    if (data && parseFloat(data.calibrationPointNo) === calibrationPointNo) return;

    if (instruments && instruments?.length > 0 && !isMounted.current && calibrationPointNo) {
      isMounted.current = true;

      const initialDFNV = instruments.map((equipment, i) => {
        return {
          tagId: equipment.tagId,
          ids: [],
          equipmentId: equipment.id,
          description: equipment.description,
          calibrationPoints: Array.from({ length: calibrationPointNo }, (_, i) => ({
            data: [[], []],
          })),
        };
      });

      // TODO: retain old data content values when calibrationPointNo changed

      setTimeout(() => {
        //* set initial nominal value
        form.setValue('data.nominalValues', NOMINAL_VALUE.slice(0, calibrationPointNo));

        //* set initial measured value
        form.setValue(
          'data.measuredValues',
          NOMINAL_VALUE.slice(0, calibrationPointNo).map((value, i) => Array(3).fill(value))
        );

        replace(initialDFNV);
      }, 1000);
    }

    return () => (isMounted.current = false);
  }, [instruments, data, calibrationPointNo]);

  return (
    <>
      <div className='mx-0 border border-primary rounded overflow-hidden'>
        <Table className='text-center align-middle' bordered responsive>
          <thead>
            <tr>
              <th colSpan={7}>Departure From Nominal Value (g)</th>
            </tr>

            <tr>
              <th>Inspection Point</th>
              {NOMINAL_VALUE.slice(0, 6).map((_, i) => (
                <th key={i}>A{i + 1}</th>
              ))}
            </tr>

            <tr>
              <th>Nominal Value</th>

              {NOMINAL_VALUE.slice(0, 6).map((_, i) => {
                return (
                  <th key={i}>
                    <Controller
                      name={`data.nominalValues.${i}`}
                      control={form.control}
                      render={({ field }) => (
                        <Form.Control
                          onChange={(e) => {
                            form.setValue(
                              `data.nominalValues.${i}`,
                              isNaN(e.target.value) ? 0 : parseFloat(e.target.value)
                            );
                          }}
                          name={field.name}
                          ref={field.ref}
                          value={field.value}
                          className={`${styles.columnData} text-center`}
                          type='number'
                        />
                      )}
                    />
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {fields.map((entry, entryIndex) => {
              const calibrationPoints = entry.calibrationPoints.slice(0, 6);

              //* maximum length of the element of point.data
              const maximumDataLength = max(
                calibrationPoints?.length > 0
                  ? calibrationPoints.map((point) => {
                      return max(point.data.map((data) => data.length));
                    })
                  : 0
              );

              return (
                <tr key={entryIndex}>
                  <td className={`${styles.columnEquipment} align-top`}>
                    <div>{`${entry.description} - ${entry.tagId}`}</div>

                    <div className='mt-3'>
                      <Form
                        onKeyDown={(e) =>
                          idsInputOnKeyDown({
                            event: e,
                            entry,
                            entryIndex,
                            key: `data.dfnv.${entryIndex}.idValue`,
                          })
                        }
                      >
                        <Controller
                          name={`data.dfnv.${entryIndex}.idValue`}
                          control={form.control}
                          render={({ field }) => (
                            <>
                              <Form.Control
                                onChange={(e) => {
                                  const key = `data.dfnv.${entryIndex}.idValue`;
                                  form.setValue(key, e.target.value);
                                }}
                                name={field.name}
                                ref={field.ref}
                                value={field.value}
                                className={`${styles.columnData} text-center`}
                                type='text'
                              />

                              {formErrors && formErrors?.data?.dfnv?.[entryIndex]?.ids?.message && (
                                <Form.Text className='text-danger'>
                                  {formErrors?.data?.dfnv?.[entryIndex]?.ids?.message}
                                </Form.Text>
                              )}
                            </>
                          )}
                        />
                      </Form>
                    </div>

                    <div
                      className='mt-2 d-inline-flex flex-wrap gap-1 justify-content-center'
                      style={{ maxWidth: '90%' }}
                    >
                      {entry?.ids?.length > 0 &&
                        entry?.ids?.map((id, idIndex) => (
                          <div className={`${styles.columnData}`} key={`${id}-${idIndex}`}>
                            <div
                              className={styles.columnDataValue}
                              contentEditable
                              suppressContentEditableWarning={true}
                              onInput={(e) => {
                                debouncedHandleEditId({
                                  value: e.target.innerText,
                                  entry,
                                  entryIndex,
                                  idIndex,
                                });
                              }}
                            >
                              {id}
                            </div>
                            <div
                              contentEditable={false}
                              className={styles.columnDataClose}
                              onClick={() => {
                                handleRemoveIds({
                                  entry,
                                  entryIndex,
                                  idIndex,
                                });
                              }}
                            >
                              X
                            </div>
                          </div>
                        ))}
                    </div>
                  </td>

                  {calibrationPoints.map((point, pointIndex) => {
                    return (
                      <td className='p-0 align-top'>
                        <Table responsive>
                          <tr>
                            <th className={styles.dataColumnHeader}>E2</th>
                            <th className={styles.dataColumnHeader}>ST-MW</th>
                          </tr>
                          <tbody>
                            <tr key={`${entryIndex}-${pointIndex}-e2`}>
                              <td>
                                <Form
                                  onKeyDown={(e) =>
                                    dataInputOnKeyDown({
                                      event: e,
                                      key: `data.dfnv.${entryIndex}.calibrationPoints.${pointIndex}.e2`,
                                      entry,
                                      entryIndex,
                                      calibrationPointIndex: pointIndex,
                                      dataColumnIndex: 0,
                                    })
                                  }
                                >
                                  <Controller
                                    name={`data.dfnv.${entryIndex}.calibrationPoints.${pointIndex}.e2`}
                                    control={form.control}
                                    render={({ field }) => (
                                      <Form.Control
                                        onChange={(e) => {
                                          const key = `data.dfnv.${entryIndex}.calibrationPoints.${pointIndex}.e2`;
                                          form.setValue(key, e.target.value);
                                        }}
                                        name={field.name}
                                        ref={field.ref}
                                        value={field.value}
                                        className={`${styles.columnData} text-center`}
                                        type='number'
                                      />
                                    )}
                                  />
                                </Form>
                              </td>

                              <td>
                                <Form
                                  onKeyDown={(e) =>
                                    dataInputOnKeyDown({
                                      event: e,
                                      key: `data.dfnv.${entryIndex}.calibrationPoints.${pointIndex}.st-mw`,
                                      entry,
                                      entryIndex,
                                      calibrationPointIndex: pointIndex,
                                      dataColumnIndex: 1,
                                    })
                                  }
                                >
                                  <Controller
                                    name={`data.dfnv.${entryIndex}.calibrationPoints.${pointIndex}.st-mw`}
                                    control={form.control}
                                    render={({ field }) => (
                                      <Form.Control
                                        onChange={(e) => {
                                          const key = `data.dfnv.${entryIndex}.calibrationPoints.${pointIndex}.st-mw`;
                                          form.setValue(key, e.target.value);
                                        }}
                                        name={field.name}
                                        ref={field.ref}
                                        value={field.value}
                                        className={`${styles.columnData} text-center`}
                                        type='number'
                                      />
                                    )}
                                  />
                                </Form>
                              </td>
                            </tr>

                            {Array.from({ length: maximumDataLength }).map((_, indexColumnData) => {
                              return (
                                <tr key={indexColumnData}>
                                  <td className={styles.columnDataContent}>
                                    {point.data?.[0]?.[indexColumnData] ? (
                                      <div className={`${styles.columnData}`} key={indexColumnData}>
                                        <div
                                          className={styles.columnDataValue}
                                          contentEditable
                                          suppressContentEditableWarning={true}
                                          onKeyDown={handleKeyDownData}
                                          onPaste={handleOnPasteData}
                                          onInput={(e) => {
                                            debouncedHandleEditData({
                                              value: e.target.innerText,
                                              entry,
                                              entryIndex,
                                              calibrationPointIndex: pointIndex,
                                              dataColumnIndex: 0,
                                              dataIndex: indexColumnData,
                                            });
                                          }}
                                        >
                                          {point.data?.[0]?.[indexColumnData]}
                                        </div>
                                        <div
                                          contentEditable={false}
                                          className={styles.columnDataClose}
                                          onClick={() => {
                                            handleRemoveData({
                                              entry,
                                              entryIndex,
                                              calibrationPointIndex: pointIndex,
                                              dataColumnIndex: 0,
                                              dataIndex: indexColumnData,
                                            });
                                          }}
                                        >
                                          X
                                        </div>
                                      </div>
                                    ) : (
                                      <div
                                        className={`${styles.columnData}`}
                                        key={indexColumnData}
                                        style={{ borderColor: 'transparent' }}
                                      >
                                        &nbsp;
                                      </div>
                                    )}
                                  </td>
                                  <td className={styles.columnDataContent}>
                                    {point.data?.[1]?.[indexColumnData] ? (
                                      <div className={`${styles.columnData}`} key={indexColumnData}>
                                        <div
                                          className={styles.columnDataValue}
                                          contentEditable
                                          suppressContentEditableWarning={true}
                                          onKeyDown={handleKeyDownData}
                                          onInput={(e) => {
                                            debouncedHandleEditData({
                                              value: e.target.innerText,
                                              entry,
                                              entryIndex,
                                              calibrationPointIndex: pointIndex,
                                              dataColumnIndex: 1,
                                              dataIndex: indexColumnData,
                                            });
                                          }}
                                        >
                                          {point.data?.[1]?.[indexColumnData]}
                                        </div>
                                        <div
                                          contentEditable={false}
                                          className={styles.columnDataClose}
                                          onClick={() => {
                                            handleRemoveData({
                                              entry,
                                              entryIndex,
                                              calibrationPointIndex: pointIndex,
                                              dataColumnIndex: 1,
                                              dataIndex: indexColumnData,
                                            });
                                          }}
                                        >
                                          X
                                        </div>
                                      </div>
                                    ) : (
                                      <div
                                        className={`${styles.columnData}`}
                                        key={indexColumnData}
                                        style={{ borderColor: 'transparent' }}
                                      >
                                        &nbsp;
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}

                            {maximumDataLength === 0 && (
                              <tr>
                                <td>&nbsp;</td>
                                <td>&nbsp;</td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            {Array.from({ length: 3 }).map((_, measuredValueIndex) => (
              <tr key={measuredValueIndex}>
                {measuredValueIndex === 0 && (
                  <th rowSpan={3} className='align-middle'>
                    Measured Value
                  </th>
                )}
                {NOMINAL_VALUE.slice(0, 6).map((_, pointIndex) => (
                  <th key={`${pointIndex}-measured-value`} className='align-middle'>
                    <Controller
                      name={`data.measuredValues.${pointIndex}.${measuredValueIndex}`}
                      control={form.control}
                      render={({ field }) => (
                        <Form.Control
                          onChange={(e) => {
                            form.setValue(
                              `data.measuredValues.${pointIndex}.${measuredValueIndex}`,
                              isNaN(e.target.value) ? 0 : parseFloat(e.target.value)
                            );
                          }}
                          name={field.name}
                          ref={field.ref}
                          value={field.value}
                          className={`${styles.columnData} text-center`}
                          type='number'
                        />
                      )}
                    />
                  </th>
                ))}
              </tr>
            ))}
          </tfoot>
        </Table>
      </div>

      {calibrationPointNo && calibrationPointNo > 6 && (
        <>
          <hr className='my-4 border border-primary border-3' />

          <div className='mx-0 border border-primary rounded overflow-hidden'>
            <Table className='text-center align-middle' bordered responsive>
              <thead>
                <tr>
                  <th colSpan={7}>Departure From Nominal Value (g)</th>
                </tr>

                <tr>
                  <th>Inspection Point</th>
                  {NOMINAL_VALUE.slice(6, calibrationPointNo).map((_, i) => (
                    <th key={i}>A{i + 7}</th>
                  ))}
                </tr>

                <tr>
                  <th>Nominal Value</th>

                  {NOMINAL_VALUE.slice(6, calibrationPointNo).map((value, i) => {
                    const nominalValueIndex = i + 6;

                    return (
                      <th key={i}>
                        <Form>
                          <Controller
                            name={`data.nominalValues.${nominalValueIndex}`}
                            control={form.control}
                            render={({ field }) => (
                              <Form.Control
                                onChange={(e) => {
                                  form.setValue(
                                    `data.nominalValues.${nominalValueIndex}`,
                                    isNaN(e.target.value) ? 0 : parseFloat(e.target.value)
                                  );
                                }}
                                name={field.name}
                                ref={field.ref}
                                value={field.value}
                                className={`${styles.columnData} text-center`}
                                type='number'
                              />
                            )}
                          />
                        </Form>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {fields.map((entry, entryIndex) => {
                  const calibrationPoints = entry.calibrationPoints.slice(6, calibrationPointNo);

                  //* maximum length of the element of point.data
                  const maximumDataLength = max(
                    calibrationPoints?.length > 0
                      ? calibrationPoints.map((point) => {
                          return max(point.data.map((data) => data.length));
                        })
                      : 0
                  );

                  return (
                    <tr key={entryIndex}>
                      <td className={`${styles.columnEquipment} align-top`}>
                        <div>{`${entry.description} - ${entry.tagId}`}</div>

                        <div className='mt-3'>
                          <Form
                            onKeyDown={(e) =>
                              idsInputOnKeyDown({
                                event: e,
                                entry,
                                entryIndex,
                                key: `data.dfnv.${entryIndex}.idValue`,
                              })
                            }
                          >
                            <Controller
                              name={`data.dfnv.${entryIndex}.idValue`}
                              control={form.control}
                              render={({ field }) => (
                                <>
                                  <Form.Control
                                    onChange={(e) => {
                                      const key = `data.dfnv.${entryIndex}.idValue`;
                                      form.setValue(key, e.target.value);
                                    }}
                                    name={field.name}
                                    ref={field.ref}
                                    value={field.value}
                                    className={`${styles.columnData} text-center`}
                                    type='text'
                                  />

                                  {formErrors &&
                                    formErrors?.data?.content?.[entryIndex]?.ids?.message && (
                                      <Form.Text className='text-danger'>
                                        {formErrors?.data?.content?.[entryIndex]?.ids?.message}
                                      </Form.Text>
                                    )}
                                </>
                              )}
                            />
                          </Form>
                        </div>

                        <div
                          className='mt-2 d-inline-flex flex-wrap gap-1 justify-content-center'
                          style={{ maxWidth: '90%' }}
                        >
                          {entry?.ids?.length > 0 &&
                            entry?.ids?.map((id, idIndex) => (
                              <div className={`${styles.columnData}`} key={`${id}-${idIndex}`}>
                                <div
                                  className={styles.columnDataValue}
                                  contentEditable
                                  suppressContentEditableWarning={true}
                                  onInput={(e) => {
                                    debouncedHandleEditId({
                                      value: e.target.innerText,
                                      entry,
                                      entryIndex,
                                      idIndex,
                                    });
                                  }}
                                >
                                  {id}
                                </div>
                                <div
                                  contentEditable={false}
                                  className={styles.columnDataClose}
                                  onClick={() => {
                                    handleRemoveIds({
                                      entry,
                                      entryIndex,
                                      idIndex,
                                    });
                                  }}
                                >
                                  X
                                </div>
                              </div>
                            ))}
                        </div>
                      </td>

                      {calibrationPoints.map((point, pointIndex) => {
                        const _pointIndex = pointIndex + 6;

                        return (
                          <td className='p-0 align-top'>
                            <Table responsive>
                              <tr>
                                <th className={styles.dataColumnHeader}>E2</th>
                                <th className={styles.dataColumnHeader}>ST-MW</th>
                              </tr>
                              <tbody>
                                <tr key={`${entryIndex}-${_pointIndex}-e2`}>
                                  <td>
                                    <Form
                                      onKeyDown={(e) =>
                                        dataInputOnKeyDown({
                                          event: e,
                                          key: `data.dfnv.${entryIndex}.calibrationPoints.${_pointIndex}.e2`,
                                          entry,
                                          entryIndex,
                                          calibrationPointIndex: _pointIndex,
                                          dataColumnIndex: 0,
                                        })
                                      }
                                    >
                                      <Controller
                                        name={`data.dfnv.${entryIndex}.calibrationPoints.${_pointIndex}.e2`}
                                        control={form.control}
                                        render={({ field }) => (
                                          <Form.Control
                                            onChange={(e) => {
                                              const key = `data.dfnv.${entryIndex}.calibrationPoints.${_pointIndex}.e2`;
                                              form.setValue(key, e.target.value);
                                            }}
                                            name={field.name}
                                            ref={field.ref}
                                            value={field.value}
                                            className={`${styles.columnData} text-center`}
                                            type='number'
                                          />
                                        )}
                                      />
                                    </Form>
                                  </td>

                                  <td>
                                    <Form
                                      onKeyDown={(e) =>
                                        dataInputOnKeyDown({
                                          event: e,
                                          key: `data.dfnv.${entryIndex}.calibrationPoints.${_pointIndex}.st-mw`,
                                          entry,
                                          entryIndex,
                                          calibrationPointIndex: _pointIndex,
                                          dataColumnIndex: 1,
                                        })
                                      }
                                    >
                                      <Controller
                                        name={`data.dfnv.${entryIndex}.calibrationPoints.${_pointIndex}.st-mw`}
                                        control={form.control}
                                        render={({ field }) => (
                                          <Form.Control
                                            onChange={(e) => {
                                              const key = `data.dfnv.${entryIndex}.calibrationPoints.${_pointIndex}.st-mw`;
                                              form.setValue(key, e.target.value);
                                            }}
                                            name={field.name}
                                            ref={field.ref}
                                            value={field.value}
                                            className={`${styles.columnData} text-center`}
                                            type='number'
                                          />
                                        )}
                                      />
                                    </Form>
                                  </td>
                                </tr>

                                {Array.from({ length: maximumDataLength }).map(
                                  (_, indexColumnData) => {
                                    return (
                                      <tr key={indexColumnData}>
                                        <td className={styles.columnDataContent}>
                                          {point.data?.[0]?.[indexColumnData] ? (
                                            <div
                                              className={`${styles.columnData}`}
                                              key={indexColumnData}
                                            >
                                              <div
                                                className={styles.columnDataValue}
                                                contentEditable
                                                suppressContentEditableWarning={true}
                                                onKeyDown={handleKeyDownData}
                                                onPaste={handleOnPasteData}
                                                onInput={(e) => {
                                                  debouncedHandleEditData({
                                                    value: e.target.innerText,
                                                    entry,
                                                    entryIndex,
                                                    calibrationPointIndex: _pointIndex,
                                                    dataColumnIndex: 0,
                                                    dataIndex: indexColumnData,
                                                  });
                                                }}
                                              >
                                                {point.data?.[0]?.[indexColumnData]}
                                              </div>
                                              <div
                                                contentEditable={false}
                                                className={styles.columnDataClose}
                                                onClick={() => {
                                                  handleRemoveData({
                                                    entry,
                                                    entryIndex,
                                                    calibrationPointIndex: _pointIndex,
                                                    dataColumnIndex: 0,
                                                    dataIndex: indexColumnData,
                                                  });
                                                }}
                                              >
                                                X
                                              </div>
                                            </div>
                                          ) : (
                                            <div
                                              className={`${styles.columnData}`}
                                              key={indexColumnData}
                                              style={{
                                                borderColor: 'transparent',
                                              }}
                                            >
                                              &nbsp;
                                            </div>
                                          )}
                                        </td>
                                        <td className={styles.columnDataContent}>
                                          {point.data?.[1]?.[indexColumnData] ? (
                                            <div
                                              className={`${styles.columnData}`}
                                              key={indexColumnData}
                                            >
                                              <div
                                                className={styles.columnDataValue}
                                                contentEditable
                                                suppressContentEditableWarning={true}
                                                onKeyDown={handleKeyDownData}
                                                onInput={(e) => {
                                                  debouncedHandleEditData({
                                                    value: e.target.innerText,
                                                    entry,
                                                    entryIndex,
                                                    calibrationPointIndex: _pointIndex,
                                                    dataColumnIndex: 1,
                                                    dataIndex: indexColumnData,
                                                  });
                                                }}
                                              >
                                                {point.data?.[1]?.[indexColumnData]}
                                              </div>
                                              <div
                                                contentEditable={false}
                                                className={styles.columnDataClose}
                                                onClick={() => {
                                                  handleRemoveData({
                                                    entry,
                                                    entryIndex,
                                                    calibrationPointIndex: _pointIndex,
                                                    dataColumnIndex: 1,
                                                    dataIndex: indexColumnData,
                                                  });
                                                }}
                                              >
                                                X
                                              </div>
                                            </div>
                                          ) : (
                                            <div
                                              className={`${styles.columnData}`}
                                              key={indexColumnData}
                                              style={{
                                                borderColor: 'transparent',
                                              }}
                                            >
                                              &nbsp;
                                            </div>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  }
                                )}

                                {maximumDataLength === 0 && (
                                  <tr>
                                    <td>&nbsp;</td>
                                    <td>&nbsp;</td>
                                  </tr>
                                )}
                              </tbody>
                            </Table>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>

              <tfoot>
                {Array.from({ length: 3 }).map((_, measuredValueIndex) => (
                  <tr key={measuredValueIndex}>
                    {measuredValueIndex === 0 && (
                      <th rowSpan={3} className='align-middle'>
                        Measured Value
                      </th>
                    )}
                    {NOMINAL_VALUE.slice(6, calibrationPointNo).map((_, pointIndex) => {
                      const _pointIndex = pointIndex + 6;

                      return (
                        <th key={`${_pointIndex}-measured-value`} className='align-middle'>
                          <Controller
                            name={`data.measuredValues.${_pointIndex}.${measuredValueIndex}`}
                            control={form.control}
                            render={({ field }) => (
                              <Form.Control
                                onChange={(e) => {
                                  form.setValue(
                                    `data.measuredValues.${_pointIndex}.${measuredValueIndex}`,
                                    isNaN(e.target.value) ? 0 : parseFloat(e.target.value)
                                  );
                                }}
                                name={field.name}
                                ref={field.ref}
                                value={field.value}
                                className={`${styles.columnData} text-center`}
                                type='number'
                              />
                            )}
                          />
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </tfoot>
            </Table>
          </div>
        </>
      )}
    </>
  );
};

export default DFNVTest;
