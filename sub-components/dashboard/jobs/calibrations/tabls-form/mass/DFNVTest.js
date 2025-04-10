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

  const slotsFields = useMemo(() => {
    return [
      { placeholder: 'Enter E2 Tag IDs' },
      { placeholder: 'Enter F1 Tag IDs' },
      { placeholder: 'Enter F1 Tag IDs' },
    ];
  }, []);

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

  const handleValueOnChange = ({ value, entry, calibrationPointIndex, dataColumnIndex, key }) => {
    //* allow only number, dot, and asterisk
    if (/[^0-9.*]/.test(value)) return;

    //* check if value is already exist
    const existingDataArray = entry.calibrationPoints[calibrationPointIndex].data[dataColumnIndex]; //prettier-ignore

    if (existingDataArray?.includes(value)) form.setError(key, { message: 'Duplicate value' });
    else form.clearErrors(key);

    form.setValue(key, value);
  };

  const handleIdValueSubmit = ({ value, entry, entryIndex, key, slotIndex }) => {
    const existingIdsArray = entry.ids?.[slotIndex];

    if (!existingIdsArray) return;

    const newValue = [...existingIdsArray, value];

    //* update ids
    entry.ids[slotIndex] = newValue;

    //* update field
    update(entryIndex, entry);

    //* reset
    form.setValue(key, '');

    //* clear errors
    form.clearErrors(`data.dfnv.${entryIndex}.${slotIndex}.ids`);
  };

  const handleEditData = useCallback(
    ({ value, entry, entryIndex, calibrationPointIndex, dataColumnIndex, dataIndex, key }) => {
      //* allow only number, dot, and asterisk
      if (/[^0-9.*]/.test(value)) {
        form.setError(key, { message: 'Invalid value' });
        return;
      }

      const existingDataArray = entry.calibrationPoints[calibrationPointIndex].data[dataColumnIndex]; //prettier-ignore

      console.log({
        x: existingDataArray?.map((item, index) => (item === value ? index : null)),
        condition:
          existingDataArray.filter((item, index) => item === value && index === dataIndex).length >
          (0).length,
        value,
      });

      //* remove data from array
      existingDataArray.splice(dataIndex, 1, value);
      //* update data
      entry.calibrationPoints[calibrationPointIndex].data[dataColumnIndex] = existingDataArray; //prettier-ignore
      //* update field
      update(entryIndex, entry);

      //* check if value is already exist
      if (
        value &&
        existingDataArray?.length > 0 &&
        existingDataArray?.includes(value) &&
        existingDataArray.filter((item, index) => item === value && index !== dataIndex).length > 0
      ) {
        form.setError(key, { message: 'Duplicate value' });
      } else form.clearErrors(key);
    },
    [JSON.stringify(fields)]
  );

  const handleEditId = ({ value, entry, entryIndex, idIndex, slotIndex }) => {
    const existingIdsArray = entry.ids?.[slotIndex];

    if (!existingIdsArray) return;

    //* remove data from array
    existingIdsArray.splice(idIndex, 1, value);
    //* update data
    entry.ids[slotIndex] = existingIdsArray;
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
    key,
  }) => {
    const existingDataArray = entry.calibrationPoints[calibrationPointIndex].data[dataColumnIndex]; //prettier-ignore

    //* remove data from array
    existingDataArray.splice(dataIndex, 1);
    //* update data
    entry.calibrationPoints[calibrationPointIndex].data[dataColumnIndex] = existingDataArray; //prettier-ignore
    //* update field
    update(entryIndex, entry);
    //* clear errors
    form.clearErrors(key);
  };

  const handleRemoveIds = ({ entry, entryIndex, idIndex, slotIndex }) => {
    const existingIdsArray = entry.ids?.[slotIndex];

    if (!existingIdsArray) return;

    //* remove data from array
    existingIdsArray.splice(idIndex, 1);
    //* update data
    entry.ids[slotIndex] = existingIdsArray;
    //* update field
    update(entryIndex, entry);
  };

  const handleOnPasteData = (e) => {
    const pastedText = event.clipboardData.getData('text');
    if (!/[0-9.*]/.test(pastedText)) e.preventDefault();
  };

  const handleKeyDownData = (e) => {
    //*Allow: Numbers (0-9), Backspace, Arrow keys, Delete, Enter, and Tab.
    if (
      !/[0-9.*]/.test(e.key) &&
      !['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(e.key)
    ) {
      //* Allow Ctrl + A (Select All). Ctrl + C (Copy). Ctrl + V (Paste),
      if (
        (e.ctrlKey && e.key.toLowerCase() === 'a') ||
        (e.ctrlKey && e.key.toLowerCase() === 'c') | (e.ctrlKey && e.key.toLowerCase() === 'v')
      ) {
        return;
      }

      e.preventDefault(); //* Block keypress
    }
  };

  const dataInputOnKeyDown = useCallback(
    ({ event, key, entry, entryIndex, calibrationPointIndex, dataColumnIndex }) => {
      const value = form.getValues(key);

      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();

        if (value) {
          //* check if value is already exist
          const existingDataArray = entry.calibrationPoints[calibrationPointIndex].data[dataColumnIndex]; //prettier-ignore

          if (existingDataArray?.includes(value)) {
            form.setError(key, { message: 'Duplicate value' });
            return;
          }

          handleValueSubmit({
            value,
            entry,
            entryIndex,
            calibrationPointIndex,
            dataColumnIndex,
            key,
          });
        }
      }
    },
    [form.watch('data.dfnv')]
  );

  const idsInputOnKeyDown = useCallback(
    ({ event, entry, entryIndex, key, slotIndex }) => {
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
            slotIndex,
          });
        }
      }
    },
    [form.watch('data.dfnv')]
  );

  const putCursorAtEnd = (target) => {
    //* ensure the cursor is at the end value

    //* Create a new range
    const range = document.createRange();
    //* Create a new selection
    const selection = window.getSelection();

    //* Select the last child node (text node) and set the cursor at the end
    range.selectNodeContents(target);
    range.collapse(false); //* false collapses to the end

    //* Clear any existing selection and add the new range
    selection.removeAllRanges();
    selection.addRange(range);
  };

  //* set iniitial DFNV data
  useEffect(() => {
    //* if data exist and calibration point no is same as data's dont dont something, else set initial data
    if (data && parseFloat(data.calibrationPointNo) === calibrationPointNo) return;

    if (!isMounted.current && calibrationPointNo) {
      isMounted.current = true;

      const initialDFNV = [
        {
          ids: [[], [], []],
          calibrationPoints: Array.from({ length: calibrationPointNo }, (_, i) => ({
            data: [[], [], [], []],
          })),
        },
      ];

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
  }, [data, calibrationPointNo]);

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

              //* maximum length of the element of point.data first 2 elements of data
              const maximumDataLengthRow1 = max(
                calibrationPoints?.length > 0
                  ? calibrationPoints.map((point) => {
                      return max(point.data.slice(0, 2).map((data) => data.length));
                    })
                  : 0
              );

              //* maximum length of the element of point.data first 2 elements of data
              const maximumDataLengthRow2 = max(
                calibrationPoints?.length > 0
                  ? calibrationPoints.map((point) => {
                      return max(point.data.slice(2, 4).map((data) => data.length));
                    })
                  : 0
              );

              return (
                <tr key={entryIndex}>
                  <td className={`${styles.columnEquipment} align-top`}>
                    <div>Weight(s) Used</div>

                    <div className='mt-3 d-flex flex-column row-gap-3'>
                      {slotsFields.map((slotField, slotIndex) => (
                        <div>
                          <div>
                            <Form
                              onKeyDown={(e) =>
                                idsInputOnKeyDown({
                                  event: e,
                                  entry,
                                  entryIndex,
                                  key: `data.dfnv.${entryIndex}.${slotIndex}.idValue`,
                                  slotIndex,
                                })
                              }
                            >
                              <Controller
                                name={`data.dfnv.${entryIndex}.${slotIndex}.idValue`}
                                control={form.control}
                                render={({ field }) => (
                                  <>
                                    <Form.Control
                                      onChange={(e) => {
                                        const key = `data.dfnv.${entryIndex}.${slotIndex}.idValue`;
                                        form.setValue(key, e.target.value);
                                      }}
                                      name={field.name}
                                      ref={field.ref}
                                      value={field.value}
                                      className={`${styles.columnData} text-center`}
                                      placeholder={slotField.placeholder}
                                      type='text'
                                    />

                                    {formErrors &&
                                      formErrors?.data?.dfnv?.[entryIndex]?.ids?.[slotIndex]
                                        ?.message && (
                                        <Form.Text className='text-danger'>
                                          {
                                            formErrors?.data?.dfnv?.[entryIndex]?.ids?.[slotIndex]
                                              ?.message
                                          }
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
                            {entry?.ids?.[slotIndex]?.length > 0 &&
                              entry?.ids?.[slotIndex]?.map((id, idIndex) => (
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
                                        slotIndex,
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
                                        slotIndex,
                                      });
                                    }}
                                  >
                                    X
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>

                  {calibrationPoints.map((point, pointIndex) => {
                    return (
                      <td className='p-0 align-top'>
                        <Table responsive className='mb-0' style={{ borderCollapse: 'collapse' }}>
                          <tr>
                            <th className='border-top-0'>E2</th>
                            <th className='border-start border-top-0'>ST-MW</th>
                          </tr>
                          <tbody>
                            <tr key={`${entryIndex}-${pointIndex}-row-e2-st-mw`}>
                              <td className='align-top'>
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
                                          handleValueOnChange({
                                            value: e.target.value,
                                            entry,
                                            calibrationPointIndex: pointIndex,
                                            dataColumnIndex: 0,
                                            key: `data.dfnv.${entryIndex}.calibrationPoints.${pointIndex}.e2`,
                                          });
                                        }}
                                        name={field.name}
                                        ref={field.ref}
                                        value={field.value}
                                        className={`${styles.columnData} text-center`}
                                        type='text'
                                      />
                                    )}
                                  />
                                </Form>

                                {formErrors &&
                                  formErrors?.data?.dfnv?.[entryIndex]?.calibrationPoints?.[
                                    pointIndex
                                  ]?.e2?.message && (
                                    <Form.Text className='text-danger' style={{ fontSize: 10.2 }}>
                                      {
                                        formErrors?.data?.dfnv?.[entryIndex]?.calibrationPoints?.[
                                          pointIndex
                                        ]?.e2?.message
                                      }
                                    </Form.Text>
                                  )}
                              </td>

                              <td className='border-start align-top'>
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
                                          handleValueOnChange({
                                            value: e.target.value,
                                            entry,
                                            calibrationPointIndex: pointIndex,
                                            dataColumnIndex: 1,
                                            key: `data.dfnv.${entryIndex}.calibrationPoints.${pointIndex}.st-mw`,
                                          });
                                        }}
                                        name={field.name}
                                        ref={field.ref}
                                        value={field.value}
                                        className={`${styles.columnData} text-center`}
                                        type='text'
                                      />
                                    )}
                                  />
                                </Form>

                                {formErrors &&
                                  formErrors?.data?.dfnv?.[entryIndex]?.calibrationPoints?.[
                                    pointIndex
                                  ]?.['st-mw']?.message && (
                                    <Form.Text className='text-danger' style={{ fontSize: 10.2 }}>
                                      {
                                        formErrors?.data?.dfnv?.[entryIndex]?.calibrationPoints?.[
                                          pointIndex
                                        ]?.['st-mw']?.message
                                      }
                                    </Form.Text>
                                  )}
                              </td>
                            </tr>

                            {Array.from({ length: maximumDataLengthRow1 }).map(
                              (_, indexColumnData) => {
                                return (
                                  <tr key={indexColumnData}>
                                    <td className={`${styles.columnDataContent} align-top`}>
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
                                                calibrationPointIndex: pointIndex,
                                                dataColumnIndex: 0,
                                                dataIndex: indexColumnData,
                                                key: `data.dfnv.${entryIndex}.calibrationPoints.${pointIndex}.${0}.${indexColumnData}`,
                                              });

                                              putCursorAtEnd(e.target);
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
                                                key: `data.dfnv.${entryIndex}.calibrationPoints.${pointIndex}.${0}.${indexColumnData}`,
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

                                      {formErrors &&
                                        formErrors?.data?.dfnv?.[entryIndex]?.calibrationPoints?.[
                                          pointIndex
                                        ]?.[0]?.[indexColumnData]?.message && (
                                          <Form.Text
                                            className='text-danger'
                                            style={{ fontSize: 10.2 }}
                                            contentEditable={false}
                                          >
                                            {
                                              formErrors?.data?.dfnv?.[entryIndex]
                                                ?.calibrationPoints?.[pointIndex]?.[0]?.[
                                                indexColumnData
                                              ]?.message
                                            }
                                          </Form.Text>
                                        )}
                                    </td>

                                    <td
                                      className={`${styles.columnDataContent} border-start align-top`}
                                    >
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
                                                calibrationPointIndex: pointIndex,
                                                dataColumnIndex: 1,
                                                dataIndex: indexColumnData,
                                                key: `data.dfnv.${entryIndex}.calibrationPoints.${pointIndex}.${1}.${indexColumnData}`,
                                              });

                                              putCursorAtEnd(e.target);
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
                                                key: `data.dfnv.${entryIndex}.calibrationPoints.${pointIndex}.${1}.${indexColumnData}`,
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

                                      {formErrors &&
                                        formErrors?.data?.dfnv?.[entryIndex]?.calibrationPoints?.[
                                          pointIndex
                                        ]?.[1]?.[indexColumnData]?.message && (
                                          <Form.Text
                                            className='text-danger'
                                            style={{ fontSize: 10.2 }}
                                            contentEditable={false}
                                          >
                                            {
                                              formErrors?.data?.dfnv?.[entryIndex]
                                                ?.calibrationPoints?.[pointIndex]?.[1]?.[
                                                indexColumnData
                                              ]?.message
                                            }
                                          </Form.Text>
                                        )}
                                    </td>
                                  </tr>
                                );
                              }
                            )}

                            {maximumDataLengthRow1 === 0 && (
                              <tr>
                                <td className='border-bottom'>&nbsp;</td>
                                <td className='border-start border-bottom'>&nbsp;</td>
                              </tr>
                            )}

                            <tr>
                              <th className='border-top'>F1</th>
                              <th className='border-top border-start'>F1</th>
                            </tr>

                            <tr key={`${entryIndex}-${pointIndex}-row-f1-f1`}>
                              <td className='align-top'>
                                <Form
                                  onKeyDown={(e) =>
                                    dataInputOnKeyDown({
                                      event: e,
                                      key: `data.dfnv.${entryIndex}.calibrationPoints.${pointIndex}.1f1`,
                                      entry,
                                      entryIndex,
                                      calibrationPointIndex: pointIndex,
                                      dataColumnIndex: 2,
                                    })
                                  }
                                >
                                  <Controller
                                    name={`data.dfnv.${entryIndex}.calibrationPoints.${pointIndex}.1f1`}
                                    control={form.control}
                                    render={({ field }) => (
                                      <Form.Control
                                        onChange={(e) => {
                                          handleValueOnChange({
                                            value: e.target.value,
                                            entry,
                                            calibrationPointIndex: pointIndex,
                                            dataColumnIndex: 2,
                                            key: `data.dfnv.${entryIndex}.calibrationPoints.${pointIndex}.1f1`,
                                          });
                                        }}
                                        name={field.name}
                                        ref={field.ref}
                                        value={field.value}
                                        className={`${styles.columnData} text-center`}
                                        type='text'
                                      />
                                    )}
                                  />
                                </Form>

                                {formErrors &&
                                  formErrors?.data?.dfnv?.[entryIndex]?.calibrationPoints?.[
                                    pointIndex
                                  ]?.['1f1']?.message && (
                                    <Form.Text className='text-danger' style={{ fontSize: 10.2 }}>
                                      {
                                        formErrors?.data?.dfnv?.[entryIndex]?.calibrationPoints?.[
                                          pointIndex
                                        ]?.['1f1']?.message
                                      }
                                    </Form.Text>
                                  )}
                              </td>

                              <td className='border-start align-top'>
                                <Form
                                  onKeyDown={(e) =>
                                    dataInputOnKeyDown({
                                      event: e,
                                      key: `data.dfnv.${entryIndex}.calibrationPoints.${pointIndex}.2f1`,
                                      entry,
                                      entryIndex,
                                      calibrationPointIndex: pointIndex,
                                      dataColumnIndex: 3,
                                    })
                                  }
                                >
                                  <Controller
                                    name={`data.dfnv.${entryIndex}.calibrationPoints.${pointIndex}.2f1`}
                                    control={form.control}
                                    render={({ field }) => (
                                      <Form.Control
                                        onChange={(e) => {
                                          handleValueOnChange({
                                            value: e.target.value,
                                            entry,
                                            calibrationPointIndex: pointIndex,
                                            dataColumnIndex: 3,
                                            key: `data.dfnv.${entryIndex}.calibrationPoints.${pointIndex}.2f1`,
                                          });
                                        }}
                                        name={field.name}
                                        ref={field.ref}
                                        value={field.value}
                                        className={`${styles.columnData} text-center`}
                                        type='text'
                                      />
                                    )}
                                  />
                                </Form>

                                {formErrors &&
                                  formErrors?.data?.dfnv?.[entryIndex]?.calibrationPoints?.[
                                    pointIndex
                                  ]?.['2f1']?.message && (
                                    <Form.Text className='text-danger' style={{ fontSize: 10.2 }}>
                                      {
                                        formErrors?.data?.dfnv?.[entryIndex]?.calibrationPoints?.[
                                          pointIndex
                                        ]?.['2f1']?.message
                                      }
                                    </Form.Text>
                                  )}
                              </td>
                            </tr>

                            {maximumDataLengthRow2 === 0 && (
                              <tr>
                                <td className='border-bottom'>&nbsp;</td>
                                <td className='border-start border-bottom'>&nbsp;</td>
                              </tr>
                            )}

                            {Array.from({ length: maximumDataLengthRow2 }).map(
                              (_, indexColumnData) => {
                                return (
                                  <tr key={indexColumnData}>
                                    <td className={`${styles.columnDataContent} align-top`}>
                                      {point.data?.[2]?.[indexColumnData] ? (
                                        <div
                                          className={`${styles.columnData}`}
                                          key={indexColumnData}
                                        >
                                          <div
                                            tabIndex='0'
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
                                                dataColumnIndex: 2,
                                                dataIndex: indexColumnData,
                                                key: `data.dfnv.${entryIndex}.calibrationPoints.${pointIndex}.${2}.${indexColumnData}`,
                                              });

                                              putCursorAtEnd(e.target);
                                            }}
                                          >
                                            {point.data?.[2]?.[indexColumnData]}
                                          </div>
                                          <div
                                            contentEditable={false}
                                            className={styles.columnDataClose}
                                            onClick={() => {
                                              handleRemoveData({
                                                entry,
                                                entryIndex,
                                                calibrationPointIndex: pointIndex,
                                                dataColumnIndex: 2,
                                                dataIndex: indexColumnData,
                                                key: `data.dfnv.${entryIndex}.calibrationPoints.${pointIndex}.${2}.${indexColumnData}`,
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

                                      {formErrors &&
                                        formErrors?.data?.dfnv?.[entryIndex]?.calibrationPoints?.[
                                          pointIndex
                                        ]?.[2]?.[indexColumnData]?.message && (
                                          <Form.Text
                                            className='text-danger'
                                            style={{ fontSize: 10.2 }}
                                            contentEditable={false}
                                          >
                                            {
                                              formErrors?.data?.dfnv?.[entryIndex]
                                                ?.calibrationPoints?.[pointIndex]?.[2]?.[
                                                indexColumnData
                                              ]?.message
                                            }
                                          </Form.Text>
                                        )}
                                    </td>

                                    <td
                                      className={`${styles.columnDataContent} border-start align-top`}
                                    >
                                      {point.data?.[3]?.[indexColumnData] ? (
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
                                                calibrationPointIndex: pointIndex,
                                                dataColumnIndex: 3,
                                                dataIndex: indexColumnData,
                                                key: `data.dfnv.${entryIndex}.calibrationPoints.${pointIndex}.${3}.${indexColumnData}`,
                                              });

                                              putCursorAtEnd(e.target);
                                            }}
                                          >
                                            {point.data?.[3]?.[indexColumnData]}
                                          </div>
                                          <div
                                            contentEditable={false}
                                            className={styles.columnDataClose}
                                            onClick={() => {
                                              handleRemoveData({
                                                entry,
                                                entryIndex,
                                                calibrationPointIndex: pointIndex,
                                                dataColumnIndex: 3,
                                                dataIndex: indexColumnData,
                                                key: `data.dfnv.${entryIndex}.calibrationPoints.${pointIndex}.${3}.${indexColumnData}`,
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

                                      {formErrors &&
                                        formErrors?.data?.dfnv?.[entryIndex]?.calibrationPoints?.[
                                          pointIndex
                                        ]?.[3]?.[indexColumnData]?.message && (
                                          <Form.Text
                                            className='text-danger'
                                            style={{ fontSize: 10.2 }}
                                            contentEditable={false}
                                          >
                                            {
                                              formErrors?.data?.dfnv?.[entryIndex]
                                                ?.calibrationPoints?.[pointIndex]?.[3]?.[
                                                indexColumnData
                                              ]?.message
                                            }
                                          </Form.Text>
                                        )}
                                    </td>
                                  </tr>
                                );
                              }
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
                  const maximumDataLengthRow1 = max(
                    calibrationPoints?.length > 0
                      ? calibrationPoints.map((point) => {
                          return max(point.data.slice(0, 2).map((data) => data.length));
                        })
                      : 0
                  );

                  const maximumDataLengthRow2 = max(
                    calibrationPoints?.length > 0
                      ? calibrationPoints.map((point) => {
                          return max(point.data.slice(2, 4).map((data) => data.length));
                        })
                      : 0
                  );

                  return (
                    <tr key={entryIndex}>
                      <td className={`${styles.columnEquipment} align-top`}>
                        <div>Weight(s) Used</div>

                        <div className='mt-3 d-flex flex-column row-gap-3'>
                          {slotsFields.map((slotField, slotIndex) => (
                            <div>
                              <div>
                                <Form
                                  onKeyDown={(e) =>
                                    idsInputOnKeyDown({
                                      event: e,
                                      entry,
                                      entryIndex,
                                      key: `data.dfnv.${entryIndex}.${slotIndex}.idValue`,
                                      slotIndex,
                                    })
                                  }
                                >
                                  <Controller
                                    name={`data.dfnv.${entryIndex}.${slotIndex}.idValue`}
                                    control={form.control}
                                    render={({ field }) => (
                                      <>
                                        <Form.Control
                                          onChange={(e) => {
                                            const key = `data.dfnv.${entryIndex}.${slotIndex}.idValue`;
                                            form.setValue(key, e.target.value);
                                          }}
                                          name={field.name}
                                          ref={field.ref}
                                          value={field.value}
                                          className={`${styles.columnData} text-center`}
                                          placeholder={slotField.placeholder}
                                          type='text'
                                        />

                                        {formErrors &&
                                          formErrors?.data?.dfnv?.[entryIndex]?.ids?.[slotIndex]
                                            ?.message && (
                                            <Form.Text className='text-danger'>
                                              {
                                                formErrors?.data?.dfnv?.[entryIndex]?.ids?.[
                                                  slotIndex
                                                ]?.message
                                              }
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
                                {entry?.ids?.[slotIndex]?.length > 0 &&
                                  entry?.ids?.[slotIndex]?.map((id, idIndex) => (
                                    <div
                                      className={`${styles.columnData}`}
                                      key={`${id}-${idIndex}`}
                                    >
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
                                            slotIndex,
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
                                            slotIndex,
                                          });
                                        }}
                                      >
                                        X
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>

                      {calibrationPoints.map((point, pointIndex) => {
                        const _pointIndex = pointIndex + 6;

                        return (
                          <td className='p-0 align-top'>
                            <Table
                              responsive
                              className='mb-0'
                              style={{ borderCollapse: 'collapse' }}
                            >
                              <tr>
                                <th className='border-top-0'>E2</th>
                                <th className='border-start border-top-0'>ST-MW</th>
                              </tr>
                              <tbody>
                                <tr key={`${entryIndex}-${_pointIndex}-row-e2-st-mw`}>
                                  <td className='align-top'>
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
                                              handleValueOnChange({
                                                value: e.target.value,
                                                entry,
                                                calibrationPointIndex: _pointIndex,
                                                dataColumnIndex: 0,
                                                key: `data.dfnv.${entryIndex}.calibrationPoints.${_pointIndex}.e2`,
                                              });
                                            }}
                                            name={field.name}
                                            ref={field.ref}
                                            value={field.value}
                                            className={`${styles.columnData} text-center`}
                                            type='text'
                                          />
                                        )}
                                      />
                                    </Form>

                                    {formErrors &&
                                      formErrors?.data?.dfnv?.[entryIndex]?.calibrationPoints?.[
                                        _pointIndex
                                      ]?.e2?.message && (
                                        <Form.Text
                                          className='text-danger'
                                          style={{ fontSize: 10.2 }}
                                        >
                                          {
                                            formErrors?.data?.dfnv?.[entryIndex]
                                              ?.calibrationPoints?.[_pointIndex]?.e2?.message
                                          }
                                        </Form.Text>
                                      )}
                                  </td>

                                  <td className='border-start align-top'>
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
                                              handleValueOnChange({
                                                value: e.target.value,
                                                entry,
                                                calibrationPointIndex: _pointIndex,
                                                dataColumnIndex: 1,
                                                key: `data.dfnv.${entryIndex}.calibrationPoints.${_pointIndex}.st-mw`,
                                              });
                                            }}
                                            name={field.name}
                                            ref={field.ref}
                                            value={field.value}
                                            className={`${styles.columnData} text-center`}
                                            type='text'
                                          />
                                        )}
                                      />
                                    </Form>

                                    {formErrors &&
                                      formErrors?.data?.dfnv?.[entryIndex]?.calibrationPoints?.[
                                        _pointIndex
                                      ]?.['st-mw']?.message && (
                                        <Form.Text
                                          className='text-danger'
                                          style={{ fontSize: 10.2 }}
                                        >
                                          {
                                            formErrors?.data?.dfnv?.[entryIndex]
                                              ?.calibrationPoints?.[_pointIndex]?.['st-mw']?.message
                                          }
                                        </Form.Text>
                                      )}
                                  </td>
                                </tr>

                                {Array.from({ length: maximumDataLengthRow1 }).map(
                                  (_, indexColumnData) => {
                                    return (
                                      <tr key={indexColumnData}>
                                        <td className={`${styles.columnDataContent} align-top`}>
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
                                                    key: `data.dfnv.${entryIndex}.calibrationPoints.${_pointIndex}.${0}.${indexColumnData}`,
                                                  });

                                                  putCursorAtEnd(e.target);
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
                                                    key: `data.dfnv.${entryIndex}.calibrationPoints.${_pointIndex}.${0}.${indexColumnData}`,
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

                                          {formErrors &&
                                            formErrors?.data?.dfnv?.[entryIndex]
                                              ?.calibrationPoints?.[_pointIndex]?.[0]?.[
                                              indexColumnData
                                            ]?.message && (
                                              <Form.Text
                                                className='text-danger'
                                                style={{ fontSize: 10.2 }}
                                                contentEditable={false}
                                              >
                                                {
                                                  formErrors?.data?.dfnv?.[entryIndex]
                                                    ?.calibrationPoints?.[_pointIndex]?.[0]?.[
                                                    indexColumnData
                                                  ]?.message
                                                }
                                              </Form.Text>
                                            )}
                                        </td>

                                        <td
                                          className={`${styles.columnDataContent} border-start align-top`}
                                        >
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
                                                    key: `data.dfnv.${entryIndex}.calibrationPoints.${_pointIndex}.${1}.${indexColumnData}`,
                                                  });

                                                  putCursorAtEnd(e.target);
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
                                                    key: `data.dfnv.${entryIndex}.calibrationPoints.${_pointIndex}.${1}.${indexColumnData}`,
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

                                          {formErrors &&
                                            formErrors?.data?.dfnv?.[entryIndex]
                                              ?.calibrationPoints?.[_pointIndex]?.[1]?.[
                                              indexColumnData
                                            ]?.message && (
                                              <Form.Text
                                                className='text-danger'
                                                style={{ fontSize: 10.2 }}
                                                contentEditable={false}
                                              >
                                                {
                                                  formErrors?.data?.dfnv?.[entryIndex]
                                                    ?.calibrationPoints?.[_pointIndex]?.[1]?.[
                                                    indexColumnData
                                                  ]?.message
                                                }
                                              </Form.Text>
                                            )}
                                        </td>
                                      </tr>
                                    );
                                  }
                                )}

                                {maximumDataLengthRow1 === 0 && (
                                  <tr>
                                    <td>&nbsp;</td>
                                    <td>&nbsp;</td>
                                  </tr>
                                )}

                                <tr>
                                  <th className='border-top'>F1</th>
                                  <th className='border-top border-start'>F1</th>
                                </tr>

                                <tr key={`${entryIndex}-${_pointIndex}-row-f1-f1`}>
                                  <td className='align-top'>
                                    <Form
                                      onKeyDown={(e) =>
                                        dataInputOnKeyDown({
                                          event: e,
                                          key: `data.dfnv.${entryIndex}.calibrationPoints.${_pointIndex}.1f1`,
                                          entry,
                                          entryIndex,
                                          calibrationPointIndex: _pointIndex,
                                          dataColumnIndex: 2,
                                        })
                                      }
                                    >
                                      <Controller
                                        name={`data.dfnv.${entryIndex}.calibrationPoints.${_pointIndex}.1f1`}
                                        control={form.control}
                                        render={({ field }) => (
                                          <Form.Control
                                            onChange={(e) => {
                                              handleValueOnChange({
                                                value: e.target.value,
                                                entry,
                                                calibrationPointIndex: _pointIndex,
                                                dataColumnIndex: 2,
                                                key: `data.dfnv.${entryIndex}.calibrationPoints.${_pointIndex}.1f1`,
                                              });
                                            }}
                                            name={field.name}
                                            ref={field.ref}
                                            value={field.value}
                                            className={`${styles.columnData} text-center`}
                                            type='text'
                                          />
                                        )}
                                      />
                                    </Form>

                                    {formErrors &&
                                      formErrors?.data?.dfnv?.[entryIndex]?.calibrationPoints?.[
                                        _pointIndex
                                      ]?.['1f1']?.message && (
                                        <Form.Text
                                          className='text-danger'
                                          style={{ fontSize: 10.2 }}
                                        >
                                          {
                                            formErrors?.data?.dfnv?.[entryIndex]
                                              ?.calibrationPoints?.[_pointIndex]?.['1f1']?.message
                                          }
                                        </Form.Text>
                                      )}
                                  </td>

                                  <td className='border-start align-top'>
                                    <Form
                                      onKeyDown={(e) =>
                                        dataInputOnKeyDown({
                                          event: e,
                                          key: `data.dfnv.${entryIndex}.calibrationPoints.${_pointIndex}.2f1`,
                                          entry,
                                          entryIndex,
                                          calibrationPointIndex: _pointIndex,
                                          dataColumnIndex: 3,
                                        })
                                      }
                                    >
                                      <Controller
                                        name={`data.dfnv.${entryIndex}.calibrationPoints.${_pointIndex}.2f1`}
                                        control={form.control}
                                        render={({ field }) => (
                                          <Form.Control
                                            onChange={(e) => {
                                              handleValueOnChange({
                                                value: e.target.value,
                                                entry,
                                                calibrationPointIndex: _pointIndex,
                                                dataColumnIndex: 3,
                                                key: `data.dfnv.${entryIndex}.calibrationPoints.${_pointIndex}.2f1`,
                                              });
                                            }}
                                            name={field.name}
                                            ref={field.ref}
                                            value={field.value}
                                            className={`${styles.columnData} text-center`}
                                            type='text'
                                          />
                                        )}
                                      />
                                    </Form>

                                    {formErrors &&
                                      formErrors?.data?.dfnv?.[entryIndex]?.calibrationPoints?.[
                                        _pointIndex
                                      ]?.['2f1']?.message && (
                                        <Form.Text
                                          className='text-danger'
                                          style={{ fontSize: 10.2 }}
                                        >
                                          {
                                            formErrors?.data?.dfnv?.[entryIndex]
                                              ?.calibrationPoints?.[_pointIndex]?.['2f1']?.message
                                          }
                                        </Form.Text>
                                      )}
                                  </td>
                                </tr>

                                {maximumDataLengthRow2 === 0 && (
                                  <tr>
                                    <td>&nbsp;</td>
                                    <td>&nbsp;</td>
                                  </tr>
                                )}

                                {Array.from({ length: maximumDataLengthRow2 }).map(
                                  (_, indexColumnData) => {
                                    return (
                                      <tr key={indexColumnData}>
                                        <td className={`${styles.columnDataContent} align-top`}>
                                          {point.data?.[2]?.[indexColumnData] ? (
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
                                                    dataColumnIndex: 2,
                                                    dataIndex: indexColumnData,
                                                    key: `data.dfnv.${entryIndex}.calibrationPoints.${_pointIndex}.${2}.${indexColumnData}`,
                                                  });

                                                  putCursorAtEnd(e.target);
                                                }}
                                              >
                                                {point.data?.[2]?.[indexColumnData]}
                                              </div>
                                              <div
                                                contentEditable={false}
                                                className={styles.columnDataClose}
                                                onClick={() => {
                                                  handleRemoveData({
                                                    entry,
                                                    entryIndex,
                                                    calibrationPointIndex: _pointIndex,
                                                    dataColumnIndex: 2,
                                                    dataIndex: indexColumnData,
                                                    key: `data.dfnv.${entryIndex}.calibrationPoints.${_pointIndex}.${2}.${indexColumnData}`,
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

                                          {formErrors &&
                                            formErrors?.data?.dfnv?.[entryIndex]
                                              ?.calibrationPoints?.[_pointIndex]?.[2]?.[
                                              indexColumnData
                                            ]?.message && (
                                              <Form.Text
                                                className='text-danger'
                                                style={{ fontSize: 10.2 }}
                                                contentEditable={false}
                                              >
                                                {
                                                  formErrors?.data?.dfnv?.[entryIndex]
                                                    ?.calibrationPoints?.[_pointIndex]?.[2]?.[
                                                    indexColumnData
                                                  ]?.message
                                                }
                                              </Form.Text>
                                            )}
                                        </td>

                                        <td
                                          className={`${styles.columnDataContent} border-start align-top`}
                                        >
                                          {point.data?.[3]?.[indexColumnData] ? (
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
                                                    dataColumnIndex: 3,
                                                    dataIndex: indexColumnData,
                                                    key: `data.dfnv.${entryIndex}.calibrationPoints.${_pointIndex}.${3}.${indexColumnData}`,
                                                  });

                                                  putCursorAtEnd(e.target);
                                                }}
                                              >
                                                {point.data?.[3]?.[indexColumnData]}
                                              </div>
                                              <div
                                                contentEditable={false}
                                                className={styles.columnDataClose}
                                                onClick={() => {
                                                  handleRemoveData({
                                                    entry,
                                                    entryIndex,
                                                    calibrationPointIndex: _pointIndex,
                                                    dataColumnIndex: 3,
                                                    dataIndex: indexColumnData,
                                                    key: `data.dfnv.${entryIndex}.calibrationPoints.${_pointIndex}.${3}.${indexColumnData}`,
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

                                          {formErrors &&
                                            formErrors?.data?.dfnv?.[entryIndex]
                                              ?.calibrationPoints?.[_pointIndex]?.[3]?.[
                                              indexColumnData
                                            ]?.message && (
                                              <Form.Text
                                                className='text-danger'
                                                style={{ fontSize: 10.2 }}
                                                contentEditable={false}
                                              >
                                                {
                                                  formErrors?.data?.dfnv?.[entryIndex]
                                                    ?.calibrationPoints?.[_pointIndex]?.[3]?.[
                                                    indexColumnData
                                                  ]?.message
                                                }
                                              </Form.Text>
                                            )}
                                        </td>
                                      </tr>
                                    );
                                  }
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
