import Checkbox from '@/components/common/Checkbox';
import DataTable from '@/components/common/DataTable';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import DataTableFilter from '@/components/common/DataTableFilter';
import DataTableSearch from '@/components/common/DataTableSearch';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import { TooltipContent } from '@/components/common/ToolTipContent';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import { CATEGORY } from '@/schema/calibration';
import { globalSearchFilter } from '@/utils/datatable';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Form, Nav, OverlayTrigger, Tab, Tooltip } from 'react-bootstrap';
import { Tag } from 'react-bootstrap-icons';
import { useFormContext } from 'react-hook-form';
import toast from 'react-hot-toast';

//* limit per category
const LIMIT = 10;

const JobCustomerEquipmentForm = ({ data, isLoading, handleNext, handlePrevious }) => {
  const form = useFormContext();
  const formErrors = form.formState.errors;

  const [activeKey, setActiveKey] = useState(CATEGORY[0]);

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

      if (selelectedCategoriesCount >= LIMIT && !selected) {
        toast.error(
          `You can only select up to 10 pieces of equipment per category of "${formattedCategory}."`,
          { duration: 5500 }
        );
        return;
      }

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

        if (selelectedCategoriesCount > LIMIT) {
          toast.error(
            `You can only select up to 10 pieces of equipment per category of "${formattedCategory}."`,
            { duration: 5500 }
          );
          return;
        }

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
      columnHelper.accessor('id', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='ID' />,
        size: 100,
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
      columnHelper.accessor('rangeMin', {
        id: 'range min',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Range (Min)' />,
      }),
      columnHelper.accessor('rangeMax', {
        id: 'range max',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Range (Max)' />,
      }),
      columnHelper.accessor('uom', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='UOM' />,
      }),
      columnHelper.accessor('notes', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Notes' />,
      }),
    ];
  }, [form.watch('customerEquipments'), activeKey, allCustomerEquipmentByCategory]);

  const filterFields = useMemo(() => {
    return [
      {
        label: 'Equipment ID',
        columnId: 'id',
        type: 'text',
        placeholder: 'Search by equipment id...',
      },
      {
        label: 'Description',
        columnId: 'description',
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
        label: 'UOM',
        columnId: 'uom',
        type: 'text',
        placeholder: 'Search by uom...',
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

  useEffect(() => {
    if (data && allCustomerEquipment.length > 1 && table) {
      const currentEquipmentsIds = data.customerEquipments?.length > 0 ? data.customerEquipments.map(eq => eq.id) : []; // prettier-ignore
      const selectedEquipments = allCustomerEquipment.filter((eq) => currentEquipmentsIds.includes(eq.id)); // prettier-ignore

      //* set form data & row selection state
      form.setValue('customerEquipments', selectedEquipments);
      table.setRowSelection(selectedEquipments.reduce((acc, eq) => ({ ...acc, [eq.id]: true }), {})); // prettier-ignore
    }
  }, [data, allCustomerEquipment, table]);

  return (
    <Card className='shadow-none'>
      <Card.Body className='pb-0'>
        <div className='d-flex'>
          <h4 className='mb-0'>Customer Equipment</h4>
          <OverlayTrigger placement='top' overlay={<Tooltip>This field is required</Tooltip>}>
            <span className='text-danger' style={{ marginLeft: '4px', cursor: 'help' }}>
              *
            </span>
          </OverlayTrigger>
        </div>
        <p className='text-muted fs-6'>
          The equipment of the currently selected customer. Select up to{' '}
          <span className='fw-bold'>10 pieces of equipment per category</span> to be calibrated for
          the job.
        </p>

        <Tab.Container className='mt-5' activeKey={activeKey} onSelect={(key) => setActiveKey(key)}>
          <Nav variant='pills' className='d-flex justify-content-center gap-3'>
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
                  <div className='d-flex justify-content-between'>
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

          <Button disabled={isLoading} type='button' onClick={handleNext}>
            Next
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default JobCustomerEquipmentForm;
