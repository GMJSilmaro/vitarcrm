import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Col,
  Form,
  InputGroup,
  Modal,
  OverlayTrigger,
  Row,
  Tooltip,
} from 'react-bootstrap';
import { ChevronLeft, ChevronRight, Eraser, Plus, X } from 'react-bootstrap-icons';
import styles from './DFNVTest.module.css';
import { Controller, FormProvider, useFieldArray, useForm, useFormContext } from 'react-hook-form';
import { NOMINAL_VALUE, testInputDataSchema } from '@/schema/calibration';
import { zodResolver } from '@hookform/resolvers/zod';

import { useDebouncedCallback } from 'use-debounce';
import Swal from 'sweetalert2';

const DFNTest = ({ data }) => {
  const isMounted = useRef(false);

  const [dfnvIndex, setDfnvIndex] = useState(0);
  const [modal, setModal] = useState({
    show: false,
    title: '',
    body: '',
    rowIndex: -1,
    calibrationPointIndex: -1,
    dataColumnIndex: -1,
    dataIndex: -1,
  });

  const form = useFormContext();

  const { fields, append, update, replace } = useFieldArray({
    name: 'dfnv',
    control: form.control,
  });

  const testInputForm = useForm({
    mode: 'onChange',
    defaultValues: { data: '' },
    resolver: zodResolver(testInputDataSchema),
  });

  const activeField = useMemo(() => fields[dfnvIndex], [dfnvIndex, fields]);

  const instruments = useMemo(() => {
    return form.getValues('instruments');
  }, [form.watch('instruments')]);

  const calibrationPointNo = useMemo(() => {
    const value = parseFloat(form.getValues('calibrationPointNo')?.value);
    return isNaN(value) ? undefined : value;
  }, [form.watch('calibrationPointNo')]);

  const handleNextDFNVIndex = () => {
    if (dfnvIndex < fields.length - 1) setDfnvIndex(dfnvIndex + 1);
  };

  const handlePreviousDFNVIndex = () => {
    if (dfnvIndex > 0) setDfnvIndex(dfnvIndex - 1);
  };

  const handleClose = () => {
    setModal({ show: false, title: '' });
    testInputForm.reset();
  };

  const handleShow = ({ title, body, rowIndex, calibrationPointIndex, dataColumnIndex }) => {
    setModal({ show: true, title, body, rowIndex, calibrationPointIndex, dataColumnIndex });
    testInputForm.setFocus('data');
  };

  const handleInputDataSubmit = useCallback(
    (formData) => {
      const currentActiveField = activeField;

      const existingDataArray = currentActiveField.calibrationPoints[modal.calibrationPointIndex].data[modal.dataColumnIndex]; //prettier-ignore
      const newValue = [...existingDataArray, formData.data];

      //* update data
      currentActiveField.calibrationPoints[modal.calibrationPointIndex].data[modal.dataColumnIndex] = newValue; //prettier-ignore

      //* update field
      update(modal.rowIndex, currentActiveField);

      //* reset  form & close modal
      testInputForm.reset();
      handleClose();
    },
    [modal, activeField]
  );

  const handleRemoveData = useCallback(
    ({ rowIndex, calibrationPointIndex, dataColumnIndex, dataIndex }) => {
      const currentActiveField = activeField;
      const existingDataArray = currentActiveField.calibrationPoints[calibrationPointIndex].data[dataColumnIndex]; //prettier-ignore

      //* remove data from array
      existingDataArray.splice(dataIndex, 1);
      //* update data
      currentActiveField.calibrationPoints[calibrationPointIndex].data[dataColumnIndex] = existingDataArray; //prettier-ignore
      //* update field
      update(rowIndex, currentActiveField);
    },
    [activeField]
  );

  const handleEditData = useCallback(
    ({ value, rowIndex, calibrationPointIndex, dataColumnIndex, dataIndex }) => {
      if (!value.match(/^\d+$/)) return;

      const currentActiveField = activeField;
      const existingDataArray = currentActiveField.calibrationPoints[calibrationPointIndex].data[dataColumnIndex]; //prettier-ignore

      //* remove data from array
      existingDataArray.splice(dataIndex, 1, Number(value));
      //* update data
      currentActiveField.calibrationPoints[calibrationPointIndex].data[dataColumnIndex] = existingDataArray; //prettier-ignore
      //* update field
      update(rowIndex, currentActiveField);
    },
    [activeField]
  );

  const debouncedHandleEditData = useDebouncedCallback(handleEditData, 500);

  const handleKeyDown = (e) => {
    //*Allow: Numbers (0-9), Backspace, Arrow keys, Delete, Enter, and Tab
    if (
      !/[0-9.]/.test(e.key) &&
      !['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(e.key)
    ) {
      //* Allow Ctrl + A (Select All)
      if (e.ctrlKey && e.key.toLowerCase() === 'a') return;

      e.preventDefault(); //* Block keypress
    }
  };

  const handleClearData = useCallback(
    ({ rowIndex, calibrationPointIndex, dataColumnIndex }) => {
      Swal.fire({
        title: 'Are you sure?',
        text: 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'btn btn-primary rounded',
          cancelButton: 'btn btn-secondary rounded',
        },
      }).then(async (data) => {
        if (data.isConfirmed) {
          const currentActiveField = activeField;
          const existingDataArray = currentActiveField.calibrationPoints[calibrationPointIndex].data[dataColumnIndex]; //prettier-ignore

          //TODO: Add confirmation modal

          //* clear data
          existingDataArray.splice(0, existingDataArray.length);
          //* update data
          currentActiveField.calibrationPoints[calibrationPointIndex].data[dataColumnIndex] = existingDataArray; //prettier-ignore
          //* update field
          update(rowIndex, currentActiveField);
        }
      });
    },
    [activeField]
  );

  //* set dfnv, if data exist
  useEffect(() => {
    if (data) {
      const dfnvWithResovedData = data.dfnv.map((entry) => {
        return {
          ...entry,
          calibrationPoints: entry.calibrationPoints.map((point) => {
            return {
              ...point,
              data: point.data.map((data) => JSON.parse(data)),
            };
          }),
        };
      });

      replace(dfnvWithResovedData);
    }
  }, [data, calibrationPointNo]);

  //* set iniitial DFNV data
  useEffect(() => {
    //* if data exist and calibration point no is same as data's dont dont something, else set initial data
    if (data && parseFloat(data.calibrationPointNo) === calibrationPointNo) return;

    if (instruments && instruments?.length > 0 && !isMounted.current && calibrationPointNo) {
      isMounted.current = true;

      const initialDFNV = instruments.map((equipment, i) => {
        return {
          tagId: equipment.tagId,
          equipmentId: equipment.id,
          description: equipment.description,
          calibrationPoints: Array.from({ length: calibrationPointNo }, (_, i) => ({
            nominalValue: NOMINAL_VALUE[i],
            data: [[], []],
          })),
        };
      });

      replace(initialDFNV);
    }

    return () => (isMounted.current = false);
  }, [instruments, data, calibrationPointNo]);

  return (
    <>
      {activeField && (
        <>
          <Row className='mx-0 d-flex flex-column rounded border border-primary border-primary'>
            {/* buttons prev & next */}
            <Col className='pt-3'>
              <div className='d-flex gap-2 justify-content-end align-content-center'>
                <Button
                  variant='primary'
                  className='p-2'
                  size='sm'
                  onClick={handlePreviousDFNVIndex}
                  disabled={dfnvIndex === 0}
                >
                  <ChevronLeft size={16} />
                </Button>

                <Button
                  variant='primary'
                  className='p-2'
                  size='sm'
                  onClick={handleNextDFNVIndex}
                  disabled={dfnvIndex === fields.length - 1}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </Col>

            {/* header */}
            <Col>
              <Row className='p-3 row-gap-2'>
                <Col
                  md={3}
                  className='d-flex justify-content-center justify-content-md-start align-items-center'
                >
                  <h5 className='mb-0 h-100 d-inline-block'>Intrument / Weight(s) Used</h5>
                </Col>
                <Col
                  md={9}
                  className='d-flex justify-content-center justify-content-md-start align-items-center'
                >
                  <h5 className='mb-0 mb-0 h-100 d-inline-block'>Inspection Point</h5>
                </Col>
              </Row>
            </Col>

            {/* list */}
            <Col>
              <Row className={`py-3 border-primary row-gap-2 border-top`}>
                <Col md={3}>
                  <InputGroup>
                    <InputGroup.Text className='px-2' style={{ color: '#1e40a6' }}>
                      #{dfnvIndex + 1}
                    </InputGroup.Text>
                    <Form.Control
                      as='textarea'
                      rows={2}
                      disabled
                      readOnly
                      value={`${activeField.description} - ${activeField.tagId}`}
                    />
                  </InputGroup>
                </Col>

                <Col md={9}>
                  <div className='px-4 py-3 bg-light h-100 rounded'>
                    {activeField.calibrationPoints.map((point, indexPoint) => (
                      <div
                        className={`d-flex flex-column border-primary pb-2 ${
                          indexPoint === activeField.calibrationPoints.length - 1
                            ? ''
                            : 'mb-2 border-bottom'
                        }`}
                        key={indexPoint}
                      >
                        <p className='mb-1 d-flex justify-content-between align-items-center'>
                          <div>
                            <span className='pe-1 fs-6'>#</span>
                            <strong className='text-capitalize'>A{indexPoint + 1}</strong>
                          </div>

                          <div className='d-flex gap-2 align-content-center'>
                            <div className='d-flex gap-2'>
                              <OverlayTrigger
                                rootClose
                                placement='top'
                                overlay={<Tooltip>Add E2 for Column A{indexPoint + 1}</Tooltip>}
                              >
                                <Button
                                  variant='outline-primary'
                                  className='py-1 px-2 d-flex align-items-center'
                                  size='sm'
                                  onClick={() =>
                                    handleShow({
                                      title: `${activeField.description} - ${activeField.tagId}`,
                                      body: `Add E2 for Column A${indexPoint + 1}`,
                                      rowIndex: dfnvIndex,
                                      calibrationPointIndex: indexPoint,
                                      dataColumnIndex: 0,
                                    })
                                  }
                                >
                                  <Plus size={14} />
                                  <span className='mt-auto'>E2</span>
                                </Button>
                              </OverlayTrigger>

                              <OverlayTrigger
                                rootClose
                                placement='top'
                                overlay={<Tooltip>Add ST-MW for Column A{indexPoint + 1}</Tooltip>}
                              >
                                <Button
                                  variant='outline-primary'
                                  className='p-1 px-2'
                                  size='sm'
                                  onClick={() =>
                                    handleShow({
                                      title: `${activeField.description} - ${activeField.tagId}`,
                                      body: `Add ST-MW for Column A${indexPoint + 1}`,
                                      rowIndex: dfnvIndex,
                                      calibrationPointIndex: indexPoint,
                                      dataColumnIndex: 1,
                                    })
                                  }
                                >
                                  <Plus size={12} />
                                  <span className='mt-auto'>ST-MW</span>
                                </Button>
                              </OverlayTrigger>
                            </div>

                            <div className='d-flex gap-2'>
                              <OverlayTrigger
                                rootClose
                                placement='top'
                                overlay={<Tooltip>Clear E2 for Column A{indexPoint + 1}</Tooltip>}
                              >
                                <Button
                                  variant='outline-danger'
                                  className='py-1 px-2 d-flex align-items-center'
                                  size='sm'
                                  onClick={() => {
                                    handleClearData({
                                      rowIndex: dfnvIndex,
                                      calibrationPointIndex: indexPoint,
                                      dataColumnIndex: 0,
                                    });
                                  }}
                                >
                                  <Eraser size={12} className='me-1' />
                                  <span className='mt-auto'>E2</span>
                                </Button>
                              </OverlayTrigger>

                              <OverlayTrigger
                                rootClose
                                placement='top'
                                overlay={
                                  <Tooltip>Clear ST-MW for Column A{indexPoint + 1}</Tooltip>
                                }
                              >
                                <Button
                                  variant='outline-danger'
                                  className='py-1 px-2 d-flex align-items-center'
                                  size='sm'
                                  onClick={() => {
                                    handleClearData({
                                      rowIndex: dfnvIndex,
                                      calibrationPointIndex: indexPoint,
                                      dataColumnIndex: 1,
                                    });
                                  }}
                                >
                                  <Eraser size={12} className='me-1' />
                                  <span className='mt-auto'>ST-MW</span>
                                </Button>
                              </OverlayTrigger>
                            </div>
                          </div>
                        </p>

                        <p className='mb-1'>
                          <span className='pe-1 fs-6'>Nominal Value:</span>
                          <strong className='text-capitalize'>
                            {point.nominalValue.toFixed(4)}
                          </strong>
                        </p>
                        <p className='mb-2'>
                          <span className='pe-1 fs-6'>Measured Value:</span>
                          <strong className='text-capitalize'>
                            {point.nominalValue.toFixed(4)}
                          </strong>
                        </p>

                        <p className='mb-1'>
                          <span className='pe-1 fs-6'>E2:</span>
                          <strong className={styles.columnDataContainer}>
                            {point?.data[0] &&
                              point?.data[0].map((value, indexColumnData) => (
                                <div className={`${styles.columnData}`} key={indexColumnData}>
                                  <div
                                    className={styles.columnDataValue}
                                    contentEditable
                                    suppressContentEditableWarning={true}
                                    onKeyDown={handleKeyDown}
                                    onInput={(e) => {
                                      debouncedHandleEditData({
                                        value: e.target.innerText,
                                        rowIndex: dfnvIndex,
                                        calibrationPointIndex: indexPoint,
                                        dataColumnIndex: 0,
                                        dataIndex: indexColumnData,
                                      });
                                    }}
                                  >
                                    {value.toString()}
                                  </div>
                                  <div
                                    contentEditable={false}
                                    className={styles.columnDataClose}
                                    onClick={() => {
                                      handleRemoveData({
                                        rowIndex: dfnvIndex,
                                        calibrationPointIndex: indexPoint,
                                        dataColumnIndex: 0,
                                        dataIndex: indexColumnData,
                                      });
                                    }}
                                  >
                                    X
                                  </div>
                                </div>
                              ))}
                          </strong>
                        </p>

                        <p className='mt-2 mb-1'>
                          <span className='pe-1 fs-6'>ST-MW:</span>
                          <strong className={styles.columnDataContainer}>
                            {point?.data[1] &&
                              point?.data[1].map((value, indexColumnData) => (
                                <div className={`${styles.columnData}`} key={indexColumnData}>
                                  <div
                                    className={styles.columnDataValue}
                                    contentEditable
                                    suppressContentEditableWarning={true}
                                    onKeyDown={handleKeyDown}
                                    onInput={(e) => {
                                      debouncedHandleEditData({
                                        value: e.target.innerText,
                                        rowIndex: dfnvIndex,
                                        calibrationPointIndex: indexPoint,
                                        dataColumnIndex: 1,
                                        dataIndex: indexColumnData,
                                      });
                                    }}
                                  >
                                    {value.toString()}
                                  </div>
                                  <div
                                    contentEditable={false}
                                    className={styles.columnDataClose}
                                    onClick={() =>
                                      handleRemoveData({
                                        rowIndex: dfnvIndex,
                                        calibrationPointIndex: indexPoint,
                                        dataColumnIndex: 1,
                                        dataIndex: indexColumnData,
                                      })
                                    }
                                  >
                                    X
                                  </div>
                                </div>
                              ))}
                          </strong>
                        </p>
                      </div>
                    ))}
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>

          <Modal size='md' centered show={modal.show} onHide={handleClose}>
            <Modal.Header closeButton>
              <div>
                <h4 className='mb-0'>{modal.title}</h4>
                <small className='text-muted'>{modal.body}</small>
              </div>
            </Modal.Header>

            <Form onSubmit={testInputForm.handleSubmit(handleInputDataSubmit)}>
              <Modal.Body>
                <FormProvider {...testInputForm}>
                  <Controller
                    name='data'
                    control={testInputForm.control}
                    render={({ field }) => (
                      <>
                        <Form.Control {...field} autoFocus type='text' placeholder='Enter value' />

                        {testInputForm.formState.errors &&
                          testInputForm.formState.errors.data?.message && (
                            <Form.Text className='text-danger'>
                              {testInputForm.formState.errors.data?.message}
                            </Form.Text>
                          )}
                      </>
                    )}
                  />
                </FormProvider>
              </Modal.Body>

              <Modal.Footer>
                <Button variant='secondary' size='sm' onClick={handleClose}>
                  Close
                </Button>

                <Button variant='primary' size='sm' type='submit'>
                  Submit
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>
        </>
      )}
    </>
  );
};

export default DFNTest;
