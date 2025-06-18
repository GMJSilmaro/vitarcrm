import Checkbox from '@/components/common/Checkbox';
import DataTable from '@/components/common/DataTable';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import DataTableFilter from '@/components/common/DataTableFilter';
import DataTableSearch from '@/components/common/DataTableSearch';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import { TooltipContent } from '@/components/common/ToolTipContent';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import Select from '@/components/Form/Select';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { CATEGORY } from '@/schema/customerEquipment';
import { customerEquipmentSchema } from '@/schema/customerEquipment';
import { dateFilter, dateSort, globalSearchFilter } from '@/utils/datatable';
import { getFormDefaultValues } from '@/utils/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Dropdown,
  Form,
  Nav,
  OverlayTrigger,
  Row,
  Spinner,
  Tab,
  Tooltip,
} from 'react-bootstrap';
import {
  ExclamationCircle,
  PencilSquare,
  Plus,
  Save,
  Tag,
  ThreeDotsVertical,
  Trash,
} from 'react-bootstrap-icons';
import { Controller, FormProvider, useForm, useFormContext } from 'react-hook-form';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

//* limit per category
const LIMIT = 10;

const JobRequestCustomerEquipmentForm = ({ data, isLoading, handleNext, handlePrevious }) => {
  const form = useFormContext();
  const formErrors = form.formState.errors;

  const auth = useAuth();

  const [activeKey, setActiveKey] = useState(CATEGORY[0]);

  //* form use for add/edit customer equipment
  const customerEquipmentForm = useForm({
    mode: 'onChange',
    defaultValues: { ...getFormDefaultValues(customerEquipmentSchema) },
    resolver: zodResolver(customerEquipmentSchema),
  });

  const customerEquipmentFormErrors = customerEquipmentForm.formState.errors;
  const [categoryOptions] = useState(CATEGORY.map((category) => ({ value: category, label: category.split(' ').map(str => _.capitalize(str)).join(' ') }))); //prettier-ignore
  const [customerEquipmentIsLoading, setCustomerEquipmentIsLoading] = useState(false);
  const [isSettingCustomerEquipmentId, setIsSettingCustomerEquipmentId] = useState(false);

  const columnHelper = createColumnHelper();

  const allCustomerEquipment = useMemo(() => {
    const customer = form.getValues('customer');

    if (!customer || !customer?.id) return [];

    const values = form.getValues('allCustomerEquipments') || [];

    return values.filter((eq) => eq.customerId === customer.id);
  }, [form.watch('customer.id'), form.watch('allCustomerEquipments')]);

  const allCustomerEquipmentByCategory = useMemo(() => {
    const values = allCustomerEquipment?.filter((eq) => eq.category === activeKey);
    return values || [];
  }, [allCustomerEquipment, activeKey]);

  const getSelectedCategoryCount = useCallback(
    (category) => {
      const selectedEquipments = form.watch('customerEquipments');
      if (!selectedEquipments || selectedEquipments?.length < 1 || !category) return 0;
      return selectedEquipments.filter((eq) => eq?.category === category)?.length || 0;
    },
    [form.watch('customerEquipments')]
  );

  const handleSelectRow = useCallback(
    (row) => {
      const category = row.original.category;
      const formattedCategory = category ? category.split(' ').map((str) => _.capitalize(str || '')).join(' ') : ''; //prettier-ignore
      const selelectedCategoriesCount = getSelectedCategoryCount(row.original.category);

      const selected = row.getIsSelected();

      //?? Disable limit check for now
      // if (selelectedCategoriesCount >= LIMIT && !selected) {
      //   toast.error(
      //     `You can only select up to 10 pieces of equipment per category of "${formattedCategory}."`,
      //     { duration: 5500 }
      //   );
      //   return;
      // }

      row.toggleSelected();

      const equipment = row.original;
      const id = row.id;

      //* handle form change
      const current = form.getValues('customerEquipments') || [];
      const newArray = [...current];
      const index = current.findIndex((eq) => eq.id === id);

      if (index > -1) newArray.splice(index, 1);
      else newArray.push({ ...equipment });

      form.setValue('customerEquipments', newArray);
    },
    [form.watch('customerEquipments')]
  );

  const handleSelectAllRow = useCallback(
    (table) => {
      const isAllSelected = table.getIsAllRowsSelected();

      //* handle form change
      if (isAllSelected) {
        table.toggleAllRowsSelected();

        //* remove selected equipment from form by category
        const currentSelectedEquipment = form.getValues('customerEquipments') || [];
        const newSelectedEquipment = currentSelectedEquipment.filter(
          (eq) => eq.category !== activeKey
        );

        form.setValue('customerEquipments', newSelectedEquipment);
      } else {
        const formattedCategory = activeKey ? activeKey.split(' ').map((str) => _.capitalize(str || '')).join(' ') : ''; //prettier-ignore
        const selelectedCategoriesCount = allCustomerEquipmentByCategory?.length || 0;

        //?? Disable limit check for now
        // if (selelectedCategoriesCount > LIMIT) {
        //   toast.error(
        //     `You can only select up to 10 pieces of equipment per category of "${formattedCategory}."`,
        //     { duration: 5500 }
        //   );
        //   return;
        // }

        table.toggleAllRowsSelected();

        const currentSelectedEquipment = form.getValues('customerEquipments') || [];
        const newSelectedEquipment = [...currentSelectedEquipment, ...allCustomerEquipmentByCategory]; //prettier-ignore

        form.setValue('customerEquipments', newSelectedEquipment);
      }
    },
    [activeKey, allCustomerEquipmentByCategory]
  );

  const getIsAllRowSelected = useCallback(() => {
    const currentlySelectedEquipments = form.getValues('customerEquipments') || [];
    const currentlySelectedEquipmentIds = currentlySelectedEquipments.map((eq) => eq.id);

    if (
      !activeKey ||
      !allCustomerEquipmentByCategory ||
      allCustomerEquipmentByCategory?.length < 1
    ) {
      return false;
    }

    return allCustomerEquipmentByCategory.every((eq) => currentlySelectedEquipmentIds.includes(eq.id)); //prettier-ignore
  }, [form.watch('customerEquipments'), activeKey, allCustomerEquipmentByCategory]);

  const getIsSomeRowSelected = useCallback(() => {
    const currentlySelectedEquipments = form.getValues('customerEquipments') || [];
    const currentlySelectedEquipmentIds = currentlySelectedEquipments.map((eq) => eq.id);

    if (
      !activeKey ||
      !allCustomerEquipmentByCategory ||
      allCustomerEquipmentByCategory?.length < 1
    ) {
      return false;
    }

    return allCustomerEquipmentByCategory.some((eq) => currentlySelectedEquipmentIds.includes(eq.id)); //prettier-ignore
  }, [form.watch('customerEquipments'), activeKey, allCustomerEquipmentByCategory]);

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('select', {
        header: ({ table }) => {
          return (
            <Checkbox
              {...{
                checked: getIsAllRowSelected(),
                indeterminate: getIsSomeRowSelected(),
                onChange: () => {
                  handleSelectAllRow(table); //prettier-ignore
                },
              }}
            />
          );
        },
        cell: ({ row }) => {
          row.sele;
          return (
            <div className='px-1'>
              <Checkbox
                {...{
                  checked: row.getIsSelected(),
                  disabled: !row.getCanSelect(),
                  indeterminate: row.getIsSomeSelected(),
                  onChange: () => {
                    handleSelectRow(row);
                  },
                }}
              />
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.accessor('description', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Description' />,
      }),
      columnHelper.accessor('category', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Category' />,
        cell: ({ row }) => {
          const category = row.original.category;

          return (
            <Badge bg='light' className='text-dark'>
              {category
                ? category
                    ?.split(' ')
                    ?.map((str) => _.capitalize(str))
                    ?.join(' ')
                : 'N/A'}
            </Badge>
          );
        },
      }),
      // columnHelper.accessor('make', {
      //   header: ({ column }) => <DataTableColumnHeader column={column} title='Make' />,
      // }),
      // columnHelper.accessor('model', {
      //   header: ({ column }) => <DataTableColumnHeader column={column} title='Model' />,
      // }),
      columnHelper.accessor('serialNumber', {
        id: 'serial number',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Serial Number' />,
      }),
      columnHelper.accessor('rangeMin', {
        id: 'range min',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Range (Min)' />,
      }),
      columnHelper.accessor('rangeMax', {
        id: 'range max',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Range (Max)' />,
      }),
      columnHelper.accessor('tolerance', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Tolerance' />,
      }),
      columnHelper.accessor((row) => row?.uom || '', {
        id: 'unit',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Unit' />,
      }),
      columnHelper.accessor(
        (row) => (row.original?.dueDate ? format(row.original.dueDate, 'dd-MM-yyyy') : ''),
        {
          id: 'due date',
          header: ({ column }) => <DataTableColumnHeader column={column} title='Due Date' />,
          cell: ({ row }) => {
            const dueDate = row.original?.dueDate;
            if (!dueDate) return null;
            return <div>{format(dueDate, 'dd-MM-yyyy')}</div>;
          },
          filterFn: (row, columnId, filterValue, addMeta) => {
            const dueDate = row.original?.dueDate;
            const filterDateValue = new Date(filterValue);
            return dateFilter(dueDate, filterDateValue);
          },
          sortingFn: (rowA, rowB, columnId) => {
            const rowADueDate = rowA.original?.dueDate;
            const rowBDueDate = rowB.original?.dueDate;
            return dateSort(rowADueDate, rowBDueDate);
          },
        }
      ),
      columnHelper.accessor(
        (row) => (row.original?.calDate ? format(row.original.calDate, 'dd-MM-yyyy') : ''),
        {
          id: 'cal date',
          header: ({ column }) => <DataTableColumnHeader column={column} title='Cal Date' />,
          cell: ({ row }) => {
            const calDate = row.original?.calDate;
            if (!calDate) return null;
            return <div>{format(calDate, 'dd-MM-yyyy')}</div>;
          },
          filterFn: (row, columnId, filterValue, addMeta) => {
            const calDate = row.original?.calDate;
            const filterDateValue = new Date(filterValue);
            return dateFilter(calDate, filterDateValue);
          },
          sortingFn: (rowA, rowB, columnId) => {
            const rowACalDate = rowA.original?.calDate;
            const rowBCalDate = rowB.original?.calDate;
            return dateSort(rowACalDate, rowBCalDate);
          },
        }
      ),
      columnHelper.accessor('notes', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Notes' />,
      }),
      columnHelper.accessor('actions', {
        id: 'actions',
        size: 50,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Actions' />,
        enableSorting: false,
        cell: ({ row }) => {
          const [isLoading, setIsLoading] = useState(false);

          const { id } = row.original;

          const handleEditEquipment = (id) => {
            const rowData = row.original;
            const selectedCategory = categoryOptions.find(
              (category) => category.value === rowData.category
            );

            const tolerance = rowData.tolerance ? rowData?.tolerance : '';
            const dueDate = rowData?.dueDate ? rowData?.dueDate : '';
            const calDate = rowData?.calDate ? rowData?.calDate : '';

            customerEquipmentForm.reset({
              ...rowData,
              tolerance,
              dueDate,
              calDate,
              category: selectedCategory || '',
            });
            setActiveKey('add-edit');
          };

          const handleDeleteEquipment = (id) => {
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
                try {
                  setIsLoading(true);

                  const equipmentRef = doc(db, 'customerEquipments', id);

                  await deleteDoc(equipmentRef);

                  //* update allCustomerEquipments
                  const allCustomerEquipments = form.getValues('allCustomerEquipments') || [];
                  const newAllCustomerEquipments = allCustomerEquipments.filter((eq) => eq.equipmentId !== id); // prettier-ignore
                  form.setValue('allCustomerEquipments', newAllCustomerEquipments);

                  toast.success('Equipment removed successfully', { position: 'top-right' });
                  setIsLoading(false);

                  //* set last equipment id
                  setLastEquipmentId();
                } catch (error) {
                  console.error('Error removing equipment:', error);
                  toast.error('Error removing equipment: ' + error.message, {
                    position: 'top-right',
                  });
                  setIsLoading(false);
                }
              }
            });
          };

          return (
            <OverlayTrigger
              rootClose
              trigger='click'
              placement='left-start'
              overlay={
                <Dropdown.Menu show style={{ zIndex: 999 }}>
                  {/* <Dropdown.Item onClick={() => {}}>
                    <Eye className='me-2' size={16} />
                    View Equipment
                  </Dropdown.Item> */}
                  <Dropdown.Item onClick={() => handleEditEquipment(id)}>
                    <PencilSquare className='me-2' size={16} />
                    Edit Equipment
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleDeleteEquipment(id)}>
                    <Trash className='me-2' size={16} />
                    Delete Equipment
                  </Dropdown.Item>
                </Dropdown.Menu>
              }
            >
              <Button variant='light' className='p-2' size='sm'>
                {isLoading ? (
                  <Spinner animation='border' size='sm' />
                ) : (
                  <ThreeDotsVertical size={16} />
                )}
              </Button>
            </OverlayTrigger>
          );
        },
      }),
    ];
  }, [
    form.watch('customerEquipments'),
    form.watch('customer.id'),
    activeKey,
    allCustomerEquipmentByCategory,
  ]);

  const setLastEquipmentId = async () => {
    setIsSettingCustomerEquipmentId(true);

    getDocs(collection(db, 'customerEquipments'))
      .then((snapshot) => {
        if (!snapshot.empty) {
          const id = snapshot.docs.pop().id.replace('CE', '');
          const lastEquipmentId = parseInt(id, 10);

          customerEquipmentForm.setValue(
            'equipmentId',
            `CE${(lastEquipmentId + 1).toString().padStart(6, '0')}`
          );

          setIsSettingCustomerEquipmentId(false);
        } else {
          customerEquipmentForm.setValue('equipmentId', 'CE000001');
          setIsSettingCustomerEquipmentId(false);
        }
      })
      .catch((err) => {
        console.error(err.message);
        toast.error(err.message);
        setIsSettingCustomerEquipmentId(false);
      });
  };

  const handleCustomerEquipmentSubmit = useCallback(
    async (formData, isSaveNew) => {
      const isValid = await customerEquipmentForm.trigger();
      const parseData = customerEquipmentSchema.safeParse(formData);
      const customerId = form.watch('customer.id');

      if (!isValid || !customerId || !parseData.success) return;

      try {
        setCustomerEquipmentIsLoading(true);

        const customerEquipmentFormData = {
          ...parseData.data,
          customerId,
          ...(!data && { createdAt: serverTimestamp(), createdBy: auth.currentUser }),
          updatedAt: serverTimestamp(),
          updatedBy: auth.currentUser,
        };

        await setDoc(
          doc(db, 'customerEquipments', formData.equipmentId),
          customerEquipmentFormData,
          {
            merge: true,
          }
        );

        toast.success(`Customer #${customerId} Equipment saved successfully.`, {
          position: 'top-right',
        });

        setCustomerEquipmentIsLoading(false);

        //* add to allCustomerEquipments
        const allCustomerEquipments = form.getValues('allCustomerEquipments')
          ? [...form.getValues('allCustomerEquipments')]
          : [];

        const index = allCustomerEquipments.findIndex(
          (eq) => eq.equipmentId === customerEquipmentFormData.equipmentId
        );

        const customerEquipmentRowData = {
          ...customerEquipmentFormData,
          id: customerEquipmentFormData.equipmentId,
        };

        //* if equipment already exist, just replace otherwise append
        if (index > -1) {
          allCustomerEquipments[index] = customerEquipmentRowData;
        } else allCustomerEquipments.push(customerEquipmentRowData);

        form.setValue('allCustomerEquipments', allCustomerEquipments);

        if (isSaveNew) {
          customerEquipmentForm.reset({
            description: '',
            category: '',
            make: '',
            model: '',
            serialNumber: '',
            rangeMin: '',
            rangeMax: '',
            uom: '',
            notes: '',
          });

          await setLastEquipmentId();
        } else {
          customerEquipmentForm.setValue('equipmentId', parseData.data.equipmentId);
        }
      } catch (error) {
        console.error('Error submitting customer equipment:', error);
        setCustomerEquipmentIsLoading(false);
        toast.error('Something went wrong. Please try again later.');
      }
    },
    [form.watch('customer.id')]
  );

  const filterFields = useMemo(() => {
    return [
      {
        label: 'Description',
        columnId: 'description',
        type: 'text',
        placeholder: 'Search by description...',
      },
      // {
      //   label: 'Make',
      //   columnId: 'make',
      //   type: 'text',
      //   placeholder: 'Search by make...',
      // },
      // {
      //   label: 'Model',
      //   columnId: 'model',
      //   type: 'text',
      //   placeholder: 'Search by model...',
      // },
      {
        label: 'Serial Number',
        columnId: 'serial number',
        type: 'text',
        placeholder: 'Search by serial number...',
      },
      {
        label: 'Range (Min)',
        columnId: 'range min',
        type: 'text',
        placeholder: 'Search by range min...',
      },
      {
        label: 'Range (Max)',
        columnId: 'range max',
        type: 'text',
        placeholder: 'Search by range max...',
      },
      {
        label: 'Tolerance',
        columnId: 'tolerance',
        type: 'text',
        placeholder: 'Search by tolerance...',
      },
      {
        label: 'Unit',
        columnId: 'unit',
        type: 'text',
        placeholder: 'Search by unit...',
      },
      {
        label: 'Notes',
        columnId: 'notes',
        type: 'text',
        placeholder: 'Search by notes...',
      },
    ];
  }, []);

  const table = useReactTable({
    data: allCustomerEquipmentByCategory,
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

  //* set selected equipment if data exist
  useEffect(() => {
    if (data && allCustomerEquipment.length > 0 && table) {
      const currentEquipmentsIds = data.customerEquipments?.length > 0 ? data.customerEquipments.map(eq => eq.id) : []; // prettier-ignore
      const selectedEquipments = allCustomerEquipment.filter((eq) => currentEquipmentsIds.includes(eq.id)); // prettier-ignore

      //* set form data & row selection state
      form.setValue('customerEquipments', selectedEquipments);
      table.setRowSelection(selectedEquipments.reduce((acc, eq) => ({ ...acc, [eq.id]: true }), {})); // prettier-ignore
    }
  }, [data, JSON.stringify(allCustomerEquipment), table]);

  //* query & set last customer equipment  id
  useEffect(() => {
    setLastEquipmentId();
  }, []);

  return (
    <Card className='shadow-none'>
      <Card.Body className='pb-0'>
        <div className='d-flex'>
          <h4 className='mb-0'>Calibration Items</h4>
        </div>
        <p className='text-muted fs-6'>
          The equipment of the currently selected customer. Select any number of equipment to be
          calibrated for the job.
        </p>

        {allCustomerEquipment?.length < 1 && (
          <Alert className='mb-5' style={{ width: 'fit-content' }} variant='warning'>
            <ExclamationCircle className='me-1' size={20} />
            The selected customer, <span className='fw-bold'>
              "{form.watch('customer.name')}"
            </span>{' '}
            does not have any equipment. Please add equipment to this customer or choose another
            customer that has equipment.
          </Alert>
        )}

        <Tab.Container className='mt-5' activeKey={activeKey} onSelect={(key) => setActiveKey(key)}>
          <Nav variant='pills' className='d-flex justify-content-center gap-3'>
            <Nav.Item>
              <Nav.Link eventKey='add-edit'>
                <span className='d-flex align-items-center gap-2'>
                  <Plus size={18} />
                  Add / Edit Equipment
                </span>
              </Nav.Link>
            </Nav.Item>

            {CATEGORY.map((c) => {
              return (
                <Nav.Item key={`${c}-nav-item`} className='d-flex align-items-center'>
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
                      {getSelectedCategoryCount(c)}
                    </Badge>
                  </Nav.Link>
                </Nav.Item>
              );
            })}
          </Nav>

          <hr className='my-3' />

          <Tab.Content className='h-100 w-100'>
            {CATEGORY.map((c) => (
              <Tab.Pane key={`${c}-tab-pane`} className='h-100' eventKey={c}>
                <DataTable
                  table={table}
                  isLoading={allCustomerEquipment.isLoading}
                  isError={allCustomerEquipment.isError}
                >
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

            {/* //* add/edit customer equipment form*/}
            <Tab.Pane eventKey='add-edit'>
              {isSettingCustomerEquipmentId ? (
                <div
                  className='d-flex justify-content-center align-items-center'
                  style={{ height: '200px' }}
                >
                  <Spinner animation='border' className='me-2' size='sm' /> Loading...
                </div>
              ) : (
                <Card className='shadow-none p-0'>
                  <Card.Body className='p-0'>
                    <FormProvider {...customerEquipmentForm}>
                      <Form id='customerEquipmentForm'>
                        <Card className='shadow-none'>
                          <Card.Body>
                            <h4 className='mb-0'>Equipment Info</h4>
                            <p className='text-muted fs-6'>Details about the customer equipment.</p>

                            <Row className='row-gap-3'>
                              <Form.Group as={Col} md={12}>
                                <Form.Label>Customer</Form.Label>
                                <Form.Control
                                  type='text'
                                  value={form.watch('customer.name')}
                                  readOnly
                                  disabled
                                />
                              </Form.Group>

                              <Form.Group as={Col} md={3}>
                                <Form.Label>Equipment ID</Form.Label>
                                <Form.Control
                                  type='text'
                                  value={customerEquipmentForm.watch('equipmentId')}
                                  readOnly
                                  disabled
                                />
                              </Form.Group>

                              <Form.Group as={Col} md={3}>
                                <RequiredLabel label='Description' id='description' />

                                <Controller
                                  name='description'
                                  control={customerEquipmentForm.control}
                                  render={({ field }) => (
                                    <>
                                      <Form.Control
                                        {...field}
                                        id='description'
                                        placeholder='Enter description'
                                      />

                                      {customerEquipmentFormErrors &&
                                        customerEquipmentFormErrors.description?.message && (
                                          <Form.Text className='text-danger'>
                                            {customerEquipmentFormErrors.description?.message}
                                          </Form.Text>
                                        )}
                                    </>
                                  )}
                                />
                              </Form.Group>

                              <Form.Group as={Col} md={3}>
                                <RequiredLabel label='Category' id='category' />
                                <OverlayTrigger
                                  placement='right'
                                  overlay={
                                    <Tooltip>
                                      <TooltipContent
                                        title='Calibration Category Search'
                                        info={['Search by category']}
                                      />
                                    </Tooltip>
                                  }
                                >
                                  <i
                                    className='fe fe-help-circle text-muted'
                                    style={{ cursor: 'pointer' }}
                                  />
                                </OverlayTrigger>

                                <Controller
                                  name='category'
                                  control={customerEquipmentForm.control}
                                  render={({ field }) => (
                                    <>
                                      <Select
                                        {...field}
                                        inputId='category'
                                        instanceId='category'
                                        onChange={(option) => field.onChange(option)}
                                        options={categoryOptions}
                                        placeholder='Search by calibration category'
                                        noOptionsMessage={() => 'No calibration category found'}
                                      />

                                      {customerEquipmentFormErrors &&
                                        customerEquipmentFormErrors.category?.message && (
                                          <Form.Text className='text-danger'>
                                            {customerEquipmentFormErrors.category?.message}
                                          </Form.Text>
                                        )}
                                    </>
                                  )}
                                />
                              </Form.Group>

                              <Form.Group as={Col} md={3}>
                                <Form.Label htmlFor='make'>Make</Form.Label>

                                <Controller
                                  name='make'
                                  control={customerEquipmentForm.control}
                                  render={({ field }) => (
                                    <>
                                      <Form.Control {...field} id='make' placeholder='Enter make' />

                                      {customerEquipmentFormErrors &&
                                        customerEquipmentFormErrors.make?.message && (
                                          <Form.Text className='text-danger'>
                                            {customerEquipmentFormErrors.make?.message}
                                          </Form.Text>
                                        )}
                                    </>
                                  )}
                                />
                              </Form.Group>

                              <Form.Group as={Col} md={3}>
                                <Form.Label htmlFor='model'>Model</Form.Label>

                                <Controller
                                  name='model'
                                  control={customerEquipmentForm.control}
                                  render={({ field }) => (
                                    <>
                                      <Form.Control
                                        {...field}
                                        id='model'
                                        placeholder='Enter model'
                                      />

                                      {customerEquipmentFormErrors &&
                                        customerEquipmentFormErrors.model?.message && (
                                          <Form.Text className='text-danger'>
                                            {customerEquipmentFormErrors.model?.message}
                                          </Form.Text>
                                        )}
                                    </>
                                  )}
                                />
                              </Form.Group>

                              <Form.Group as={Col} md={3}>
                                <RequiredLabel label='Serial Number' id='serialNumber' />

                                <Controller
                                  name='serialNumber'
                                  control={customerEquipmentForm.control}
                                  render={({ field }) => (
                                    <>
                                      <Form.Control
                                        {...field}
                                        id='serialNumber'
                                        placeholder='Enter serial number'
                                      />

                                      {customerEquipmentFormErrors &&
                                        customerEquipmentFormErrors.serialNumber?.message && (
                                          <Form.Text className='text-danger'>
                                            {customerEquipmentFormErrors.serialNumber?.message}
                                          </Form.Text>
                                        )}
                                    </>
                                  )}
                                />
                              </Form.Group>

                              <Form.Group as={Col} md={3}>
                                <Form.Label htmlFor='rangeMin'>Minimum Range</Form.Label>

                                <Controller
                                  name='rangeMin'
                                  control={customerEquipmentForm.control}
                                  render={({ field }) => (
                                    <>
                                      <Form.Control
                                        type='text'
                                        {...field}
                                        id='rangeMin'
                                        placeholder='Enter minimum range'
                                      />

                                      {customerEquipmentFormErrors &&
                                        customerEquipmentFormErrors.rangeMin?.message && (
                                          <Form.Text className='text-danger'>
                                            {customerEquipmentFormErrors.rangeMin?.message}
                                          </Form.Text>
                                        )}
                                    </>
                                  )}
                                />
                              </Form.Group>

                              <Form.Group as={Col} md={3}>
                                <Form.Label htmlFor='rangeMax'>Maximum Range</Form.Label>

                                <Controller
                                  name='rangeMax'
                                  control={customerEquipmentForm.control}
                                  render={({ field }) => (
                                    <>
                                      <Form.Control
                                        type='text'
                                        {...field}
                                        id='rangeMax'
                                        placeholder='Enter maximum range'
                                      />

                                      {customerEquipmentFormErrors &&
                                        customerEquipmentFormErrors.rangeMax?.message && (
                                          <Form.Text className='text-danger'>
                                            {customerEquipmentFormErrors.rangeMax?.message}
                                          </Form.Text>
                                        )}
                                    </>
                                  )}
                                />
                              </Form.Group>

                              <Form.Group as={Col} md={3}>
                                <Form.Label htmlFor='uom'>Unit</Form.Label>

                                <Controller
                                  name='uom'
                                  control={customerEquipmentForm.control}
                                  render={({ field }) => (
                                    <>
                                      <Form.Control {...field} id='uom' placeholder='Enter Unit' />

                                      {customerEquipmentFormErrors &&
                                        customerEquipmentFormErrors.uom?.message && (
                                          <Form.Text className='text-danger'>
                                            {customerEquipmentFormErrors.uom?.message}
                                          </Form.Text>
                                        )}
                                    </>
                                  )}
                                />
                              </Form.Group>

                              <Form.Group as={Col} md={3}>
                                <Form.Label htmlFor='tolerance'>Tolerance</Form.Label>

                                <Controller
                                  name='tolerance'
                                  control={customerEquipmentForm.control}
                                  render={({ field }) => (
                                    <>
                                      <Form.Control
                                        {...field}
                                        id='tolerance'
                                        placeholder='Enter tolerance'
                                      />
                                    </>
                                  )}
                                />
                              </Form.Group>

                              <Form.Group as={Col} md={3}>
                                <Form.Label htmlFor='dueDate'>Due Date</Form.Label>

                                <Controller
                                  name='dueDate'
                                  control={customerEquipmentForm.control}
                                  render={({ field }) => (
                                    <Form.Control {...field} id='dueDate' type='date' />
                                  )}
                                />
                              </Form.Group>

                              <Form.Group as={Col} md={3}>
                                <Form.Label htmlFor='calDate'>Cal Date</Form.Label>

                                <Controller
                                  name='calDate'
                                  control={customerEquipmentForm.control}
                                  render={({ field }) => (
                                    <Form.Control {...field} id='calDate' type='date' />
                                  )}
                                />
                              </Form.Group>

                              <Form.Group as={Col} md={6}>
                                <Form.Label htmlFor='notes'>Notes</Form.Label>

                                <Controller
                                  name='notes'
                                  control={customerEquipmentForm.control}
                                  render={({ field }) => (
                                    <Form.Control
                                      {...field}
                                      id='notes'
                                      as='textarea'
                                      rows={1}
                                      placeholder='Enter notes'
                                    />
                                  )}
                                />
                              </Form.Group>
                            </Row>

                            <div className='mt-4 d-flex justify-content-end align-items-center'>
                              <div className='d-flex gap-2 align-items-center'>
                                <Button
                                  disabled={customerEquipmentIsLoading}
                                  form='customerEquipmentForm'
                                  type='button'
                                  variant='outline-primary'
                                  onClick={() => {
                                    handleCustomerEquipmentSubmit(
                                      customerEquipmentForm.getValues(),
                                      true
                                    );
                                  }}
                                >
                                  {customerEquipmentIsLoading ? (
                                    <>
                                      <Spinner
                                        as='span'
                                        animation='border'
                                        size='sm'
                                        role='status'
                                        aria-hidden='true'
                                        className='me-2'
                                      />
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <Save size={14} className='me-2' />
                                      Save & New
                                    </>
                                  )}
                                </Button>

                                <Button
                                  form='customerEquipmentForm'
                                  type='button'
                                  variant='outline-primary'
                                  disabled={customerEquipmentIsLoading}
                                  onClick={() => {
                                    handleCustomerEquipmentSubmit(
                                      customerEquipmentForm.getValues(),
                                      false
                                    );
                                  }}
                                >
                                  {customerEquipmentIsLoading ? (
                                    <>
                                      <Spinner
                                        as='span'
                                        animation='border'
                                        size='sm'
                                        role='status'
                                        aria-hidden='true'
                                        className='me-2'
                                      />
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <Save size={14} className='me-2' />
                                      Save
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </Form>
                    </FormProvider>
                  </Card.Body>
                </Card>
              )}
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>

        {formErrors && formErrors.customerEquipments?.message && (
          <Form.Text className='text-danger'>{formErrors.customerEquipments?.message}</Form.Text>
        )}

        <div className='mt-4 d-flex justify-content-between align-items-center'>
          <Button
            disabled={isLoading}
            type='button'
            variant='outline-primary'
            onClick={handlePrevious}
          >
            Previous
          </Button>

          <Button
            disabled={isLoading}
            type='button'
            onClick={() => {
              handleNext();
              customerEquipmentForm.clearErrors();
            }}
          >
            Next
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default JobRequestCustomerEquipmentForm;
