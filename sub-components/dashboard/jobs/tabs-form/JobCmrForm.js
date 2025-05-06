import DataTable from '@/components/common/DataTable';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import DataTableFilter from '@/components/common/DataTableFilter';
import DataTableSearch from '@/components/common/DataTableSearch';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import SignatureField from '@/components/common/SignaturePad';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import { YES_NO_OPTIONS } from '@/constants/common';
import { db } from '@/firebase';
import { CATEGORY } from '@/schema/customerEquipment';
import { globalSearchFilter } from '@/utils/datatable';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Col, Form, Image, Nav, Row, Spinner, Tab } from 'react-bootstrap';
import { Save, Tag } from 'react-bootstrap-icons';
import { Controller, useFormContext } from 'react-hook-form';

const EquipmentRequested = ({ calibrations }) => {
  const form = useFormContext();

  const columnHelper = createColumnHelper();

  const [activeKey, setActiveKey] = useState(CATEGORY[0]);

  const allCustomerEquipment = useMemo(() => {
    const values = form.getValues('customerEquipments') || [];
    return values;
  }, [JSON.stringify(form.watch('customerEquipments'))]);

  const allCustomerEquipmentByCategory = useMemo(() => {
    const values = allCustomerEquipment?.filter((eq) => eq.category === activeKey);
    return values || [];
  }, [allCustomerEquipment, activeKey]);

  const getSelectedCategoryCountEquipmentRequested = useCallback(
    (category) => {
      const selectedEquipments = form.watch('customerEquipments');
      if (!selectedEquipments || selectedEquipments?.length < 1 || !category) return 0;
      return selectedEquipments.filter((eq) => eq?.category === category)?.length || 0;
    },
    [JSON.stringify(form.watch('customerEquipments'))]
  );

  const selectedCustomerEquipmentRequestedByCategory = useMemo(() => {
    if (allCustomerEquipment?.length < 1) return [];
    return allCustomerEquipmentByCategory.filter((eq) => eq.category === activeKey);
  }, [JSON.stringify(allCustomerEquipment), activeKey]);

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('description', {
        id: 'equipment',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Equipment' />,
      }),

      columnHelper.accessor('make', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Make' />,
      }),
      columnHelper.accessor('model', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Model' />,
      }),
      columnHelper.accessor('serialNumber', {
        id: 'serial number',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Serial Number' />,
      }),
      columnHelper.accessor(
        (row) => {
          const rangeMin = row?.rangeMin;
          const rangeMax = row?.rangeMax;
          return rangeMin && rangeMax ? `${rangeMin} - ${rangeMax}` : '';
        },
        {
          id: 'range',
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Calibration Points / Range' />
          ),
        }
      ),
      columnHelper.accessor('tolerance', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Tolerance' />,
      }),
    ];
  }, [activeKey, selectedCustomerEquipmentRequestedByCategory]);

  const filterFields = useMemo(() => {
    return [
      {
        label: 'Equipment',
        columnId: 'equipment',
        type: 'text',
        placeholder: 'Search by description...',
      },
      {
        label: 'Make',
        columnId: 'make',
        type: 'text',
        placeholder: 'Search by make...',
      },
      {
        label: 'Model',
        columnId: 'model',
        type: 'text',
        placeholder: 'Search by model...',
      },
      {
        label: 'Serial Number',
        columnId: 'serial number',
        type: 'text',
        placeholder: 'Search by serial number...',
      },
      {
        label: 'Range',
        columnId: 'range',
        type: 'text',
        placeholder: 'Search by range...',
      },
      {
        label: 'Tolerance',
        columnId: 'tolerance',
        type: 'text',
        placeholder: 'Search by tolerance...',
      },
    ];
  }, []);

  const table = useReactTable({
    data: selectedCustomerEquipmentRequestedByCategory,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFns: { globalSearch: globalSearchFilter },
    globalFilterFn: 'globalSearch',
    initialState: {},
    getRowId: (row) => row.id,
  });

  return (
    <Tab.Container className='mt-5' activeKey={activeKey} onSelect={(key) => setActiveKey(key)}>
      <Nav variant='pills' className='d-flex justify-content-center gap-3'>
        {CATEGORY.map((c) => {
          return (
            <Nav.Item
              key={`${c}-nav-item-equipment-requested`}
              className='d-flex align-items-center'
            >
              <Nav.Link eventKey={`${c}`}>
                <Tag size={18} />
                {c
                  .split(' ')
                  .map((str) => _.capitalize(str || ''))
                  .join(' ')}

                <Badge
                  className={`ms-2 ${activeKey === c ? 'text-dark' : ''}`}
                  bg={activeKey === c ? 'light' : 'primary'}
                >
                  {getSelectedCategoryCountEquipmentRequested(c)}
                </Badge>
              </Nav.Link>
            </Nav.Item>
          );
        })}
      </Nav>

      <hr className='my-3' />

      <Tab.Content style={{ width: '100%', height: 'fit-content' }}>
        {CATEGORY.map((c) => (
          <Tab.Pane key={`${c}-tab-pane-equipment-requested`} className='h-100' eventKey={c}>
            <DataTable table={table} isLoading={calibrations.isLoading} isError={false}>
              <div className='d-flex flex-column row-gap-3 flex-lg-row justify-content-lg-between'>
                <DataTableSearch table={table} />

                <div className='d-flex align-items-center gap-2'>
                  <DataTableFilter table={table} filterFields={filterFields} />
                  <DataTableViewOptions table={table} />
                </div>
              </div>
            </DataTable>
          </Tab.Pane>
        ))}
      </Tab.Content>
    </Tab.Container>
  );
};

const EquipmentCompleted = ({ calibrations }) => {
  const form = useFormContext();

  const columnHelper = createColumnHelper();

  const [activeKey, setActiveKey] = useState(CATEGORY[0]);

  const allCustomerEquipments = useMemo(() => {
    const customer = form.getValues('customer');

    if (!customer || !customer?.id) return [];

    const values = form.getValues('allCustomerEquipments') || [];

    return values.filter((eq) => eq.customerId === customer.id);
  }, [form.watch('customer.id'), form.watch('allCustomerEquipments')]);

  const completedEquipment = useMemo(() => {
    const result = calibrations.data
      .map((c) => allCustomerEquipments.find((ce) => ce.id === c.description?.id))
      .filter(Boolean);

    return result;
  }, [allCustomerEquipments]);

  const getSelectedCategoryCountEquipmentCompleted = useCallback(
    (category) => {
      const selectedEquipments = completedEquipment;
      if (!selectedEquipments || selectedEquipments?.length < 1 || !category) return 0;
      return selectedEquipments.filter((eq) => eq?.category === category)?.length || 0;
    },
    [JSON.stringify(completedEquipment), activeKey]
  );

  const selectedCompletedEquipmentByCategory = useMemo(() => {
    if (completedEquipment?.length < 1) return [];
    return completedEquipment.filter((eq) => eq.category === activeKey);
  }, [JSON.stringify(completedEquipment), activeKey]);

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('description', {
        id: 'equipment',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Equipment' />,
      }),

      columnHelper.accessor('make', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Make' />,
      }),
      columnHelper.accessor('model', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Model' />,
      }),
      columnHelper.accessor('serialNumber', {
        id: 'serial number',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Serial Number' />,
      }),
      columnHelper.accessor(
        (row) => {
          const rangeMin = row?.rangeMin;
          const rangeMax = row?.rangeMax;
          return rangeMin && rangeMax ? `${rangeMin} - ${rangeMax}` : '';
        },
        {
          id: 'range',
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Calibration Points / Range' />
          ),
        }
      ),
      columnHelper.accessor('tolerance', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Tolerance' />,
      }),
    ];
  }, [activeKey]);

  const filterFields = useMemo(() => {
    return [
      {
        label: 'Equipment',
        columnId: 'equipment',
        type: 'text',
        placeholder: 'Search by description...',
      },
      {
        label: 'Make',
        columnId: 'make',
        type: 'text',
        placeholder: 'Search by make...',
      },
      {
        label: 'Model',
        columnId: 'model',
        type: 'text',
        placeholder: 'Search by model...',
      },
      {
        label: 'Serial Number',
        columnId: 'serial number',
        type: 'text',
        placeholder: 'Search by serial number...',
      },
      {
        label: 'Range',
        columnId: 'range',
        type: 'text',
        placeholder: 'Search by range...',
      },
      {
        label: 'Tolerance',
        columnId: 'tolerance',
        type: 'text',
        placeholder: 'Search by tolerance...',
      },
    ];
  }, []);

  const table = useReactTable({
    data: selectedCompletedEquipmentByCategory,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFns: { globalSearch: globalSearchFilter },
    globalFilterFn: 'globalSearch',
    initialState: {},
    getRowId: (row) => row.id,
  });

  return (
    <Tab.Container className='mt-5' activeKey={activeKey} onSelect={(key) => setActiveKey(key)}>
      <Nav variant='pills' className='d-flex justify-content-center gap-3'>
        {CATEGORY.map((c) => {
          return (
            <Nav.Item
              key={`${c}-nav-item-equipment-completed`}
              className='d-flex align-items-center'
            >
              <Nav.Link eventKey={`${c}`}>
                <Tag size={18} />
                {c
                  .split(' ')
                  .map((str) => _.capitalize(str || ''))
                  .join(' ')}

                <Badge
                  className={`ms-2 ${activeKey === c ? 'text-dark' : ''}`}
                  bg={activeKey === c ? 'light' : 'primary'}
                >
                  {getSelectedCategoryCountEquipmentCompleted(c)}
                </Badge>
              </Nav.Link>
            </Nav.Item>
          );
        })}
      </Nav>

      <hr className='my-3' />

      <Tab.Content style={{ width: '100%', height: 'fit-content' }}>
        {CATEGORY.map((c) => (
          <Tab.Pane key={`${c}-tab-pane-equipment-completed`} className='h-100' eventKey={c}>
            <DataTable table={table} isLoading={calibrations.isLoading} isError={false}>
              <div className='d-flex flex-column row-gap-3 flex-lg-row justify-content-lg-between'>
                <DataTableSearch table={table} />

                <div className='d-flex align-items-center gap-2'>
                  <DataTableFilter table={table} filterFields={filterFields} />
                  <DataTableViewOptions table={table} />
                </div>
              </div>
            </DataTable>
          </Tab.Pane>
        ))}
      </Tab.Content>
    </Tab.Container>
  );
};

const JobCmrForm = ({ data, isLoading, handleNext, handlePrevious, calibrations }) => {
  const form = useFormContext();
  const formErrors = form.formState.errors;

  const [worker, setWorker] = useState(null);
  const [isSettingWorker, setIsSettingWorker] = useState(false);
  const [labRepresentative, setLabRepresentative] = useState(null);
  const [isSettingLabRepresentative, setIsSettingLabRepresentative] = useState(false);

  const scope = useMemo(() => {
    const value = form.watch('scope')?.value;

    if (!value) return '';

    if (value === 'lab') return 'Permanent Lab. Calibration';
    else return 'On-site Calibration';
  }, [form.watch('scope')]);

  const address = useMemo(() => {
    const location = form.watch('location');

    if (!location) return '';

    const defaultAddress = location?.addresses?.find((a) => a.isDefault);
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
  }, [JSON.stringify(form.watch('location'))]);

  const contactPhone = useMemo(() => {
    const value = form.watch('contact')?.phone;
    return value || '';
  }, [JSON.stringify(form.watch('contact'))]);

  //* set lab representative if data exist,
  useEffect(() => {
    //* if no jobRequestId then set it as the createdBy of job else set is as the one who created the job request
    if (data) {
      setIsSettingLabRepresentative(true);

      if (!data?.jobRequestId) {
        const uid = data?.createdBy?.uid;

        if (uid) {
          //* query user
          getDoc(doc(db, 'users', uid))
            .then((snapshot) => {
              if (snapshot.exists()) {
                const user = { id: snapshot.id, ...snapshot.data() };
                const signature = data?.salesSignature || user?.signature;

                setLabRepresentative(user);
                if (signature) form.setValue('salesSignature', signature);
                else form.setValue('salesSignature', '');
              }
            })
            .catch((err) => {
              console.error('Failed to set lab representative:', err);
              setIsSettingLabRepresentative(false);
            });
        }
      } else {
        const jobRequestId = data?.jobRequestId;

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
                    const signature = data?.salesSignature || user?.signature;

                    setLabRepresentative(user);
                    if (signature) form.setValue('salesSignature', signature);
                    else form.setValue('salesSignature', '');
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
  }, [data]);

  //* set worker
  useEffect(() => {
    if (data) {
      setIsSettingWorker(true);

      //* set workerSignature based on the first worker assigned/selected in the job
      const worker = data?.workers?.[0];

      if (worker) {
        const id = worker?.id;

        if (id) {
          getDocs(query(collection(db, 'users'), where('workerId', '==', id)))
            .then((snapshot) => {
              if (!snapshot.empty) {
                const user = snapshot.docs[0].data();
                const signature = user?.signature;

                setWorker(user);
                if (signature) form.setValue('workerSignature', signature);
                else form.setValue('workerSignature', '');
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
  }, [data]);

  //* if data exist set default value for customer signature
  useEffect(() => {
    if (data) {
      form.setValue('pic', data?.pic || '');
      form.setValue('customerSignature', data?.customerSignature || '');
      form.setValue('recalibrationInterval', data?.recalibrationInterval || '');
      form.setValue('accessories', data?.accessories || '');
      form.setValue('remark', data?.remark || '');
      form.setValue('conditionWhenReceived', data?.conditionWhenReceived || '');
      form.setValue('isPartialRange', data?.isPartialRange || false);
      form.setValue('isNonAccredited', data?.isNonAccredited || false);
      form.setValue('isOpenWiringConnection', data?.isOpenWiringConnection || false);
      form.setValue('isAdjustments', data?.isAdjustments || false);
    }
  }, [data]);

  useEffect(() => {
    console.log({ labRepresentative, worker });
  }, [labRepresentative, worker]);

  return (
    <Card className='shadow-none'>
      <Card.Body className='pb-0'>
        <Row className='mb-3 row-gap-3'>
          <Form.Group as={Col} md={6}>
            <Form.Label>Date</Form.Label>
            <Form.Control
              required
              type='text'
              value={format(form.watch('startDate'), 'dd-MM-yyyy')}
              readOnly
              disabled
            />
          </Form.Group>

          <Form.Group as={Col} md={6}>
            <Form.Label>CMR No.</Form.Label>
            <Form.Control required type='text' value={form.watch('jobId')} readOnly disabled />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <Form.Label>Scope</Form.Label>
            <Form.Control required type='text' value={scope} readOnly disabled />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <Form.Label>Est. Date Done</Form.Label>
            <Form.Control
              required
              type='text'
              value={format(form.watch('endDate'), 'dd-MM-yyyy')}
              readOnly
              disabled
            />
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <Form.Label>Time</Form.Label>
            <Form.Control
              required
              type='text'
              value={format(new Date(`1900-01-01T${form.watch('endTime')}`), 'p')}
              readOnly
              disabled
            />
          </Form.Group>
        </Row>

        <hr className='my-4' />
        <h4 className='mb-0'>Company</h4>
        <p className='text-muted fs-6'>Details about the company.</p>

        <Row className='mb-3 row-gap-3'>
          <Form.Group as={Col} md={12}>
            <Form.Label>Customer</Form.Label>
            <Form.Control
              required
              type='text'
              value={form.watch('customer.name')}
              readOnly
              disabled
            />
          </Form.Group>

          <Form.Group as={Col} md={12}>
            <Form.Label>Address</Form.Label>
            <Form.Control
              required
              type='text'
              as='textarea'
              rows={2}
              value={address}
              readOnly
              disabled
              style={{ resize: 'none' }}
            />
          </Form.Group>

          <Form.Group as={Col} md={6}>
            <Form.Label htmlFor='telFax'>Tel / Fax</Form.Label>

            <Controller
              name='telFax'
              control={form.control}
              render={({ field }) => (
                <Form.Control {...field} id='telFax' placeholder='Enter Tel / Fax' />
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={6}>
            <RequiredLabel label='P.I.C' id='pic' />

            <Controller
              name='pic'
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control {...field} id='pic' placeholder='Enter P.I.C' />

                  {formErrors && formErrors.pic?.message && (
                    <Form.Text className='text-danger'>{formErrors.pic?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>
        </Row>

        <hr className='my-4' />
        <h4 className='mb-0'>Equipment Requested</h4>
        <p className='text-muted fs-6'>
          Details about the list of equipment requested (calibration items).
        </p>

        <Row className='mb-3 row-gap-3'>
          <Col>
            <EquipmentRequested calibrations={calibrations} />
          </Col>
        </Row>

        <hr className='my-4' />
        <h4 className='mb-0'>Equipment Completed</h4>
        <p className='text-muted fs-6'>
          Details about the list of equipment completed (completed calibration items).
        </p>

        <Row className='mb-3 row-gap-3'>
          <Col>
            <EquipmentCompleted calibrations={calibrations} />
          </Col>
        </Row>

        <hr className='my-4' />

        <Row className='mb-3 row-gap-3'>
          <Form.Group as={Col} md={6}>
            <RequiredLabel label='Recalibration Interval' id='recalibrationInterval' />

            <Controller
              name='recalibrationInterval'
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control
                    {...field}
                    id='recalibrationInterval'
                    type='date'
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />

                  {formErrors && formErrors.recalibrationInterval?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.recalibrationInterval?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={6}>
            <RequiredLabel label='Accessories' id='accessories' />

            <Controller
              name='accessories'
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control {...field} id='accessories' placeholder='Enter accessories' />

                  {formErrors && formErrors.accessories?.message && (
                    <Form.Text className='text-danger'>{formErrors.accessories?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={6}>
            <RequiredLabel label='Remark' id='remark' />

            <Controller
              name='remark'
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control {...field} id='remark' placeholder='Enter remark' />

                  {formErrors && formErrors.remark?.message && (
                    <Form.Text className='text-danger'>{formErrors.remark?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={6}>
            <RequiredLabel label='Condition When Received' id='conditionWhenReceived' />

            <Controller
              name='conditionWhenReceived'
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control
                    {...field}
                    id='conditionWhenReceived'
                    placeholder='Enter condition when received'
                  />

                  {formErrors && formErrors.conditionWhenReceived?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.conditionWhenReceived?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>
        </Row>

        <hr className='my-4' />
        <h4 className='mb-0'>If Nonconforming Work</h4>
        <p className='text-muted fs-6'>Please specify type of NC work</p>

        <Row className='mb-3 row-gap-3 align-items-end'>
          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Partial Range' id='isPartialRange' />

            <Controller
              name='isPartialRange'
              control={form.control}
              render={({ field }) => (
                <div className='mt-3'>
                  {YES_NO_OPTIONS.map((item) => (
                    <Form.Check
                      inline
                      label={_.startCase(item.label)}
                      name='isPartialRange'
                      type='radio'
                      id={`inline-${item.value}-isPartialRange`}
                      checked={field.value === item.value}
                      onChange={() => field.onChange(item.value)}
                    />
                  ))}

                  <div className='mt-1'>
                    {formErrors && formErrors.isPartialRange?.message && (
                      <Form.Text className='text-danger'>
                        {formErrors.isPartialRange?.message}
                      </Form.Text>
                    )}
                  </div>
                </div>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Non Accredited' id='isNonAccredited' />

            <Controller
              name='isNonAccredited'
              control={form.control}
              render={({ field }) => (
                <div className='mt-3'>
                  {YES_NO_OPTIONS.map((item) => (
                    <Form.Check
                      inline
                      label={_.startCase(item.label)}
                      name='isNonAccredited'
                      type='radio'
                      id={`inline-${item.value}-isNonAccredited`}
                      checked={field.value === item.value}
                      onChange={() => field.onChange(item.value)}
                    />
                  ))}

                  <div className='mt-1'>
                    {formErrors && formErrors.isNonAccredited?.message && (
                      <Form.Text className='text-danger'>
                        {formErrors.isNonAccredited?.message}
                      </Form.Text>
                    )}
                  </div>
                </div>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Open Wiring Connection' id='isOpenWiringConnection'>
              <div className='text-muted' style={{ fontSize: '12px' }}>
                (stop watch)
              </div>
            </RequiredLabel>

            <Controller
              name='isOpenWiringConnection'
              control={form.control}
              render={({ field }) => (
                <div className='mt-3'>
                  {YES_NO_OPTIONS.map((item) => (
                    <Form.Check
                      inline
                      label={_.startCase(item.label)}
                      name='isOpenWiringConnection'
                      type='radio'
                      id={`inline-${item.value}-isOpenWiringConnection`}
                      checked={field.value === item.value}
                      onChange={() => field.onChange(item.value)}
                    />
                  ))}

                  <div className='mt-1'>
                    {formErrors && formErrors.isOpenWiringConnection?.message && (
                      <Form.Text className='text-danger'>
                        {formErrors.isOpenWiringConnection?.message}
                      </Form.Text>
                    )}
                  </div>
                </div>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={3}>
            <RequiredLabel label='Adjustments' id='isAdjustments'>
              <div className='text-muted' style={{ fontSize: '12px' }}>
                (Manufacturer's instructions Required)
              </div>
            </RequiredLabel>

            <Controller
              name='isAdjustments'
              control={form.control}
              render={({ field }) => (
                <div className='mt-3'>
                  {YES_NO_OPTIONS.map((item) => (
                    <Form.Check
                      inline
                      label={_.startCase(item.label)}
                      name='isAdjustments'
                      type='radio'
                      id={`inline-${item.value}-isAdjustments`}
                      checked={field.value === item.value}
                      onChange={() => field.onChange(item.value)}
                    />
                  ))}

                  <div className='mt-1'>
                    {formErrors && formErrors.isAdjustments?.message && (
                      <Form.Text className='text-danger'>
                        {formErrors.isAdjustments?.message}
                      </Form.Text>
                    )}
                  </div>
                </div>
              )}
            />
          </Form.Group>

          <Form.Group as={Col} md={12}>
            <Form.Label htmlFor='others'>Others</Form.Label>

            <Controller
              name='others'
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control {...field} id='others' placeholder='Please specify' />

                  {formErrors && formErrors.others?.message && (
                    <Form.Text className='text-danger'>{formErrors.others?.message}</Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>
        </Row>

        <Row className='row-gap-3'>
          <Form.Group as={Col} md={4}>
            <RequiredLabel label='Signature' id='salesSignature' />

            {isSettingLabRepresentative ? (
              <div>
                <Spinner animation='border' className='me-2' size='sm' /> Loading...
              </div>
            ) : form.watch('salesSignature') &&
              form.watch('salesSignature')?.startsWith('data:image') ? (
              <Controller
                name='salesSignature'
                control={form.control}
                render={({ field }) => (
                  <>
                    <div className='d-flex justify-content-center flex-column align-items-center text-center'>
                      <SignatureField onChange={field.onChange} value={field.value} />
                      <div className='fw-bold text-center'>Laboratory Representative</div>
                      <div className='text-muted text-center'>{labRepresentative?.fullName}</div>
                    </div>

                    {formErrors && formErrors.salesSignature?.message && (
                      <Form.Text className='text-danger'>
                        {formErrors.salesSignature?.message}
                      </Form.Text>
                    )}
                  </>
                )}
              />
            ) : form.watch('salesSignature') ? (
              <div className='d-flex justify-content-center flex-column align-items-center text-center '>
                <div
                  className='d-flex justify-content-center align-items-center border rounded overflow-hidden'
                  style={{ width: 500, height: 200 }}
                >
                  <Image
                    style={{ margin: 'auto', width: 450, height: 150 }}
                    src={form.watch('salesSignature')}
                    alt='Signature'
                  />
                </div>

                <div className='mt-2 fw-bold text-center'>Laboratory Representative</div>
                <div className='text-muted text-center'>{labRepresentative?.fullName}</div>
              </div>
            ) : (
              <Controller
                name='salesSignature'
                control={form.control}
                render={({ field }) => (
                  <>
                    <div className='d-flex justify-content-center flex-column align-items-center text-center'>
                      <SignatureField onChange={field.onChange} value={field.value} />
                      <div className='fw-bold text-center'>Laboratory Representative</div>
                      <div className='text-muted text-center'>{labRepresentative?.fullName}</div>
                    </div>

                    {formErrors && formErrors.salesSignature?.message && (
                      <Form.Text className='text-danger'>
                        {formErrors.salesSignature?.message}
                      </Form.Text>
                    )}
                  </>
                )}
              />
            )}
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <RequiredLabel label='Signature' id='workerSignature' />

            {isSettingWorker ? (
              <div>
                <Spinner animation='border' className='me-2' size='sm' /> Loading...
              </div>
            ) : form.watch('workerSignature') &&
              form.watch('workerSignature')?.startsWith('data:image') ? (
              <Controller
                name='workerSignature'
                control={form.control}
                render={({ field }) => (
                  <>
                    <div className='d-flex justify-content-center flex-column align-items-center text-center'>
                      <SignatureField onChange={field.onChange} value={field.value} />
                      <div className='fw-bold'>Reviewd By</div>
                      <div className='text-muted text-center'>{worker?.fullName}</div>
                      <div className='text-muted text-center'>
                        {format(new Date(), 'dd MMMM yyyy')}
                      </div>
                    </div>

                    {formErrors && formErrors.workerSignature?.message && (
                      <Form.Text className='text-danger'>
                        {formErrors.workerSignature?.message}
                      </Form.Text>
                    )}
                  </>
                )}
              />
            ) : form.watch('workerSignature') ? (
              <div className='d-flex justify-content-center flex-column align-items-center text-center '>
                <div
                  className='d-flex justify-content-center align-items-center border rounded overflow-hidden'
                  style={{ width: 500, height: 200 }}
                >
                  <Image
                    style={{ margin: 'auto', width: 450, height: 150 }}
                    src={form.watch('workerSignature')}
                    alt='Signature'
                  />
                </div>

                <div className='mt-2 fw-bold'>Reviewd By</div>
                <div className='text-muted text-center'>{worker?.fullName}</div>
                <div className='text-muted text-center'>{format(new Date(), 'dd MMMM yyyy')}</div>
              </div>
            ) : (
              <Controller
                name='workerSignature'
                control={form.control}
                render={({ field }) => (
                  <>
                    <div className='d-flex justify-content-center flex-column align-items-center text-center'>
                      <SignatureField onChange={field.onChange} value={field.value} />
                      <div className='fw-bold'>Reviewd By</div>
                      <div className='text-muted text-center'>{worker?.fullName}</div>
                      <div className='text-muted text-center'>
                        {format(new Date(), 'dd MMMM yyyy')}
                      </div>
                    </div>

                    {formErrors && formErrors.workerSignature?.message && (
                      <Form.Text className='text-danger'>
                        {formErrors.workerSignature?.message}
                      </Form.Text>
                    )}
                  </>
                )}
              />
            )}
          </Form.Group>

          <Form.Group as={Col} md={4}>
            <RequiredLabel label='Signature' id='customerSignature' />

            <Controller
              name='customerSignature'
              control={form.control}
              render={({ field }) => (
                <>
                  <div className='d-flex justify-content-center flex-column align-items-center text-center'>
                    <SignatureField onChange={field.onChange} value={field.value} />
                    <div className='fw-bold'>Customer Chop & Sign</div>
                    <div className='text-muted'>{form.watch('customer.name')}</div>
                  </div>

                  {formErrors && formErrors.customerSignature?.message && (
                    <Form.Text className='text-danger'>
                      {formErrors.customerSignature?.message}
                    </Form.Text>
                  )}
                </>
              )}
            />
          </Form.Group>
        </Row>

        <div className='mt-4 d-flex justify-content-between align-items-center'>
          <Button
            disabled={isLoading}
            type='button'
            variant='outline-primary'
            onClick={handlePrevious}
          >
            Previous
          </Button>

          <Button type='button' onClick={handleNext} disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner
                  as='span'
                  animation='border'
                  size='sm'
                  role='status'
                  aria-hidden='true'
                  className='me-2'
                />
                {data ? 'Updating' : 'Creating'}...
              </>
            ) : (
              <>
                <Save size={14} className='me-2' />
                {data ? 'Update' : 'Create'} {' Job'}
              </>
            )}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default JobCmrForm;
