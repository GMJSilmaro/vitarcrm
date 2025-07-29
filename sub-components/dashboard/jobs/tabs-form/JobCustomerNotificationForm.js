import Checkbox from '@/components/common/Checkbox';
import DataTable from '@/components/common/DataTable';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import DataTableFilter from '@/components/common/DataTableFilter';
import DataTableSearch from '@/components/common/DataTableSearch';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import SignatureField from '@/components/common/SignaturePad';
import Select from '@/components/Form/Select';
import { db } from '@/firebase';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { collection, getDocs, query } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Col, Form, Row } from 'react-bootstrap';
import { Controller, useFormContext } from 'react-hook-form';

export default function JobCustomerNotificationForm({
  data,
  isLoading,
  handleNext,
  handlePrevious,
  calibrations,
}) {
  const form = useFormContext();
  const formErrors = form.formState.errors;

  const [usersOptions, setUsersOptions] = useState({ data: [], isLoading: true, isError: false }); //prettier-ignore

  const workerOptions = useMemo(() => {
    if (usersOptions.data.length > 0) {
      const workers = form.getValues('workers') || [];
      const workersUids = workers.map((worker) => worker.uid);
      return usersOptions.data.filter((user) => workersUids.includes(user.uid));
    }
    return [];
  }, [JSON.stringify(usersOptions), JSON.stringify(form.watch('workers'))]);

  const adminSupervisorOptions = useMemo(() => {
    if (usersOptions.data.length > 0) {
      return usersOptions.data.filter(
        (user) => user.role === 'supervisor' || user.role === 'admin'
      );
    }
    return [];
  }, [JSON.stringify(usersOptions)]);

  const allCustomerEquipment = useMemo(() => {
    const customer = form.getValues('customer');

    if (!customer || !customer?.id) return [];

    const values = form.getValues('allCustomerEquipments') || [];

    return values.filter((eq) => eq.customerId === customer.id);
  }, [form.watch('customer.id'), form.watch('allCustomerEquipments')]);

  const calibratedInstruments = useMemo(() => {
    if (
      !calibrations ||
      calibrations?.data.length < 1 ||
      !allCustomerEquipment ||
      allCustomerEquipment?.length < 1
    ) {
      return [];
    }

    return (
      calibrations?.data?.map((c) => {
        const eqData = allCustomerEquipment.find((eq) => c?.description?.id === eq?.id);
        if (eqData)
          return {
            calibrateId: c.id,
            certificateNumber: c.certificateNumber,
            equipmentId: eqData.id,
            description: eqData.description,
            serialNumber: eqData.serialNumber,
            make: eqData.make,
            model: eqData.model,
          };
      }) || []
    );
  }, [JSON.stringify(calibrations), JSON.stringify(allCustomerEquipment)]);

  const cnCalibrationItems = useMemo(() => {
    const value = form.getValues('cnCalibrationItems') || [];

    if (!value || (Array.isArray(value) && value.length < 1)) return [];
    return value;
  }, [JSON.stringify(form.watch('cnCalibrationItems'))]);

  const columnHelper = createColumnHelper();

  const handleSelectRow = (row, table) => {
    const cnCalibrationItem = row.original;
    const index = row.index;
    const isSelected = cnCalibrationItem.isSelected;
    const cnCalibrationItemsData = table.getRowModel()?.rows?.map((row) => row?.original) || [];

    let newCnCalibrationItem;
    const newArray = [...cnCalibrationItemsData];

    //* if is selected then reset the inpection result (e.g. broken, in operative, require accessories, etc)
    //* otherwise set isSelected to true and retain the inpection result
    if (isSelected) {
      newCnCalibrationItem = {
        ...cnCalibrationItem,
        isBroken: false,
        isInOperative: false,
        isRequireAccessories: false,
        others: '',
        isSelected: false,
      };
    } else {
      newCnCalibrationItem = {
        ...cnCalibrationItem,
        isSelected: true,
      };
    }

    newArray.splice(index, 1, newCnCalibrationItem);
    form.setValue('cnCalibrationItems', newArray);
  };

  const handleSelectAllRow = (table) => {
    let newArray;

    const cnCalibrationItemsData = table.getRowModel()?.rows?.map((row) => row?.original) || [];

    const isAllSelected = cnCalibrationItemsData.every((cn) => cn.isSelected);

    if (isAllSelected) {
      newArray = cnCalibrationItemsData.map((ci) => ({
        ...ci,
        isBroken: false,
        isInOperative: false,
        isRequireAccessories: false,
        others: '',
        isSelected: false,
      }));
    } else {
      newArray = cnCalibrationItemsData.map((ci) => ({ ...ci, isSelected: true }));
    }

    form.setValue('cnCalibrationItems', newArray);
  };

  const getIsSomeRowSelected = (table) => {
    const cnCalibrationItemsData = table.getRowModel()?.rows?.map((row) => row?.original) || [];
    if (!cnCalibrationItemsData || cnCalibrationItemsData?.length < 1) return false;

    return (
      cnCalibrationItemsData.some((cn) => cn.isSelected) &&
      !cnCalibrationItemsData.every((cn) => cn.isSelected)
    );
  };

  const getIsAllRowSelected = (table) => {
    const cnCalibrationItemsData = table.getRowModel()?.rows?.map((row) => row?.original) || [];
    if (!cnCalibrationItemsData || cnCalibrationItemsData?.length < 1) return false;

    return cnCalibrationItemsData.every((cn) => cn.isSelected);
  };

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('select', {
        size: 50,
        header: ({ table }) => {
          return (
            <Checkbox
              checked={getIsAllRowSelected(table)}
              indeterminate={getIsSomeRowSelected(table)}
              onChange={() => {
                handleSelectAllRow(table);
              }}
            />
          );
        },
        cell: ({ row, table }) => {
          const isSelected = row.original?.isSelected;
          return (
            <div className='px-1'>
              <Checkbox
                checked={isSelected}
                indeterminate={isSelected}
                onChange={() => {
                  handleSelectRow(row, table);
                }}
              />
            </div>
          );
        },
      }),
      columnHelper.accessor('index', {
        id: 'index',
        header: ({ column }) => <DataTableColumnHeader column={column} title='#' />,
        enableSorting: false,
        size: 50,
        cell: ({ row, table }) => (
          <div>
            {(table.getSortedRowModel()?.flatRows?.findIndex((flatRow) => flatRow.id === row.id) ||
              0) + 1}
          </div>
        ),
      }),
      columnHelper.accessor('certificateNumber', {
        id: 'cert no',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Cert No.' />,
      }),
      columnHelper.accessor('description', {
        id: 'instrument name',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Intrument Name' />,
      }),
      columnHelper.accessor('serialNumber', {
        id: 'serial no',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Serial No.' />,
      }),
      columnHelper.accessor('make', {
        id: 'maker / manufacturer',
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>
            Maker /<br /> Manufacturer
          </DataTableColumnHeader>
        ),
      }),
      columnHelper.accessor('model', {
        id: 'model',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Model' />,
      }),
      columnHelper.accessor('isBroken', {
        size: 50,
        filterFn: 'equalsString',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Broken' />,
        cell: ({ row }) => {
          const index = row.index;
          const isSelected = row.original?.isSelected;

          return (
            <Controller
              name={`cnCalibrationItems.${index}.isBroken`}
              control={form.control}
              render={({ field }) => (
                <Form.Check
                  {...field}
                  disabled={!isSelected}
                  checked={field.value}
                  type='checkbox'
                />
              )}
            />
          );
        },
      }),
      columnHelper.accessor('isInOperative', {
        size: 50,
        filterFn: 'equalsString',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Inoperative' />,
        cell: ({ row }) => {
          const index = row.index;
          const isSelected = row.original?.isSelected;

          return (
            <Controller
              name={`cnCalibrationItems.${index}.isInOperative`}
              control={form.control}
              render={({ field }) => (
                <Form.Check
                  {...field}
                  disabled={!isSelected}
                  checked={field.value}
                  type='checkbox'
                />
              )}
            />
          );
        },
      }),
      columnHelper.accessor('isRequireAccessories', {
        size: 50,
        filterFn: 'equalsString',
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>
            Require <br /> Accessories
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => {
          const index = row.index;
          const isSelected = row.original?.isSelected;

          return (
            <Controller
              name={`cnCalibrationItems.${index}.isRequireAccessories`}
              control={form.control}
              render={({ field }) => (
                <Form.Check
                  {...field}
                  disabled={!isSelected}
                  checked={field.value}
                  type='checkbox'
                />
              )}
            />
          );
        },
      }),

      columnHelper.accessor('others', {
        size: 200,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Others' />,
        cell: ({ row }) => {
          const index = row.index;
          const isSelected = row.original?.isSelected;

          return (
            <Controller
              name={`cnCalibrationItems.${index}.others`}
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control
                    className='text-center'
                    {...field}
                    disabled={!isSelected}
                    onChange={(e) => field.onChange(e.target.value)}
                    type='text'
                  />
                </>
              )}
            />
          );
        },
      }),
    ];
  }, []);

  const filterFields = useMemo(() => {
    return [
      {
        label: 'Cert No',
        columnId: 'cert no',
        type: 'text',
        placeholder: 'Search by cert no...',
      },
      {
        label: 'Instrument Name',
        columnId: 'instrument name',
        type: 'text',
        placeholder: 'Search by instrument name...',
      },
      {
        label: 'Serial No',
        columnId: 'serial no',
        type: 'text',
        placeholder: 'Search by serial no...',
      },
      {
        label: 'Maker / Manufacturer',
        columnId: 'maker / manufacturer',
        type: 'text',
        placeholder: 'Search by maker / manufacturer...',
      },
      {
        label: 'Model',
        columnId: 'model',
        type: 'text',
        placeholder: 'Search by model...',
      },
      {
        label: 'Broken',
        columnId: 'isBroken',
        type: 'select',
        options: [
          { label: 'N/A', value: '' },
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
      {
        label: 'Inoperative',
        columnId: 'isInOperative',
        type: 'select',
        options: [
          { label: 'N/A', value: '' },
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
      {
        label: 'Require Accessories',
        columnId: 'isRequireAccessories',
        type: 'select',
        options: [
          { label: 'N/A', value: '' },
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
      {
        label: 'Others',
        columnId: 'others',
        type: 'text',
        placeholder: 'Search by others...',
      },
    ];
  }, []);

  const table = useReactTable({
    data: cnCalibrationItems,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  //* set cnCalibrationItems
  useEffect(() => {
    if (data && calibratedInstruments?.length > 0) {
      const cnCalibrationItems = data?.cnCalibrationItems || [];

      if (cnCalibrationItems?.length < 1) {
        const items = calibratedInstruments.map((item) => ({
          ...item,
          isBroken: false,
          isInOperative: false,
          isRequireAccessories: false,
          others: '',
          isSelected: false,
        }));

        form.setValue('cnCalibrationItems', items);
        return;
      }

      const currentCnCalibrationItems = calibratedInstruments.map((ci) => {
        const cnItem = cnCalibrationItems.find((cn) => cn.equipmentId === ci.equipmentId);

        if (cnItem) return cnItem;

        return {
          ...ci,
          isBroken: false,
          isInOperative: false,
          isRequireAccessories: false,
          others: '',
          isSelected: false,
        };
      });

      form.setValue('cnCalibrationItems', currentCnCalibrationItems);
    }
  }, [JSON.stringify(calibratedInstruments), data]);

  //* set cnOthers if cnIsOthers is false
  useEffect(() => {
    if (!form.watch('cnIsOthers')) {
      form.setValue('cnOthers', '');
    }
  }, [JSON.stringify(form.watch('cnIsOthers'))]);

  //* set cnOthers if cnForVitarLabUseOthers is false
  useEffect(() => {
    if (!form.watch('cnForVitarLabUseIsOthers')) {
      form.setValue('cnForVitarLabUseOthers', '');
    }
  }, [JSON.stringify(form.watch('cnForVitarLabUseIsOthers'))]);

  //* cnTo default to pic,
  useEffect(() => {
    if (data) {
      if (form.getValues('pic')) form.setValue('cnTo', form.getValues('pic'));
      else form.setValue('cnTo', data?.cnTo || '');
    }
  }, [data, form.watch('pic')]);

  //* cnFaxNo default to telFax,
  useEffect(() => {
    if (data) {
      if (form.getValues('telFax')) form.setValue('cnFaxNo', form.getValues('telFax'));
      else form.setValue('cnFaxNo', data?.cnFaxNo || '');
    }
  }, [data, form.watch('telFax')]);

  //* query users
  useEffect(() => {
    const q = query(collection(db, 'users'));

    getDocs(q)
      .then((snapshot) => {
        if (!snapshot.empty) {
          const userData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setUsersOptions({
            data: userData.map((user) => ({
              uid: user.id,
              id: user.workerId,
              name: user.fullName,
              value: user.id,
              label: user.fullName,
              role: user.role,
            })),
            isLoading: false,
            isError: false,
          });
        }
      })
      .catch((err) => {
        console.error(err.message);
        setUsersOptions({ data: [], isLoading: false, isError: true });
      });
  }, []);

  return (
    <Card className='shadow-none'>
      <Card.Body className='pb-0'>
        <Row className='mb-3 row-gap-3'>
          <Form.Group as={Col} md={6}>
            <Form.Label htmlFor='cnTo'>To</Form.Label>

            <Controller
              name='cnTo'
              control={form.control}
              render={({ field }) => <Form.Control {...field} id='cnTo' placeholder='Enter to' />}
            />
          </Form.Group>

          <Form.Group as={Col} md={6}>
            <Form.Label htmlFor='cnYourRef'>Your Ref</Form.Label>

            <Controller
              name='cnYourRef'
              control={form.control}
              render={({ field }) => (
                <Form.Control {...field} id='cnYourRef' placeholder='Enter your ref' />
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={12}>
            <Form.Label>Company</Form.Label>
            <Form.Control
              required
              type='text'
              value={form.watch('customer.name')}
              readOnly
              disabled
            />
          </Form.Group>

          <Form.Group as={Col} md={6}>
            <Form.Label htmlFor='cnAttention'>Attention</Form.Label>

            <Controller
              name='cnAttention'
              control={form.control}
              render={({ field }) => (
                <Form.Control {...field} id='cnAttention' placeholder='Enter attention' />
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={6}>
            <Form.Label htmlFor='cnFaxNo'>Fax No</Form.Label>

            <Controller
              name='cnFaxNo'
              control={form.control}
              render={({ field }) => (
                <Form.Control {...field} id='cnFaxNo' placeholder='Enter fax no' />
              )}
            />
          </Form.Group>
        </Row>

        <hr className='my-4' />

        <Row className='mb-3 row-gap-3'>
          <Form.Group as={Col} md={6}>
            <Form.Label>From</Form.Label>
            <Form.Control
              required
              type='text'
              value='VITAR – SEGATEC SDN. BHD.'
              readOnly
              disabled
            />
          </Form.Group>

          <Form.Group as={Col} md={6}>
            <Form.Label>Our Ref</Form.Label>
            <Form.Control required type='text' value={form.watch('jobId')} readOnly disabled />
          </Form.Group>

          <Form.Group as={Col} md={6}>
            <Form.Label>Our Ref</Form.Label>
            <Form.Control
              required
              type='text'
              value={format(new Date(), 'dd MMMM yyyy')}
              readOnly
            />
          </Form.Group>
        </Row>

        <hr className='my-4' />

        <div className='d-flex justify-content-center align-items-center mb-2'>
          <p className='text-muted fw-bold'>
            MESSAGE: INFORMATION ON EQUIPMENT CONDITION / REQUIREMENT
          </p>
        </div>

        <Row className='mb-3 row-gap-3 justify-content-center'>
          <Form.Group as={Col} md={4}>
            <Controller
              name='cnIsBeforeCalibration'
              control={form.control}
              render={({ field }) => (
                <Form.Check
                  {...field}
                  checked={field.value}
                  id='cnIsBeforeCalibration'
                  type='checkbox'
                  label='Before Calibration'
                />
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <Controller
              name='cnIsDuringCalibration'
              control={form.control}
              render={({ field }) => (
                <Form.Check
                  {...field}
                  checked={field.value}
                  id='cnIsDuringCalibration'
                  type='checkbox'
                  label='During Calibration'
                />
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <Controller
              name='cnIsAfterCalibration'
              control={form.control}
              render={({ field }) => (
                <Form.Check
                  {...field}
                  checked={field.value}
                  id='cnIsAfterCalibration'
                  type='checkbox'
                  label='After Calibration'
                />
              )}
            />
          </Form.Group>
        </Row>

        <hr className='my-4' />
        <h4 className='mb-0'>Calibrated Instruments</h4>
        <p className='text-muted fs-6'>
          List of instruments and their respective inspection results. Please select the instruments
          that are deemed faulty based on the calibration inspection.
        </p>

        <Row>
          <Col>
            <DataTable table={table}>
              <div className='d-flex flex-column row-gap-3 flex-lg-row justify-content-lg-between'>
                <DataTableSearch table={table} />

                <div className='d-flex align-items-center gap-2'>
                  <DataTableFilter table={table} filterFields={filterFields} />
                  <DataTableViewOptions table={table} />
                </div>
              </div>
            </DataTable>
          </Col>
        </Row>

        <hr className='my-4' />

        <Row className='mb-3 row-gap-3 justify-content-center'>
          <Form.Group as={Col} md={6}>
            <Controller
              name='cnIsSendTheAccessories'
              control={form.control}
              render={({ field }) => (
                <Form.Check
                  {...field}
                  checked={field.value}
                  id='cnIsSendTheAccessories'
                  type='checkbox'
                  label='Send the accessories as above mentioned as soon as possible.'
                />
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={6}>
            <Controller
              name='cnIsAcknowledgeConfirm'
              control={form.control}
              render={({ field }) => (
                <Form.Check
                  {...field}
                  checked={field.value}
                  id='cnIsAcknowledgeConfirm'
                  type='checkbox'
                  label='Acknowledge / Confirm.'
                />
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={6}>
            <Controller
              name='cnIsArrangeForCollection'
              control={form.control}
              render={({ field }) => (
                <Form.Check
                  {...field}
                  checked={field.value}
                  id='cnIsArrangeForCollection'
                  type='checkbox'
                  label='Arrange for collection of this equipment.'
                />
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={6}>
            <Controller
              name='cnIsOthers'
              control={form.control}
              render={({ field: cnIsOthersField }) => (
                <div className='d-flex align-items-center gap-3'>
                  <Form.Check
                    {...cnIsOthersField}
                    checked={cnIsOthersField.value}
                    id='cnIsOthers'
                    type='checkbox'
                    label='Others'
                  />

                  <Controller
                    name='cnOthers'
                    control={form.control}
                    render={({ field }) => (
                      <Form.Control {...field} disabled={!cnIsOthersField.value} id='cnOthers' />
                    )}
                  />
                </div>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={6}>
            <Form.Label>Technician</Form.Label>

            <Controller
              name='cnWorker'
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    inputId='worker'
                    instanceId='worker'
                    onChange={(option) => field.onChange(option)}
                    options={workerOptions}
                    isLoading={usersOptions.isLoading}
                    placeholder={
                      usersOptions.isLoading
                        ? 'Loading technician...'
                        : "Search by technician' name"
                    }
                    isDisabled={usersOptions.isLoading}
                    noOptionsMessage={() =>
                      usersOptions.isLoading ? 'Loading...' : 'No technician found'
                    }
                  />
                </>
              )}
            />
          </Form.Group>

          <Col md={6} className='d-flex flex-column justify-content-end'>
            <p className='text-muted mb-1 text-center'>
              Should you have any further queries on the above mentioned, please contact
              <span className='fw-bold ps-1'>Mr. Avinaash Palanisamy.</span>
            </p>
            <p className='text-muted mb-1 text-center'>Thank you.</p>
          </Col>

          <hr className='my-4' />
        </Row>

        <Row className='mb-3 row-gap-3'>
          <Col md={6}>
            <Row className='mb-3 row-gap-3 w-100'>
              <Col className='px-0' xs={12}>
                <h4 className='mb-0'>For Vitar-Segatec Lab Use Only</h4>
                <p className='text-muted fs-6'>(After Customer Reply )</p>
              </Col>

              <Col className='px-0' xs={12}>
                <p className='text-muted mb-1 text-center'>
                  Information provided above have been reviewed. Action to be taken:
                </p>
              </Col>

              <Form.Group className='px-0' xs={12} as={Col}>
                <Controller
                  name='cnForVitarLabUseIsProceed'
                  control={form.control}
                  render={({ field }) => (
                    <Form.Check
                      {...field}
                      checked={field.value}
                      id='cnForVitarLabUseIsProceed'
                      type='checkbox'
                      label='Proceed with calibration'
                    />
                  )}
                />
              </Form.Group>

              <Form.Group className='px-0' xs={12} as={Col}>
                <Controller
                  name='cnForVitarLabUseIsNoCalibrationRequired'
                  control={form.control}
                  render={({ field }) => (
                    <Form.Check
                      {...field}
                      checked={field.value}
                      id='cnForVitarLabUseIsNoCalibrationRequired'
                      type='checkbox'
                      label='No calibration required & return back to the customer.'
                    />
                  )}
                />
              </Form.Group>

              <Form.Group className='px-0' xs={12} as={Col}>
                <Controller
                  name='cnForVitarLabUseIsOthers'
                  control={form.control}
                  render={({ field: cnForVitarLabUseIsOthersField }) => (
                    <div className='d-flex align-items-center gap-3'>
                      <Form.Check
                        {...cnForVitarLabUseIsOthersField}
                        checked={cnForVitarLabUseIsOthersField.value}
                        id='cnForVitarLabUseIsOthers'
                        type='checkbox'
                        label='Others'
                      />

                      <Controller
                        name='cnForVitarLabUseOthers'
                        control={form.control}
                        render={({ field }) => (
                          <Form.Control
                            {...field}
                            disabled={!cnForVitarLabUseIsOthersField.value}
                            id='cnForVitarLabUseOthers'
                          />
                        )}
                      />
                    </div>
                  )}
                />
              </Form.Group>

              <Form.Group className='px-0' xs={12} as={Col}>
                <Form.Label>Authorized by Head of Section</Form.Label>

                <Controller
                  name='cnForVitarLabUseAuthorizeBy'
                  control={form.control}
                  render={({ field }) => (
                    <>
                      <Select
                        {...field}
                        inputId='cnForVitarLabUseAuthorizeBy'
                        instanceId='cnForVitarLabUseAuthorizeBy'
                        onChange={(option) => field.onChange(option)}
                        options={adminSupervisorOptions}
                        isLoading={usersOptions.isLoading}
                        placeholder={
                          usersOptions.isLoading ? 'Loading user...' : "Search by user' name"
                        }
                        isDisabled={usersOptions.isLoading}
                        noOptionsMessage={() =>
                          usersOptions.isLoading ? 'Loading...' : 'No user found'
                        }
                      />
                    </>
                  )}
                />
              </Form.Group>

              <Form.Group className='px-0' xs={12} as={Col}>
                <Form.Label>Date</Form.Label>
                <Form.Control
                  required
                  type='text'
                  value={format(new Date(), 'dd MMMM yyyy')}
                  readOnly
                />
              </Form.Group>
            </Row>
          </Col>

          <Col md={6}>
            <Row className='mb-3 row-gap-3 w-100'>
              <Col className='px-0' xs={12}>
                <h4 className='mb-0'>Customer Reply Section</h4>
                <p className='text-muted fs-6'>Customer authorization and remarks</p>
              </Col>

              <Col className='px-0' xs={12}>
                <p className='text-muted mb-1 text-center'>
                  We acknowledge the information given / required:
                </p>
              </Col>

              <Form.Group className='px-0' xs={12} as={Col}>
                <Form.Label htmlFor='cnCustomerReplyRemarks'>Remarks</Form.Label>

                <Controller
                  name='cnCustomerReplyRemarks'
                  control={form.control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      as='textarea'
                      row={2}
                      id='cnCustomerReplyRemarks'
                      placeholder='Enter remarks (if any)'
                    />
                  )}
                />
              </Form.Group>

              <Form.Group
                className='d-flex flex-column justify-content-center align-items-center'
                as={Col}
              >
                <Form.Label htmlFor='cnCustomerReplyAuthorizeSignature'>Authorized By</Form.Label>

                <Controller
                  name='cnCustomerReplyAuthorizeSignature'
                  control={form.control}
                  render={({ field }) => (
                    <div className='d-flex justify-content-center flex-column align-items-center text-center'>
                      <SignatureField onChange={field.onChange} value={field.value} />
                      <div className='text-muted'>{form.watch('cnTo')}</div>
                      <div className='text-muted'>{format(new Date(), 'dd MMMM yyyy')}</div>
                    </div>
                  )}
                />
              </Form.Group>

              <Col className='px-0' xs={12}>
                <h4 className='mb-0'>Important Notice:</h4>
                <p className='text-muted fs-6'>
                  Please inform us if you have any objection and if we do not received any reply
                  within 3 working days, we assumed that you have agreed our explanation or action.
                </p>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
